/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, edgeTargetKey } from '../types';
import {
  FragmentEmbedder,
  IEmbeddedFragment,
  IFragmentLocator,
  IFragmentVectorIndex,
  IMemoryRecordSource,
  IScopedMemoryRecord,
  IVectorQueryHit
} from './vectorIndex';

/** One stored fragment: its in-record locator plus the vector for that span. */
interface IStoredFragment {
  readonly locator: IFragmentLocator;
  readonly vector: Float32Array;
}

/** Every stored fragment for one record, tagged with the record's scoped address. */
interface IStoredRecordFragments {
  readonly target: IEdgeTarget;
  readonly fragments: IStoredFragment[];
}

/** A candidate hit carried through selection: the fragment's key, hit, and score. */
interface IScoredFragment {
  readonly key: string;
  readonly hit: IVectorQueryHit;
}

/**
 * The brute-force, in-memory cosine {@link IFragmentVectorIndex} — the
 * fragment-granular sibling of {@link InMemoryCosineIndex}. Stores many
 * `Float32Array`s per record (one per in-record {@link IFragmentLocator | span})
 * and answers a query by computing cosine similarity against every stored
 * fragment, returning the top-k fragment hits by descending score.
 *
 * @remarks
 * Same regime and same non-goals as {@link InMemoryCosineIndex}: no external
 * dependency, no ANN structure, a linear scan over the stored fragments — the seam
 * ({@link IFragmentVectorIndex}) stays open for a consumer to swap a persistent /
 * ANN backend once N grows. `addFragments` is whole-record-replace, so re-authoring
 * a document never leaves stale fragments behind. The index has a single dimension
 * established by the first fragment added; every subsequent fragment and every
 * `query` vector must match it or fail loudly — a mismatched dimension is an
 * embedder-wiring bug, never a silent zero-similarity result.
 * {@link InMemoryFragmentCosineIndex.rebuild | rebuild} clears the index (and the
 * established dimension), so a re-embed with a different model is supported.
 *
 * The optional `maxPerRecord` cap on `query` is applied **during selection**, before
 * the `topK` cut, so one long document with many strong fragments cannot crowd every
 * other record out of the result.
 * @public
 */
export class InMemoryFragmentCosineIndex implements IFragmentVectorIndex {
  /**
   * Stored fragments keyed by the canonical {@link edgeTargetKey} of the record's
   * scope-qualified address, so two records that share a filename stem across
   * scopes occupy distinct entries and never overwrite each other's fragments.
   */
  private readonly _records: Map<string, IStoredRecordFragments>;
  /** The dimension of every stored fragment vector; `undefined` until the first `add`. */
  private _dimension: number | undefined;

  private constructor() {
    this._records = new Map<string, IStoredRecordFragments>();
    this._dimension = undefined;
  }

  /** The number of records that currently have at least one stored fragment. */
  public get recordCount(): number {
    return this._records.size;
  }

  /** The total number of fragments currently held across all records. */
  public get fragmentCount(): number {
    let total: number = 0;
    for (const record of this._records.values()) {
      total += record.fragments.length;
    }
    return total;
  }

  /** Family-convention factory. */
  public static create(): Result<InMemoryFragmentCosineIndex> {
    return succeed(new InMemoryFragmentCosineIndex());
  }

  /** {@inheritDoc IFragmentVectorIndex.addFragments} */
  public addFragments(
    target: IEdgeTarget,
    fragments: ReadonlyArray<IEmbeddedFragment>
  ): Promise<Result<number>> {
    const key: string = edgeTargetKey(target);
    // Validate every fragment before mutating, so a bad fragment never leaves the
    // record half-replaced (whole-record-replace must be all-or-nothing).
    const stored: IStoredFragment[] = [];
    for (const fragment of fragments) {
      if (fragment.vector.length === 0) {
        return Promise.resolve(fail(`fragment index: cannot add '${key}': empty fragment vector`));
      }
      if (this._dimension === undefined) {
        this._dimension = fragment.vector.length;
      } else if (fragment.vector.length !== this._dimension) {
        return Promise.resolve(
          fail(
            `fragment index: cannot add '${key}': fragment dimension ${fragment.vector.length} does not match index dimension ${this._dimension}`
          )
        );
      }
      // Defensive copy: the caller may reuse or mutate the buffer after `addFragments`.
      stored.push({ locator: fragment.locator, vector: Float32Array.from(fragment.vector) });
    }
    // Whole-record replace: an empty `fragments` array drops the record entirely
    // rather than leaving an empty shell behind.
    if (stored.length === 0) {
      this._records.delete(key);
    } else {
      this._records.set(key, { target, fragments: stored });
    }
    return Promise.resolve(succeed(stored.length));
  }

