/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryEnvelope,
  IMemoryRecord,
  Kind,
  MemoryId,
  MemoryScopeKey,
  Tag,
  edgeTargetKey
} from '../types';

/**
 * The mutation a {@link IMemoryIndex.patch | patch} applies: a record was
 * written (`'put'`) or removed (`'delete'`).
 * @public
 */
export type MemoryIndexPatchOp = 'put' | 'delete';

/** Shared empty key set for `byKind` / `byTag` misses (avoids per-call allocation). */
const EMPTY_KEY_SET: ReadonlySet<string> = new Set<string>();

/**
 * A memory record paired with the {@link MemoryScopeKey | scope} it lives
 * under. The scope is not carried on the {@link IMemoryEnvelope} (it is derived
 * from the entity id by the codec), so the store threads it alongside the
 * record when patching or rebuilding the index. The `(scope, id)` pair is the
 * index's primary key, keeping records distinct across scopes that reuse a
 * filename stem (e.g. `turn-0` under different conversations in Phase C).
 * @public
 */
export interface IIndexedMemoryRecord {
  /** The scope the record is stored under. */
  readonly scope: MemoryScopeKey;
  /** The memory record itself. */
  readonly record: IMemoryRecord<unknown>;
}

/**
 * What the index HOLDS and what every index read returns: a record's scope and
 * its {@link IMemoryEnvelope}, and **no body**.
 *
 * @remarks
 * The index is a derived *selection* structure, and selection has never needed a
 * body — every filter the store and the retrievers apply reads envelope fields
 * (`scope` / `kind` / `tags` / `contentHash` / `provenance` / `links` /
 * `temporal` / `updated` / `seq` / `rank`). Returning whole records made every
 * conforming index hold every body by construction, which was the store's
 * resident-memory ceiling; returning envelopes removes it from the contract
 * rather than from one implementation.
 *
 * A caller that needs the body **materializes it explicitly** — through
 * {@link IMemoryStore.getById}, or an `IMemoryRecordResolver` where one is
 * wired. That is deliberately visible: a lazy `body` getter would have kept
 * every call site compiling while turning a memory read into a file read behind
 * an unchanged type, which is a silent performance cliff rather than a migration.
 * @public
 */
export interface IIndexedMemoryEntry {
  /** The scope the record is stored under. */
  readonly scope: MemoryScopeKey;
  /** The record's envelope. No body — see the remarks. */
  readonly envelope: IMemoryEnvelope;
}

/** Project the write-side whole-record form onto the held/read entry form. */
function toEntry(entry: IIndexedMemoryRecord): IIndexedMemoryEntry {
  return { scope: entry.scope, envelope: entry.record.envelope };
}

/**
 * The derived, in-memory secondary indexes the store maintains over its
 * records. Never the source of truth — the FileTree is. The index is fully
 * rebuildable from a walk of the store ({@link IMemoryIndex.rebuild}) and is
 * patched incrementally on every write ({@link IMemoryIndex.patch}).
 *
 * @remarks
 * Every read returns the projected {@link IIndexedMemoryEntry} — scope and
 * envelope, no body. See that type for why.
 *
 * **The conformance rule: an index is a derived, COMPLETE, FAITHFUL projection
 * of the vault.** An implementation may change *where* entries are stored and
 * *how* they are looked up; it may not change *which* entries exist or *what any
 * envelope says*. Concretely, {@link IMemoryIndex.entries} must return exactly
 * one entry per record the store has written and not deleted, and each entry's
 * envelope must be the one the store patched in.
 *
 * An index that filters, truncates, deduplicates, or synthesizes entries is not
 * a conforming implementation, and the reason is not tidiness: **the store's
 * write path derives from these reads** — content-hash dedup, write-policy
 * admission cohorts, and temporal version histories all read the index. An index
 * that hides an entry does not merely hide it from queries; it changes what the
 * next write does. That is why the previous guidance said only a faithful
 * delegating decorator was safe to inject. This invariant is what that guidance
 * was reaching for, stated so that a genuinely different implementation (a
 * SQLite-backed index, a lazily-paged one) is permitted while the reshaping that
 * was the actual hazard stays out.
 *
 * **Ordering is NOT part of the contract.** {@link IMemoryIndex.entries} may
 * return entries in any order and callers that need one sort explicitly. Note
 * this is a *behavioural* freedom the compiler cannot police: the bundled
 * {@link MemoryIndex} iterates a `Map` and so returns insertion order, which is
 * stable and observable, so code that came to rely on it keeps compiling and
 * changes results. The ordered accessors ({@link IMemoryIndex.byRecency},
 * {@link IMemoryIndex.byRank}, and the recency-ordered `byKind` / `byTag`) are
 * the supported way to ask for an order.
 * @public
 */
