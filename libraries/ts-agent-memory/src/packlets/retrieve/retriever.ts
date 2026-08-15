/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IEnvelopeCarrier,
  IMemoryRecord,
  IMemoryRecordResolver,
  Kind,
  MemoryScopeKey,
  ProvenanceSource,
  Tag
} from '../types';
import { IIndexedMemoryEntry, IMemoryIndex } from '../index';

/**
 * What every index-backed retriever needs: the index it selects over, and the
 * resolver it materializes survivors through.
 *
 * @remarks
 * The resolver is the whole of the partial-read migration for a caller that
 * constructs retrievers directly — the index projection itself is invisible to
 * anyone who only consumes `retrieve()`. `FileTreeMemoryStore` implements
 * {@link IMemoryRecordResolver}, so wiring is `{ index, resolver: store }`.
 * @public
 */
export interface IRetrieverCreateParams {
  /** The derived index to select over. */
  readonly index: IMemoryIndex;
  /** Materializes the selected entries' bodies. */
  readonly resolver: IMemoryRecordResolver;
}

/**
 * The capabilities a retriever exposes. A consumer probes these before
 * dispatching a query so it never silently gets an empty result for a
 * capability the retriever does not implement.
 * @public
 */
export interface IMemoryRetrieverCapabilities {
  /** Semantic / vector recall is operational (an {@link IVectorIndex} is wired). */
  readonly supportsSemanticRecall: boolean;
  /** Temporal "as-of" queries are operational (a temporal index is wired). */
  readonly supportsTemporalQuery: boolean;
  /** Link traversal is supported (an in-memory backlink index is present). */
  readonly supportsLinkTraversal: boolean;
}

/**
 * A retrieval query. Every field is optional; an empty query is the "recency
 * over everything" request. `semantic` and `asOf` are present from day one (the
 * no-resignature guarantee): a backend that adds semantic or temporal recall
 * sets the matching capability flag, with no interface change.
 * @public
 */
export interface IMemoryQuery {
  /** Restrict to records in this scope. */
  readonly scope?: MemoryScopeKey;
  /** Restrict to records carrying this tag (exact match). */
  readonly tag?: Tag;
  /**
   * Restrict to records whose {@link IProvenance.source | provenance.source} is
   * exactly this value — the "show me everything this source produced" axis, for
   * review, attribution, and retraction after a bad ingest.
   *
   * @remarks
   * Exact match on `source` only, deliberately: not a subset match over the whole
   * {@link IProvenance} block, not a presence check, and not a match on `by` /
   * `model` / the consumer-owned extension keys. `source` is the only field of
   * that block the library assigns meaning to, and every record carries one
   * (`envelope.provenance` is required), so this axis is total — it partitions
   * the vault rather than filtering out records that merely omit a field.
   *
   * Applied in the shared pre-filter alongside `scope` / `kind` / `tag`, so every
   * retriever honours it and combining axes composes as AND.
   */
  readonly provenanceSource?: ProvenanceSource;
  /**
   * Restrict to records of this kind — the single-kind shorthand for
   * {@link IMemoryQuery.kinds | kinds}. When both are set they compose as AND
   * (the record's kind must satisfy both), so `kind` must itself be a member of
   * `kinds` for anything to match.
   */
  readonly kind?: Kind;
  /**
   * Restrict to records in ANY of these kinds — the general (multi-kind) form of
   * {@link IMemoryQuery.kind | kind}. Absent → no kind-set constraint (today's
   * behavior). An explicit empty array `[]` matches NOTHING (mirroring the
   * non-positive-`limit` "explicit empty" convention), never "match all".
   */
  readonly kinds?: ReadonlyArray<Kind>;
  /** Restrict to records linked FROM this scope-qualified seed (outbound). */
  readonly linkedFrom?: IEdgeTarget;
  /** Restrict to records linked TO this scope-qualified seed (inbound / backlinks). */
  readonly linkedTo?: IEdgeTarget;
  /** BFS hop count for link traversal. Default: 1. */
  readonly hops?: number;
  /**
   * Text query for semantic / vector recall. If set and the retriever's
   * `supportsSemanticRecall` is `false`, the retriever returns a loud
   * `Result.fail` ({@link SEMANTIC_UNWIRED_MESSAGE}) — never a silent empty.
   */
  readonly semantic?: string;
  /** Top-K for semantic recall. Default: 10. */
  readonly topK?: number;
  /**
   * As-of epoch ms for temporal "valid at" queries. If set and the retriever's
   * `supportsTemporalQuery` is `false`, the retriever returns a loud
   * `Result.fail` — never a silent empty.
   */
  readonly asOf?: number;
  /**
   * Ordering for the result set. `'recency'` (the default when absent — today's
   * exact behavior) orders most-recently-updated first; `'rank'` orders by the
   * store-computed {@link IMemoryEnvelope.rank} descending (records with an absent
   * `rank` last), with recency as the tiebreak. Combined with `{ limit, offset }`
   * this yields a bounded top-M rank-ordered page with no full-vault scan.
   *
   * @remarks
   * `orderBy` governs the ordered non-semantic retrievers (recency / tag /
   * structured-filter / link-traversal) and the {@link HybridRetriever}'s
   * post-merge ordering. The {@link SemanticRetriever} is the sole exception: it
   * preserves its native vector-similarity order regardless of `orderBy` —
   * re-sorting semantic hits by `rank` would discard the similarity ranking that
   * is the whole point of that path; a consumer that wants rank ordering uses a
   * non-semantic query.
   */
  readonly orderBy?: 'recency' | 'rank';
  /** Maximum records to return. Applied after all other filters. */
  readonly limit?: number;
  /**
   * Records to skip after ordering, before `limit` — so `{ offset, limit }` is a
   * stable page window over the ordered result set. Default 0. A non-positive or
   * absent offset is today's behavior (no skip); an offset past the end yields an
   * empty page, never a throw.
   */
  readonly offset?: number;
  /** Arbitrary predicate applied after the scope / kind / tag / provenance-source pre-filter. */
  readonly filter?: (record: IMemoryRecord<unknown>) => boolean;
}

