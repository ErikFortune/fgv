/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord } from '../types';

/**
 * A single hit returned by {@link IVectorIndex.query}: the matched record's
 * scope-qualified {@link IEdgeTarget | address} and the backend's similarity
 * score (higher = more similar; the exact scale is backend-defined). Hits are
 * returned in descending score order.
 *
 * @remarks
 * The address is a `(scope, id)` pair, NOT a bare {@link MemoryId} — per-scope
 * codecs (e.g. the medium-term codec's `turn-<n>` stems) legally mint the same
 * stem under different scopes, so a bare id could not disambiguate two records
 * that share a stem. The caller re-resolves the hit against the record index by
 * the same scoped address.
 * @public
 */
export interface IVectorQueryHit {
  /** The scope-qualified address of the matched record. */
  readonly target: IEdgeTarget;
  /** Backend similarity score; higher is more similar. */
  readonly score: number;
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
 * Embeds a complete record into a vector for the store's embed-on-write hook.
 * Async and `Result`-returning, since a real embedder does a network call (cloud
 * provider) or in-process model inference. The consumer wires this — the core
 * package never calls an embedding provider directly, staying embedder-agnostic.
 * @public
 */
export type MemoryEmbedder = (record: IMemoryRecord<unknown>) => Promise<Result<Float32Array>>;

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
