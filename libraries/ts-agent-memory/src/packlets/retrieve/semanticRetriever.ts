/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, IMemoryRecordResolver } from '../types';
import { IIndexedMemoryEntry, IMemoryIndex } from '../index';
import { IVectorIndex, IVectorQueryHit } from '../vector';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  IRetrieverCreateParams,
  SEMANTIC_UNWIRED_MESSAGE,
  indexedRecordMatchesQuery,
  limitEntries,
  materializeEntries,
  temporalUnwiredMessage
} from './retriever';

/**
 * Embeds a query string into a vector for {@link IVectorIndex.query}. Async and
 * `Result`-returning, since a real embedder does a network call.
 * @public
 */
export type QueryEmbedder = (text: string) => Promise<Result<Float32Array>>;

/**
 * The semantic backend wired into a {@link SemanticRetriever}: the vector index
 * to query and the embedder that turns the query text into a vector. Both are
 * required together — a vector index is useless without a way to embed the
 * query, so {@link SemanticRetriever.create} treats them as one unit.
 * @public
 */
export interface ISemanticBackend {
  /** The vector index to query. */
  readonly vectorIndex: IVectorIndex;
  /** Turns the query text into a vector. */
  readonly embedQuery: QueryEmbedder;
}

/**
 * Construction options for {@link SemanticRetriever.create}.
 * @public
 */
export interface ISemanticRetrieverCreateParams extends IRetrieverCreateParams {
  /**
   * The semantic backend. When absent, the retriever reports
   * `supportsSemanticRecall: false` and a `query.semantic` request degrades
   * loudly ({@link SEMANTIC_UNWIRED_MESSAGE}) rather than returning empty.
   */
  readonly backend?: ISemanticBackend;
}

/**
 * Vector-recall retriever. When a {@link ISemanticBackend | backend} is wired it
 * embeds `query.semantic`, queries the vector index, and resolves the hits back
 * to records (preserving vector score order). When no backend is wired,
 * `supportsSemanticRecall` is `false` and any `query.semantic` request degrades
 * loudly — it NEVER returns a silent empty.
 *
 * @remarks
 * A consumer-supplied backend that rejects (throws) is normalized into a
 * `Failure` — `retrieve` always honors its `Promise<Result<...>>` contract.
 * @public
 */
export class SemanticRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;
  private readonly _resolver: IMemoryRecordResolver;
  private readonly _backend: ISemanticBackend | undefined;

  private constructor(params: ISemanticRetrieverCreateParams) {
    this._index = params.index;
    this._resolver = params.resolver;
    this._backend = params.backend;
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return {
      supportsSemanticRecall: this._backend !== undefined,
      supportsTemporalQuery: false,
      supportsLinkTraversal: false
    };
  }

  /** Family-convention factory. */
  public static create(params: ISemanticRetrieverCreateParams): Result<SemanticRetriever> {
    return succeed(new SemanticRetriever(params));
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public async retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    if (query.asOf !== undefined) {
      return fail(temporalUnwiredMessage(query.kind));
    }
    if (query.semantic === undefined) {
      // The semantic term is this retriever's axis; without it there is nothing
      // to recall (a no-op contribution to a HybridRetriever, not a failure).
      return succeed([]);
    }
    if (this._backend === undefined) {
      return fail(SEMANTIC_UNWIRED_MESSAGE);
    }
    const backend: ISemanticBackend = this._backend;
    // The backend hooks are consumer-supplied; a rejecting (throwing) impl must
    // still surface as a `Failure`, never escape `retrieve` as a rejected
    // promise. `_callBackend` normalizes both a returned `fail` and a rejection.
    const embedded: Result<Float32Array> = await SemanticRetriever._callBackend('query embedding', () =>
      backend.embedQuery(query.semantic as string)
    );
    if (embedded.isFailure()) {
      return fail(embedded.message);
    }
    const hits: Result<ReadonlyArray<IVectorQueryHit>> = await SemanticRetriever._callBackend(
      'vector query',
      () => backend.vectorIndex.query(embedded.value, query.topK ?? 10)
    );
    if (hits.isFailure()) {
      return fail(hits.message);
    }
    // Resolve each hit by its canonical scope-qualified target — a bare id would
    // alias two records that share a filename stem across scopes. This used to
    // build a Map over the ENTIRE index to look up at most `topK` of them; the
    // index's own `get` makes it O(hits).
    const selected: IIndexedMemoryEntry[] = [];
    for (const hit of hits.value) {
      const entry: IIndexedMemoryEntry | undefined = this._index.get(hit.target);
      if (entry !== undefined && indexedRecordMatchesQuery(entry, query)) {
        selected.push(entry);
      }
    }
    // Hit order IS the ranking, so the page is taken before materializing and
    // only the returned records are read.
    return materializeEntries(limitEntries(selected, query.limit, query.offset), this._resolver);
  }

  /**
   * Invoke a consumer-supplied backend hook, normalizing both a returned `fail`
   * and a thrown/rejected promise into a single `semantic recall: <label> failed`
   * `Failure`. Keeps `retrieve` within the `Promise<Result<...>>` contract even
   * when the injected `embedQuery` / `vectorIndex` misbehaves.
   */
  private static async _callBackend<T>(label: string, op: () => Promise<Result<T>>): Promise<Result<T>> {
    try {
      return (await op()).withErrorFormat((msg) => `semantic recall: ${label} failed: ${msg}`);
    } catch (err) {
      return fail(`semantic recall: ${label} failed: ${String(err)}`);
    }
  }
}