/**
 * The retrieval contract. A retriever exposes its {@link
 * IMemoryRetrieverCapabilities | capabilities} and answers
 * {@link IMemoryRetriever.retrieve | queries}, degrading loudly (never silently
 * empty) when a requested capability is not wired.
 * @public
 */
export interface IMemoryRetriever {
  /** The capabilities this retriever exposes. Probe before dispatch. */
  readonly capabilities: IMemoryRetrieverCapabilities;
  /**
   * Retrieve records matching `query`. Returns a `Result.fail` with a
   * diagnostic message when the query requests a capability this retriever does
   * not support (never an empty success).
   */
  retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;
}

/**
 * The loud-degradation message a retriever returns when `query.semantic` is set
 * but no {@link IVectorIndex} is wired.
 * @public
 */
export const SEMANTIC_UNWIRED_MESSAGE: string = 'semantic recall requires a vector index; none configured';

/**
 * The loud-degradation message a retriever returns when a link-traversal axis
 * (`linkedFrom` / `linkedTo` / `hops`) is requested but no backlink index is
 * wired.
 * @public
 */
export const LINK_TRAVERSAL_UNWIRED_MESSAGE: string =
  'link traversal requires a backlink index; none configured';

/**
 * The capabilities every non-semantic, non-temporal, non-link v1 retriever
 * exposes (all three flags `false`).
 * @public
 */
export const NON_SEMANTIC_CAPABILITIES: IMemoryRetrieverCapabilities = {
  supportsSemanticRecall: false,
  supportsTemporalQuery: false,
  supportsLinkTraversal: false
};

/**
 * Build the loud-degradation message a retriever returns when `query.asOf` is
 * set but no temporal index is wired.
 * @public
 */
export function temporalUnwiredMessage(kind?: Kind): string {
  return `temporal query requires temporal index; none configured${
    kind !== undefined ? ` for kind ${kind}` : ''
  }`;
}

/**
 * Enforce the loud-degradation contract for the `semantic` and `asOf` axes
 * against a retriever's `capabilities`: a requested capability the retriever
 * does not support fails loudly rather than returning a silent empty result.
 * @public
 */
