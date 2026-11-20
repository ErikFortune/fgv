/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  ITaskCommitRecord,
  ITaskInventoryEntry,
  ITaskRepositoryManifest,
  OperationId,
  TaskId,
  TaskResult
} from '../types';
import { idOf } from './commitRules';
import { classify, ok, propagate, taskFailure } from './failures';
import {
  IEncodedRecord,
  encodeValidated,
  fingerprintOf,
  manifestName,
  parseJson,
  recordName,
  utf8Length
} from './layout';
import { ITaskProjection, taskRecordLimit } from './projection';
import { RecordStore } from './recordStore';
import { ICachedRecord, MaterializationGate, RecordCache } from './workingSet';

/**
 * A committed task record and its exact text.
 * @internal
 */
export interface IReadRecord {
  readonly record: ITaskCommitRecord;
  readonly encoded: IEncodedRecord;
}

/**
 * What the committed-files layer needs of the repository that owns it.
 * @internal
 */
export interface ICommittedFilesHost {
  readonly store: RecordStore;
  readonly converters: TaskConverters;
  readonly cache: RecordCache;
  readonly gate: MaterializationGate;
  /** The live projections — replaced wholesale by a rebuild, so always asked, never held. */
  readonly projections: () => ReadonlyMap<TaskId, ITaskProjection>;
  /** Whether the repository may read at all (closed, rebuilding and fenced may not). */
  readonly usable: () => TaskResult<true>;
  /** Fences the repository: something on disk is not what this instance committed. */
  readonly fence: (reason: string) => void;
}

/**
 * The repository's committed files: the one manifest this instance last wrote or read, and the
 * task records its projections name — and the rule that nothing else is ever read as, or
 * written over, either.
 *
 * @remarks
 * Every write is one atomic replacement classified by what a reader can now see; a write whose
 * outcome is not positively `'unchanged'` fences the repository. The manifest is rewritten only
 * while the file on disk still carries the fingerprint of the one this instance committed, and
 * a task record is returned only when its text carries the fingerprint its projection recorded.
 * Anything else is out-of-band change or loss, and fences rather than being erased or trusted
 * (design §8.2, §8.5).
 *
 * The layer owns no repository state beyond the manifest; health, projections, the ledger and
 * the index stay with the repository, which is why the host is two callbacks and some handles.
 * @internal
 */
export class CommittedFiles {
  private readonly _host: ICommittedFilesHost;
  private _manifest: ITaskRepositoryManifest;
  private _fingerprint: string;

  public constructor(host: ICommittedFilesHost, manifest: ITaskRepositoryManifest, manifestText: string) {
    this._host = host;
    this._manifest = manifest;
    this._fingerprint = fingerprintOf(manifestText);
  }

  /** The manifest as last committed by, or read into, this instance. */
  public get manifest(): ITaskRepositoryManifest {
    return this._manifest;
  }

  /** Adopts a manifest read from disk (a rebuild), making it the one later writes are checked against. */
  public reset(manifest: ITaskRepositoryManifest, manifestText: string): void {
    this._manifest = manifest;
    this._fingerprint = fingerprintOf(manifestText);
  }

  /** Records a manifest whose write has committed. */
  public setManifest(manifest: ITaskRepositoryManifest): void {
    this._manifest = manifest;
  }

  /** The current manifest with one inventory entry replaced or added, at the next revision. */
  public withEntry(entry: ITaskInventoryEntry): ITaskRepositoryManifest {
    const others: ReadonlyArray<ITaskInventoryEntry> = this._manifest.tasks.filter((e) => e.id !== entry.id);
    return {
      ...this._manifest,
      manifestRevision: this._manifest.manifestRevision + 1,
      tasks: [...others, entry].sort((a, b) => (a.id < b.id ? -1 : 1))
    };
  }

  public encodeManifest(manifest: ITaskRepositoryManifest): TaskResult<IEncodedRecord> {
    const converter = this._host.converters.storage.manifest;
    return classify(
      encodeValidated(manifest, (from) => converter.convert(from)),
      'invalid',
      'after-host-action'
    );
  }

  /**
   * One atomic write at the repository's guarantee, classified by what a reader can now see.
   *
   * @remarks
   * `'unchanged'` is positive evidence nothing happened: the failure is safe to retry and no
   * in-memory state moves. `'replaced'` or `'unknown'` means the write may have landed: the
   * repository fences itself and reports `commit-indeterminate` with the operation ID the host
   * resolves it by, after a reopen that reads what is actually on disk. A failed call is never
   * treated as proof that nothing happened (design §8.2).
   */
  public write(name: string, text: string, operationId: OperationId | undefined): TaskResult<true> {
    if (name === manifestName) {
      const current: TaskResult<true> = this._checkManifest(operationId);
      if (current.isFailure()) {
        return current;
      }
    }
    const written = this._host.store.write(name, text);
    if (written.isSuccess()) {
      if (name === manifestName) {
        this._fingerprint = fingerprintOf(text);
      }
      return ok(true);
    }
    // A store that fails without classifying the failure has told us nothing about what a
    // reader can see, which is exactly 'unknown'.
    const visibility: FileTree.IAtomicWriteFailure['visibility'] = written.detail?.visibility ?? 'unknown';
    const stage: string = written.detail?.stage ?? 'unclassified';
    if (visibility === 'unchanged') {
      return taskFailure(
        `${name}: write failed before anything became visible: ${written.message}`,
        'storage-unavailable',
        'safe',
        operationId !== undefined ? { operationId } : undefined
      );
    }
    this._host.fence(`${name}: write outcome is ${visibility} after '${stage}'`);
    return operationId !== undefined
      ? taskFailure(
          `${name}: the write may have landed (${visibility}): ${written.message}`,
          'commit-indeterminate',
          'reconcile-first',
          { operationId }
        )
      : taskFailure(
          `${name}: the write may have landed (${visibility}): ${written.message}`,
          'storage-unavailable',
          'reconcile-first'
        );
  }

