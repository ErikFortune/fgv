/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IMemoryObservationRecord,
  Kind,
  MemoryId,
  MemoryObservationPhase,
  MemoryObservationStore,
  MemoryScopeKey
} from '../../../index';

interface IObsSpec {
  readonly seq: number;
  readonly timestamp?: number;
  readonly phase?: MemoryObservationPhase;
  readonly scope?: string;
  readonly kind?: string;
  readonly id?: string;
  readonly outcome?: 'success' | 'failure';
}

function obs(spec: IObsSpec): IMemoryObservationRecord {
  return {
    seq: spec.seq,
    timestamp: spec.timestamp ?? spec.seq,
    phase: spec.phase ?? 'write',
    scope: spec.scope === undefined ? undefined : (spec.scope as MemoryScopeKey),
    kind: spec.kind === undefined ? undefined : (spec.kind as Kind),
    id: spec.id === undefined ? undefined : (spec.id as MemoryId),
    outcome: spec.outcome ?? 'success'
  };
}

function seqs(records: ReadonlyArray<IMemoryObservationRecord>): ReadonlyArray<number> {
  return records.map((r) => r.seq);
}

describe('MemoryObservationStore', () => {
  describe('create', () => {
    test('builds with defaults', () => {
      expect(MemoryObservationStore.create()).toSucceedAndSatisfy((store: MemoryObservationStore) => {
        expect(store.size).toBe(0);
        expect(store.lastSeq).toBe(0);
      });
    });

    test('rejects a non-positive-integer maxRecords', () => {
      expect(MemoryObservationStore.create({ maxRecords: 0 })).toFailWith(/positive integer/i);
      expect(MemoryObservationStore.create({ maxRecords: 2.5 })).toFailWith(/positive integer/i);
      expect(MemoryObservationStore.create({ maxRecords: -1 })).toFailWith(/positive integer/i);
    });
  });

  describe('observe', () => {
    test('retains records and tracks size + lastSeq', async () => {
      const store = MemoryObservationStore.create().orThrow();
      expect(await store.observe(obs({ seq: 1 }))).toSucceed();
      expect(await store.observe(obs({ seq: 2 }))).toSucceed();
      expect(store.size).toBe(2);
      expect(store.lastSeq).toBe(2);
    });

    test('evicts the oldest beyond maxRecords, preserving lastSeq', async () => {
      const store = MemoryObservationStore.create({ maxRecords: 2 }).orThrow();
      await store.observe(obs({ seq: 1 }));
      await store.observe(obs({ seq: 2 }));
      await store.observe(obs({ seq: 3 }));
      expect(store.size).toBe(2);
      expect(store.lastSeq).toBe(3);
      expect(seqs(store.query())).toEqual([2, 3]);
    });
  });

  describe('query', () => {
    let store: MemoryObservationStore;

    beforeEach(async () => {
      store = MemoryObservationStore.create().orThrow();
      await store.observe(
        obs({
          seq: 1,
          timestamp: 100,
          phase: 'write',
          scope: 'knowledge',
          kind: 'knowledge',
          outcome: 'success'
        })
      );
      await store.observe(
        obs({
          seq: 2,
          timestamp: 200,
          phase: 'read',
          scope: 'knowledge',
          kind: 'knowledge',
          outcome: 'failure'
        })
      );
      await store.observe(
        obs({ seq: 3, timestamp: 300, phase: 'delete', scope: 'other', kind: 'note', outcome: 'success' })
      );
    });

    test('returns all records oldest-first with no criteria', () => {
      expect(seqs(store.query())).toEqual([1, 2, 3]);
    });

    test('pages by sinceSeq', () => {
      expect(seqs(store.query({ sinceSeq: 1 }))).toEqual([2, 3]);
    });

    test('limits to the most-recent N', () => {
      expect(seqs(store.query({ limit: 2 }))).toEqual([2, 3]);
    });

    test('filters by timestamp window', () => {
      expect(seqs(store.query({ since: 200 }))).toEqual([2, 3]);
      expect(seqs(store.query({ until: 200 }))).toEqual([1, 2]);
      expect(seqs(store.query({ since: 150, until: 250 }))).toEqual([2]);
    });

    test('filters by scope', () => {
      expect(seqs(store.query({ scope: 'knowledge' as MemoryScopeKey }))).toEqual([1, 2]);
    });

    test('filters by kind', () => {
      expect(seqs(store.query({ kind: 'note' as Kind }))).toEqual([3]);
    });

    test('filters by phase', () => {
      expect(seqs(store.query({ phase: 'read' }))).toEqual([2]);
    });

    test('filters by outcome', () => {
      expect(seqs(store.query({ outcome: 'failure' }))).toEqual([2]);
    });

    test('combines criteria with AND', () => {
      expect(seqs(store.query({ scope: 'knowledge' as MemoryScopeKey, outcome: 'success' }))).toEqual([1]);
    });
  });

  describe('clear', () => {
    test('drops records but preserves lastSeq as a cursor floor', async () => {
      const store = MemoryObservationStore.create().orThrow();
      await store.observe(obs({ seq: 1 }));
      await store.observe(obs({ seq: 2 }));
      store.clear();
      expect(store.size).toBe(0);
      expect(store.lastSeq).toBe(2);
      expect(store.query()).toEqual([]);
    });
  });
});