export interface IMemoryIndex {
  /**
   * Replace the entire index from a full set of entries (a store walk).
   *
   * @remarks
   * Takes the **projected** {@link IIndexedMemoryEntry} form, not whole records,
   * and the distinction is load-bearing rather than cosmetic: **`patch` writes,
   * `rebuild` reads.** A rebuild is a whole-vault read that happens to terminate
   * in the index, so requiring whole records here would force every caller — the
   * store's own open path included — to materialize N bodies purely to feed a
   * structure that projects the envelope back out and discards them. `patch`
   * keeps whole records because it carries exactly one, which its caller already
   * holds.
   *
   * @returns The number of entries indexed.
   */
  rebuild(entries: ReadonlyArray<IIndexedMemoryEntry>): Result<number>;

  /**
   * Apply a single incremental change. `'put'` inserts or replaces the entry
   * at its `(scope, id)` key (removing any prior associations first); `'delete'`
   * removes it.
   *
   * @remarks
   * Takes the whole record — see {@link IMemoryIndex.rebuild} for why this one
   * does and that one does not. It costs nothing (the caller is mid-write and
   * holds the record already) and it is the single point at which an index
   * maintaining a body-derived view could observe content without a re-read.
   * What is *held* is still only the projection.
   *
   * @returns The entry that was applied.
   */
  patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord>;

  /** Every indexed entry (scope + envelope). Primary read surface for the store. */
  entries(): ReadonlyArray<IIndexedMemoryEntry>;

  /**
   * The entry at a scope-qualified address, or `undefined` if none.
   *
   * @remarks
   * On the contract because its absence made every caller that wanted **one**
   * entry rebuild a map of **all** of them: both `SemanticRetriever` (resolving
   * at most `topK` hits) and `LinkTraversalRetriever` (resolving a BFS frontier)
   * built a full-index `Map` per query for want of this. The index already keys
   * on `(scope, id)` internally, so this exposes a lookup it was doing anyway.
   */
  get(target: IEdgeTarget): IIndexedMemoryEntry | undefined;

  /** Entries of the given kind, in recency order (most-recently-updated first). */
  byKind(kind: Kind): ReadonlyArray<IIndexedMemoryEntry>;

  /** Entries carrying the given tag, in recency order. */
  byTag(tag: Tag): ReadonlyArray<IIndexedMemoryEntry>;

  /** All entries in recency order (most-recently-updated first). */
  byRecency(): ReadonlyArray<IIndexedMemoryEntry>;

  /**
   * All entries ordered by store-computed {@link IMemoryEnvelope.rank} descending,
   * with recency (most-recently-updated, then `seq`) as a tiebreak. Entries with
   * an absent `rank` sort LAST (after every ranked entry), then by recency among
   * themselves. Serves a bounded top-M ({@link IMemoryEnvelope.rank}-ordered) page
   * from the in-memory index with no full-vault (filesystem) scan — and since the
   * page is envelope-only, a caller taking the top M materializes M bodies rather
   * than the vault.
   */
  byRank(): ReadonlyArray<IIndexedMemoryEntry>;

  /**
   * The scope-qualified sources of records whose `links` point AT `target`
   * (inbound edges), keyed on the target's `(scope, id)` address. The seed map
   * for B2 link-traversal; results are {@link IEdgeTarget}s so a caller can feed
   * them straight back in as further traversal seeds.
   */
  backlinks(target: IEdgeTarget): ReadonlyArray<IEdgeTarget>;
}

/**
 * Default in-memory {@link IMemoryIndex}. Maintains the derived `byKind` /
 * `byTag` / `byRecency` / `backlinks` views incrementally; a `'put'` for an
 * already-indexed key first removes the prior entry's associations so a changed
 * kind / tag / link set never leaves a stale reference behind.
 * @public
 */
export class MemoryIndex implements IMemoryIndex {
  /**
   * Primary store: `(scope, id)` composite key → indexed entry. Holds the
   * PROJECTED form, so the index never retains a body.
   */
  private readonly _byKey: Map<string, IIndexedMemoryEntry>;
  /** kind → set of composite keys. */
  private readonly _byKind: Map<Kind, Set<string>>;
  /** tag → set of composite keys. */
  private readonly _byTag: Map<Tag, Set<string>>;
  /**
   * canonical target key (`edgeTargetKey`) → (source composite key → source
   * {@link IEdgeTarget}). The OUTER map is keyed on the scope-qualified target's
   * canonical `(scope, id)` string — NOT the target's bare id — so an edge to
   * `turn-3` in one conversation is tracked separately from `turn-3` in another.
   * The INNER map is keyed by the source's `(scope, id)` composite so two distinct
   * source records that share an id across scopes are tracked independently and
   * removing one never drops the other's edge.
   */
  private readonly _backlinks: Map<string, Map<string, IEdgeTarget>>;

