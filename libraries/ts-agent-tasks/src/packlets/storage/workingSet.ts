/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { ITaskCommitRecord, ITaskEnvironment, PageCursor, TaskId, TaskResult } from '../types';
import { mintId, ok, taskFailure } from './failures';
import { IEncodedRecord } from './layout';
import { ITaskRecordCacheOptions } from './model';

/**
 * Design §7's bounded working space: view cursor handles, the optional parsed-record cache and
 * the read/materialization gate. Every structure has a fixed ceiling; none grows with history.
 * @internal
 */

/** At most this many live cursor handles per repository. */
export const maxCursorHandles: number = 256;

/** A cursor handle idle this long expires. */
export const cursorIdleMilliseconds: number = 5 * 60 * 1000;

/** At most this many record parses in flight at once. */
export const maxMaterializations: number = 4;

/** The largest parsed-record cache a host may configure. */
export const maxRecordCacheEntries: number = 32;

/** The largest encoded charge a parsed-record cache may hold. */
export const maxRecordCacheBytes: number = 8 * 1024 * 1024;

/**
 * What one cursor handle retains: the normalized query descriptor and a keyset position —
 * never a page of results.
 * @internal
 */
export interface ICursorPosition {
  readonly descriptor: string;
  readonly generation: number;
  readonly after: string;
}

interface ICursorHandle extends ICursorPosition {
  lastUsed: number;
}

/**
 * Server-held page cursors.
 *
 * @remarks
 * The token a caller holds is `<epoch>.<sequence>`: it names a handle and carries nothing else,
 * so no key a caller could not already see leaves the repository. The epoch is minted through
 * the host's ID factory on first issuance — never at open — so a token from another repository
 * instance, or from before a restart, names no handle here. Unknown, expired and evicted
 * handles, and handles from an earlier generation, are `cursor-stale`; a handle presented with a
 * different query is `invalid`.
 * @internal
 */
export class CursorTable {
  private readonly _environment: ITaskEnvironment;
  private readonly _handles: Map<string, ICursorHandle> = new Map();
  private _epoch: string | undefined;
  private _sequence: number = 0;

  public constructor(environment: ITaskEnvironment) {
    this._environment = environment;
  }

  public get size(): number {
    return this._handles.size;
  }

  /** Issues a handle for a position, evicting expired handles and then the least recently used. */
  public issue(position: ICursorPosition): TaskResult<PageCursor> {
    if (this._epoch === undefined) {
      const minted: Result<string> = mintId(this._environment);
      if (minted.isFailure()) {
        return taskFailure(`cursor: ${minted.message}`, 'storage-unavailable', 'safe');
      }
      this._epoch = minted.value;
    }
    const now: number = this._environment.clock();
    this._expire(now);
    while (this._handles.size >= maxCursorHandles) {
      this._handles.delete(this._handles.keys().next().value!);
    }
    const token: string = `${this._epoch}.${++this._sequence}`;
    this._handles.set(token, { ...position, lastUsed: now });
    return ok(token as PageCursor);
  }

  /** Resolves a token for a query at the current generation. */
  public resolve(token: PageCursor, descriptor: string, generation: number): TaskResult<ICursorPosition> {
    const now: number = this._environment.clock();
    this._expire(now);
    const handle: ICursorHandle | undefined = this._handles.get(token);
    if (handle === undefined) {
      return taskFailure(
        `cursor ${token}: unknown, expired or evicted; start the query again`,
        'cursor-stale',
        'safe'
      );
    }
    if (handle.descriptor !== descriptor) {
      return taskFailure(`cursor ${token}: issued for a different query`, 'invalid', 'after-host-action');
    }
    if (handle.generation !== generation) {
      this._handles.delete(token);
      return taskFailure(
        `cursor ${token}: the repository changed since this page (generation ${handle.generation}, now ` +
          `${generation}); start the query again`,
        'cursor-stale',
        'safe'
      );
    }
    // Most recently used moves to the back of the eviction order.
    this._handles.delete(token);
    handle.lastUsed = now;
    this._handles.set(token, handle);
    return ok(handle);
  }

  /** Drops every handle — a rebuild or close releases the old generation's cursors. */
  public clear(): void {
    this._handles.clear();
  }

