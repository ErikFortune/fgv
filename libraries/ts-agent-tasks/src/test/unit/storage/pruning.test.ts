/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  DeliveryId,
  FileTreeTaskRepository,
  ITaskCommitRecord,
  ITaskRepository,
  Instant,
  SubscriptionId,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateId,
  taskUpdateId
} from '../../../index';
import { InMemoryCheckpointStore } from '../../helpers/deliveryFixtures';
import { addTask, scope, subscribeTo } from '../../helpers/queryFixtures';
import { at, memoryRoot, nextDraft, params } from '../../helpers/storageFixtures';

// The falsifiers for the retention rule, written before the disposition path. A "drop it and free
// the slot" implementation passes every functional test of disposition and pruning; these are the
// tests it fails. Each asserts a refusal *and* that nothing moved: the obligation is still owed and
// no capacity was released.

const A = scope('alpha');
const t: TaskId = 't' as TaskId;
const s1: SubscriptionId = 's1' as SubscriptionId;
const lifecycle1: UpdateId = taskUpdateId(t, 1 as TaskRevision, 'lifecycle');
const later: Instant = new Date(Date.parse(at) + 3600000).toISOString() as Instant;

async function repositoryWith(store: InMemoryCheckpointStore): Promise<ITaskRepository> {
  const repository = (
    await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { checkpoints: store }))
  ).orThrow();
  await subscribeTo(repository, 's1', [A]);
  await addTask(repository, 't', { scopes: [A] });
  return repository;
}

async function record(repository: ITaskRepository): Promise<ITaskCommitRecord> {
  return (await repository.readCommit(t)).orThrow()!;
}

/** A maintenance commit keeping only the updates `keep` admits. */
async function dropUpdates(
  repository: ITaskRepository,
  keep: (id: UpdateId) => boolean = () => false
): Promise<TaskResult<ITaskCommitRecord>> {
  const current = await record(repository);
  const resolved = current.recordType === 'resolved' ? current : (undefined as never);
  return repository.withWriter((w) =>
    w.commit({
      purpose: 'maintenance',
      taskId: t,
      expectedRevision: resolved.task.envelope.revision,
      expectedRecordRevision: resolved.recordRevision,
      record: { ...nextDraft(resolved, {}), updates: resolved.updates.filter((u) => keep(u.id)) }
    })
  );
}

async function acknowledgeFirst(repository: ITaskRepository): Promise<void> {
  const receipt = {
    version: 1,
    deliveryId: 'd1',
    included: [{ taskId: 't', revision: 1, updateIds: [lifecycle1] }]
  } as never;
  (
    await repository.withWriter((w) =>
      w.issueReceipt({
        subscriptionId: s1,
        expectedRecordRevision: 1,
        receipt,
        issuedAt: at as Instant,
        expiresAt: later
      })
    )
  ).orThrow();
  (
    await repository.withWriter((w) =>
      w.acknowledgeReceipt({
        subscriptionId: s1,
        expectedRecordRevision: 2,
        deliveryId: 'd1' as DeliveryId,
        at: at as Instant
      })
    )
  ).orThrow();
}

function committed(repository: ITaskRepository): Record<string, number> {
  const rows = repository.capacityStatus().orThrow().dimensions;
  return Object.fromEntries(rows.map((d) => [d.dimension, d.used + d.reserved]));
}

async function owedIds(repository: ITaskRepository): Promise<string[]> {
  return (await repository.listOwed({ subscription: s1 })).orThrow().updates.map((u) => u.id);
}

describe('falsifier: an owed update cannot leave a record without durable evidence', () => {
  test('a maintenance commit cannot drop a required update its audience is still owed', async () => {
    const repository = await repositoryWith(new InMemoryCheckpointStore());
    const before = committed(repository);
    expect(await dropUpdates(repository)).toFailWithDetail(
      /owed|evidence/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    expect(await owedIds(repository)).toEqual([lifecycle1]);
    expect(committed(repository)).toEqual(before);
    expect((await record(repository)).recordRevision).toBe(1);
  });

  test('an acknowledged update is not prunable when its evidence is missing from the checkpoint store', async () => {
    const store = new InMemoryCheckpointStore();
    const repository = await repositoryWith(store);
    await acknowledgeFirst(repository);
    // The resident index says the link is satisfied; the durable evidence is gone. Cleanup must
    // believe the store, not the index — and a store that lost committed state fences.
    store.records.delete(s1);
    expect(await dropUpdates(repository)).toFailWithDetail(
      /checkpoint/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    expect(repository.health().state).toBe('unavailable');
  });

  test('positive control: with durable evidence the same drop succeeds and releases the payload', async () => {
    const repository = await repositoryWith(new InMemoryCheckpointStore());
    await acknowledgeFirst(repository);
    const before = committed(repository);
    const pruned = (await dropUpdates(repository)).orThrow();
    expect(pruned.recordType === 'resolved' && pruned.updates).toEqual([]);
    const after = committed(repository);
    expect(after.updates).toBe(before.updates - 1);
    expect(after['resident-payload-bytes']).toBeLessThan(before['resident-payload-bytes']);
  });
});

describe('supersedable answers by category, never by the flag', () => {
  test('a required-category update is never supersedable, whatever it says about itself', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { checkpoints: new InMemoryCheckpointStore() })
      )
    ).orThrow();
    await subscribeTo(repository, 's1', [A], undefined, true);
    await addTask(repository, 't', { scopes: [A] });
    const current = await record(repository);
    const owed = (current.recordType === 'resolved' ? current.updates : [])[0];
    expect(owed.id).toBe(lifecycle1);
    // Positive control: the same owed update, read as routine, is supersedable for this audience.
    expect(repository.supersedable({ ...owed, category: 'progress', required: false }, [s1])).toBe(true);
    expect(repository.supersedable(owed, [s1])).toBe(false);
    expect(repository.supersedable({ ...owed, required: false }, [s1])).toBe(false);
  });

  test('a discharged update an open receipt still names is not supersedable', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { checkpoints: new InMemoryCheckpointStore() })
      )
    ).orThrow();
    await subscribeTo(repository, 's1', [A], undefined, true);
    await addTask(repository, 't', { scopes: [A] });
    const current = await record(repository);
    const owed = (current.recordType === 'resolved' ? current.updates : [])[0];
    // The owed update read as routine, so only the pin decides.
    const asRoutine = { ...owed, category: 'progress' as const, required: false };
    const receipt = (deliveryId: string): never =>
      ({
        version: 1,
        deliveryId,
        included: [{ taskId: 't', revision: 1, updateIds: [lifecycle1] }]
      } as never);
    let revision = 1;
    for (const deliveryId of ['d1', 'd2']) {
      (
        await repository.withWriter((w) =>
          w.issueReceipt({
            subscriptionId: s1,
            expectedRecordRevision: revision++,
            receipt: receipt(deliveryId),
            issuedAt: at as Instant,
            expiresAt: later
          })
        )
      ).orThrow();
    }
    const ack = async (deliveryId: string): Promise<void> => {
      (
        await repository.withWriter((w) =>
          w.acknowledgeReceipt({
            subscriptionId: s1,
            expectedRecordRevision: revision++,
            deliveryId: deliveryId as DeliveryId,
            at: at as Instant
          })
        )
      ).orThrow();
    };
    await ack('d2');
    expect(repository.supersedable(asRoutine, [s1])).toBe(false);
    await ack('d1');
    expect(repository.supersedable(asRoutine, [s1])).toBe(true);
  });
});
