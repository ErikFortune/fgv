/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ITaskCommitRecord, ITaskRepository, TaskId } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { SortedKeySet } from '../../../packlets/storage/sortedKeys';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { TaskIndex } from '../../../packlets/storage/taskIndex';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { evaluateDue, evaluateTasks } from '../../../packlets/storage/queries';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { RecordCache } from '../../../packlets/storage/workingSet';
import { scope } from '../../helpers/queryFixtures';

describe('SortedKeySet', () => {
  test('holds each key once, in order, and removes only what it holds', () => {
    const set = new SortedKeySet();
    expect(set.add('b')).toBe(true);
    expect(set.add('a')).toBe(true);
    expect(set.add('b')).toBe(false);
    expect(set.keys).toEqual(['a', 'b']);
    expect(set.delete('c')).toBe(false);
    expect(set.delete('a')).toBe(true);
    expect(set.keys).toEqual(['b']);
    expect(set.startAfter(undefined)).toBe(0);
    expect(set.startAfter('a')).toBe(0);
    expect(set.startAfter('b')).toBe(1);
  });
});

describe('RecordCache', () => {
  const record = (recordRevision: number): ITaskCommitRecord =>
    ({ recordRevision } as unknown as ITaskCommitRecord);

  test('an entry read at another revision or fingerprint is dropped, and its charge released', () => {
    const cache = new RecordCache({ maxEntries: 4, maxEncodedBytes: 1000 });
    const id = 't' as TaskId;
    cache.put(id, { record: record(1), encoded: { text: 'x', bytes: 10 } }, 'f1');
    expect(cache.charge).toBe(10);
    expect(cache.get(id, 2, 'f1')).toBeUndefined();
    expect(cache.charge).toBe(0);
    cache.put(id, { record: record(1), encoded: { text: 'x', bytes: 10 } }, 'f1');
    expect(cache.get(id, 1, 'f2')).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});

describe('TaskIndex', () => {
  test('a quarantined entry is replaced as a whole, like every other', () => {
    const index = new TaskIndex();
    const id = 'q' as TaskId;
    expect(index.put(id, { category: 'quarantined', scopes: [scope('a')], archived: false })).toSucceed();
    expect(index.quarantinedByScope.size).toBe(1);
    expect(index.put(id, { category: 'quarantined', scopes: [scope('b')], archived: false })).toSucceed();
    expect([...index.quarantinedByScope.keys()]).toEqual([JSON.stringify(['project', 'b'])]);
    // An archived quarantined record is reported nowhere by scope.
    expect(index.put(id, { category: 'quarantined', scopes: [scope('b')], archived: true })).toSucceed();
    expect(index.quarantinedByScope.size).toBe(0);
    expect(index.categoryOf('nobody' as TaskId)).toBeUndefined();
  });

  test('an archived entry is replaced as a whole too, keeping only identity and edges', () => {
    const index = new TaskIndex();
    const envelope = { lifecycle: { status: 'succeeded' }, parentId: 'p', scopes: [scope('a')] } as never;
    expect(index.put('k' as TaskId, { category: 'archived', envelope })).toSucceed();
    expect(index.put('k' as TaskId, { category: 'archived', envelope })).toSucceed();
    expect([...index.children.get('p' as TaskId)!]).toEqual(['k']);
    expect(index.summaries.size).toBe(0);
  });
});

describe('query evaluation', () => {
  const counter = { candidateVisits: 0 };
  const all = { scopes: [scope('a')], lifecycleClass: 'all' as const, statuses: [] };

  test('an unresolved reference matches on responsibility', () => {
    const index = new TaskIndex();
    const reference = {
      id: 'u' as TaskId,
      scopes: [scope('a')],
      responsibility: { namespace: 'agent', key: 'ann' },
      binding: { sourceId: 's', referenceVersion: 1, reference: 'r' }
    } as never;
    index.put('u' as TaskId, { category: 'unresolved', reference }).orThrow();
    const ann = evaluateTasks(
      index,
      { ...all, responsibility: { namespace: 'agent', key: 'ann' } },
      10,
      undefined,
      counter
    );
    expect(ann.unresolved).toHaveLength(1);
    const bob = evaluateTasks(
      index,
      { ...all, responsibility: { namespace: 'agent', key: 'bob' } },
      10,
      undefined,
      counter
    );
    expect(bob.unresolved).toHaveLength(0);
  });

  test('more quarantined tasks than a page names are reported as more, with bounded work', () => {
    const index = new TaskIndex();
    for (let i = 0; i < 2000; i++) {
      index
        .put(`q${String(i).padStart(4, '0')}` as TaskId, {
          category: 'quarantined',
          scopes: [scope('a')],
          archived: false
        })
        .orThrow();
    }
    const before = counter.candidateVisits;
    const page = evaluateTasks(index, all, 10, undefined, counter);
    expect(page.issues.join()).toMatch(/q0000, .*q0015 and more/);
    // Sixteen named, the one that says "more", and one key of stream lookahead — not 2,000.
    expect(counter.candidateVisits - before).toBe(18);
    // A due query reports the same bounded diagnostic.
    const dueBefore = counter.candidateVisits;
    const due = evaluateDue(index, all, '2026-01-01T00:00:00.000Z', 10, undefined, counter);
    expect(due.issues.join()).toMatch(/and more/);
    expect(counter.candidateVisits - dueBefore).toBe(18);
  });
});

describe('inspectRepository', () => {
  test('knows nothing about a repository this package did not construct', () => {
    expect(inspectRepository({} as ITaskRepository)).toBeUndefined();
  });
});
