/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IProvenance, Kind, MemoryId, MemoryScopeKey } from '../types';

/**
 * The store/retriever operation an observation record describes.
 *
 * @remarks
 * `'read'` / `'write'` / `'delete'` are fired post-op by
 * {@link FileTreeMemoryStore} (on `get` / `put` / `delete` respectively) when
 * observers are wired. `'retrieve'` is reserved for retriever-fired
 * observations; no B2 retriever fires one (a single seq authority per
 * observation store is the supported topology), so it never appears in B2 but
 * is part of the vocabulary so a future retriever-firing hook is additive.
 * @public
 */
export type MemoryObservationPhase = 'read' | 'write' | 'delete' | 'retrieve';

/**
 * The outcome of the observed operation.
 * @public
 */
export type MemoryObservationOutcome = 'success' | 'failure';

/**
 * A single audit record produced by an observed store (or retriever) operation.
 *
 * @remarks
 * `seq` and `timestamp` are assigned by the firing authority (the store) before
 * fan-out, so the same record carries the same `seq` across every observer it
 * lands in. `seq` is strictly increasing per authority, satisfying the
 * `RetainingRingBuffer` cursor contract that {@link MemoryObservationStore}
 * relies on.
 * @public
 */
export interface IMemoryObservationRecord {
  /**
   * Monotonic 1-based sequence number assigned by the firing authority, stable
   * across a store's ring eviction. The ordering / paging key.
   */
  readonly seq: number;
  /** Milliseconds since epoch when the firing authority produced the record. */
  readonly timestamp: number;
  /** Which operation this record describes. */
  readonly phase: MemoryObservationPhase;
  /** The scope the operation touched, when resolvable. */
  readonly scope?: MemoryScopeKey;
  /** The record id the operation touched, when resolvable. */
  readonly id?: MemoryId;
  /** The kind the operation targeted, when known. */
  readonly kind?: Kind;
  /** Whether the operation succeeded. */
  readonly outcome: MemoryObservationOutcome;
  /** Present on failure: the failure `Result`'s message. */
  readonly error?: string;
  /** Structured provenance of the write, when the operation carried one. */
  readonly provenance?: IProvenance;
  /**
   * For `'retrieve'` observations: an opaque snapshot of the query that drove
   * the retrieval. Carried verbatim; never interpreted by the store.
   */
  readonly querySnapshot?: Readonly<Record<string, unknown>>;
}

/**
 * Single-method async observer hook. The store fires `observe` once per public
 * `get` / `put` / `delete` call when observers are wired.
 *
 * @remarks
 * Observer errors never affect the store operation — the store swallows a
 * failed `Result` or a thrown / rejected `observe`, logging it to the injected
 * diagnostic logger at `warn`.
 * @public
 */
export interface IMemoryObserver {
  /**
   * When `true`, the store dispatches `observe` without awaiting it, so a slow
   * remote observer (SIEM, network sink) does not extend the store operation's
   * latency. Defaults to `false` (awaited), which is correct for the cheap
   * in-memory default {@link MemoryObservationStore}. Errors are swallowed
   * either way.
   */
  readonly fireAndForget?: boolean;
  /**
   * Receives a fully-formed observation record.
   * @param record - The observation record.
   * @returns A `Result` whose failure is swallowed (logged to the store's
   * diagnostic logger). A rejected promise is likewise swallowed.
   */
  observe(record: IMemoryObservationRecord): Promise<Result<unknown>>;
}

/**
 * Query criteria for {@link MemoryObservationStore.query}. All supplied criteria
 * are AND-combined.
 * @public
 */
export interface IMemoryObservationQuery {
  /** Only records with `seq > sinceSeq` (incremental paging cursor). */
  readonly sinceSeq?: number;
  /** Return at most this many records — the most-recent N, still oldest-first. */
  readonly limit?: number;
  /** Only records with `timestamp >= since`. */
  readonly since?: number;
  /** Only records with `timestamp <= until`. */
  readonly until?: number;
  /** Only records that touched this scope. */
  readonly scope?: MemoryScopeKey;
  /** Only records that targeted this kind. */
  readonly kind?: Kind;
  /** Only records of this phase. */
  readonly phase?: MemoryObservationPhase;
  /** Only records with this outcome. */
  readonly outcome?: MemoryObservationOutcome;
}
