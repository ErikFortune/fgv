/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  ITaskAccessRequest,
  ITaskSubscription,
  ITaskDeliveryDefaults,
  SubscriptionId,
  TaskBroker,
  TaskId,
  TaskRevision,
  baselineUpdateId,
  defaultDeliveryCategories,
  taskUpdateId
} from '../../../index';
import {
  TestPolicy,
  ada,
  alpha,
  beta,
  bob,
  op,
  registerVendor,
  revisionOf,
  succeedTask,
  tid,
  track,
  watch
} from '../../helpers/brokerFixtures';
import {
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  everyCategory,
  pendingIds,
  reopen,
  allowEverything,
  subscribeAs,
  subscribed
} from '../../helpers/deliveryFixtures';
import { registerJob, sourceHarness } from '../../helpers/sourceFixtures';

const uid = (task: string, revision: number, category: Parameters<typeof taskUpdateId>[2]): string =>
  taskUpdateId(task as TaskId, revision as TaskRevision, category);
const base = (task: string, revision: number): string =>
  baselineUpdateId(task as TaskId, revision as TaskRevision);

describe('start policies', () => {
  test('current: a baseline of every selected task the principal may see, terminal and attention included', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 'open');
    await track(h.writer, 'done');
    await succeedTask(h, h.writer, 'done');
    await track(h.writer, 'hidden');
    h.policy.hide('hidden');
    const s: ITaskSubscription = await subscribed(h, 'sub', { start: 'current' });
    expect(s.start).toBe('current');
    const record = await consumerRecord(h.repository, 'sub');
    expect(record.baseline.map((b) => [b.id, b.category])).toEqual([
      [base('done', 2), 'result'],
      [base('open', 1), 'lifecycle']
    ]);
    // Each baseline is the task's frozen current state, owed to this subscription alone.
    expect(
      record.baseline.every((b) => b.required && b.audience.length === 1 && b.audience[0] === 'sub')
    ).toBe(true);
    // The hidden task is covered from now on — owed later updates — but not disclosed in the baseline.
    const host = h.broker
      .bind({ principal: 'host', scopes: [alpha], authorization: allowEverything })
      .orThrow();
    await succeedTask(h, host, 'hidden');
    expect((await consumerRecord(h.repository, 'sub')).baseline).toHaveLength(2);
    h.policy.deny.length = 0;
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([
      base('done', 2),
      uid('hidden', 2, 'lifecycle'),
      uid('hidden', 2, 'result'),
      base('open', 1)
    ]);
  });

  test('current: a task with attention is baselined under attention', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    (
      await h.writer.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: 1 as TaskRevision,
        patch: { attention: [{ namespace: 'review', key: 'r1' }] }
      })
    ).orThrow();
    await subscribed(h, 'sub', { start: 'current' });
    expect((await consumerRecord(h.repository, 'sub')).baseline.map((b) => b.category)).toEqual([
      'attention'
    ]);
  });

  test('from-now: no baseline, only what commits after activation', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 'before');
    await subscribed(h, 'sub', { start: 'from-now' });
    await track(h.writer, 'after');
    expect((await consumerRecord(h.repository, 'sub')).baseline).toEqual([]);
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([uid('after', 1, 'lifecycle')]);
  });

  test("B's baseline is independent of A's acknowledgements", async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'a');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'a');
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    expect(await pendingIds(delivery)).toEqual([]);
    await subscribed(h, 'b', { start: 'current' });
    expect(await pendingIds(deliveryOf(h, 'b'))).toEqual([base('t', 1)]);
    // And B's acknowledgement moves nothing of A's.
    const b = deliveryOf(h, 'b');
    (await b.acknowledge((await b.prepare()).orThrow().context.receipt)).orThrow();
    expect((await consumerRecord(h.repository, 'a')).acknowledged).toEqual([uid('t', 1, 'lifecycle')]);
    expect((await consumerRecord(h.repository, 'b')).acknowledged).toEqual([base('t', 1)]);
  });

  test('a current selection larger than the baseline bound is refused, never truncated', async () => {
    const h = await deliveryHarness({ defaults: { maxBaselineTasks: 2 } });
    await track(h.writer, 'a');
    await track(h.writer, 'b');
    await track(h.writer, 'c');
    expect(await subscribeAs(h, 'sub', { start: 'current' })).toFailWithDetail(
      /more than 2 tasks, the baseline bound/i,
      expect.objectContaining({ code: 'backpressure' })
    );
    expect(h.repository.subscription('sub' as SubscriptionId)).toSucceedWith(undefined);
    // A narrower selection fits.
    expect(
      await subscribeAs(h, 'narrow', { start: 'current', selection: { responsibility: ada } })
    ).toSucceed();
  });

  test('a baseline that does not fit the subscription record is refused by capacity', async () => {
    const h = await deliveryHarness();
    const profile = h.repository.profile;
    // Room for the record, its one reusable receipt preparation (a maximum manifest) and the future
    // links of two open tasks — and not for two 2,000-character baselines on top.
    const units: number = 2 * everyCategory.length * profile.encoded.maxAcknowledgementEvidenceBytes;
    const limit: number = profile.encoded.maxIssuedReceiptBytes + units + 2000;
    const tiny = await deliveryHarness({
      profile: { ...profile, encoded: { ...profile.encoded, maxConsumerRecordBytes: limit } }
    });
    for (const id of ['a', 'b']) {
      (
        await tiny.writer.createTracked({
          taskId: tid(id),
          operationId: op(),
          title: id,
          description: 'x'.repeat(2000)
        })
      ).orThrow();
    }
    expect(await subscribeAs(tiny, 'sub', { start: 'current' })).toFailWithDetail(
      /capacity/i,
      expect.objectContaining({ code: 'backpressure' })
    );
    expect(tiny.repository.subscription('sub' as SubscriptionId)).toSucceedWith(undefined);
    expect(await subscribeAs(tiny, 'sub', { start: 'from-now' })).toSucceed();
  });
});

