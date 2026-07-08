/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, isTemporalRecord, selectCurrentVersion, selectVersionAsOf } from '../types';
import { IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  guardRetrieverCapabilities,
  indexedRecordMatchesQuery,
  limitRecords,
  recencyCompare
} from './retriever';

/**
 * The capabilities every temporal retriever exposes: temporal "as-of" queries
 * are operational (semantic recall and link traversal are not this retriever's
 * concern).
 * @public
 */
export const TEMPORAL_CAPABILITIES: IMemoryRetrieverCapabilities = {
  supportsSemanticRecall: false,
  supportsTemporalQuery: true,
  supportsLinkTraversal: false
};

/**
 * Group the temporal records surviving a query's scope / kind / tag / predicate
 * pre-filter by entity (`kind` + `entityId`). Non-temporal records are excluded —
 * the temporal retrievers operate only over versioned entities. The map values
 * are each entity's versions (unordered).
 */
function groupTemporalVersionsByEntity(
  index: IMemoryIndex,
  query: IMemoryQuery
): Map<string, IMemoryRecord<unknown>[]> {
  const groups: Map<string, IMemoryRecord<unknown>[]> = new Map<string, IMemoryRecord<unknown>[]>();
  for (const entry of index.entries()) {
    if (!isTemporalRecord(entry.record) || !indexedRecordMatchesQuery(entry, query)) {
      continue;
    }
    const key: string = `${entry.record.envelope.kind}\0${entry.record.envelope.entityId}`;
    const existing: IMemoryRecord<unknown>[] | undefined = groups.get(key);
    if (existing === undefined) {
      groups.set(key, [entry.record]);
    } else {
      existing.push(entry.record);
    }
  }
  return groups;
}

/**
 * Temporal retriever returning the **current** version of each temporal entity
 * matching the query (the newest version whose `invalid_at` is null/absent),
 * recency-ordered and limited. A fully-invalidated (soft-deleted) entity
 * contributes nothing. Non-temporal records are not this retriever's concern.
 * @public
 */
export class CurrentValidRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return TEMPORAL_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<CurrentValidRetriever> {
    return succeed(new CurrentValidRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        const selected: IMemoryRecord<unknown>[] = [];
        for (const versions of groupTemporalVersionsByEntity(this._index, query).values()) {
          const current: IMemoryRecord<unknown> | undefined = selectCurrentVersion(versions);
          if (current !== undefined) {
            selected.push(current);
          }
        }
        selected.sort(recencyCompare);
        return succeed(limitRecords(selected, query.limit));
      })
    );
  }
}

/**
 * Temporal retriever returning, for each temporal entity matching the query, the
 * version valid at `query.asOf` (epoch ms). `asOf` is this retriever's axis: a
 * query without it yields an empty success (a no-op contribution to a
 * {@link HybridRetriever}, not a failure). Results are recency-ordered and
 * limited.
 * @public
 */
export class AsOfRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return TEMPORAL_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<AsOfRetriever> {
    return succeed(new AsOfRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        if (query.asOf === undefined) {
          return succeed([]);
        }
        const asOf: number = query.asOf;
        const selected: IMemoryRecord<unknown>[] = [];
        for (const versions of groupTemporalVersionsByEntity(this._index, query).values()) {
          const valid: IMemoryRecord<unknown> | undefined = selectVersionAsOf(versions, asOf);
          if (valid !== undefined) {
            selected.push(valid);
          }
        }
        selected.sort(recencyCompare);
        return succeed(limitRecords(selected, query.limit));
      })
    );
  }
}

/**
 * Temporal retriever returning **every** version of each temporal entity matching
 * the query, ordered ascending by `valid_at` (then `seq` as a stable tiebreak) —
 * the entity's full history. Limited after ordering.
 *
 * @remarks
 * When the query matches more than one entity, the result is a single
 * CROSS-entity list globally sorted by `valid_at` — versions of different
 * entities interleave, NOT grouped per entity — so `limit` truncates that
 * globally-sorted list. Constrain to one entity (e.g. via `query.scope`) for a
 * single entity's contiguous history.
 * @public
 */
export class HistoryRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return TEMPORAL_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<HistoryRetriever> {
    return succeed(new HistoryRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        const history: IMemoryRecord<unknown>[] = [];
        for (const versions of groupTemporalVersionsByEntity(this._index, query).values()) {
          history.push(...versions);
        }
        history.sort(HistoryRetriever._byValidAtAscending);
        return succeed(limitRecords(history, query.limit));
      })
    );
  }

  /** A version's world-truth start: its `valid_at`, defaulting to `created` when absent. */
  private static _startOf(record: IMemoryRecord<unknown>): number {
    const temporal: IMemoryRecord<unknown>['envelope']['temporal'] = record.envelope.temporal;
    /* c8 ignore next 3 -- unreachable: HistoryRetriever orders only temporal records (pre-filtered by isTemporalRecord), so `temporal` is always present; the guard keeps the type honest */
    if (temporal === undefined) {
      return record.envelope.created;
    }
    return temporal.valid_at ?? record.envelope.created;
  }

  /**
   * Ascending-by-`valid_at` comparator (a version's `valid_at` defaults to its
   * `created` when absent), with `seq` as a stable ascending tiebreak so
   * same-instant versions order by write sequence.
   */
  private static _byValidAtAscending(a: IMemoryRecord<unknown>, b: IMemoryRecord<unknown>): number {
    const aStart: number = HistoryRetriever._startOf(a);
    const bStart: number = HistoryRetriever._startOf(b);
    return aStart !== bStart ? aStart - bStart : a.envelope.seq - b.envelope.seq;
  }
}
