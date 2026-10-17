/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, IIdentityResolver, IMemoryRecord, edgeTargetKey, scopedAddressOf } from '../types';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  guardRetrieverCapabilities,
  limitRecords,
  rankCompare,
  recencyCompare
} from './retriever';

/**
 * Strategy for combining the result sets of the retrievers a
 * {@link HybridRetriever} composes. Injectable so a consumer can weight,
 * re-rank, or intersect instead of the default union.
 * @public
 */
export interface IMergeStrategy {
  /**
   * Merge the per-retriever result sets into a single ordered result.
   * @param resultSets - One entry per composed retriever, in composition order.
   */
  merge(
    resultSets: ReadonlyArray<ReadonlyArray<IMemoryRecord<unknown>>>
  ): Result<ReadonlyArray<IMemoryRecord<unknown>>>;
}

/**
 * Parameters for {@link ScoreUnionMergeStrategy.create}.
 * @public
 */
export interface IScoreUnionMergeStrategyCreateParams {
  /**
   * Resolves each merged record's `(kind, entityId)` to the scope it lives under,
   * which together with its `id` is the identity the merge deduplicates and scores
   * on. Normally the store the composed retrievers read from (`IMemoryStore` is an
   * `IIdentityResolver`), so the merge uses the same codecs the records were
   * loaded and verified with.
   */
  readonly identityResolver: IIdentityResolver;
}

/** A merged record paired with its scope-qualified identity key. */
interface IKeyedRecord {
  readonly key: string;
  readonly record: IMemoryRecord<unknown>;
}

/**
 * The reference {@link IMergeStrategy}: a score-union. Every record is scored by
 * the number of composed result sets it appears in; the merged result is ordered
 * by descending score, then by recency. Records surfaced by more retrievers rank
 * higher.
 *
 * @remarks
 * **Identity is the record's scope-qualified address, not its bare `id`.** A
 * `MemoryId` is unique only within a scope — the MTM codec mints `turn-<n>` under
 * every conversation — so two records are "the same" when their
 * {@link scopedAddressOf | `(scope, id)` addresses} match, the scope coming from
 * the injected {@link IScoreUnionMergeStrategyCreateParams.identityResolver |
 * identity resolver}. A record appearing several times in one result set counts
 * once for that set; distinct versions of a versioned entity have distinct ids and
 * stay distinct.
 *
 * A record whose identity cannot be resolved (no codec for its kind, or a codec
 * that rejects its entity id) fails the whole merge, naming the kind and entity id.
 * There is deliberately no fallback to the bare id: that would silently conflate
 * records again.
 * @public
 */
export class ScoreUnionMergeStrategy implements IMergeStrategy {
  private readonly _identityResolver: IIdentityResolver;

  private constructor(identityResolver: IIdentityResolver) {
    this._identityResolver = identityResolver;
  }

  /**
   * Family-convention factory.
   * @param params - {@link IScoreUnionMergeStrategyCreateParams}; the identity
   * resolver is required.
   */
  public static create(params: IScoreUnionMergeStrategyCreateParams): Result<ScoreUnionMergeStrategy> {
    // Typed as required; still refused at runtime so an untyped caller that omits it
    // fails here rather than on the first merge.
    if (params?.identityResolver === undefined || params.identityResolver === null) {
      return fail('ScoreUnionMergeStrategy: an identityResolver is required');
    }
    return succeed(new ScoreUnionMergeStrategy(params.identityResolver));
  }

  /** {@inheritDoc IMergeStrategy.merge} */
  public merge(
    resultSets: ReadonlyArray<ReadonlyArray<IMemoryRecord<unknown>>>
  ): Result<ReadonlyArray<IMemoryRecord<unknown>>> {
    return mapResults(
      resultSets.map((set) => mapResults(set.map((record) => this._keyed(record))))
    ).onSuccess((keyedSets) => {
      const scored: Map<string, { readonly record: IMemoryRecord<unknown>; score: number }> = new Map();
      for (const set of keyedSets) {
        // Count each record at most once per result set, so the score is "how many
        // retrievers surfaced this record" rather than "how many copies total".
        const seenInSet: Set<string> = new Set<string>();
        for (const { key, record } of set) {
          if (seenInSet.has(key)) {
            continue;
          }
          seenInSet.add(key);
          const existing = scored.get(key);
          if (existing === undefined) {
            scored.set(key, { record, score: 1 });
          } else {
            existing.score += 1;
          }
        }
      }
      const merged: IMemoryRecord<unknown>[] = Array.from(scored.values())
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : recencyCompare(a.record, b.record)))
        .map((entry) => entry.record);
      return succeed(merged);
    });
  }

  /**
   * The merge identity of one record: the canonical key of its scope-qualified
   * address.
   *
   * @remarks
   * The scope is derived from `(kind, entityId)` by the codec because no retriever
   * result carries one, and for a record the store loaded the two agree — the store
   * verifies every load against the codec round-trip. If a retriever result ever
   * carries an authoritative scope the codec cannot derive (a custom codec whose
   * round-trip ignores scope, or a child retriever returning records it built
   * itself), the merge should key on that scope instead of resolving one.
   *
   * The resolver is a consumer-injectable seam, so a throw becomes a `Failure`
   * here rather than escaping `merge`'s `Result` contract.
   */
  private _keyed(record: IMemoryRecord<unknown>): Result<IKeyedRecord> {
    const { id, kind, entityId } = record.envelope;
    return captureResult(() => scopedAddressOf(record, this._identityResolver))
      .onSuccess((address: Result<IEdgeTarget>) => address)
      .withErrorFormat(
        (msg) =>
          `ScoreUnionMergeStrategy: cannot resolve the scope of record '${id}' (kind '${kind}', entityId '${entityId}'): ${msg}`
      )
      .onSuccess((address) => succeed({ key: edgeTargetKey(address), record }));
  }
}