  /** {@inheritDoc IFragmentVectorIndex.remove} */
  public remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    this._records.delete(edgeTargetKey(target));
    return Promise.resolve(succeed(target));
  }

  /** {@inheritDoc IFragmentVectorIndex.query} */
  public query(
    vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (topK <= 0 || this._records.size === 0) {
      return Promise.resolve(succeed([]));
    }
    if (vector.length !== this._dimension) {
      return Promise.resolve(
        fail(
          `fragment index: query dimension ${vector.length} does not match index dimension ${this._dimension}`
        )
      );
    }
    const queryMagnitude: number = InMemoryFragmentCosineIndex._magnitude(vector);
    const scored: IScoredFragment[] = [];
    for (const record of this._records.values()) {
      for (const fragment of record.fragments) {
        scored.push({
          key: edgeTargetKey(record.target),
          hit: {
            target: record.target,
            score: InMemoryFragmentCosineIndex._cosine(vector, queryMagnitude, fragment.vector),
            locator: fragment.locator
          }
        });
      }
    }
    // Descending by score; the caller re-resolves each `(target, locator)` hit.
    scored.sort((a, b) => b.hit.score - a.hit.score);

    const hits: IVectorQueryHit[] = [];
    // Apply the per-record cap during selection (before the topK cut) so a single
    // long document cannot monopolize the result. `undefined` means uncapped.
    const perRecord: Map<string, number> | undefined =
      maxPerRecord === undefined ? undefined : new Map<string, number>();
    for (const candidate of scored) {
      if (hits.length >= topK) {
        break;
      }
      if (perRecord !== undefined) {
        const used: number = perRecord.get(candidate.key) ?? 0;
        if (used >= maxPerRecord!) {
          continue;
        }
        perRecord.set(candidate.key, used + 1);
      }
      hits.push(candidate.hit);
    }
    return Promise.resolve(succeed(hits));
  }

  /**
   * Re-embed every record from `source` and rebuild the fragment index from
   * scratch. Clears the current contents (and the established dimension) first, so
   * a re-embed with a different model is supported. Returns the total number of
   * fragments indexed.
   *
   * On any failure (list, embed, or add) the index is rolled back to empty rather
   * than left in a partially-rebuilt state.
   *
   * @param source - The scope-qualified record source to re-embed.
   * @param embed - The fragment embedder applied to each record.
   */
  public async rebuild(source: IMemoryRecordSource, embed: FragmentEmbedder): Promise<Result<number>> {
    this._reset();
    const listed: Result<ReadonlyArray<IScopedMemoryRecord>> = await source.list();
    if (listed.isFailure()) {
      return fail(`fragment index rebuild: failed to list records: ${listed.message}`);
    }
    for (const scoped of listed.value) {
      const embedded: Result<ReadonlyArray<IEmbeddedFragment>> = await embed(scoped.record);
      if (embedded.isFailure()) {
        this._reset();
        return fail(
          `fragment index rebuild: embedding '${edgeTargetKey(scoped.target)}' failed: ${embedded.message}`
        );
      }
      const added: Result<number> = await this.addFragments(scoped.target, embedded.value);
      if (added.isFailure()) {
        this._reset();
        return fail(`fragment index rebuild: ${added.message}`);
      }
    }
    return succeed(this.fragmentCount);
  }

  /** Empty the index and forget the established dimension. */
  private _reset(): void {
    this._records.clear();
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
   * reused across the scan) and a stored fragment vector. A zero-magnitude vector
   * on either side yields `0` rather than `NaN`.
   */
  private static _cosine(query: Float32Array, queryMagnitude: number, stored: Float32Array): number {
    const storedMagnitude: number = InMemoryFragmentCosineIndex._magnitude(stored);
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
