/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, edgeTargetKey } from '../types';
import {
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorIndex,
  IVectorQueryHit,
  MemoryEmbedder
} from './vectorIndex';

/** One stored embedding: the scope-qualified address plus its vector. */
interface IStoredVector {
  readonly target: IEdgeTarget;
  readonly vector: Float32Array;
}

/**
 * The brute-force, in-memory cosine {@link IVectorIndex}. Stores one
 * `Float32Array` per record and answers a query by computing cosine similarity
 * against every stored vector, returning the top-k by descending score.
 *
 * @remarks
 * This is the **complete** vector implementation for the fgv regime — large-N is
 * explicitly out of scope (the seam stays open for a consumer to swap an external
 * ANN backend once N grows beyond "thousands of records"). No external dependency
 * and no ANN structure: a linear scan over a few thousand vectors is well within
 * an interactive budget.
 *
 * The index has a single dimension established by the first vector added; every
 * subsequent `add` and every `query` vector must match that dimension or fail
 * loudly — a mismatched dimension is an embedder-wiring bug, never a silent
 * zero-similarity result. {@link InMemoryCosineIndex.rebuild | rebuild} clears
 * the index, so a re-embed with a different model (hence dimension) is supported.
 *
 * Persistence (a JSON sidecar) is deliberately out of scope for this layer — the
 * index is in-memory and rebuilt from the store via `rebuild`; a sidecar is a
 * future nicety.
 * @public
 */
export class InMemoryCosineIndex implements IVectorIndex {
  /**
   * Stored embeddings keyed by the canonical {@link edgeTargetKey} of the
   * record's scope-qualified address, so two records that share a filename stem
   * across scopes occupy distinct entries and never overwrite each other.
   */
  private readonly _vectors: Map<string, IStoredVector>;
  /** The dimension of every stored vector; `undefined` until the first `add`. */
  private _dimension: number | undefined;

  private constructor() {
    this._vectors = new Map<string, IStoredVector>();
    this._dimension = undefined;
  }

  /** The number of vectors currently held. */
  public get size(): number {
    return this._vectors.size;
  }

  /** Family-convention factory. */
  public static create(): Result<InMemoryCosineIndex> {
    return succeed(new InMemoryCosineIndex());
  }

  /** {@inheritDoc IVectorIndex.add} */
  public add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>> {
    const key: string = edgeTargetKey(target);
    if (vector.length === 0) {
      return Promise.resolve(fail(`vector index: cannot add '${key}': empty vector`));
    }
    if (this._dimension === undefined) {
      this._dimension = vector.length;
    } else if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `vector index: cannot add '${key}': dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    // Defensive copy: the caller may reuse or mutate the buffer after `add`, and
    // the index must keep serving the embedding it was given.
    this._vectors.set(key, { target, vector: Float32Array.from(vector) });
    // The in-memory index keys entries by the canonical scoped-target string, so
    // that key IS the entry reference.
    return Promise.resolve(succeed(key));
  }

  /** {@inheritDoc IVectorIndex.remove} */
  public remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    this._vectors.delete(edgeTargetKey(target));
    return Promise.resolve(succeed(target));
  }

  /** {@inheritDoc IVectorIndex.query} */
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (topK <= 0 || this._vectors.size === 0) {
      return Promise.resolve(succeed([]));
    }
    if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `vector index: query dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    const queryMagnitude: number = InMemoryCosineIndex._magnitude(vector);
    const hits: IVectorQueryHit[] = [];
    for (const stored of this._vectors.values()) {
      hits.push({
        target: stored.target,
        score: InMemoryCosineIndex._cosine(vector, queryMagnitude, stored.vector)
      });
    }
    // Descending by score; a `seq`-free tiebreak is unnecessary here because the
    // caller (SemanticRetriever) re-resolves hits against the record index.
    hits.sort((a, b) => b.score - a.score);
    return Promise.resolve(succeed(hits.length > topK ? hits.slice(0, topK) : hits));
  }

  /**
   * Re-embed every record from `source` and rebuild the index from scratch.
   * Clears the current contents (and the established dimension) first, so a
   * re-embed with a different model is supported. Returns the number of vectors
   * indexed.
   *
   * On any failure (list, embed, or add) the index is rolled back to empty
   * rather than left in a partially-rebuilt state — a caller that retries a query
   * after a failed rebuild sees a clean empty index, never a half-populated one.
   *
   * @param source - The scope-qualified record source to re-embed.
   * @param embed - The embedder applied to each record.
   */
  public async rebuild(source: IMemoryRecordSource, embed: MemoryEmbedder): Promise<Result<number>> {
    // Reset up front so the "any failure leaves the index empty" contract holds
    // even when the listing itself fails (no stale vectors survive a failed
    // rebuild).
    this._reset();
    const listed: Result<ReadonlyArray<IScopedMemoryRecord>> = await source.list();
    if (listed.isFailure()) {
      return fail(`vector index rebuild: failed to list records: ${listed.message}`);
    }
    for (const scoped of listed.value) {
      const embedded: Result<Float32Array> = await embed(scoped.record);
      if (embedded.isFailure()) {
        this._reset();
        return fail(
          `vector index rebuild: embedding '${edgeTargetKey(scoped.target)}' failed: ${embedded.message}`
        );
      }
      const added: Result<string> = await this.add(scoped.target, embedded.value);
      if (added.isFailure()) {
        this._reset();
        return fail(`vector index rebuild: ${added.message}`);
      }
    }
    return succeed(this._vectors.size);
  }

  /** Empty the index and forget the established dimension. */
  private _reset(): void {
    this._vectors.clear();
    this._dimension = undefined;
  }

  /** The Euclidean magnitude (L2 norm) of a vector. */
  private static _magnitude(vector: Float32Array): number {
    let sum: number = 0;
    for (let i: number = 0; i < vector.length; i++) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * Cosine similarity between the query (whose magnitude is precomputed once and
   * reused across the scan) and a stored vector. A zero-magnitude vector on
   * either side yields `0` rather than `NaN` — a degenerate vector is simply
   * maximally dissimilar, not an error.
   */
  private static _cosine(query: Float32Array, queryMagnitude: number, stored: Float32Array): number {
    const storedMagnitude: number = InMemoryCosineIndex._magnitude(stored);
    if (queryMagnitude === 0 || storedMagnitude === 0) {
      return 0;
    }
    let dot: number = 0;
    for (let i: number = 0; i < query.length; i++) {
      dot += query[i] * stored[i];
    }
    return dot / (queryMagnitude * storedMagnitude);
  }
}
