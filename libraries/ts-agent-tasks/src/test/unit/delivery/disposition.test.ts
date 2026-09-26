/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IResolvedTaskCommitRecord, ITaskScope, TaskId } from '../../../index';
import { alpha, beta, op, revisionOf, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  committedIn,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  subscribed
} from '../../helpers/deliveryFixtures';

function host(
  h: IDeliveryHarness,
  scopes: ReadonlyArray<ITaskScope> = [alpha]
): Parameters<typeof h.broker.dispose>[0] {
  return { principal: 'alice', scopes, authorization: h.policy };
}

async function updateTitle(h: IDeliveryHarness, id: string, title: string): Promise<void> {
  (
    await h.writer.updateTracked({
      taskId: tid(id),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, id),
      patch: { title }
    })
  ).orThrow();
}

async function recordOf(h: IDeliveryHarness, id: string): Promise<IResolvedTaskCommitRecord> {
  return (await h.repository.readCommit(id as TaskId)).orThrow() as IResolvedTaskCommitRecord;
}

describe('TaskBroker.dispose', () => {
  // The falsifier for "abandon obligations without authority": a disposition the policy refuses ends
  // nothing, frees nothing, and leaves the archive held.
  test('without dispose-obligation authority, nothing is disposed and nothing is released', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const ids = await pendingIds(deliveryOf(h, 'sub'));
    h.policy.denyOn('dispose-obligation', 't');
    const before = committedIn(h.repository, 'acknowledgement-ids');
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'sub', updateIds: ids, reason: 'r' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual(ids);
    expect(committedIn(h.repository, 'acknowledgement-ids')).toBe(before);
    expect((await consumerRecord(h.repository, 'sub')).disposed).toEqual([]);
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toFailWithDetail(/still owed/i, expect.objectContaining({ code: 'retention-blocked' }));
  });

  test('a hidden task, a missing subscription and one outside the binding all get one answer', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const ids = await pendingIds(deliveryOf(h, 'sub'));
    h.policy.hide('t');
    const denied = expect.objectContaining({ code: 'not-found-or-denied' });
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'sub', updateIds: ids, reason: 'r' })
    ).toFailWithDetail(/not found or not permitted/i, denied);
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'nope', updateIds: ids, reason: 'r' })
    ).toFailWithDetail(/not found or not permitted/i, denied);
    expect(
      await h.broker.dispose(host(h, [beta]), { subscriptionId: 'sub', updateIds: ids, reason: 'r' })
    ).toFailWithDetail(/not found or not permitted/i, denied);
  });

  test('disposes owed ids with the host reason, which the exact history keeps', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    expect(
      await h.broker.dispose(host(h), {
        subscriptionId: 'sub',
        updateIds: ['t:1:0'],
        reason: 'access removed'
      })
    ).toSucceedWith({
      subscriptionId: 'sub' as never,
      newlyDisposed: ['t:1:0' as never],
      alreadyDischarged: []
    });
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([]);
    expect((await consumerRecord(h.repository, 'sub')).disposed).toEqual([
      { updateId: 't:1:0', reason: 'access removed' }
    ]);
  });

  test('a policy epoch that moves during authorization disposes nothing', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    h.policy.afterDecision = (r) => {
      if (r.action === 'dispose-obligation') {
        h.policy.epoch = 'epoch-2';
      }
    };
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'sub', updateIds: ['t:1:0'], reason: 'r' })
    ).toFailWithDetail(/policy changed/i, expect.objectContaining({ code: 'conflict', retry: 'safe' }));
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual(['t:1:0']);
  });

  test('a task that moves after authorization is authorized again, not trusted', async () => {
    const h = await deliveryHarness();
    const policy = h.policy;
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    let moved = 0;
    policy.afterDecision = async (r) => {
      if (r.action === 'dispose-obligation' && moved < 3) {
        moved++;
        await updateTitle(h, 't', `moved ${moved}`);
      }
    };
    // Every attempt finds the task moved: bounded retries, then a safe conflict.
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'sub', updateIds: ['t:1:0'], reason: 'r' })
    ).toFailWithDetail(/kept changing/i, expect.objectContaining({ code: 'conflict', retry: 'safe' }));
    expect(moved).toBe(3);
    // Once it holds still, the same request succeeds.
    expect(
      await h.broker.dispose(host(h), { subscriptionId: 'sub', updateIds: ['t:1:0'], reason: 'r' })
    ).toSucceed();
  });

  test('a malformed request is invalid', async () => {
    const h = await deliveryHarness();
    expect(await h.broker.dispose(host(h), { subscriptionId: 'sub' })).toFailWithDetail(
      /dispose/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await h.broker.dispose({ principal: '', scopes: [], authorization: h.policy }, {})).toFail();
  });
});

