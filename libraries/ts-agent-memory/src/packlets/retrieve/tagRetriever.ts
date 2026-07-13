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
 * Returns records carrying `query.tag`, recency-ordered within the tag and
 * narrowed by any scope / kind / predicate filters. Tag is this retriever's
 * axis: a query without a `tag` is not its concern and yields an empty success
 * (so it contributes nothing to a {@link HybridRetriever}, rather than failing).
 * @public
 */
export class TagRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return NON_SEMANTIC_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<TagRetriever> {
    return succeed(new TagRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        if (query.tag === undefined) {
          return succeed([]);
        }
        const ordered: IMemoryRecord<unknown>[] = selectByQuery(this._index.entries(), query).sort(
          orderingCompare(query.orderBy)
        );
        return succeed(limitRecords(ordered, query.limit, query.offset));
      })
    );
  }
}
