/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord, IMemoryRecordResolver, edgeTargetKey } from '../types';
import { IIndexedMemoryEntry, IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  IRetrieverCreateParams,
  guardRetrieverCapabilities,
  indexedRecordMatchesQuery,
  limitEntries,
  materializeEntries,
  orderingCompare
} from './retriever';

/** The capabilities a link-traversal retriever exposes (link traversal only). */
const LINK_TRAVERSAL_CAPABILITIES: IMemoryRetrieverCapabilities = {
  supportsSemanticRecall: false,
  supportsTemporalQuery: false,
  supportsLinkTraversal: true
};

/** Default BFS hop count when `query.hops` is not supplied. */
const DEFAULT_HOPS: number = 1;

/**
 * The loud-degradation message returned when a link-traversal query supplies no
 * seed (`linkedFrom` / `linkedTo`).
 * @public
 */
export const LINK_TRAVERSAL_NO_SEED_MESSAGE: string =
  'link traversal requires a seed id (linkedFrom or linkedTo)';

/**
 * Breadth-first link-traversal retriever. From a scope-qualified
 * {@link IEdgeTarget} seed it walks the link graph up to `query.hops` levels and
 * returns the records reached (excluding the seed), recency-ordered and limited.
 *
 * @remarks
 * - **Direction.** `linkedFrom` walks OUTBOUND edges (each record's
 *   `envelope.links[].target`); `linkedTo` walks INBOUND edges (the index's
 *   `backlinks`). Exactly one is the seed; `linkedFrom` wins if both are set.
 * - **Scope-qualified nodes.** Every graph node is an {@link IEdgeTarget}
 *   `(scope, id)` pair, so following an edge to `turn-3` reaches ONLY the record
 *   in the edge's own scope — never a same-stem record in another scope.
 * - **Bound + cycle safety.** Traversal is bounded by `hops` (default `1` — a
 *   single hop) and a visited-set guard. Nodes are canonicalized to their
 *   `(scope, id)` string via {@link edgeTargetKey}, so a `Set<string>` visited-set
 *   is the exact, collision-free cycle key — no structural hashing (e.g.
 *   `Crc32Normalizer`) is needed. A self-loop or any multi-hop cycle terminates
 *   because a revisited node is never re-expanded.
 * - **Post-filter.** The scope / kind / tag / provenance-source / predicate axes of the query are
 *   applied to the reached records (the link axes are the traversal itself).
 * @public
 */
export class LinkTraversalRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;
  private readonly _resolver: IMemoryRecordResolver;

  private constructor(params: IRetrieverCreateParams) {
    this._index = params.index;
    this._resolver = params.resolver;
  }

  /** Family-convention factory. */
  public static create(params: IRetrieverCreateParams): Result<LinkTraversalRetriever> {
    return succeed(new LinkTraversalRetriever(params));
  }

  /** {@inheritDoc IMemoryRetriever.capabilities} */
  public get capabilities(): IMemoryRetrieverCapabilities {
    return LINK_TRAVERSAL_CAPABILITIES;
  }

  /** {@inheritDoc IMemoryRetriever.retrieve} */
  public retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    return Promise.resolve(
      guardRetrieverCapabilities(query, this.capabilities).onSuccess(() => this._traverse(query))
    );
  }

  /** Run the bounded, cycle-safe BFS and post-filter the reached records. */
  private _traverse(query: IMemoryQuery): Result<ReadonlyArray<IMemoryRecord<unknown>>> {
    const outbound: boolean = query.linkedFrom !== undefined;
    const seed: IEdgeTarget | undefined = query.linkedFrom ?? query.linkedTo;
    if (seed === undefined) {
      return fail(LINK_TRAVERSAL_NO_SEED_MESSAGE);
    }
    const hops: number = query.hops ?? DEFAULT_HOPS;

    // The visited-set IS the cycle guard: nodes are canonicalized to their
    // `(scope, id)` string, so set membership is an exact identity check. The
    // seed is pre-marked so it is never re-added.
    const visited: Set<string> = new Set<string>([edgeTargetKey(seed)]);
    const reached: IEdgeTarget[] = [];
    let frontier: IEdgeTarget[] = [seed];
    for (let hop = 0; hop < hops && frontier.length > 0; hop++) {
      const next: IEdgeTarget[] = [];
      for (const node of frontier) {
        for (const neighbor of outbound ? this._outbound(node) : this._inbound(node)) {
          const neighborKey: string = edgeTargetKey(neighbor);
          if (!visited.has(neighborKey)) {
            visited.add(neighborKey);
            reached.push(neighbor);
            next.push(neighbor);
          }
        }
      }
      frontier = next;
    }

    const entries: IIndexedMemoryEntry[] = [];
    for (const node of reached) {
      const match: IIndexedMemoryEntry | undefined = this._index.get(node);
      if (match !== undefined) {
        entries.push(match);
      }
    }
    const ordered: ReadonlyArray<IIndexedMemoryEntry> = entries
      .filter((entry) => indexedRecordMatchesQuery(entry, query))
      .sort(orderingCompare(query.orderBy));
    return materializeEntries(limitEntries(ordered, query.limit, query.offset), this._resolver);
  }

  /** Outbound neighbors: the scope-qualified targets of every edge on the record at `node`. */
  private _outbound(node: IEdgeTarget): IEdgeTarget[] {
    const targets: IEdgeTarget[] = [];
    const match: IIndexedMemoryEntry | undefined = this._index.get(node);
    if (match !== undefined) {
      for (const edge of match.envelope.links) {
        targets.push(edge.target);
      }
    }
    return targets;
  }

  /** Inbound neighbors: the scope-qualified sources whose edges point AT `node` (the backlinks). */
  private _inbound(node: IEdgeTarget): ReadonlyArray<IEdgeTarget> {
    return this._index.backlinks(node);
  }
}