describe('no subscribe/mutate gap', () => {
  test('a terminal transition between baseline capture and activation is recaptured, never lost', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 't');
    let fired: boolean = false;
    // The policy's baseline check for `t` is where the capture has read it and is about to commit:
    // complete the task right there.
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (!fired && request.action === 'read' && request.task?.envelope.id === 't') {
        fired = true;
        policy.afterDecision = undefined;
        await succeedTask(h, h.writer, 't');
      }
    };
    await subscribed(h, 'sub', { start: 'current' });
    expect(fired).toBe(true);
    // The subscription saw the terminal state: in its baseline, because the capture was redone.
    expect((await consumerRecord(h.repository, 'sub')).baseline.map((b) => b.id)).toEqual([base('t', 2)]);
  });

  test('a task created between capture and activation is recaptured into the baseline', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 'a');
    let fired: boolean = false;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (!fired && request.action === 'read') {
        fired = true;
        policy.afterDecision = undefined;
        await track(h.writer, 'b');
      }
    };
    await subscribed(h, 'sub', { start: 'current' });
    expect((await consumerRecord(h.repository, 'sub')).baseline.map((b) => b.id)).toEqual([
      base('a', 1),
      base('b', 1)
    ]);
  });

  test('a terminal transition after activation is owed as an update', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await subscribed(h, 'sub', { start: 'current' });
    await succeedTask(h, h.writer, 't');
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([
      base('t', 1),
      uid('t', 2, 'lifecycle'),
      uid('t', 2, 'result')
    ]);
  });

  test('a selection that keeps changing is refused after bounded recaptures', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 't');
    let n: number = 0;
    policy.afterDecision = async (request: ITaskAccessRequest) => {
      if (request.action === 'read') {
        await track(h.writer, `extra${++n}`);
      }
    };
    expect(await subscribeAs(h, 'sub', { start: 'current' })).toFailWithDetail(
      /kept changing/i,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    policy.afterDecision = undefined;
  });

  test('a policy epoch that moves between capture and activation recaptures', async () => {
    const h = await deliveryHarness();
    const policy: TestPolicy = h.policy;
    await track(h.writer, 't');
    let fired: boolean = false;
    policy.afterDecision = () => {
      if (!fired) {
        fired = true;
        policy.epoch = 'epoch-2';
      }
    };
    expect(await subscribeAs(h, 'sub', { start: 'current' })).toSucceed();
    expect(fired).toBe(true);
  });

  test('a principal without subscribe authority is refused', async () => {
    const h = await deliveryHarness();
    h.policy.deny.push((r) => r.action === 'subscribe');
    expect(await subscribeAs(h, 'sub')).toFailWithDetail(
      /not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
  });
});

