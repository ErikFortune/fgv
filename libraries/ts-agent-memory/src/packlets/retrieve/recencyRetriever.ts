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
 * Returns records matching the query's scope / kind / tag / provenance-source / predicate filters,
 * ordered most-recently-updated first. The universal v1 retriever — an empty
 * query returns the whole vault in recency order.
 * @public
 */
export class RecencyRetriever implements IMemoryRetriever {
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
  public static create(params: IRetrieverCreateParams): Result<RecencyRetriever> {
    return succeed(new RecencyRetriever(params));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        return resolveQuery(this._index.entries(), query, this._resolver);
      })
    );
  }
}
