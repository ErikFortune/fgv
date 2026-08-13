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
 * Returns records matching `query.filter` or `query.provenanceSource`, narrowed
 * by any scope / kind / tag pre-filter and recency-ordered. Those two are this
 * retriever's axes: a query carrying neither is not its concern and yields an
 * empty success (so it contributes nothing to a {@link HybridRetriever}, rather
 * than failing).
 *
 * @remarks
 * `provenanceSource` is applied by the shared pre-filter, so every retriever
 * narrows by it. What this retriever adds is answering a query whose *only* axis
 * is `provenanceSource` — the "show me everything this source produced" request,
 * which would otherwise fall through the `filter`-absent guard and come back
 * empty.
 * @public
 */
export class StructuredFilterRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return NON_SEMANTIC_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<StructuredFilterRetriever> {
    return succeed(new StructuredFilterRetriever(index));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        if (query.filter === undefined && query.provenanceSource === undefined) {
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
