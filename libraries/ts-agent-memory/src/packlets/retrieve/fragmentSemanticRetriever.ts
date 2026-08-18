/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { EntityId, IIdentityCodecResult, IIdentityResolver, Kind, MemoryId } from '../types';
import { IFragmentQueryOptions, IFragmentVectorIndex, IVectorQueryHit } from '../vector';
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
 * The loud-degradation message returned when a query carries a record narrowing but
 * no {@link IIdentityResolver} is wired to resolve it.
 *
 * @remarks
 * Deliberately a `Failure` rather than a silently-global search: answering a scoped
 * question with an unscoped result is the failure this narrowing exists to remove.
 * @public
 */
export const FRAGMENT_NARROWING_UNRESOLVABLE_MESSAGE: string =
  'fragment recall: a record narrowing was supplied but no identity resolver is wired; pass one to FragmentSemanticRetriever.create';

/**
 * The message returned when exactly one of `entityId` / `kind` is supplied.
 *
 * @remarks
 * They travel together because `kind` is what selects the identity codec, and the
 * codec is what makes the resolution unambiguous. One without the other is not a
 * partial narrowing that could be honored best-effort — it is not a narrowing at all.
 * @public
 */
export const FRAGMENT_NARROWING_INCOMPLETE_MESSAGE: string =
  'fragment recall: `entityId` and `kind` must be supplied together — `kind` selects the identity codec that resolves the narrowing';

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

  /**
   * Narrow the search to one record's fragments: the consumer-supplied domain key
   * of the record to search within. **Must be supplied with
   * {@link IFragmentQuery.kind}.**
   *
   * @remarks
   * The narrowing is applied **during selection, before the `topK` cut**, so the
   * `topK` you ask for is the `topK` you get. Filtering a global result afterwards
   * is not equivalent: it truncates to `topK` across every record first, so a scoped
   * search would come back short whenever other records outscored this one's
   * fragments.
   *
   * For a versioned kind this narrows to **every version of the entity** — literally
   * every version, superseded ones included, because invalidation stamps `invalid_at`
   * without pruning that version's fragments. Nothing on a hit distinguishes a
   * current fragment from a historical one. That matches the record-granular vector
   * lane; it is not currency filtering.
   */
  readonly entityId?: EntityId;

  /**
   * The kind of the record named by {@link IFragmentQuery.entityId}. **Must be
   * supplied with it.**
   *
   * @remarks
   * This is not decoration and not a filter: `kind` **selects the identity codec**,
   * and the codec computes the storage address. An `EntityId` promises no uniqueness
   * beyond a scope — the same id under two kinds is the ordinary case, not a
   * pathological one — so without `kind` the resolution is ambiguous, and with it
   * ambiguity is structurally impossible.
   */
  readonly kind?: Kind;
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
 * {@link IVectorQueryHit | hits} (each carrying a record `target` AND whichever of
 * `locator` / `fragmentId` the stored fragment was indexed with), NOT resolved
 * records: the consumer re-reads each record and resolves the fragment on its own
 * read side. Note the `locator` span is advisory — see {@link IFragmentLocator}; it
 * is not a slice guaranteed to reproduce the fragment's text.
 *
 * @remarks
 * Deliberately NOT an {@link IMemoryRetriever}: memory recall is record-granular and
 * returns records; fragment discovery is fragment-granular and returns fragment
 * identities. Keeping it a distinct surface matches the consumer contract (memory
 * stays record-granular; sub-document knowledge uses a separate fragment index) and
 * avoids overloading the record retriever's return type with identity fields that
 * only make sense here.
 *
 * When no backend is wired, `supportsFragmentRecall` is `false` and any fragment
 * query degrades loudly ({@link FRAGMENT_SEMANTIC_UNWIRED_MESSAGE}) — it NEVER
 * returns a silent empty. A consumer-supplied backend that rejects (throws) is
 * normalized into a `Failure`.
 * @public
 */
export class FragmentSemanticRetriever {
  private readonly _backend: IFragmentSemanticBackend | undefined;
  private readonly _identityResolver: IIdentityResolver | undefined;

  private constructor(
    backend: IFragmentSemanticBackend | undefined,
    identityResolver: IIdentityResolver | undefined
  ) {
    this._backend = backend;
    this._identityResolver = identityResolver;
  }

  /** What this retriever can do given its wiring. */
  public get capabilities(): IFragmentRetrieverCapabilities {
    return { supportsFragmentRecall: this._backend !== undefined };
  }

  /**
   * Family-convention factory.
   *
   * @param params - `backend` wires fragment recall itself. `identityResolver`
   * resolves a query's `(kind, entityId)` narrowing to a storage address;
   * `IMemoryStore` implements it, so the usual wiring is
   * `{ backend, identityResolver: store }`. It is optional because an unscoped
   * fragment search needs nothing to resolve — but a query that *does* carry a
   * narrowing fails loudly without it rather than quietly searching everything.
   */
  public static create(params: {
    readonly backend?: IFragmentSemanticBackend;
    readonly identityResolver?: IIdentityResolver;
  }): Result<FragmentSemanticRetriever> {
    return succeed(new FragmentSemanticRetriever(params.backend, params.identityResolver));
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
    // Resolve the narrowing FIRST. It is synchronous, local, and cheap, while
    // `embedQuery` is typically a paid network round trip — so a typo'd `kind`, a
    // missing resolver, or a half-supplied narrowing should cost nothing.
    const options: Result<IFragmentQueryOptions> = this._resolveOptions(query);
    if (options.isFailure()) {
      return fail(options.message);
    }
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
      backend.fragmentIndex.query(embedded.value, query.topK ?? 10, options.value)
    );
  }

  /**
   * Turn the query's consumer-facing narrowing into the storage-address narrowing
   * the index understands.
   *
   * @remarks
   * `kind` selects the identity codec and the codec computes the record's storage
   * address, so this is a deterministic resolution rather than a search —
   * which is what makes a colliding `entityId` across kinds a non-issue.
   *
   * A **versioned** kind resolves to the entity's own subtree scope and deliberately
   * carries no `id`, so the narrowing covers every version of the entity — including
   * superseded ones, which are invalidated but never pruned from the index. A
   * non-versioned kind resolves to exactly one record.
   */
  private _resolveOptions(query: IFragmentQuery): Result<IFragmentQueryOptions> {
    const { entityId, kind, maxPerRecord } = query;
    if (entityId === undefined && kind === undefined) {
      return succeed({ maxPerRecord });
    }
    if (entityId === undefined || kind === undefined) {
      return fail(FRAGMENT_NARROWING_INCOMPLETE_MESSAGE);
    }
    if (this._identityResolver === undefined) {
      return fail(FRAGMENT_NARROWING_UNRESOLVABLE_MESSAGE);
    }
    return this._identityResolver
      .resolveIdentity(kind, entityId)
      .withErrorFormat((msg) => `fragment recall: cannot resolve '${kind}'/'${entityId}': ${msg}`)
      .onSuccess((address: IIdentityCodecResult) =>
        succeed({
          maxPerRecord,
          scope: address.scope,
          // A versioned kind's every version lives under the entity subtree the
          // codec returned, so omitting `id` is what makes the narrowing mean
          // "this entity" rather than "one of its versions".
          id: address.isVersioned ? undefined : (address.idStem as MemoryId)
        })
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
