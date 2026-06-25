/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { MemoryId } from '../types';

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
 * **Interface only.** B2 ships the seam — the {@link IMemoryEnvelope.embeddingRef}
 * field hangs off `add`, and {@link SemanticRetriever} degrades loudly until an
 * implementation is wired. The in-package brute-force cosine implementation
 * (`InMemoryCosineIndex`) and the embed-on-write store hook are a post-v1
 * fast-follow, deliberately out of B2 scope.
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
  add(id: MemoryId, vector: ReadonlyArray<number>): Promise<Result<string>>;

  /**
   * Remove the embedding for `id`. Returns the removed id.
   */
  remove(id: MemoryId): Promise<Result<MemoryId>>;

  /**
   * Return the `topK` nearest records to `vector`, in descending score order.
   */
  query(vector: ReadonlyArray<number>, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
}
