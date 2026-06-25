/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { IMemoryRecord, Kind, MemoryId, MemoryScopeKey, Tag } from '../types';

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
 * The derived, in-memory secondary indexes the store maintains over its
 * records. Never the source of truth — the FileTree is. The index is fully
 * rebuildable from a walk of the store ({@link IMemoryIndex.rebuild}) and is
 * patched incrementally on every write ({@link IMemoryIndex.patch}).
 *
 * @remarks
 * B1 builds the maps; link-traversal BFS over {@link IMemoryIndex.backlinks}
 * is B2. The accessors return records (not bare ids) so the B2 retrievers can
 * consume them directly.
 * @public
 */
export interface IMemoryIndex {
  /**
   * Replace the entire index from a full set of records (a store walk).
   * @returns The number of records indexed.
   */
  rebuild(entries: ReadonlyArray<IIndexedMemoryRecord>): Result<number>;

  /**
   * Apply a single incremental change. `'put'` inserts or replaces the entry
   * at its `(scope, id)` key (removing any prior associations first); `'delete'`
   * removes it.
   * @returns The entry that was applied.
   */
  patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord>;

  /** Every indexed entry (scope + record). Primary read surface for the store. */
  entries(): ReadonlyArray<IIndexedMemoryRecord>;

  /** Records of the given kind, in recency order (most-recently-updated first). */
  byKind(kind: Kind): ReadonlyArray<IMemoryRecord<unknown>>;

  /** Records carrying the given tag, in recency order. */
  byTag(tag: Tag): ReadonlyArray<IMemoryRecord<unknown>>;

  /** All records in recency order (most-recently-updated first). */
  byRecency(): ReadonlyArray<IMemoryRecord<unknown>>;

  /**
   * The ids of records whose `links` point AT `target` (inbound edges).
   * The seed map for B2 link-traversal.
   */
  backlinks(target: MemoryId): ReadonlyArray<MemoryId>;
}

/**
 * Default in-memory {@link IMemoryIndex}. Maintains the derived `byKind` /
 * `byTag` / `byRecency` / `backlinks` views incrementally; a `'put'` for an
 * already-indexed key first removes the prior entry's associations so a changed
 * kind / tag / link set never leaves a stale reference behind.
 * @public
 */
export class MemoryIndex implements IMemoryIndex {
  /** Primary store: `(scope, id)` composite key → indexed entry. */
  private readonly _byKey: Map<string, IIndexedMemoryRecord>;
  /** kind → set of composite keys. */
  private readonly _byKind: Map<Kind, Set<string>>;
  /** tag → set of composite keys. */
  private readonly _byTag: Map<Tag, Set<string>>;
  /** link target id → set of source ids that link at it. */
  private readonly _backlinks: Map<MemoryId, Set<MemoryId>>;

  private constructor() {
    this._byKey = new Map<string, IIndexedMemoryRecord>();
    this._byKind = new Map<Kind, Set<string>>();
    this._byTag = new Map<Tag, Set<string>>();
    this._backlinks = new Map<MemoryId, Set<MemoryId>>();
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
    return `${scope}\0${id}`;
  }

  /** {@inheritDoc IMemoryIndex.rebuild} */
  public rebuild(entries: ReadonlyArray<IIndexedMemoryRecord>): Result<number> {
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
      this._add(entry);
    }
    return succeed(entry);
  }

  /** {@inheritDoc IMemoryIndex.entries} */
  public entries(): ReadonlyArray<IIndexedMemoryRecord> {
    return Array.from(this._byKey.values());
  }

  /** {@inheritDoc IMemoryIndex.byKind} */
  public byKind(kind: Kind): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._recencyOrdered(this._byKind.get(kind) ?? EMPTY_KEY_SET);
  }

  /** {@inheritDoc IMemoryIndex.byTag} */
  public byTag(tag: Tag): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._recencyOrdered(this._byTag.get(tag) ?? EMPTY_KEY_SET);
  }

  /** {@inheritDoc IMemoryIndex.byRecency} */
  public byRecency(): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._recencyOrdered(this._byKey.keys());
  }

  /** {@inheritDoc IMemoryIndex.backlinks} */
  public backlinks(target: MemoryId): ReadonlyArray<MemoryId> {
    const sources: Set<MemoryId> | undefined = this._backlinks.get(target);
    return sources === undefined ? [] : Array.from(sources);
  }

  /**
   * Resolve a set of composite keys to their records, ordered
   * most-recently-updated first (with a `seq` tiebreak so equal-`updated`
   * records sort deterministically).
   */
  private _recencyOrdered(keys: Iterable<string>): ReadonlyArray<IMemoryRecord<unknown>> {
    const records: IMemoryRecord<unknown>[] = [];
    for (const key of keys) {
      const entry: IIndexedMemoryRecord | undefined = this._byKey.get(key);
      if (entry !== undefined) {
        records.push(entry.record);
      }
    }
    return records.sort((a, b) => {
      const byUpdated: number = b.envelope.updated - a.envelope.updated;
      return byUpdated !== 0 ? byUpdated : b.envelope.seq - a.envelope.seq;
    });
  }

  /** Insert an entry and register all its derived associations. */
  private _add(entry: IIndexedMemoryRecord): void {
    const key: string = MemoryIndex._keyOf(entry.scope, entry.record.envelope.id);
    const envelope: IMemoryRecord<unknown>['envelope'] = entry.record.envelope;
    this._byKey.set(key, entry);
    this._addToSetMap(this._byKind, envelope.kind, key);
    for (const tag of envelope.tags) {
      this._addToSetMap(this._byTag, tag, key);
    }
    for (const edge of envelope.links) {
      this._addToSetMap(this._backlinks, edge.target, envelope.id);
    }
  }

  /** Remove the entry at `key` (if present) and all its derived associations. */
  private _remove(key: string): void {
    const entry: IIndexedMemoryRecord | undefined = this._byKey.get(key);
    if (entry === undefined) {
      return;
    }
    const envelope: IMemoryRecord<unknown>['envelope'] = entry.record.envelope;
    this._byKey.delete(key);
    this._removeFromSetMap(this._byKind, envelope.kind, key);
    for (const tag of envelope.tags) {
      this._removeFromSetMap(this._byTag, tag, key);
    }
    for (const edge of envelope.links) {
      this._removeFromSetMap(this._backlinks, edge.target, envelope.id);
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
