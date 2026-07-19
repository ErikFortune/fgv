/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord } from '../types';

/**
 * A half-open `[start, end)` span into a record's body — the in-record locator a
 * {@link IFragmentVectorIndex} carries on each fragment hit. `start` is inclusive,
 * `end` exclusive. The unit (character / byte / token offsets) is the consumer's
 * choice: the index stores the two integers opaquely and never interprets them,
 * so they line up with whatever locator the consumer's own read side uses.
 * @public
 */
export interface IFragmentLocator {
  /** Inclusive start offset into the record body. */
  readonly start: number;
  /** Exclusive end offset into the record body. */
  readonly end: number;
}

/**
 * A single hit returned by {@link IVectorIndex.query} (or
 * {@link IFragmentVectorIndex.query}): the matched record's scope-qualified
 * {@link IEdgeTarget | address} and the backend's similarity score (higher = more
 * similar; the exact scale is backend-defined). Hits are returned in descending
 * score order.
 *
 * @remarks
 * The address is a `(scope, id)` pair, NOT a bare {@link MemoryId} — per-scope
 * codecs (e.g. the medium-term codec's `turn-<n>` stems) legally mint the same
 * stem under different scopes, so a bare id could not disambiguate two records
 * that share a stem. The caller re-resolves the hit against the record index by
 * the same scoped address.
 *
 * `locator` is present only on hits from a {@link IFragmentVectorIndex} — it
 * identifies WHICH fragment of the record matched. Record-granular
 * {@link IVectorIndex} hits omit it.
 * @public
 */
export interface IVectorQueryHit {
  /** The scope-qualified address of the matched record. */
  readonly target: IEdgeTarget;
  /** Backend similarity score; higher is more similar. */
  readonly score: number;
  /** The matched fragment's in-record span; present only for fragment-index hits. */
  readonly locator?: IFragmentLocator;
}

/**
 * The vector-index seam an embedding backend implements to make
 * {@link SemanticRetriever | semantic recall} operational.
 *
 * @remarks
 * Vectors cross this seam as `Float32Array` (the in-memory representation an
 * embedding model produces); `number[]` is reserved for the JSON-wire edges
 * (e.g. a provider's embedding response). The in-package brute-force cosine
 * implementation is {@link InMemoryCosineIndex}; a consumer can swap an external
 * ANN backend behind the same seam once N grows beyond the in-memory regime.
 *
 * Every operation returns a `Result` (async, since a real backend does I/O) so
 * failure is explicit and never throws across the seam.
 * @public
 */
export interface IVectorIndex {
  /**
   * Add (or replace) the embedding for the scope-qualified `target`. Returns the
   * opaque {@link IMemoryEnvelope.embeddingRef | embeddingRef} the store stamps
   * onto the envelope so a later read knows the record is embedded. Keying on the
   * `(scope, id)` address (not a bare id) is load-bearing: two records that share
   * a filename stem across scopes must not clobber each other's embedding.
   */
  add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>>;

  /**
   * Remove the embedding for the scope-qualified `target`. Returns the removed
   * target. Idempotent — removing a target with no embedding still succeeds
   * (returns the target).
   */
  remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>>;

  /**
   * Return the `topK` nearest records to `vector`, in descending score order.
   */
  query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
}

/**
 * One embedded fragment of a record: its in-record {@link IFragmentLocator | span}
 * and the vector for that span. Produced by a {@link FragmentEmbedder} and stored
 * via {@link IFragmentVectorIndex.addFragments}.
 * @public
 */
export interface IEmbeddedFragment {
  /** The fragment's in-record span. */
  readonly locator: IFragmentLocator;
  /** The embedding vector for that span. */
  readonly vector: Float32Array;
}

