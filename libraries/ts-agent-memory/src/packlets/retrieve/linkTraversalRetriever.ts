/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord, edgeTargetKey } from '../types';
import { IIndexedMemoryRecord, IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  guardRetrieverCapabilities,
  indexedRecordMatchesQuery,
  limitRecords,
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
 * - **Post-filter.** The scope / kind / tag / predicate axes of the query are
 *   applied to the reached records (the link axes are the traversal itself).
 * @public
 */
export class LinkTraversalRetriever implements IMemoryRetriever {
  private readonly _index: IMemoryIndex;

  private constructor(index: IMemoryIndex) {
    this._index = index;
  }

  /** Family-convention factory. */
  public static create(index: IMemoryIndex): Result<LinkTraversalRetriever> {
    return succeed(new LinkTraversalRetriever(index));
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
    const byKey: ReadonlyMap<string, IIndexedMemoryRecord> = this._indexByKey();

    // The visited-set IS the cycle guard: nodes are canonicalized to their
    // `(scope, id)` string, so set membership is an exact identity check. The
    // seed is pre-marked so it is never re-added.
    const visited: Set<string> = new Set<string>([edgeTargetKey(seed)]);
    const reached: IEdgeTarget[] = [];
    let frontier: IEdgeTarget[] = [seed];
    for (let hop = 0; hop < hops && frontier.length > 0; hop++) {
      const next: IEdgeTarget[] = [];
      for (const node of frontier) {
        for (const neighbor of outbound ? this._outbound(node, byKey) : this._inbound(node)) {
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

    const entries: IIndexedMemoryRecord[] = [];
    for (const node of reached) {
      const match: IIndexedMemoryRecord | undefined = byKey.get(edgeTargetKey(node));
      if (match !== undefined) {
        entries.push(match);
      }
    }
    const ordered: IMemoryRecord<unknown>[] = entries
      .filter((entry) => indexedRecordMatchesQuery(entry, query))
      .map((entry) => entry.record)
      .sort(orderingCompare(query.orderBy));
    return succeed(limitRecords(ordered, query.limit, query.offset));
  }

  /**
   * Group the index's entries by their scope-qualified {@link edgeTargetKey}
   * `(scope, id)` composite. Each composite is the index's primary key, so it maps
   * to exactly one entry — two records that reuse a filename stem across scopes
   * (e.g. `turn-0` in two conversations) get distinct keys and never collide.
   */
  private _indexByKey(): ReadonlyMap<string, IIndexedMemoryRecord> {
    const byKey: Map<string, IIndexedMemoryRecord> = new Map<string, IIndexedMemoryRecord>();
    for (const entry of this._index.entries()) {
      byKey.set(edgeTargetKey({ scope: entry.scope, id: entry.record.envelope.id }), entry);
    }
    return byKey;
  }

  /** Outbound neighbors: the scope-qualified targets of every edge on the record at `node`. */
  private _outbound(node: IEdgeTarget, byKey: ReadonlyMap<string, IIndexedMemoryRecord>): IEdgeTarget[] {
    const targets: IEdgeTarget[] = [];
    const match: IIndexedMemoryRecord | undefined = byKey.get(edgeTargetKey(node));
    if (match !== undefined) {
      for (const edge of match.record.envelope.links) {
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
