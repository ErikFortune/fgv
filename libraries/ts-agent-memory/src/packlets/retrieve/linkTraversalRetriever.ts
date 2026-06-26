/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, MemoryId } from '../types';
import { IIndexedMemoryRecord, IMemoryIndex } from '../index';
import {
  IMemoryQuery,
  IMemoryRetriever,
  IMemoryRetrieverCapabilities,
  guardRetrieverCapabilities,
  indexedRecordMatchesQuery,
  limitRecords,
  recencyCompare
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
 * Breadth-first link-traversal retriever. From a seed {@link MemoryId} it walks
 * the link graph up to `query.hops` levels and returns the records reached
 * (excluding the seed), recency-ordered and limited.
 *
 * @remarks
 * - **Direction.** `linkedFrom` walks OUTBOUND edges (each record's
 *   `envelope.links[].target`); `linkedTo` walks INBOUND edges (the index's
 *   `backlinks`). Exactly one is the seed; `linkedFrom` wins if both are set.
 * - **Bound + cycle safety.** Traversal is bounded by `hops` (default `1` — a
 *   single hop) and a visited-set guard. The graph is keyed by bare
 *   string {@link MemoryId}s, so a `Set<string>` visited-set is the exact,
 *   collision-free cycle key — no structural hashing (e.g. `Crc32Normalizer`) is
 *   needed. A self-loop or any multi-hop cycle terminates because a revisited id
 *   is never re-expanded.
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
    const seed: MemoryId | undefined = query.linkedFrom ?? query.linkedTo;
    if (seed === undefined) {
      return fail(LINK_TRAVERSAL_NO_SEED_MESSAGE);
    }
    const hops: number = query.hops ?? DEFAULT_HOPS;
    const byId: ReadonlyMap<MemoryId, IIndexedMemoryRecord[]> = this._indexById();

    // The visited-set IS the cycle guard: ids are strings, so set membership is
    // an exact identity check. The seed is pre-marked so it is never re-added.
    const visited: Set<string> = new Set<string>([seed]);
    const reached: MemoryId[] = [];
    let frontier: MemoryId[] = [seed];
    for (let hop = 0; hop < hops && frontier.length > 0; hop++) {
      const next: MemoryId[] = [];
      for (const id of frontier) {
        for (const neighbor of outbound ? this._outbound(id, byId) : this._inbound(id)) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            reached.push(neighbor);
            next.push(neighbor);
          }
        }
      }
      frontier = next;
    }

    const entries: IIndexedMemoryRecord[] = [];
    for (const id of reached) {
      const matches: IIndexedMemoryRecord[] | undefined = byId.get(id);
      if (matches !== undefined) {
        entries.push(...matches);
      }
    }
    const ordered: IMemoryRecord<unknown>[] = entries
      .filter((entry) => indexedRecordMatchesQuery(entry, query))
      .map((entry) => entry.record)
      .sort(recencyCompare);
    return succeed(limitRecords(ordered, query.limit));
  }

  /**
   * Group the index's entries by bare {@link MemoryId}. An id can map to more
   * than one entry when distinct scopes reuse a filename stem (e.g. `turn-0` in
   * two conversations), so the value is an array.
   *
   * @remarks
   * **Design note (links are globally-scoped identifiers in this phase).** An
   * {@link IEdge.target} is a bare `MemoryId`, not a `(scope, id)` pair, so
   * traversal resolves a target across ALL scopes that hold that id. When two
   * scopes reuse a stem, following an edge to it reaches every match. This
   * mirrors the `backlinks` index, which is also keyed by bare id. Scope-
   * qualified link resolution is intentionally out of scope for Phase C and
   * would be an additive change here (and to {@link IEdge} / the index).
   */
  private _indexById(): ReadonlyMap<MemoryId, IIndexedMemoryRecord[]> {
    const byId: Map<MemoryId, IIndexedMemoryRecord[]> = new Map<MemoryId, IIndexedMemoryRecord[]>();
    for (const entry of this._index.entries()) {
      const id: MemoryId = entry.record.envelope.id;
      const existing: IIndexedMemoryRecord[] | undefined = byId.get(id);
      if (existing === undefined) {
        byId.set(id, [entry]);
      } else {
        existing.push(entry);
      }
    }
    return byId;
  }

  /** Outbound neighbors: the targets of every edge on the records with this id. */
  private _outbound(id: MemoryId, byId: ReadonlyMap<MemoryId, IIndexedMemoryRecord[]>): MemoryId[] {
    const targets: MemoryId[] = [];
    const matches: IIndexedMemoryRecord[] | undefined = byId.get(id);
    if (matches !== undefined) {
      for (const entry of matches) {
        for (const edge of entry.record.envelope.links) {
          targets.push(edge.target);
        }
      }
    }
    return targets;
  }

  /** Inbound neighbors: the ids whose edges point AT this id (the backlinks). */
  private _inbound(id: MemoryId): ReadonlyArray<MemoryId> {
    return this._index.backlinks(id);
  }
}
