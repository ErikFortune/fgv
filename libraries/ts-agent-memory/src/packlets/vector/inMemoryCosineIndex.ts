/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  DetailedResult,
  Result,
  captureAsyncResult,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { IEdgeTarget, Kind, edgeTargetKey } from '../types';
import {
  IMemoryRecordListing,
  IMemoryRecordSource,
  ISkippedVectorRecord,
  IVectorIndex,
  IVectorQueryHit,
  IVectorRebuildOptions,
  IVectorRebuildReport,
  MemoryEmbedder
} from './vectorIndex';

/**
 * Invoke a consumer-supplied hook that already returns a `Result`, converting a
 * synchronous throw or a promise rejection into a `Failure` rather than letting
 * it escape. `captureAsyncResult` wraps the hook's own `Result`, so the outcome
 * is flattened back to one level.
 */
async function invokeHook<T>(hook: () => Promise<Result<T>>): Promise<Result<T>> {
  return (await captureAsyncResult(hook)).onSuccess((inner) => inner);
}

/**
 * Increment `kind`'s tally by one. Both shipped implementations accumulate their
 * per-kind counts this way; it is a three-line local rather than an exported
 * helper because publishing a mutation primitive on the package surface would buy
 * nothing a caller could not write, and would invite treating the accumulation
 * shape as part of the contract when only the report is.
 */
function tally(counts: Map<Kind, number>, kind: Kind): void {
  counts.set(kind, (counts.get(kind) ?? 0) + 1);
}

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
   * re-embed with a different model is supported. Returns an
   * {@link IVectorRebuildReport} describing what was indexed, declined and skipped.
   *
   * @remarks
   * **A failure to LIST is always fatal**, under either mode — and **leaves the
   * existing index untouched**: an unreadable source says nothing about which
   * records exist, so there is neither an honest partial to report nor any reason
   * to discard what is already held.
   *
   * Per-record embed/add failures are governed by
   * {@link IVectorRebuildOptions.onRecordError}, which defaults to `'fail'` —
   * **the historical all-or-nothing contract, unchanged**: the index is rolled back
   * to empty rather than left partially rebuilt, so a caller that retries a query
   * sees a clean empty index it can reason about.
   *
   * `'skip'` opts into the lenient shape the store's own open already uses: the
   * rebuild continues and every casualty is returned structurally on
   * {@link IVectorRebuildReport.skipped}. **It reports more, it does not report
   * less** — the point is to stop one bad record emptying an entire index, not to
   * make failures quieter. A caller that ignores `skipped` under `'skip'` has
   * chosen to, rather than been given no way to know.
   *
   * A {@link MemoryEmbedder} decline is not a failure under either mode: it is
   * counted on {@link IVectorRebuildReport.declined} and never appears in `skipped`.
   *
   * **A `'fail'` failure carries the partial report on its `detail`** — the
   * rollback still runs, so that report describes the aborted attempt rather than
   * the (now empty) index. The one failure with no detail is a `list` failure,
   * which disturbs nothing and has nothing to describe.
   *
   * Both consumer-supplied hooks are capture-wrapped, so a `source` or `embed`
   * that throws or rejects becomes a `Failure` on the path above rather than an
   * exception escaping mid-rebuild — which would bypass the rollback entirely.
   *
   * @param source - The scope-qualified record source to re-embed.
   * @param embed - The embedder applied to each record.
   * @param options - Rebuild options; omit for the historical `'fail'` behavior.
   */
  public async rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IVectorRebuildReport, IVectorRebuildReport>> {
    const lenient: boolean = (options?.onRecordError ?? 'fail') === 'skip';
    const listed: Result<IMemoryRecordListing> = await invokeHook(() => source.list());
    if (listed.isFailure()) {
      // Deliberately BEFORE the reset. This used to reset first, on the reasoning
      // that no stale vectors should survive a failed rebuild — but a failed list
      // is no evidence about the vectors already held, and nothing has been
      // re-embedded yet, so there is no half-rebuilt state to guard against.
      // Leaving the prior contents intact is the more correct answer, and on the
      // durable sibling (`SqliteVecVectorIndex`) resetting here was data loss.
      //
      // No detail, for the same reason: an all-zero report would describe an index
      // this call never touched.
      return failWithDetail(`vector index rebuild: failed to list records: ${listed.message}`);
    }
    // From here a rebuild is genuinely starting, so clear. A mid-loop failure
    // under `'fail'` still resets, which is what keeps that contract honest.
    this._reset();
    const indexed: Map<Kind, number> = new Map<Kind, number>();
    const declined: Map<Kind, number> = new Map<Kind, number>();
    const skipped: ISkippedVectorRecord[] = [];
    // Only the source knows what it filtered, so an absent `excluded` propagates
    // as absent rather than becoming an empty map — "cannot say" and "excluded
    // nothing" are different answers.
    const report = (): IVectorRebuildReport => ({
      indexed,
      declined,
      excluded: listed.value.excluded,
      skipped
    });
    for (const scoped of listed.value.records) {
      const kind: Kind = scoped.record.envelope.kind;
      // Both hooks are consumer-supplied, so a throw or rejection is captured
      // into a `Failure` rather than escaping as an exception — otherwise a
      // badly-behaved embedder would reject out of `rebuild` mid-loop and leave
      // the index half-populated, which is precisely what the rollback below
      // exists to prevent.
      const embedded: Result<Float32Array | undefined> = await invokeHook(() => embed(scoped.record));
      if (embedded.isFailure()) {
        const error: string = `vector index rebuild: embedding '${edgeTargetKey(scoped.target)}' failed: ${
          embedded.message
        }`;
        // `'fail'` keeps the historical all-or-nothing contract EXACTLY: reset and
        // abort, so a caller that retries a query sees a clean empty index rather
        // than a partially-rebuilt one it cannot reason about. What is new is only
        // that the failure also carries what the attempt had established.
        if (!lenient) {
          this._reset();
          return failWithDetail(error, report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      // A decline is not an error under either mode — it is counted, never skipped.
      if (embedded.value === undefined) {
        tally(declined, kind);
        continue;
      }
      const added: Result<string> = await this.add(scoped.target, embedded.value);
      if (added.isFailure()) {
        const error: string = `vector index rebuild: ${added.message}`;
        if (!lenient) {
          this._reset();
          return failWithDetail(error, report());
        }
        skipped.push({ target: scoped.target, error });
        continue;
      }
      // Tallied per successful add rather than read back off `size` at the end:
      // `size` counts distinct addresses, and this count must line up with its
      // per-record siblings so the three still sum to the records seen.
      tally(indexed, kind);
    }
    return succeedWithDetail(report());
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