  private _expire(now: number): void {
    for (const [token, handle] of this._handles) {
      if (now - handle.lastUsed >= cursorIdleMilliseconds) {
        this._handles.delete(token);
      }
    }
  }
}

/**
 * A parsed record and its exact committed text.
 * @internal
 */
export interface ICachedRecord {
  readonly record: ITaskCommitRecord;
  readonly encoded: IEncodedRecord;
}

/**
 * The optional shared parsed-record LRU (design §7). Disabled unless a host configures it.
 *
 * @remarks
 * One cache for the repository — never one per task, subscription or source. An entry is keyed
 * by task and is valid only for the record revision and exact text fingerprint it was read at,
 * so a replacement invalidates it without any explicit call. A record whose encoded size alone
 * exceeds the charge ceiling is never held.
 * @internal
 */
export class RecordCache {
  public readonly maxEntries: number;
  public readonly maxEncodedBytes: number;
  private readonly _entries: Map<TaskId, ICachedRecord & { readonly fingerprint: string }> = new Map();
  private _charge: number = 0;

  public constructor(options: ITaskRecordCacheOptions | undefined) {
    this.maxEntries = options?.maxEntries ?? 0;
    this.maxEncodedBytes = options?.maxEncodedBytes ?? 0;
  }

  public get size(): number {
    return this._entries.size;
  }

  public get charge(): number {
    return this._charge;
  }

  public get(id: TaskId, recordRevision: number, fingerprint: string): ICachedRecord | undefined {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return undefined;
    }
    this._entries.delete(id);
    if (entry.record.recordRevision !== recordRevision || entry.fingerprint !== fingerprint) {
      this._charge -= entry.encoded.bytes;
      return undefined;
    }
    this._entries.set(id, entry);
    return entry;
  }

  public put(id: TaskId, value: ICachedRecord, fingerprint: string): void {
    this.delete(id);
    if (this.maxEntries === 0 || value.encoded.bytes > this.maxEncodedBytes) {
      return;
    }
    while (
      this._entries.size >= this.maxEntries ||
      this._charge + value.encoded.bytes > this.maxEncodedBytes
    ) {
      const [oldest, evicted] = this._entries.entries().next().value!;
      this._entries.delete(oldest);
      this._charge -= evicted.encoded.bytes;
    }
    this._entries.set(id, { ...value, fingerprint });
    this._charge += value.encoded.bytes;
  }

  public delete(id: TaskId): void {
    const entry = this._entries.get(id);
    if (entry !== undefined) {
      this._entries.delete(id);
      this._charge -= entry.encoded.bytes;
    }
  }

  public clear(): void {
    this._entries.clear();
    this._charge = 0;
  }
}

/**
 * Bounds record materializations in flight. Excess work is refused — `conflict` with
 * `retry: 'safe'`, the same classification as a concurrent writer — rather than queued: there is
 * no internal wait list to grow. (`backpressure` is reserved for capacity exhaustion and carries
 * a capacity dimension, which a working-space limit does not have.)
 * @internal
 */
export class MaterializationGate {
  public readonly limit: number;
  private _inFlight: number = 0;
  private _highWater: number = 0;

  public constructor(limit: number = maxMaterializations) {
    this.limit = limit;
  }

  public get inFlight(): number {
    return this._inFlight;
  }

  /** The most materializations ever in flight at once. */
  public get highWater(): number {
    return this._highWater;
  }

  /**
   * Counts a materialization the caller has already serialized — a scan, which parses one record
   * at a time by construction and runs only with the repository fenced.
   */
  public track<T>(action: () => T): T {
    this._inFlight++;
    this._highWater = Math.max(this._highWater, this._inFlight);
    try {
      return action();
    } finally {
      this._inFlight--;
    }
  }

  public run<T>(what: string, action: () => TaskResult<T>): TaskResult<T> {
    if (this._inFlight >= this.limit) {
      return taskFailure(
        `${what}: ${this._inFlight} record reads are already in flight (limit ${this.limit}); retry`,
        'conflict',
        'safe'
      );
    }
    this._inFlight++;
    this._highWater = Math.max(this._highWater, this._inFlight);
    try {
      return action();
    } finally {
      this._inFlight--;
    }
  }
}