  private constructor() {
    this._byKey = new Map<string, IIndexedMemoryEntry>();
    this._byKind = new Map<Kind, Set<string>>();
    this._byTag = new Map<Tag, Set<string>>();
    this._backlinks = new Map<string, Map<string, IEdgeTarget>>();
  }

  /** Family-convention factory. */
  public static create(): Result<MemoryIndex> {
    return succeed(new MemoryIndex());
  }

  /**
   * The composite primary key for an entry: scope + id, NUL-separated. NUL
   * is excluded from both components (scope segments pass
   * `assertPortableFilenameStem`; `MemoryId` is portable-filename-safe), so it
   * is a collision-proof separator across every scope/id pair the codecs produce.
   */
  private static _keyOf(scope: MemoryScopeKey, id: MemoryId): string {
    return edgeTargetKey({ scope, id });
  }

  /** {@inheritDoc IMemoryIndex.rebuild} */
  public rebuild(entries: ReadonlyArray<IIndexedMemoryEntry>): Result<number> {
    this._byKey.clear();
    this._byKind.clear();
    this._byTag.clear();
    this._backlinks.clear();
    for (const entry of entries) {
      this._add(entry);
    }
    return succeed(this._byKey.size);
  }

  /** {@inheritDoc IMemoryIndex.patch} */
  public patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord> {
    const key: string = MemoryIndex._keyOf(entry.scope, entry.record.envelope.id);
    // Always drop any prior associations for this key first, so a 'put' that
    // changes kind/tags/links cannot strand a stale reference.
    this._remove(key);
    if (op === 'put') {
      // Projected on the way in: the caller's record is used for its envelope and
      // the body is not retained.
      this._add(toEntry(entry));
    }
    return succeed(entry);
  }

  /** {@inheritDoc IMemoryIndex.entries} */
  public entries(): ReadonlyArray<IIndexedMemoryEntry> {
    return Array.from(this._byKey.values());
  }

  /** {@inheritDoc IMemoryIndex.get} */
  public get(target: IEdgeTarget): IIndexedMemoryEntry | undefined {
    return this._byKey.get(edgeTargetKey(target));
  }

  /** {@inheritDoc IMemoryIndex.byKind} */
  public byKind(kind: Kind): ReadonlyArray<IIndexedMemoryEntry> {
    return this._recencyOrdered(this._byKind.get(kind) ?? EMPTY_KEY_SET);
  }

  /** {@inheritDoc IMemoryIndex.byTag} */
  public byTag(tag: Tag): ReadonlyArray<IIndexedMemoryEntry> {
    return this._recencyOrdered(this._byTag.get(tag) ?? EMPTY_KEY_SET);
  }

  /** {@inheritDoc IMemoryIndex.byRecency} */
  public byRecency(): ReadonlyArray<IIndexedMemoryEntry> {
    return this._recencyOrdered(this._byKey.keys());
  }

  /** {@inheritDoc IMemoryIndex.byRank} */
  public byRank(): ReadonlyArray<IIndexedMemoryEntry> {
    return this._rankOrdered(this._byKey.keys());
  }

  /** {@inheritDoc IMemoryIndex.backlinks} */
  public backlinks(target: IEdgeTarget): ReadonlyArray<IEdgeTarget> {
    const sources: Map<string, IEdgeTarget> | undefined = this._backlinks.get(edgeTargetKey(target));
    return sources === undefined ? [] : Array.from(sources.values());
  }

  /**
   * Resolve a set of composite keys to their records, ordered
   * most-recently-updated first (with a `seq` tiebreak so equal-`updated`
   * records sort deterministically).
   */
  private _recencyOrdered(keys: Iterable<string>): ReadonlyArray<IIndexedMemoryEntry> {
    return MemoryIndex._resolve(this._byKey, keys).sort((a, b) => {
      const byUpdated: number = b.envelope.updated - a.envelope.updated;
      return byUpdated !== 0 ? byUpdated : b.envelope.seq - a.envelope.seq;
    });
  }

  /**
   * Resolve a set of composite keys to their records, ordered by
   * {@link IMemoryEnvelope.rank} descending with recency (`updated`, then `seq`)
   * as the tiebreak. Records with an absent `rank` sort LAST, then by recency
   * among themselves. Computed on call (mirrors {@link MemoryIndex._recencyOrdered}) —
   * no incremental rank-ordered view is maintained, matching the recency view's
   * approach; the sort is over the in-memory index, never a filesystem walk.
   */
  private _rankOrdered(keys: Iterable<string>): ReadonlyArray<IIndexedMemoryEntry> {
    return MemoryIndex._resolve(this._byKey, keys).sort(MemoryIndex._compareByRank);
  }