/**
 * The fragment-granular sibling of {@link IVectorIndex}: instead of one vector per
 * record it holds many vectors per record, each tagged with an in-record
 * {@link IFragmentLocator}, and its `query` returns per-fragment hits carrying that
 * locator. This is the seam behind sub-document semantic search — the "discovery"
 * half of a search-then-read contract, where a hit's `(target, locator)` tells the
 * consumer which record AND which span to read.
 *
 * @remarks
 * Deliberately NOT `extends IVectorIndex`: an index keyed by `(target, locator)`
 * has no well-defined single-vector `add(target, vector)`. It is a parallel
 * contract with three operations — `addFragments`, `remove`, `query` — reusing
 * {@link IVectorQueryHit} (whose `locator` is always populated here). Kept distinct
 * from the record-granular index per the consumer contract: memory recall stays
 * record-granular; sub-document knowledge uses a separate fragment index.
 * @public
 */
export interface IFragmentVectorIndex {
  /**
   * Add (or replace) all fragments for the scope-qualified `target`. Whole-record
   * semantics: every fragment previously held for `target` is dropped and replaced
   * by `fragments`, so a re-authored document never leaves stale fragments behind.
   * Returns the number of fragments now held for the record.
   */
  addFragments(target: IEdgeTarget, fragments: ReadonlyArray<IEmbeddedFragment>): Promise<Result<number>>;

  /**
   * Remove every fragment for the scope-qualified `target`. Returns the removed
   * target. Idempotent — removing a target with no fragments still succeeds.
   */
  remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>>;

  /**
   * Return the `topK` nearest fragments to `vector`, in descending score order,
   * each hit carrying its record `target` and fragment `locator`. When
   * `maxPerRecord` is supplied, no more than that many fragments of any single
   * record appear in the result — the cap is applied during selection (before the
   * `topK` cut) so one long document cannot crowd out others.
   */
  query(
    vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
}

/**
 * Embeds a complete record into a vector for the store's embed-on-write hook.
 * Async and `Result`-returning, since a real embedder does a network call (cloud
 * provider) or in-process model inference. The consumer wires this — the core
 * package never calls an embedding provider directly, staying embedder-agnostic.
 * @public
 */
export type MemoryEmbedder = (record: IMemoryRecord<unknown>) => Promise<Result<Float32Array>>;

/**
 * The fragment-granular sibling of {@link MemoryEmbedder}: chunks a record's body
 * and embeds each chunk, returning one {@link IEmbeddedFragment} per chunk. The
 * chunking policy (window size, overlap) lives entirely in the consumer's embedder
 * — the core stays chunking-agnostic, exactly as it stays embedder-agnostic for
 * the record-granular path. Used by the store's fragment-embed-on-write hook.
 * @public
 */
export type FragmentEmbedder = (
  record: IMemoryRecord<unknown>
) => Promise<Result<ReadonlyArray<IEmbeddedFragment>>>;

/**
 * A record paired with its scope-qualified {@link IEdgeTarget | address}, as
 * yielded by {@link IMemoryRecordSource.list}. The address is required because
 * {@link InMemoryCosineIndex.rebuild} keys each re-embedded entry on the
 * scope-qualified target, not a bare {@link MemoryId} — two records that share a
 * filename stem across scopes must not collide when the whole vault is re-indexed.
 * @public
 */
export interface IScopedMemoryRecord {
  /** The record's scope-qualified `(scope, id)` address. */
  readonly target: IEdgeTarget;
  /** The record itself, passed to the embedder. */
  readonly record: IMemoryRecord<unknown>;
}

/**
 * The minimal record-source surface {@link InMemoryCosineIndex.rebuild} reads to
 * re-embed an entire vault. Each entry carries the record's scope-qualified
 * address (see {@link IScopedMemoryRecord}) so the rebuild keys the vector index
 * exactly as the incremental embed-on-write path does. A consumer backs this with
 * the store's scoped index — the vector packlet does not import the store packlet
 * (which depends on the vector packlet for {@link IVectorIndex}, so the reverse
 * import would be a cycle).
 * @public
 */
export interface IMemoryRecordSource {
  /** List every record in the vault, each paired with its scoped address. */
  list(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>>;
}
