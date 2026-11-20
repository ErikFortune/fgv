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
 * Returns records carrying `query.tag`, recency-ordered within the tag and
 * narrowed by any scope / kind / provenance-source / predicate filters. Tag is this retriever's
 * axis: a query without a `tag` is not its concern and yields an empty success
 * (so it contributes nothing to a {@link HybridRetriever}, rather than failing).
 * @public
 */
export class TagRetriever implements IMemoryRetriever {
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
  public static create(params: IRetrieverCreateParams): Result<TagRetriever> {
    return succeed(new TagRetriever(params));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => {
        if (query.tag === undefined) {
          return succeed([]);
        }
        return resolveQuery(this._index.entries(), query, this._resolver);
      })
    );
  }
}