export function guardRetrieverCapabilities(
  query: IMemoryQuery,
  capabilities: IMemoryRetrieverCapabilities
): Result<true> {
  if (query.semantic !== undefined && !capabilities.supportsSemanticRecall) {
    return fail(SEMANTIC_UNWIRED_MESSAGE);
  }
  if (query.asOf !== undefined && !capabilities.supportsTemporalQuery) {
    return fail(temporalUnwiredMessage(query.kind));
  }
  const requestsLinkTraversal: boolean =
    query.linkedFrom !== undefined || query.linkedTo !== undefined || query.hops !== undefined;
  if (requestsLinkTraversal && !capabilities.supportsLinkTraversal) {
    return fail(LINK_TRAVERSAL_UNWIRED_MESSAGE);
  }
  return succeed(true);
}

/**
 * Recency comparator: most-recently-updated first, with a `seq` tiebreak so
 * equal-`updated` records sort deterministically. Mirrors the B1 index ordering.
 * @public
 */
export function recencyCompare(a: IEnvelopeCarrier, b: IEnvelopeCarrier): number {
  const byUpdated: number = b.envelope.updated - a.envelope.updated;
  return byUpdated !== 0 ? byUpdated : b.envelope.seq - a.envelope.seq;
}

/**
 * Rank comparator: store-computed {@link IMemoryEnvelope.rank} descending, with
 * {@link recencyCompare} as the tiebreak. Records with an absent `rank` sort LAST
 * (after every ranked record), then by recency among themselves. Mirrors the
 * index's rank-view ordering.
 * @public
 */
export function rankCompare(a: IEnvelopeCarrier, b: IEnvelopeCarrier): number {
  const ra: number | undefined = a.envelope.rank;
  const rb: number | undefined = b.envelope.rank;
  if (ra === undefined && rb !== undefined) {
    return 1;
  }
  if (rb === undefined && ra !== undefined) {
    return -1;
  }
  if (ra !== undefined && rb !== undefined && ra !== rb) {
    return rb - ra;
  }
  return recencyCompare(a, b);
}

/**
 * Select the record comparator for a query's {@link IMemoryQuery.orderBy | orderBy}
 * axis: {@link rankCompare} for `'rank'`, {@link recencyCompare} otherwise (the
 * default, byte-identical to the pre-`orderBy` behavior).
 * @public
 */
export function orderingCompare(
  orderBy?: IMemoryQuery['orderBy']
): (a: IEnvelopeCarrier, b: IEnvelopeCarrier) => number {
  return orderBy === 'rank' ? rankCompare : recencyCompare;
}

/**
 * Whether an indexed entry satisfies a query's scope / kind / tag /
 * provenance-source / predicate pre-filter (the axes shared by every v1
 * retriever). The `semantic` / `asOf` / link axes are NOT applied here — those
 * are each retriever's own concern.
 * @public
 */
export function indexedRecordMatchesQuery(entry: IIndexedMemoryEntry, query: IMemoryQuery): boolean {
  if (query.scope !== undefined && entry.scope !== query.scope) {
    return false;
  }
  if (query.kind !== undefined && entry.envelope.kind !== query.kind) {
    return false;
  }
  if (query.kinds !== undefined && !query.kinds.includes(entry.envelope.kind)) {
    return false;
  }
  if (query.tag !== undefined && !entry.envelope.tags.includes(query.tag)) {
    return false;
  }
  if (query.provenanceSource !== undefined && entry.envelope.provenance.source !== query.provenanceSource) {
    return false;
  }
  // `query.filter` is deliberately NOT applied here — it is a predicate over the
  // whole record, and the index holds envelopes. It runs after materialization;
  // see `resolveQuery`.
  return true;
}

/**
 * Apply the shared scope / kind / tag / provenance-source / predicate pre-filter
 * to a set of indexed entries, returning the surviving records (unordered,
 * unlimited).
 * @public
 */
export function selectByQuery(
  entries: ReadonlyArray<IIndexedMemoryEntry>,
  query: IMemoryQuery
): IIndexedMemoryEntry[] {
  return entries.filter((entry) => indexedRecordMatchesQuery(entry, query));
}