/**
 * Composes several retrievers, dispatches a query to each, and merges their
 * results via an injectable {@link IMergeStrategy}. Its capabilities are the
 * union of the composed retrievers' capabilities.
 *
 * @remarks
 * The hybrid enforces the loud-degradation contract against its OWN (union)
 * capabilities, then projects the query for each child: a child that does not
 * support the `semantic` (or `asOf`) axis is handed a query with that axis
 * stripped, so it returns its normal results instead of loud-failing on a field
 * a sibling handles. A child that genuinely fails (e.g. a wired semantic backend
 * erroring) propagates — the hybrid never silently drops a failure.
 * @public
 */
export class HybridRetriever implements IMemoryRetriever {
  private readonly _retrievers: ReadonlyArray<IMemoryRetriever>;
  private readonly _mergeStrategy: IMergeStrategy;
  private readonly _capabilities: IMemoryRetrieverCapabilities;

  private constructor(
    retrievers: ReadonlyArray<IMemoryRetriever>,
    mergeStrategy: IMergeStrategy,
    capabilities: IMemoryRetrieverCapabilities
  ) {
    this._retrievers = retrievers;
    this._mergeStrategy = mergeStrategy;
    this._capabilities = capabilities;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return this._capabilities;
  }

  /**
   * Family-convention factory.
   * @param retrievers - The retrievers to compose (at least one).
   * @param mergeStrategy - How to combine their results.
   */
  public static create(
    retrievers: ReadonlyArray<IMemoryRetriever>,
    mergeStrategy: IMergeStrategy
  ): Result<HybridRetriever> {
    if (retrievers.length === 0) {
      return fail('HybridRetriever: at least one retriever is required');
    }
    // Snapshot the caller's array so a later mutation cannot make `retrieve()`
    // and the cached `capabilities` disagree.
    const stableRetrievers: ReadonlyArray<IMemoryRetriever> = [...retrievers];
    const capabilities: IMemoryRetrieverCapabilities = {
      supportsSemanticRecall: stableRetrievers.some((r) => r.capabilities.supportsSemanticRecall),
      supportsTemporalQuery: stableRetrievers.some((r) => r.capabilities.supportsTemporalQuery),
      supportsLinkTraversal: stableRetrievers.some((r) => r.capabilities.supportsLinkTraversal)
    };
    return succeed(new HybridRetriever(stableRetrievers, mergeStrategy, capabilities));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public async retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return guardRetrieverCapabilities(query, this._capabilities).thenOnSuccess(async () => {
      const perRetriever: Result<ReadonlyArray<IMemoryRecord<unknown>>>[] = await Promise.all(
        this._retrievers.map((retriever) => retriever.retrieve(this._projectQuery(query, retriever)))
      );
      return mapResults(perRetriever)
        .onSuccess((resultSets) => this._mergeStrategy.merge(resultSets))
        .onSuccess((merged) => {
          // `orderBy: 'rank'` re-orders the merged set by rank (descending, absent
          // last) before the page window, so a rank-ordered hybrid query yields a
          // rank-ordered page. Absent / `'recency'` preserves the merge strategy's
          // own ordering (byte-identical to the pre-`orderBy` behavior).
          const ordered: ReadonlyArray<IMemoryRecord<unknown>> =
            query.orderBy === 'rank' ? [...merged].sort(rankCompare) : merged;
          return succeed(limitRecords(ordered, query.limit, query.offset));
        });
    });
  }

  /**
   * Project the query for one child retriever. Two adjustments:
   *
   * - Strip axes the child does not support (`semantic` / `topK` for a
   *   non-semantic child, `asOf` for a non-temporal child, the link axes for a
   *   non-link child) so it returns its normal results rather than loud-failing
   *   on a field a sibling handles.
   * - Strip `limit` unconditionally: limit is a post-merge concern. A child that
   *   pre-truncated its result set would starve the merge strategy of candidates
   *   it needs to score correctly (a record both children would surface must
   *   reach the merge to score 2). The hybrid applies `limit` once, after merge.
   */
  private _projectQuery(query: IMemoryQuery, retriever: IMemoryRetriever): IMemoryQuery {
    const projected: { -readonly [K in keyof IMemoryQuery]: IMemoryQuery[K] } = { ...query };
    delete projected.limit;
    // Offset, like limit, is a post-merge concern: a child that pre-skipped its
    // own ordered set would drop candidates the merge needs to score correctly.
    // The hybrid applies the `{ offset, limit }` window once, after merge.
    delete projected.offset;
    if (!retriever.capabilities.supportsSemanticRecall) {
      delete projected.semantic;
      delete projected.topK;
    }
    if (!retriever.capabilities.supportsTemporalQuery) {
      delete projected.asOf;
    }
    if (!retriever.capabilities.supportsLinkTraversal) {
      delete projected.linkedFrom;
      delete projected.linkedTo;
      delete projected.hops;
    }
    return projected;
  }
}
