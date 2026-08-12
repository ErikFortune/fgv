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
 * What the record-granular vector index did about a written record.
 *
 * @remarks
 * This exists because **`embeddingRef` absence is three-ways ambiguous**: a
 * record with no reference may have been declined, excluded, or genuinely
 * failed to embed, and the `put`'s own `outcome` cannot tell you which — it is
 * `'success'` in all three, because embed-on-write is best-effort by design and
 * never fails a durable write. Deriving index coverage from the absent field
 * alone therefore cannot distinguish a policy decision from an outage.
 *
 * - `'embedded'` — embedded and added; the record carries an `embeddingRef`.
 * - `'declined'` — the {@link MemoryEmbedder} resolved `undefined`: deliberately
 *   not embedded. Not a fault.
 * - `'excluded'` — the record's kind is outside the store's `embedKinds`
 *   declaration, so the embedder was never called. Also not a fault, and the
 *   cheaper of the two.
 * - `'failed'` — the embedder returned a `Failure` (or threw), **or** the index
 *   `add` did. Both are faults, and what they leave behind depends on whether
 *   the record had been embedded before: a **first** write ends up with no
 *   `embeddingRef` and nothing in the index, while an **update** keeps the
 *   reference and vector it already had — so the index goes on answering on the
 *   record's **previous** content until a `rebuild` reconciles it. Stale, not
 *   absent. The store's diagnostic logger names which fault it was, because the
 *   remediation differs (an embedder outage versus an index outage) while the
 *   coverage answer — "this record needs a re-embed" — does not.
 *
 * Absent on a write observation means **no outcome is being reported**, which
 * covers three cases:
 *
 * 1. no vector index / embedder is wired, so there is no index for the record to
 *    be absent from;
 * 2. the `put` was a dedup no-op, which attempted nothing;
 * 3. the `put` **failed** (`outcome: 'failure'`). An embed step may well have run
 *    before the failure — a record can even have been added to the index and then
 *    lost its durable write, leaving an orphan vector that a later `rebuild`
 *    reconciles. That is deliberately not reported here: the field answers
 *    "is this *stored* record in the index?", and on a failed write there is no
 *    stored record for it to be a statement about.
 *
 * So `embed` is a property of successful writes. Never present on `'read'` /
 * `'delete'` / `'retrieve'`.
 *
 * Record-granular only. The fragment path is independent and reports nothing
 * here — a record may be fragment-embedded while its record-level outcome is
 * `'excluded'`.
 * @public
 */
export type MemoryEmbedOutcome = 'embedded' | 'declined' | 'excluded' | 'failed';

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
   * For `'write'` observations: what the record-granular vector index did about
   * this record. Absent when the question does not apply — see
   * {@link MemoryEmbedOutcome}.
   */
  readonly embed?: MemoryEmbedOutcome;
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
  /**
   * Only `'write'` records with this embed outcome. Records carrying no embed
   * outcome never match, so `embed: 'failed'` answers "which writes left the
   * index short?" without a full scan of every record's `embeddingRef`.
   */
  readonly embed?: MemoryEmbedOutcome;
}