describe('pending delivery uses stored audiences, not current selection membership', () => {
  test('an open-only subscription keeps its terminal exit update', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'open', { selection: { lifecycleClass: 'open' } });
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    // The task no longer matches an open-only selection; its exit is still owed.
    expect(await pendingIds(deliveryOf(h, 'open'))).toEqual([
      uid('t', 1, 'lifecycle'),
      uid('t', 2, 'lifecycle'),
      uid('t', 2, 'result')
    ]);
  });

  test('a status-filtered subscription keeps the update of the transition out of its status', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'pending', { selection: { lifecycleClass: 'open', statuses: ['pending'] } });
    await track(h.writer, 't');
    await h.writer.execute({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: 1 as TaskRevision,
      command: 'start',
      parameters: {}
    });
    expect(await pendingIds(deliveryOf(h, 'pending'))).toEqual([
      uid('t', 1, 'lifecycle'),
      uid('t', 2, 'lifecycle')
    ]);
    // After it, the task is out of the selection: nothing more is owed.
    await succeedTask(h, h.writer, 't');
    expect(await pendingIds(deliveryOf(h, 'pending'))).toEqual([
      uid('t', 1, 'lifecycle'),
      uid('t', 2, 'lifecycle')
    ]);
  });

  test('a parent-filtered subscription keeps the reparent exit, and the new parent gains the task', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 'p1');
    await track(h.writer, 'p2');
    await subscribed(h, 'under-p1', { selection: { parentId: 'p1' } });
    await subscribed(h, 'under-p2', { selection: { parentId: 'p2' } });
    await track(h.writer, 'c', { parentId: 'p1' });
    (
      await h.writer.reparent({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'c'),
        parent: { taskId: tid('p2') }
      })
    ).orThrow();
    expect(await pendingIds(deliveryOf(h, 'under-p1'))).toEqual([
      uid('c', 1, 'lifecycle'),
      uid('c', 2, 'relationship')
    ]);
    expect(await pendingIds(deliveryOf(h, 'under-p2'))).toEqual([uid('c', 2, 'relationship')]);
    // Later work on c is p2's subscription's only.
    await succeedTask(h, h.writer, 'c');
    expect(await pendingIds(deliveryOf(h, 'under-p1'))).toHaveLength(2);
    expect(await pendingIds(deliveryOf(h, 'under-p2'))).toHaveLength(3);
  });

  test('a subscription takes only its categories; the mandatory ones always', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    await track(h.writer, 't');
    await h.writer.execute({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: 1 as TaskRevision,
      command: 'set-progress',
      parameters: { progress: { completed: 1 } }
    });
    await succeedTask(h, h.writer, 't');
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([
      uid('t', 1, 'lifecycle'),
      uid('t', 3, 'lifecycle'),
      uid('t', 3, 'result')
    ]);
    expect(await subscribeAs(h, 'bad', { categories: ['progress'] })).toFailWithDetail(
      /mandatory/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('the persisted delivery policy is authoritative', () => {
  test('reopening under changed host defaults leaves an existing subscription as it was created', async () => {
    const h = await deliveryHarness({
      defaults: { policy: { categories: ['attention', 'lifecycle', 'result'] } }
    });
    const created = (
      await h.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        {
          subscriptionId: 'sub',
          operationId: 'subscribe-sub',
          consumerId: 'consumer-sub',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'from-now'
        }
      )
    ).orThrow();
    expect(created.policy).toEqual({
      schemaVersion: 1,
      durability: 'session',
      history: 'observed-state',
      categories: ['attention', 'lifecycle', 'result']
    });
    const later = await reopen(h, { policy: { categories: everyCategory } });
    expect(later.repository.subscription('sub' as SubscriptionId)).toSucceedWith(created);
    await track(later.writer, 't');
    await later.writer.execute({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: 1 as TaskRevision,
      command: 'set-progress',
      parameters: { progress: { completed: 1 } }
    });
    // Progress is not in the stored policy, whatever the new defaults say.
    expect(await pendingIds(deliveryOf(later, 'sub'))).toEqual([uid('t', 1, 'lifecycle')]);
    // A subscription created now does take the new defaults.
    const fresh = (
      await later.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: later.policy },
        {
          subscriptionId: 'fresh',
          operationId: 'subscribe-fresh',
          consumerId: 'consumer-fresh',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'from-now'
        }
      )
    ).orThrow();
    expect(fresh.policy.categories).toEqual(everyCategory);
  });

  test('with no defaults, a subscription is owed the required categories', async () => {
    const h = await deliveryHarness();
    const s = (
      await h.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        {
          subscriptionId: 'sub',
          operationId: 'op-s',
          consumerId: 'c',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'from-now'
        }
      )
    ).orThrow();
    expect(s.policy.categories).toEqual(defaultDeliveryCategories);
  });

  test('a policy more durable than the repository is refused', async () => {
    const h = await deliveryHarness();
    expect(await subscribeAs(h, 'sub', { policy: { durability: 'process-crash' } })).toFailWithDetail(
      /session-only/i,
      expect.objectContaining({ code: 'unsupported' })
    );
  });

  test('invalid broker delivery defaults are refused at creation', async () => {
    const h = await deliveryHarness();
    const make = (delivery: ITaskDeliveryDefaults): unknown =>
      TaskBroker.create({ repository: h.repository, environment: h.env, delivery });
    expect(make({ receiptLifetimeMs: 0 })).toFailWith(/receiptLifetimeMs/);
    expect(make({ maxBaselineTasks: 0 })).toFailWith(/maxBaselineTasks/);
    expect(make({ maxBaselineTasks: 1e9 })).toFailWith(/maxBaselineTasks/);
    expect(make({ policy: { categories: 'lifecycle' as never } })).toFailWith(/delivery categories/);
    expect(make({ policy: { categories: ['progress'] } })).toFailWith(/delivery categories/);
    expect(make({ policy: { categories: ['attention', 'lifecycle', 'result'] } })).toSucceed();
  });
});

