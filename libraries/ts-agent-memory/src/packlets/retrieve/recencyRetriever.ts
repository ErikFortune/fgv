/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IMemoryRecord } from '../types';
import { IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  NON_SEMANTIC_CAPABILITIES,
  guardRetrieverCapabilities,
  limitRecords,
  orderingCompare,
  selectByQuery
} from './retriever';

/**
 * Returns records matching the query's scope / kind / tag / predicate filters,
 * ordered most-recently-updated first. The universal v1 retriever — an empty
 * query returns the whole vault in recency order.
 * @public
 */
export class RecencyRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return NON_SEMANTIC_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<RecencyRetriever> {
    return succeed(new RecencyRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        const ordered: IMemoryRecord<unknown>[] = selectByQuery(this._index.entries(), query).sort(
          orderingCompare(query.orderBy)
        );
        return succeed(limitRecords(ordered, query.limit, query.offset));
      })
    );
  }
}
