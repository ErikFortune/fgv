/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IFragmentVectorIndex, IVectorQueryHit } from '../vector';
import { QueryEmbedder } from './semanticRetriever';

/**
 * The loud-degradation message a {@link FragmentSemanticRetriever} returns when a
 * fragment query is issued but no {@link IFragmentSemanticBackend | backend} is
 * wired — the discovery surface NEVER answers a fragment query with a silent empty.
 * @public
 */
export const FRAGMENT_SEMANTIC_UNWIRED_MESSAGE: string =
  'fragment recall: no fragment index is wired; wire an IFragmentSemanticBackend to enable sub-document search';

/**
 * The fragment backend wired into a {@link FragmentSemanticRetriever}: the fragment
 * index to query and the embedder that turns the query text into a vector. Both are
 * required together — a fragment index is useless without a way to embed the query.
 * @public
 */
export interface IFragmentSemanticBackend {
  /** The fragment-granular vector index to query. */
  readonly fragmentIndex: IFragmentVectorIndex;
  /** Turns the query text into a vector. */
  readonly embedQuery: QueryEmbedder;
}

/**
 * A sub-document semantic-search request: the natural-language `semantic` text to
 * match, an optional `topK` result cap (default 10), and an optional
 * `maxPerRecord` cap that keeps one long document from monopolizing the result.
 * @public
 */
export interface IFragmentQuery {
  /** The natural-language text to embed and match against stored fragments. */
  readonly semantic: string;
  /** Maximum number of fragment hits to return. Defaults to 10. */
  readonly topK?: number;
  /**
   * Maximum number of fragments any single record may contribute to the result.
   * Applied during selection (before the `topK` cut). Omit for uncapped.
   */
  readonly maxPerRecord?: number;
}

/**
 * What a {@link FragmentSemanticRetriever} can do given its wiring.
 * @public
 */
export interface IFragmentRetrieverCapabilities {
  /** `true` when a fragment backend is wired and fragment recall is operational. */
  readonly supportsFragmentRecall: boolean;
}

/**
 * The sub-document semantic-search retriever — the "discovery" half of a
 * search-then-read contract. It embeds a fragment query, queries the
 * {@link IFragmentVectorIndex}, and returns the raw per-fragment
 * {@link IVectorQueryHit | hits} (each carrying a record `target` AND the matched
 * `locator`), NOT resolved records: the consumer re-reads each record and slices it
 * by the locator on its own read side.
 *
 * @remarks
 * Deliberately NOT an {@link IMemoryRetriever}: memory recall is record-granular and
 * returns records; fragment discovery is span-granular and returns locators. Keeping
 * it a distinct surface matches the consumer contract (memory stays record-granular;
 * sub-document knowledge uses a separate fragment index) and avoids overloading the
 * record retriever's return type with a locator that only makes sense here.
 *
 * When no backend is wired, `supportsFragmentRecall` is `false` and any fragment
 * query degrades loudly ({@link FRAGMENT_SEMANTIC_UNWIRED_MESSAGE}) — it NEVER
 * returns a silent empty. A consumer-supplied backend that rejects (throws) is
 * normalized into a `Failure`.
 * @public
 */
export class FragmentSemanticRetriever {
  private readonly _backend: IFragmentSemanticBackend | undefined;

  private constructor(backend: IFragmentSemanticBackend | undefined) {
    this._backend = backend;
  }

  /** What this retriever can do given its wiring. */
  public get capabilities(): IFragmentRetrieverCapabilities {
    return { supportsFragmentRecall: this._backend !== undefined };
  }

  /** Family-convention factory. */
  public static create(params: {
    readonly backend?: IFragmentSemanticBackend;
  }): Result<FragmentSemanticRetriever> {
    return succeed(new FragmentSemanticRetriever(params.backend));
  }

  /**
   * Embed `query.semantic`, query the fragment index, and return the per-fragment
   * hits in descending score order. Fails loudly when no backend is wired.
   */
  public async retrieve(query: IFragmentQuery): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    if (this._backend === undefined) {
      return fail(FRAGMENT_SEMANTIC_UNWIRED_MESSAGE);
    }
    const backend: IFragmentSemanticBackend = this._backend;
    // Consumer-supplied hooks may throw; normalize both a returned `fail` and a
    // rejection into a single `fragment recall: <label> failed` Failure so
    // `retrieve` always honors its `Promise<Result<...>>` contract.
    const embedded: Result<Float32Array> = await FragmentSemanticRetriever._callBackend(
      'query embedding',
      () => backend.embedQuery(query.semantic)
    );
    if (embedded.isFailure()) {
      return fail(embedded.message);
    }
    return FragmentSemanticRetriever._callBackend('fragment query', () =>
      backend.fragmentIndex.query(embedded.value, query.topK ?? 10, query.maxPerRecord)
    );
  }

  /**
   * Invoke a consumer-supplied backend hook, normalizing both a returned `fail`
   * and a thrown/rejected promise into a single `fragment recall: <label> failed`
   * `Failure`.
   */
  private static async _callBackend<T>(label: string, op: () => Promise<Result<T>>): Promise<Result<T>> {
    try {
      return (await op()).withErrorFormat((msg) => `fragment recall: ${label} failed: ${msg}`);
    } catch (err) {
      return fail(`fragment recall: ${label} failed: ${String(err)}`);
    }
  }
}
