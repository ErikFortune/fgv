/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IMemoryRecord, MemoryId } from '../types';

/**
 * A single hit returned by {@link IVectorIndex.query}: the matched record id and
 * the backend's similarity score (higher = more similar; the exact scale is
 * backend-defined). Hits are returned in descending score order.
 * @public
 */
export interface IVectorQueryHit {
  /** The id of the matched record. */
  readonly id: MemoryId;
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
   * Add (or replace) the embedding for `id`. Returns the opaque
   * {@link IMemoryEnvelope.embeddingRef | embeddingRef} the store stamps onto
   * the envelope so a later read knows the record is embedded.
   */
  add(id: MemoryId, vector: Float32Array): Promise<Result<string>>;

  /**
   * Remove the embedding for `id`. Returns the removed id. Idempotent — removing
   * an id with no embedding still succeeds (returns the id).
   */
  remove(id: MemoryId): Promise<Result<MemoryId>>;

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
 * The minimal record-source surface {@link InMemoryCosineIndex.rebuild} reads to
 * re-embed an entire vault. {@link IMemoryStore} satisfies it structurally (its
 * `list` accepts an optional filter, which is assignable to this no-argument
 * shape), so a consumer passes the store directly — without the vector packlet
 * taking a dependency on the store packlet (which depends on the vector packlet
 * for {@link IVectorIndex}, so the reverse import would be a cycle).
 * @public
 */
export interface IMemoryRecordSource {
  /** List every record in the vault. */
  list(): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;
}