describe('subscription identity', () => {
  test('the same registration replays; a different one under the same id conflicts', async () => {
    const h = await deliveryHarness();
    const first = await subscribed(h, 'sub');
    expect(await subscribeAs(h, 'sub')).toSucceedWith(first);
    expect(await subscribeAs(h, 'sub', { consumer: 'someone-else' })).toFailWithDetail(
      /already registered by a different operation or specification/i,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(await subscribeAs(h, 'sub', { operationId: 'another-op' })).toFailWithDetail(
      /already registered/i,
      expect.objectContaining({ code: 'conflict' })
    );
  });

  test('a malformed request is invalid', async () => {
    const h = await deliveryHarness();
    expect(
      await h.broker.subscribe({ principal: 'alice', scopes: [alpha], authorization: h.policy }, {})
    ).toFailWithDetail(/subscribe/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await h.broker.subscribe({ principal: '', scopes: [alpha], authorization: h.policy }, {})
    ).toFailWithDetail(/bind/i, expect.objectContaining({ code: 'invalid' }));
  });

  test('changing a selection means a new subscription: the old one is untouched', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'narrow', { selection: { responsibility: ada } });
    await subscribed(h, 'wide');
    await track(h.writer, 't', { responsibility: bob });
    expect(await pendingIds(deliveryOf(h, 'narrow'))).toEqual([]);
    expect(await pendingIds(deliveryOf(h, 'wide'))).toEqual([uid('t', 1, 'lifecycle')]);
  });
});