/**
 * The shared select → order → page → materialize pipeline every non-semantic
 * retriever runs, and the one place the body-vs-envelope ordering decision lives.
 *
 * @public
 * @remarks
 * **Without `query.filter`, ordering and paging happen over envelopes and only
 * the page is materialized** — so `limit` genuinely bounds the number of records
 * read, not merely the number returned. That is what makes `limit` a legitimate
 * narrowing axis rather than a loophole, and it is conditional on the ordering
 * key being an envelope field: both shipped comparators (`recencyCompare`,
 * `rankCompare`) read `updated` / `seq` / `rank` and qualify. **An ordering that
 * keyed on a body field could not use this path** and would have to sort after
 * materialization, at which point `limit` bounds the result and not the read.
 *
 * **With `query.filter`, every envelope-survivor must be materialized first**,
 * because the predicate takes a whole record. Semantics are preserved exactly;
 * the cost is not. Pair `filter` with an envelope axis when the read cost
 * matters.
 */
export function resolveQuery(
  entries: ReadonlyArray<IIndexedMemoryEntry>,
  query: IMemoryQuery,
  resolver: IMemoryRecordResolver
): Result<ReadonlyArray<IMemoryRecord<unknown>>> {
  const selected: IIndexedMemoryEntry[] = selectByQuery(entries, query);
  if (query.filter === undefined) {
    const page: ReadonlyArray<IIndexedMemoryEntry> = limitEntries(
      [...selected].sort(orderingCompare(query.orderBy)),
      query.limit,
      query.offset
    );
    return materializeEntries(page, resolver);
  }
  return materializeEntries(selected, resolver).onSuccess((records) => {
    const filtered: IMemoryRecord<unknown>[] = records.filter((record) => query.filter!(record));
    return succeed(limitRecords(filtered.sort(orderingCompare(query.orderBy)), query.limit, query.offset));
  });
}

/**
 * Materialize entries through the resolver, dropping any that have vanished
 * since selection — a concurrent delete between selecting an envelope and
 * reading its body is a legitimate race and yields a shorter list, not an error.
 * A read that FAILS is a real fault and propagates.
 * @public
 */
export function materializeEntries(
  entries: ReadonlyArray<IIndexedMemoryEntry>,
  resolver: IMemoryRecordResolver
): Result<ReadonlyArray<IMemoryRecord<unknown>>> {
  return mapResults(entries.map((e) => resolver.resolveRecord(e.scope, e.envelope.id))).onSuccess((records) =>
    succeed(records.filter((r): r is IMemoryRecord<unknown> => r !== undefined))
  );
}

/**
 * The {@link limitRecords} window, applied to entries — used on the
 * no-body-filter path so paging happens before anything is read.
 * @public
 */
export function limitEntries(
  entries: ReadonlyArray<IIndexedMemoryEntry>,
  limit?: number,
  offset?: number
): ReadonlyArray<IIndexedMemoryEntry> {
  const skip: number = offset !== undefined && offset > 0 ? offset : 0;
  const windowed: ReadonlyArray<IIndexedMemoryEntry> = skip > 0 ? entries.slice(skip) : entries;
  if (limit === undefined) {
    return windowed;
  }
  return limit > 0 ? windowed.slice(0, limit) : [];
}

/**
 * Apply the `{ offset, limit }` page window to an ordered record set. Applied
 * last, after ordering, so it always takes a stable window of the ordered
 * result. `offset` is applied first (records to skip), then `limit` (top-N of
 * the remainder).
 *
 * @remarks
 * Both bounds are public query input and are guarded against non-positive
 * values slipping into `slice`:
 * - `offset` absent or non-positive → no skip (today's behavior). An offset past
 *   the end yields an empty page rather than a throw.
 * - `limit` absent → no truncation; a non-positive `limit` means "no records"
 *   and returns an empty array.
 * @public
 */
export function limitRecords(
  records: ReadonlyArray<IMemoryRecord<unknown>>,
  limit?: number,
  offset?: number
): ReadonlyArray<IMemoryRecord<unknown>> {
  const skip: number = offset !== undefined && offset > 0 ? offset : 0;
  const windowed: ReadonlyArray<IMemoryRecord<unknown>> = skip > 0 ? records.slice(skip) : records;
  if (limit === undefined) {
    return windowed;
  }
  if (limit <= 0) {
    return [];
  }
  return windowed.length > limit ? windowed.slice(0, limit) : windowed;
}
