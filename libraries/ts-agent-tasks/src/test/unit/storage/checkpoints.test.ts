/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { Instant, ITaskConsumerRecord, SubscriptionId } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { FileTreeCheckpointStore } from '../../../packlets/storage/checkpoints';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { RecordStore } from '../../../packlets/storage/recordStore';
import { converters } from '../../helpers/fixtures';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { at, memoryRoot } from '../../helpers/storageFixtures';

function validRecord(): ITaskConsumerRecord {
  return converters.delivery.consumerRecord
    .convert({
      formatVersion: 1,
      id: 'sub-1',
      recordRevision: 1,
      registration: { operationId: 'op-1', principalKey: 'alice' },
      consumerId: 'consumer-1',
      selection: { scopes: [{ namespace: 'project', key: 'alpha' }], lifecycleClass: 'all' },
      start: 'from-now',
      policy: {
        schemaVersion: 1,
        durability: 'session',
        history: 'observed-state',
        categories: ['attention', 'lifecycle', 'result']
      },
      state: 'active',
      createdAt: at,
      baseline: [],
      acknowledged: [],
      issued: [],
      capacityClaims: []
    })
    .orThrow();
}

function faultyStore(): { root: FaultyRoot; store: FileTreeCheckpointStore } {
  const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
  const recordStore = RecordStore.create(root, 'session').orThrow();
  return { root, store: new FileTreeCheckpointStore(recordStore) };
}

describe('FileTreeCheckpointStore.write', () => {
  test('writes only over the revision the caller read', () => {
    const { root, store } = faultyStore();
    expect(store.write('sub-1' as SubscriptionId, 1, validRecord())).toFailWithDetail(
      /expected record revision 1, holding 0/i,
      'unchanged'
    );
    expect(store.write('sub-1' as SubscriptionId, 0, validRecord())).toSucceed();
    // A second creation, or a replacement of a revision the store no longer holds, writes nothing.
    root.clearWrites();
    expect(store.write('sub-1' as SubscriptionId, 0, validRecord())).toFailWithDetail(
      /expected record revision 0, holding 1/i,
      'unchanged'
    );
    expect(
      store.write('sub-1' as SubscriptionId, 2, { ...validRecord(), recordRevision: 3 })
    ).toFailWithDetail(/expected record revision 2, holding 1/i, 'unchanged');
    expect(root.writes).toEqual([]);
    expect(store.write('sub-1' as SubscriptionId, 1, { ...validRecord(), recordRevision: 2 })).toSucceed();
  });

  test("another subscription's record at the name is not overwritten, whatever its revision", () => {
    const { root, store } = faultyStore();
    root.inner
      .writeChildAtomically('consumer-sub-1.json', JSON.stringify({ ...validRecord(), id: 'sub-2' }), {
        guarantee: 'session'
      })
      .orThrow();
    expect(
      store.write('sub-1' as SubscriptionId, 1, { ...validRecord(), recordRevision: 2 })
    ).toFailWithDetail(/cannot read the current record: it holds subscription sub-2's record/i, 'unchanged');
    expect(root.writes).toEqual([]);
  });

  test('a current record that cannot be read or has no revision is not overwritten', () => {
    const { root, store } = faultyStore();
    root.inner
      .writeChildAtomically('consumer-sub-1.json', JSON.stringify({ nonsense: true }), {
        guarantee: 'session'
      })
      .orThrow();
    expect(store.write('sub-1' as SubscriptionId, 0, validRecord())).toFailWithDetail(
      /cannot read the current record/i,
      'unchanged'
    );
    expect(root.writes).toEqual([]);
  });

  test('a record that cannot be canonicalized is refused before anything is written', () => {
    const { root, store } = faultyStore();
    const broken = { ...validRecord(), createdAt: (() => 'not json') as unknown as Instant };
    const written = store.write('sub-1' as SubscriptionId, 0, broken);
    expect(written.isFailure()).toBe(true);
    expect(written.detail).toBe('unchanged');
    expect(root.writes).toEqual([]);
  });

  test('a creation write that lands but whose re-listing fails is reported unknown', () => {
    const { root, store } = faultyStore();
    // The compare-and-write read lists the root first; only the re-listing after the write fails.
    const real = root.writeChildAtomically.bind(root);
    root.writeChildAtomically = (...args: Parameters<typeof real>): ReturnType<typeof real> => {
      const written = real(...args);
      root.failChildren = true;
      return written;
    };
    const written = store.write('sub-1' as SubscriptionId, 0, validRecord());
    expect(written.isFailure()).toBe(true);
    expect(written.detail).toBe('unknown');
    // The write itself reached the root before the re-listing failed.
    expect(root.writes).toEqual(['consumer-sub-1.json']);
  });

  test('a write the root refuses before anything became visible is reported unchanged', () => {
    const { root, store } = faultyStore();
    root.faults.push({ name: 'consumer-sub-1.json', when: 'before', visibility: 'unchanged' });
    const written = store.write('sub-1' as SubscriptionId, 0, validRecord());
    expect(written.isFailure()).toBe(true);
    expect(written.detail).toBe('unchanged');
  });

  test('a write whose visibility the root cannot classify is reported unknown', () => {
    const { root, store } = faultyStore();
    root.faults.push({ name: 'consumer-sub-1.json', when: 'before', visibility: 'unknown' });
    const written = store.write('sub-1' as SubscriptionId, 0, validRecord());
    expect(written.isFailure()).toBe(true);
    expect(written.detail).toBe('unknown');
  });

  test('a write failure the root does not classify at all is reported unknown', () => {
    const { root, store } = faultyStore();
    root.faults.push({
      name: 'consumer-sub-1.json',
      when: 'before',
      visibility: 'unknown',
      unclassified: true
    });
    const written = store.write('sub-1' as SubscriptionId, 0, validRecord());
    expect(written.isFailure()).toBe(true);
    expect(written.detail).toBe('unknown');
  });

  test('a replacement write (non-zero expected revision) never needs to re-list', () => {
    const { root, store } = faultyStore();
    expect(store.write('sub-1' as SubscriptionId, 0, validRecord()).isSuccess()).toBe(true);
    root.failChildren = true;
    const replaced = store.write('sub-1' as SubscriptionId, 1, { ...validRecord(), recordRevision: 2 });
    expect(replaced.isSuccess()).toBe(true);
  });
});
