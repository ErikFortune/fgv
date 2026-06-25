/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, Kind, MemoryId, MemoryScopeKey, Tag } from '../types';
import { IIndexedMemoryRecord } from '../index';

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
  /** Restrict to records of this kind. */
  readonly kind?: Kind;
  /** Restrict to records linked FROM this id (outbound). */
  readonly linkedFrom?: MemoryId;
  /** Restrict to records linked TO this id (inbound / backlinks). */
  readonly linkedTo?: MemoryId;
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
  /** Maximum records to return. Applied after all other filters. */
  readonly limit?: number;
  /** Arbitrary predicate applied after the scope / kind / tag pre-filter. */
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
  return succeed(true);
}

/**
 * Recency comparator: most-recently-updated first, with a `seq` tiebreak so
 * equal-`updated` records sort deterministically. Mirrors the B1 index ordering.
 * @public
 */
export function recencyCompare(a: IMemoryRecord<unknown>, b: IMemoryRecord<unknown>): number {
  const byUpdated: number = b.envelope.updated - a.envelope.updated;
  return byUpdated !== 0 ? byUpdated : b.envelope.seq - a.envelope.seq;
}

/**
 * Whether an indexed entry satisfies a query's scope / kind / tag / predicate
 * pre-filter (the axes shared by every v1 retriever). The `semantic` / `asOf` /
 * link axes are NOT applied here — those are each retriever's own concern.
 * @public
 */
export function indexedRecordMatchesQuery(entry: IIndexedMemoryRecord, query: IMemoryQuery): boolean {
  if (query.scope !== undefined && entry.scope !== query.scope) {
    return false;
  }
  if (query.kind !== undefined && entry.record.envelope.kind !== query.kind) {
    return false;
  }
  if (query.tag !== undefined && !entry.record.envelope.tags.includes(query.tag)) {
    return false;
  }
  if (query.filter !== undefined && !query.filter(entry.record)) {
    return false;
  }
  return true;
}

/**
 * Apply the shared scope / kind / tag / predicate pre-filter to a set of indexed
 * entries, returning the surviving records (unordered, unlimited).
 * @public
 */
export function selectByQuery(
  entries: ReadonlyArray<IIndexedMemoryRecord>,
  query: IMemoryQuery
): IMemoryRecord<unknown>[] {
  return entries.filter((entry) => indexedRecordMatchesQuery(entry, query)).map((entry) => entry.record);
}

/**
 * Truncate to `query.limit` records (a no-op when `limit` is absent). Applied
 * last, after ordering, so it always takes the top-N of the ordered result.
 * @public
 */
export function limitRecords(
  records: ReadonlyArray<IMemoryRecord<unknown>>,
  limit?: number
): ReadonlyArray<IMemoryRecord<unknown>> {
  return limit !== undefined && records.length > limit ? records.slice(0, limit) : records;
}