describe('TaskBroker.closeSubscription', () => {
  test('retain: no new obligation; what it kept drains through its delivery, current state is not presented', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const closed = (
      await h.broker.closeSubscription(host(h), { subscriptionId: 'sub', obligations: 'retain' })
    ).orThrow();
    expect(closed.state).toBe('closed');
    await updateTitle(h, 't', 'after closure');
    await track(h.writer, 'u');
    const delivery = deliveryOf(h, 'sub');
    expect(await pendingIds(delivery)).toEqual(['t:1:0']);
    const prepared = (await delivery.prepare()).orThrow();
    expect(prepared.context.receipt.included.flatMap((e) => e.updateIds)).toEqual(['t:1:0']);
    expect(prepared.context.entries.map((e) => e.summary.envelope.id)).not.toContain('u');
    (await delivery.acknowledge(prepared.context.receipt)).orThrow();
    expect(await pendingIds(delivery)).toEqual([]);
  });

  test('dispose: every owed obligation ends with the reason; tasks can then be archived', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const closed = (
      await h.broker.closeSubscription(host(h), {
        subscriptionId: 'sub',
        obligations: 'dispose',
        reason: 'consumer retired'
      })
    ).orThrow();
    expect(closed.state).toBe('closed');
    const record = await consumerRecord(h.repository, 'sub');
    expect(record.disposed.map((d) => d.updateId)).toEqual(['t:1:0', 't:2:0', 't:2:3']);
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toSucceed();
  });

  test('dispose needs authority over every task it would end an obligation on', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    h.policy.denyOn('dispose-obligation', 't');
    expect(
      await h.broker.closeSubscription(host(h), {
        subscriptionId: 'sub',
        obligations: 'dispose',
        reason: 'r'
      })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(h.repository.subscription('sub' as never)).toSucceedAndSatisfy((d) =>
      expect(d!.state).toBe('active')
    );
    // Retaining ends nothing, so only the subscription-level check applies.
    expect(
      await h.broker.closeSubscription(host(h), { subscriptionId: 'sub', obligations: 'retain' })
    ).toSucceed();
  });

  test('a subscription-level refusal, and an epoch that moves, close nothing', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    h.policy.deny.push((r) => r.action === 'dispose-obligation' && r.task === undefined);
    expect(
      await h.broker.closeSubscription(host(h), { subscriptionId: 'sub', obligations: 'retain' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    h.policy.deny.splice(0);
    h.policy.afterDecision = (r) => {
      if (r.action === 'dispose-obligation') {
        h.policy.epoch = 'epoch-2';
      }
    };
    expect(
      await h.broker.closeSubscription(host(h), { subscriptionId: 'sub', obligations: 'retain' })
    ).toFailWithDetail(/policy changed/i, expect.objectContaining({ code: 'conflict' }));
    expect(h.repository.subscription('sub' as never)).toSucceedAndSatisfy((d) =>
      expect(d!.state).toBe('active')
    );
  });

  test('dispose captures again when an obligation lands on a task it did not authorize', async () => {
    const h = await deliveryHarness();
    const policy = h.policy;
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    let added = false;
    policy.afterDecision = async (r) => {
      if (r.action === 'dispose-obligation' && r.task !== undefined && !added) {
        added = true;
        await track(h.writer, 'late');
      }
    };
    const closed = (
      await h.broker.closeSubscription(host(h), {
        subscriptionId: 'sub',
        obligations: 'dispose',
        reason: 'r'
      })
    ).orThrow();
    expect(closed.state).toBe('closed');
    expect((await consumerRecord(h.repository, 'sub')).disposed.map((d) => d.updateId)).toEqual([
      'late:1:0',
      't:1:0'
    ]);
  });

  test('a malformed request is invalid', async () => {
    const h = await deliveryHarness();
    expect(
      await h.broker.closeSubscription(host(h), { subscriptionId: 'sub', obligations: 'dispose' })
    ).toFailWithDetail(/requires the disposition reason/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await h.broker.closeSubscription({ principal: '', scopes: [], authorization: h.policy }, {})
    ).toFail();
  });
});

describe('coalescing through the broker', () => {
  test('a coalescing subscription keeps only the latest undelivered progress, with the gap marked', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { policy: { coalesceProgress: true } });
    await track(h.writer, 't');
    await updateTitle(h, 't', 'two');
    await updateTitle(h, 't', 'three');
    await updateTitle(h, 't', 'four');
    const progress = (await recordOf(h, 't')).updates.filter((u) => u.category === 'progress');
    expect(progress.map((u) => [u.id, u.coalesced])).toEqual([['t:4:1', { fromRevision: 2 }]]);
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual(['t:1:0', 't:4:1']);
  });

  test('a subscription that does not coalesce keeps every revision', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await updateTitle(h, 't', 'two');
    await updateTitle(h, 't', 'three');
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual(['t:1:0', 't:2:1', 't:3:1']);
  });

  test('an issued, unacknowledged progress update is not superseded until its receipt is settled', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { policy: { coalesceProgress: true } });
    await track(h.writer, 't');
    await updateTitle(h, 't', 'two');
    const delivery = deliveryOf(h, 'sub');
    const prepared = (await delivery.prepare()).orThrow();
    expect(prepared.context.receipt.included.flatMap((e) => e.updateIds)).toContain('t:2:1');
    await updateTitle(h, 't', 'three');
    expect(await pendingIds(delivery)).toEqual(['t:1:0', 't:2:1', 't:3:1']);
    // The receipt is honoured: nothing it named was taken out from under it.
    expect(await delivery.acknowledge(prepared.context.receipt)).toSucceed();
    await updateTitle(h, 't', 'four');
    expect(await pendingIds(delivery)).toEqual(['t:4:1']);
  });

  test('two audiences: a routine update is superseded only when every member still owed it coalesces', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'fast', { policy: { coalesceProgress: true } });
    await subscribed(h, 'exact');
    await track(h.writer, 't');
    await updateTitle(h, 't', 'two');
    await updateTitle(h, 't', 'three');
    expect(await pendingIds(deliveryOf(h, 'fast'))).toEqual(['t:1:0', 't:2:1', 't:3:1']);
    // Once the exact consumer has taken it, the coalescing one may lose it.
    const exact = deliveryOf(h, 'exact');
    (await exact.acknowledge((await exact.prepare()).orThrow().context.receipt)).orThrow();
    await updateTitle(h, 't', 'four');
    expect(await pendingIds(deliveryOf(h, 'fast'))).toEqual(['t:1:0', 't:4:1']);
  });
});
