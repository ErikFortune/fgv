/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IIndexedMemoryRecord,
  IMemoryRecord,
  Kind,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  Tag,
  envelopeConverter
} from '../../../index';

interface IRecordSpec {
  readonly id: string;
  readonly scope?: string;
  readonly kind?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly links?: ReadonlyArray<string>;
  readonly updated?: number;
  readonly seq?: number;
}

function makeEntry(spec: IRecordSpec): IIndexedMemoryRecord {
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.id,
        kind: spec.kind ?? 'knowledge',
        tags: spec.tags ?? [],
        links: (spec.links ?? []).map((target) => ({ type: 'rel', target })),
        created: 0,
        updated: spec.updated ?? 0,
        seq: spec.seq ?? 0,
        contentHash: 'h',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: `body-${spec.id}`
  };
  return { scope: (spec.scope ?? 'knowledge') as MemoryScopeKey, record };
}

function ids(records: ReadonlyArray<IMemoryRecord<unknown>>): ReadonlyArray<string> {
  return records.map((r) => r.envelope.id as string);
}

describe('MemoryIndex', () => {
  let index: MemoryIndex;

  beforeEach(() => {
    index = MemoryIndex.create().orThrow();
  });

  describe('create', () => {
    test('starts empty', () => {
      expect(index.entries()).toHaveLength(0);
      expect(index.byKind('knowledge' as Kind)).toHaveLength(0);
      expect(index.byTag('any' as Tag)).toHaveLength(0);
      expect(index.byRecency()).toHaveLength(0);
      expect(index.backlinks('none' as MemoryId)).toHaveLength(0);
    });
  });

  describe('rebuild', () => {
    test('indexes every entry and reports the count', () => {
      const entries = [
        makeEntry({ id: 'a', tags: ['x'], links: ['b'] }),
        makeEntry({ id: 'b', tags: ['x', 'y'] })
      ];
      expect(index.rebuild(entries)).toSucceedWith(2);
      expect(index.entries()).toHaveLength(2);
      expect([...ids(index.byKind('knowledge' as Kind))].sort()).toEqual(['a', 'b']);
      expect([...ids(index.byTag('x' as Tag))].sort()).toEqual(['a', 'b']);
      expect(ids(index.byTag('y' as Tag))).toEqual(['b']);
      expect(index.backlinks('b' as MemoryId)).toEqual(['a']);
    });

    test('clears prior state', () => {
      index.rebuild([makeEntry({ id: 'a', tags: ['x'] })]).orThrow();
      expect(index.rebuild([makeEntry({ id: 'c', tags: ['z'] })])).toSucceedWith(1);
      expect(ids(index.entries().map((e) => e.record))).toEqual(['c']);
      expect(index.byTag('x' as Tag)).toHaveLength(0);
    });
  });

  describe('patch', () => {
    test('put inserts a new entry and returns it', () => {
      const entry = makeEntry({ id: 'a', tags: ['x'], links: ['b'] });
      expect(index.patch('put', entry)).toSucceedWith(entry);
      expect(ids(index.byKind('knowledge' as Kind))).toEqual(['a']);
      expect(index.backlinks('b' as MemoryId)).toEqual(['a']);
    });

    test('put on an existing key replaces stale associations', () => {
      index.patch('put', makeEntry({ id: 'a', kind: 'knowledge', tags: ['old'], links: ['b'] })).orThrow();
      index.patch('put', makeEntry({ id: 'a', kind: 'note', tags: ['new'], links: ['c'] })).orThrow();
      expect(index.entries()).toHaveLength(1);
      expect(index.byTag('old' as Tag)).toHaveLength(0);
      expect(ids(index.byTag('new' as Tag))).toEqual(['a']);
      expect(index.byKind('knowledge' as Kind)).toHaveLength(0);
      expect(ids(index.byKind('note' as Kind))).toEqual(['a']);
      expect(index.backlinks('b' as MemoryId)).toHaveLength(0);
      expect(index.backlinks('c' as MemoryId)).toEqual(['a']);
    });

    test('delete removes the entry and its associations', () => {
      const entry = makeEntry({ id: 'a', tags: ['x'], links: ['b'] });
      index.patch('put', entry).orThrow();
      expect(index.patch('delete', entry)).toSucceedWith(entry);
      expect(index.entries()).toHaveLength(0);
      expect(index.byTag('x' as Tag)).toHaveLength(0);
      expect(index.backlinks('b' as MemoryId)).toHaveLength(0);
    });

    test('delete of an absent key is a no-op that still succeeds', () => {
      const entry = makeEntry({ id: 'ghost' });
      expect(index.patch('delete', entry)).toSucceedWith(entry);
      expect(index.entries()).toHaveLength(0);
    });

    test('distinguishes entries with the same id across scopes', () => {
      index.patch('put', makeEntry({ id: 'turn-0', scope: 'conversations/c1' })).orThrow();
      index.patch('put', makeEntry({ id: 'turn-0', scope: 'conversations/c2' })).orThrow();
      expect(index.entries()).toHaveLength(2);
    });
  });

  describe('byRecency', () => {
    test('orders most-recently-updated first, breaking ties by seq', () => {
      index
        .rebuild([
          makeEntry({ id: 'old', updated: 100, seq: 1 }),
          makeEntry({ id: 'newest', updated: 300, seq: 3 }),
          makeEntry({ id: 'tie-lo', updated: 200, seq: 4 }),
          makeEntry({ id: 'tie-hi', updated: 200, seq: 9 })
        ])
        .orThrow();
      expect(ids(index.byRecency())).toEqual(['newest', 'tie-hi', 'tie-lo', 'old']);
    });
  });

  describe('backlinks', () => {
    test('aggregates multiple sources pointing at one target', () => {
      index
        .rebuild([makeEntry({ id: 'a', links: ['target'] }), makeEntry({ id: 'b', links: ['target'] })])
        .orThrow();
      expect([...index.backlinks('target' as MemoryId)].sort()).toEqual(['a', 'b']);
    });

    test('drops the target set once the last source is removed', () => {
      const a = makeEntry({ id: 'a', links: ['target'] });
      index.patch('put', a).orThrow();
      index.patch('delete', a).orThrow();
      expect(index.backlinks('target' as MemoryId)).toHaveLength(0);
    });
  });

  describe('duplicate associations', () => {
    test('a record with duplicate tags and links is cleaned up exactly once on delete', () => {
      const entry = makeEntry({ id: 'a', tags: ['dup', 'dup'], links: ['t', 't'] });
      index.patch('put', entry).orThrow();
      expect(ids(index.byTag('dup' as Tag))).toEqual(['a']);
      expect(index.backlinks('t' as MemoryId)).toEqual(['a']);
      index.patch('delete', entry).orThrow();
      expect(index.byTag('dup' as Tag)).toHaveLength(0);
      expect(index.backlinks('t' as MemoryId)).toHaveLength(0);
    });
  });
});