  /** Re-lists the root after a committed write; a failure there leaves the write indeterminate. */
  public relist(operationId: OperationId): TaskResult<true> {
    const listed: Result<ReadonlyArray<string>> = this._host.store.list();
    if (listed.isSuccess()) {
      return ok(true);
    }
    this._host.fence(`relist failed after a committed write: ${listed.message}`);
    return taskFailure(
      `relist failed after a committed write: ${listed.message}`,
      'commit-indeterminate',
      'reconcile-first',
      { operationId }
    );
  }

  /**
   * Re-establishes the flush boundary of an already-committed record on replay, by atomically
   * rewriting it byte for byte (design §8.2). A replay after a failure at the directory flush
   * would otherwise report success for a record whose directory entry was never flushed.
   * Nothing semantic changes: same text, same record revision.
   */
  public reestablish(read: IReadRecord, operationId: OperationId | undefined): TaskResult<true> {
    const name: string = recordName('task', idOf(read.record));
    return this.write(name, read.encoded.text, operationId)
      .onSuccess(() => this.encodeManifest(this._manifest))
      .onSuccess((encoded) => this.write(manifestName, encoded.text, operationId));
  }

  /** Reads a task record's text, refusing it before any parse when it is over the record bound. */
  public readBounded(name: string): Result<{ text: string; bytes: number }> {
    const limit: number = taskRecordLimit(this._manifest.profile);
    return this._host.store.read(name).onSuccess((text) => {
      const bytes: number = utf8Length(text);
      return bytes > limit ? fail(`${name}: ${bytes} bytes exceeds ${limit}`) : succeed({ text, bytes });
    });
  }

  /**
   * Reads a live task's record and checks it is still the record this instance committed; a
   * record that disagrees is out-of-band change or loss, and fences. `uncached` reads the file
   * even when the cache holds the record: every writer path uses it, because a write's
   * precondition must be checked against what is on disk — a cached copy cannot notice that the
   * file changed out of band, and a write over it would erase that change instead of fencing.
   */
  public readCommitted(id: TaskId, uncached: boolean = false): TaskResult<IReadRecord | undefined> {
    const usable: TaskResult<true> = this._host.usable();
    if (usable.isFailure()) {
      return propagate(usable);
    }
    const projection: ITaskProjection | undefined = this._host.projections().get(id);
    if (projection === undefined) {
      return ok(undefined);
    }
    const cached: ICachedRecord | undefined = uncached
      ? undefined
      : this._host.cache.get(id, projection.recordRevision, projection.fingerprint);
    if (cached !== undefined) {
      return ok(cached);
    }
    const name: string = recordName('task', id);
    return this._host.gate.run(`read ${id}`, () => {
      const read: Result<IReadRecord> = this.readBounded(name).onSuccess(({ text, bytes }) =>
        parseJson(text)
          .onSuccess((parsed) => this._host.converters.storage.record.convert(parsed))
          .onSuccess((record) => {
            if (idOf(record) !== id || record.recordRevision !== projection.recordRevision) {
              return fail<IReadRecord>(
                `${name}: holds ${idOf(record)} record ${record.recordRevision}, expected ${id} record ${
                  projection.recordRevision
                }`
              );
            }
            if (fingerprintOf(text) !== projection.fingerprint) {
              return fail<IReadRecord>(
                `${name}: record ${record.recordRevision} differs from the one this repository committed`
              );
            }
            return ok<IReadRecord>({ record, encoded: { text, bytes } });
          })
      );
      if (read.isFailure()) {
        this._host.fence(read.message);
        return taskFailure<IReadRecord | undefined>(read.message, 'storage-corrupt', 'after-host-action');
      }
      this._host.cache.put(id, read.value, projection.fingerprint);
      return ok<IReadRecord | undefined>(read.value);
    });
  }

  /**
   * The manifest is committed state as much as a task record is: before it is rewritten, the
   * one on disk must still be the one this instance last wrote or read. Anything else is an
   * out-of-band change — an entry removed, a policy edited — and rewriting over it would erase
   * it, so the repository fences instead.
   */
  private _checkManifest(operationId: OperationId | undefined): TaskResult<true> {
    const detail = operationId !== undefined ? { operationId } : undefined;
    // Re-list first: a store may hand out file items that snapshot their content.
    const text: Result<string> = this._host.store.list().onSuccess(() => this._host.store.read(manifestName));
    if (text.isFailure()) {
      return taskFailure(
        `${manifestName}: cannot be re-read before rewriting it: ${text.message}`,
        'storage-unavailable',
        'safe',
        detail
      );
    }
    if (fingerprintOf(text.value) === this._fingerprint) {
      return ok(true);
    }
    const message: string = `${manifestName} differs from the one this repository committed`;
    this._host.fence(message);
    return taskFailure(message, 'storage-corrupt', 'after-host-action', detail);
  }
}