  /** Resolve composite keys to their entries, skipping any that are absent. */
  private static _resolve(
    byKey: ReadonlyMap<string, IIndexedMemoryEntry>,
    keys: Iterable<string>
  ): IIndexedMemoryEntry[] {
    const entries: IIndexedMemoryEntry[] = [];
    for (const key of keys) {
      const entry: IIndexedMemoryEntry | undefined = byKey.get(key);
      if (entry !== undefined) {
        entries.push(entry);
      }
    }
    return entries;
  }

  /**
   * Rank-descending comparator with an absent-`rank`-last rule and a recency
   * (`updated`, then `seq`) tiebreak. Duplicated from the retrieve packlet's
   * `rankCompare` deliberately: the index must not depend on `retrieve` (that
   * package depends on the index), mirroring how `_recencyOrdered` inlines the
   * recency ordering rather than importing `recencyCompare`.
   */
  private static _compareByRank(a: IIndexedMemoryEntry, b: IIndexedMemoryEntry): number {
    const ra: number | undefined = a.envelope.rank;
    const rb: number | undefined = b.envelope.rank;
    // Absent rank sorts last; two absent ranks fall through to the recency tiebreak.
    if (ra === undefined && rb !== undefined) {
      return 1;
    }
    if (rb === undefined && ra !== undefined) {
      return -1;
    }
    if (ra !== undefined && rb !== undefined && ra !== rb) {
      return rb - ra;
    }
    const byUpdated: number = b.envelope.updated - a.envelope.updated;
    return byUpdated !== 0 ? byUpdated : b.envelope.seq - a.envelope.seq;
  }

  /** Insert an entry and register all its derived associations. */
  private _add(entry: IIndexedMemoryEntry): void {
    const key: string = MemoryIndex._keyOf(entry.scope, entry.envelope.id);
    const envelope: IMemoryEnvelope = entry.envelope;
    this._byKey.set(key, entry);
    this._addToSetMap(this._byKind, envelope.kind, key);
    for (const tag of envelope.tags) {
      this._addToSetMap(this._byTag, tag, key);
    }
    for (const edge of envelope.links) {
      this._addBacklink(edge.target, key, { scope: entry.scope, id: envelope.id });
    }
  }

  /** Remove the entry at `key` (if present) and all its derived associations. */
  private _remove(key: string): void {
    const entry: IIndexedMemoryEntry | undefined = this._byKey.get(key);
    if (entry === undefined) {
      return;
    }
    const envelope: IMemoryEnvelope = entry.envelope;
    this._byKey.delete(key);
    this._removeFromSetMap(this._byKind, envelope.kind, key);
    for (const tag of envelope.tags) {
      this._removeFromSetMap(this._byTag, tag, key);
    }
    for (const edge of envelope.links) {
      this._removeBacklink(edge.target, key);
    }
  }

  /** Register `source` (keyed by its composite `sourceKey`) as linking at `target`. */
  private _addBacklink(target: IEdgeTarget, sourceKey: string, source: IEdgeTarget): void {
    const targetKey: string = edgeTargetKey(target);
    const existing: Map<string, IEdgeTarget> | undefined = this._backlinks.get(targetKey);
    if (existing === undefined) {
      this._backlinks.set(targetKey, new Map<string, IEdgeTarget>([[sourceKey, source]]));
    } else {
      existing.set(sourceKey, source);
    }
  }

  /** Drop the backlink from `sourceKey` to `target`, removing the target map when empty. */
  private _removeBacklink(target: IEdgeTarget, sourceKey: string): void {
    const targetKey: string = edgeTargetKey(target);
    const existing: Map<string, IEdgeTarget> | undefined = this._backlinks.get(targetKey);
    if (existing === undefined) {
      return;
    }
    existing.delete(sourceKey);
    if (existing.size === 0) {
      this._backlinks.delete(targetKey);
    }
  }

  /** Add `member` to the set at `mapKey`, creating the set on first use. */
  private _addToSetMap<K, M>(map: Map<K, Set<M>>, mapKey: K, member: M): void {
    const existing: Set<M> | undefined = map.get(mapKey);
    if (existing === undefined) {
      map.set(mapKey, new Set<M>([member]));
    } else {
      existing.add(member);
    }
  }

  /** Remove `member` from the set at `mapKey`, dropping the set when empty. */
  private _removeFromSetMap<K, M>(map: Map<K, Set<M>>, mapKey: K, member: M): void {
    const existing: Set<M> | undefined = map.get(mapKey);
    if (existing === undefined) {
      return;
    }
    existing.delete(member);
    if (existing.size === 0) {
      map.delete(mapKey);
    }
  }
}
