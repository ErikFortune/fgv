/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, IMemoryRecordResolver } from '../types';
import { IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  IRetrieverCreateParams,
  NON_SEMANTIC_CAPABILITIES,
  guardRetrieverCapabilities,
  resolveQuery
} from './retriever';

/**
 * Returns records matching `query.filter` or `query.provenanceSource`, narrowed
 * by any scope / kind / tag / provenance-source pre-filter and recency-ordered.
 * Those two are this retriever's axes: a query carrying neither is not its
 * concern and yields an empty success (so it contributes nothing to a
 * {@link HybridRetriever}, rather than failing).
 *
 * Note `provenanceSource` appears on both sides of that sentence, and the
 * duplication is real rather than sloppy: it is one of this retriever's two
 * *dispatch* axes (it decides whether the query is this retriever's concern at
 * all) **and** a member of the shared *pre-filter* (it narrows the result set,
 * as it does for every other retriever). `filter` is likewise both.
 *
 * @remarks
 * `provenanceSource` is *applied* by the shared pre-filter, so every retriever
 * narrows by it. What this retriever adds is *answering* a query whose only axis
 * is `provenanceSource` — the "show me everything this source produced" request,
 * which would otherwise fall through the `filter`-absent guard and come back
 * empty.
 *
 * Consequently, inside a {@link HybridRetriever} composed with the universal
 * {@link RecencyRetriever}, a `provenanceSource`-only query is answered by both
 * children and every matching record scores twice under a score-union merge.
 * That is the established behavior for a dedicated-axis retriever composed with
 * the universal one — {@link TagRetriever} double-scores a `tag`-only query the
 * same way — and is intentional here, not an artifact of grafting a second axis
 * onto a retriever whose original concern was arbitrary predicates.
 * @public
 */
export class StructuredFilterRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;
  private readonly _resolver: IMemoryRecordResolver;

  private constructor(params: IRetrieverCreateParams) {
    this._index = params.index;
    this._resolver = params.resolver;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return NON_SEMANTIC_CAPABILITIES;
  }

  /** Family-convention factory. */
  public static create(params: IRetrieverCreateParams): Result<StructuredFilterRetriever> {
    return succeed(new StructuredFilterRetriever(params));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        if (query.filter === undefined && query.provenanceSource === undefined) {
          return succeed([]);
        }
        return resolveQuery(this._index.entries(), query, this._resolver);
      })
    );
  }
}
