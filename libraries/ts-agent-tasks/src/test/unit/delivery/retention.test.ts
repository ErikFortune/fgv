/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  TaskBroker,
  TaskConverters,
  TaskId,
  TaskKindRegistry,
  taskListDescriptor,
  trackedTaskDescriptor
} from '../../../index';
import { alpha, op, registerVendor, revisionOf, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  committedIn,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  subscribed
} from '../../helpers/deliveryFixtures';

// What makes `archive` possible under a subscription: an archive is one atomic replacement to a
// tombstone that retains no update payload, admitted only when each audience member's durable
// checkpoint proves every update acknowledged or disposed.

async function archive(h: IDeliveryHarness, id: string = 't'): Promise<unknown> {
  return h.writer.archive({
    taskId: tid(id),
    operationId: op(),
    expectedRevision: await revisionOf(h.repository, id)
  });
}

async function recordOf(h: IDeliveryHarness, id: string = 't'): Promise<IResolvedTaskCommitRecord> {
  return (await h.repository.readCommit(id as TaskId)).orThrow() as IResolvedTaskCommitRecord;
}

describe('archive under a live subscription', () => {
  // An update owed to no one is never retained.
  test('with no subscription an update is owed to no one, and a terminal task archives', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    expect(await archive(h)).toSucceed();
  });

  // Refused while owed, and admitted once the exact history holds every id.
  test('a matching subscription holds archive until every update is acknowledged, then releases it', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    expect(await archive(h)).toFailWithDetail(
      /still owed/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    const prepared = (await delivery.prepare()).orThrow();
    expect((await delivery.acknowledge(prepared.context.receipt)).orThrow().newlyAcknowledged).toEqual([
      't:1:0',
      't:2:0',
      't:2:3'
    ]);
    expect(await pendingIds(delivery)).toEqual([]);
    const nonArchived = committedIn(h.repository, 'non-archived-tasks');
    const updates = committedIn(h.repository, 'updates');
    expect(await archive(h)).toSucceed();
    const tombstone = await recordOf(h);
    expect(tombstone.archived).toBe(true);
    expect(tombstone.updates).toEqual([]);
    // Transient capacity released: the non-archived slot and the retained payloads.
    expect(committedIn(h.repository, 'non-archived-tasks')).toBe(nonArchived - 1);
    expect(committedIn(h.repository, 'updates')).toBeLessThan(updates);
  });

  test('the refusal a principal sees names no subscription', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'secret-consumer');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const refused = await h.writer.archive({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, 't')
    });
    expect(refused).toFailWithDetail(/still owed/i, expect.objectContaining({ code: 'retention-blocked' }));
    expect(refused.isFailure() && refused.message).not.toMatch(/secret-consumer/);
  });

  test('a partial acknowledgement is not enough: every audience member must discharge every update', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'a');
    await subscribed(h, 'b');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const a = deliveryOf(h, 'a');
    (await a.acknowledge((await a.prepare()).orThrow().context.receipt)).orThrow();
    expect(await archive(h)).toFailWithDetail(
      /still owed/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    // The other consumer disposes rather than acknowledges: a disposition discharges just the same.
    (
      await h.broker.dispose(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { subscriptionId: 'b', updateIds: ['t:1:0', 't:2:0', 't:2:3'], reason: 'consumer retired' }
      )
    ).orThrow();
    expect(await archive(h)).toSucceed();
  });

  test('a subscription whose selection does not match the task does not block it', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { selection: { parentId: 'nobody' } });
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    expect(await archive(h)).toSucceed();
  });
});

describe('cleanup', () => {
  test('prunes acknowledged payloads of a live task, and leaves what is still owed', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await track(h.writer, 'u');
    const delivery = deliveryOf(h, 'sub');
    const prepared = (await delivery.prepare()).orThrow();
    (await delivery.acknowledge(prepared.context.receipt)).orThrow();
    await succeedTask(h, h.writer, 'u');
    const resident = committedIn(h.repository, 'resident-payload-bytes');
    expect(await h.broker.cleanup({ limit: 10 })).toSucceedWith({
      pruned: [tid('t'), tid('u')],
      unchanged: []
    });
    expect((await recordOf(h, 't')).updates).toEqual([]);
    // u's terminal updates were committed after the acknowledgement: still owed, still retained.
    expect((await recordOf(h, 'u')).updates.map((u) => u.id)).toEqual(['u:2:0', 'u:2:3']);
    expect(committedIn(h.repository, 'resident-payload-bytes')).toBeLessThan(resident);
    expect(await h.broker.cleanup({ limit: 10 })).toSucceedWith({ pruned: [], unchanged: [] });
  });

  test('prunes an external task, keeping its source revision', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await registerVendor(h, 'v');
    const before = await recordOf(h, 'v');
    expect(before.sourceRevision).toBeDefined();
    (
      await h.broker.dispose(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { subscriptionId: 'sub', updateIds: before.updates.map((u) => u.id), reason: 'r' }
      )
    ).orThrow();
    expect(await h.broker.cleanup({ limit: 10 })).toSucceedWith({ pruned: [tid('v')], unchanged: [] });
    const after = await recordOf(h, 'v');
    expect(after.updates).toEqual([]);
    expect(after.sourceRevision).toEqual(before.sourceRevision);
  });

  test('a quarantined task is a candidate cleanup leaves unchanged: its record is never rewritten', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await registerVendor(h, 'v');
    const ids = (await recordOf(h, 'v')).updates.map((u) => u.id);
    (
      await h.broker.dispose(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { subscriptionId: 'sub', updateIds: ids, reason: 'r' }
      )
    ).orThrow();
    h.repository.close().orThrow();
    const converters = TaskConverters.create().orThrow();
    const registry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    registry.register(trackedTaskDescriptor()).orThrow();
    registry.register(taskListDescriptor()).orThrow();
    const opened = (
      await FileTreeTaskRepository.open({ root: h.root, mode: 'session', environment: h.env, registry })
    ).orThrow();
    if (opened.state !== 'ready') {
      throw new Error('expected a ready repository');
    }
    const broker = TaskBroker.create({ repository: opened.repository, environment: h.env }).orThrow();
    expect(await broker.cleanup({ limit: 10 })).toSucceedWith({ pruned: [], unchanged: [tid('v')] });
  });

  test('a malformed request is invalid', async () => {
    const h = await deliveryHarness();
    expect(await h.broker.cleanup({ limit: 0 })).toFailWithDetail(
      /cleanup/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});