describe('reassignment with two consumers', () => {
  test('checkpoints stay independent across a reassignment and a reopen', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'ada', { selection: { responsibility: ada }, consumer: 'agent-ada' });
    await subscribed(h, 'bob', { selection: { responsibility: bob }, consumer: 'agent-bob' });
    await track(h.writer, 't', { responsibility: ada });
    const adaDelivery = deliveryOf(h, 'ada', { consumer: 'agent-ada' });
    (await adaDelivery.acknowledge((await adaDelivery.prepare()).orThrow().context.receipt)).orThrow();
    (
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        responsibility: bob
      })
    ).orThrow();
    const later = await reopen(h);
    // A was owed the reassignment away from it; B is owed it too, and starts from there.
    expect(await pendingIds(deliveryOf(later, 'ada', { consumer: 'agent-ada' }))).toEqual([
      uid('t', 2, 'assignment')
    ]);
    expect(await pendingIds(deliveryOf(later, 'bob', { consumer: 'agent-bob' }))).toEqual([
      uid('t', 2, 'assignment')
    ]);
    const bobDelivery = deliveryOf(later, 'bob', { consumer: 'agent-bob' });
    (await bobDelivery.acknowledge((await bobDelivery.prepare()).orThrow().context.receipt)).orThrow();
    // B's acknowledgement is B's: A still owes it.
    expect(await pendingIds(deliveryOf(later, 'ada', { consumer: 'agent-ada' }))).toEqual([
      uid('t', 2, 'assignment')
    ]);
    expect((await consumerRecord(later.repository, 'ada')).acknowledged).toEqual([uid('t', 1, 'lifecycle')]);
    expect((await consumerRecord(later.repository, 'bob')).acknowledged).toEqual([uid('t', 2, 'assignment')]);
  });
});

describe('source-replay subscriptions refuse what would weaken them', () => {
  test('registering an observed-state external task into a source-replay selection is refused', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'replay', { policy: { history: 'source-replay' } });
    await expect(registerVendor(h, 'v')).rejects.toThrow(/source-replay/);
    expect(await h.repository.readCommit(tid('v'))).toSucceedWith(undefined);
    // Outside the selection it is fine.
    await registerVendor(h, 'w', { scopes: [beta] });
  });

  test('moving an observed-state external task into a source-replay selection is refused', async () => {
    const h = await deliveryHarness();
    await registerVendor(h, 'v', { scopes: [beta] });
    await subscribed(h, 'replay', { policy: { history: 'source-replay' } });
    const writer = h.broker
      .bind({ principal: 'alice', scopes: [alpha, beta], authorization: h.policy })
      .orThrow();
    expect(
      await writer.changeScopes({
        taskId: tid('v'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'v'),
        add: [alpha]
      })
    ).toFailWithDetail(/source-replay/i, expect.objectContaining({ code: 'unsupported' }));
  });

  test('a source-replay subscription over an observed-state external task is refused at creation', async () => {
    const h = await deliveryHarness();
    await registerVendor(h, 'v');
    expect(await subscribeAs(h, 'replay', { policy: { history: 'source-replay' } })).toFailWithDetail(
      /source-replay/i,
      expect.objectContaining({ code: 'unsupported' })
    );
    expect(await subscribeAs(h, 'observed')).toSucceed();
  });

  test('a replay-admitted external task is covered, and its feed revisions are owed', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    await watch(h.broker, { history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    (await h.broker.reconcile({ sourceId: 'exec' })).orThrow();
    expect(
      (await h.repository.listOwed({ subscription: 'watcher' as SubscriptionId }))
        .orThrow()
        .updates.map((u) => u.id)
    ).toEqual([uid('j1', 2, 'lifecycle')]);
  });
});
