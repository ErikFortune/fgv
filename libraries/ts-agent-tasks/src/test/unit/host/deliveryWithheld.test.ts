/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskDelivery,
  IBoundTaskDeliveryParams,
  IPreparedTaskDelivery,
  ITaskFailure,
  SubscriptionId,
  TaskBroker,
  TaskDeliveryPump,
  TaskResult,
  TaskRevision,
  UpdateId
} from '../../../index';
import { TestPolicy, alpha, beta, bob, op, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  subscribed
} from '../../helpers/deliveryFixtures';

function binding(h: IDeliveryHarness): IBoundTaskDeliveryParams {
  return {
    principal: 'alice',
    scopes: [alpha],
    authorization: h.policy,
    subscriptionId: 's1' as SubscriptionId,
    consumerId: 'consumer-s1' as never
  };
}

function pumpOver(h: IDeliveryHarness, broker?: TaskBroker, maxChars?: number): TaskDeliveryPump {
  return TaskDeliveryPump.create({
    broker: broker ?? h.broker,
    delivery: binding(h),
    ...(maxChars !== undefined ? { budget: { maxChars } } : {})
  }).orThrow();
}

async function prepared(pump: TaskDeliveryPump): Promise<IPreparedTaskDelivery> {
  const next = (await pump.next()).orThrow();
  if (next === undefined) {
    throw new Error('expected a prepared delivery');
  }
  return next;
}

/** Moves a task out of the binding's scope. */
async function moveOut(h: IDeliveryHarness, id: string, revision: number): Promise<void> {
  const both = h.broker
    .bind({ principal: 'alice', scopes: [alpha, beta], authorization: h.policy })
    .orThrow();
  (
    await both.changeScopes({
      taskId: tid(id),
      operationId: op(`move-${id}`),
      expectedRevision: revision as TaskRevision,
      add: [beta],
      remove: [alpha]
    })
  ).orThrow();
}

/** Sets or clears the policy's after-decision hook. */
function hook(policy: TestPolicy, fn: TestPolicy['afterDecision']): void {
  policy.afterDecision = fn;
}

function ok<T>(value: T): TaskResult<T> {
  return succeedWithDetail<T, ITaskFailure>(value);
}

/** A broker whose `bindDelivery` answers `delivery` for every binding. */
function brokerBinding(h: IDeliveryHarness, delivery: IBoundTaskDelivery): TaskBroker {
  const broker: TaskBroker = Object.create(h.broker);
  broker.bindDelivery = () => ok(delivery);
  return broker;
}

describe('an owed update the principal may no longer acknowledge is withheld, never presented', () => {
  let h: IDeliveryHarness;
  let pump: TaskDeliveryPump;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1');
    pump = pumpOver(h);
    await track(h.writer, 'a1', { title: 'secret-a1-title' });
    await track(h.writer, 'b1');
  });

  test("a task moved out of the binding's scopes: the pump delivers the next task", async () => {
    await moveOut(h, 'a1', 1);
    const next = await prepared(pump);
    expect(next.entry.taskId).toBe('b1');
    (await pump.acknowledge(next)).orThrow();
    expect(await pump.next()).toSucceedWith(undefined);
  });

  test('a policy that now denies acknowledging a task: the pump delivers the next task', async () => {
    h.policy.denyOn('acknowledge', 'a1');
    expect((await prepared(pump)).entry.taskId).toBe('b1');
  });

  test('a reassignment the policy does not let this principal acknowledge: the pump delivers the next task', async () => {
    h.policy.deny.push((r) => r.action === 'acknowledge' && r.task?.envelope.responsibility?.key === 'bob');
    (
      await h.writer.reassign({
        taskId: tid('a1'),
        operationId: op('reassign-a1'),
        expectedRevision: 1 as TaskRevision,
        responsibility: bob
      })
    ).orThrow();
    expect((await prepared(pump)).entry.taskId).toBe('b1');
  });

  test("the withheld update's content is never disclosed — by pending, by prepare, or by disposal", async () => {
    await moveOut(h, 'a1', 1);
    const delivery = deliveryOf(h, 's1');
    const page = (await delivery.pending({ limit: 200 })).orThrow();
    expect(page.updates.map((u) => u.taskId)).toEqual(['b1']);
    expect(page.withheld).toBeGreaterThan(0);
    // Both modes: the frozen snapshot of a1 named alpha, but a1 is not this principal's now.
    for (const currentState of ['include', 'owed-only'] as const) {
      const context = (await delivery.prepare(undefined, { currentState })).orThrow();
      expect(context.context.text).not.toContain('secret-a1-title');
      expect(context.context.receipt.included.map((e) => e.taskId)).toEqual(['b1']);
      (await delivery.abandon(context.deliveryId)).orThrow();
    }
    const disposed = (await pump.disposeWithheld('moved out of scope')).orThrow();
    expect(JSON.stringify(disposed)).not.toContain('secret-a1-title');
    expect(Object.keys(disposed).sort()).toEqual(['disposed', 'more', 'pinned', 'subscriptionId']);
    expect(disposed.disposed.every((id) => id.startsWith('a1:'))).toBe(true);
  });

  test('disposeWithheld ends exactly what is withheld, through a bounded call that reports it', async () => {
    await moveOut(h, 'a1', 1);
    const owedA1: ReadonlyArray<UpdateId> = (await consumerRecord(h.repository, 's1')).acknowledged;
    expect(owedA1).toEqual([]);
    const disposed = (await pump.disposeWithheld('moved out of scope')).orThrow();
    expect(disposed.disposed.length).toBeGreaterThan(0);
    expect(disposed.pinned).toEqual([]);
    expect(disposed.more).toBe(false);
    expect((await consumerRecord(h.repository, 's1')).disposed.map((d) => d.reason)).toEqual(
      disposed.disposed.map(() => 'moved out of scope')
    );
    // b1 is visible, so it is not withheld and stays owed.
    expect((await prepared(pump)).entry.taskId).toBe('b1');
    // Nothing left to end.
    expect(await pump.disposeWithheld('again')).toSucceedWith({
      subscriptionId: 's1' as SubscriptionId,
      disposed: [],
      pinned: [],
      more: false
    });
  });

  test("a limit bounds the call and reports more; a receipt's pin is reported, not ended", async () => {
    // A receipt over a1, issued while it was visible, pins it.
    const pin = (await deliveryOf(h, 's1').prepare()).orThrow();
    await moveOut(h, 'a1', 1);
    h.policy.denyOn('acknowledge', 'b1');
    const first = (await pump.disposeWithheld('gone', 1)).orThrow();
    expect(first.more).toBe(true);
    expect([...first.disposed, ...first.pinned]).toHaveLength(1);
    const rest = (await pump.disposeWithheld('gone')).orThrow();
    expect(rest.pinned).toEqual(expect.arrayContaining(['a1:1:0']));
    (await deliveryOf(h, 's1').abandon(pin.deliveryId)).orThrow();
    expect((await pump.disposeWithheld('gone')).orThrow().disposed).toEqual(
      expect.arrayContaining(['a1:1:0'])
    );
    expect(await pump.next()).toSucceedWith(undefined);
  });

  test('disposeWithheld refuses a malformed request', async () => {
    expect(await deliveryOf(h, 's1').disposeWithheld({ reason: 'x', limit: 0 })).toFailWith(
      /disposeWithheld:/
    );
    expect(await pump.disposeWithheld('', 5)).toFailWith(/disposing of withheld obligations/);
  });

  test('an id decided withheld that became visible before the write is not ended', async () => {
    const policy = h.policy;
    await moveOut(h, 'a1', 1);
    let moved: boolean = false;
    hook(policy, async (request) => {
      // Once the capture has decided a1 withheld (and moves on to b1), move a1 back before the writer.
      if (!moved && request.action === 'read' && request.task?.envelope.id === 'b1') {
        moved = true;
        const both = h.broker
          .bind({ principal: 'alice', scopes: [alpha, beta], authorization: policy })
          .orThrow();
        (
          await both.changeScopes({
            taskId: tid('a1'),
            operationId: op('move-back'),
            expectedRevision: 2 as TaskRevision,
            add: [alpha],
            remove: [beta]
          })
        ).orThrow();
      }
    });
    const disposed = (await pump.disposeWithheld('moved')).orThrow();
    hook(policy, undefined);
    expect(moved).toBe(true);
    expect(disposed.disposed).toEqual([]);
    expect((await prepared(pump)).entry.taskId).toBe('a1');
  });

  test('a policy that keeps moving makes disposeWithheld and pending report a conflict', async () => {
    const policy = h.policy;
    await moveOut(h, 'a1', 1);
    let n: number = 0;
    hook(policy, () => {
      policy.epoch = `epoch-${++n}`;
    });
    expect(await deliveryOf(h, 's1').disposeWithheld({ reason: 'x' })).toFailWith(/kept changing/);
    expect(await deliveryOf(h, 's1').pending({ limit: 200 })).toFailWith(
      /changed after the operation was authorized/
    );
    hook(policy, undefined);
  });

  test('pending reports a conflict when a task it decided moves before it answers', async () => {
    const policy = h.policy;
    let moved: boolean = false;
    hook(policy, async (request) => {
      if (!moved && request.action === 'acknowledge' && request.task?.envelope.id === 'a1') {
        moved = true;
        await moveOut(h, 'a1', 1);
      }
    });
    expect(await deliveryOf(h, 's1').pending({ limit: 200 })).toFailWith(
      /changed after the operation was authorized/
    );
    hook(policy, undefined);
  });

  test('prepare captures again when a task it disclosed moves before it issues', async () => {
    const policy = h.policy;
    let moved: boolean = false;
    hook(policy, async (request) => {
      if (!moved && request.action === 'acknowledge' && request.task?.envelope.id === 'a1') {
        moved = true;
        await moveOut(h, 'a1', 1);
      }
    });
    const context = (await deliveryOf(h, 's1').prepare(undefined, { currentState: 'owed-only' })).orThrow();
    hook(policy, undefined);
    expect(moved).toBe(true);
    expect(context.context.receipt.included.map((e) => e.taskId)).toEqual(['b1']);
  });

  test('disposeWithheld reads every page of what is owed', async () => {
    for (let i = 0; i < 205; i++) {
      await track(h.writer, `t${String(i).padStart(3, '0')}`);
    }
    h.policy.denyOn('acknowledge', 't204');
    expect((await pump.disposeWithheld('gone')).orThrow().disposed).toEqual(['t204:1:0']);
  });

  test('an unclassified probe failure is not retried', async () => {
    const delivery = deliveryOf(h, 's1');
    let reads: number = 0;
    const blind = TaskDeliveryPump.create({
      broker: brokerBinding(h, {
        ...delivery,
        pending: async () => {
          reads++;
          return fail('no detail') as unknown as TaskResult<never>;
        }
      }),
      delivery: binding(h)
    }).orThrow();
    expect(await blind.next()).toFailWith(/reading what is owed: no detail/);
    expect(reads).toBe(1);
  });

  test('a listing or record read that fails fails disposeWithheld', async () => {
    const delivery = deliveryOf(h, 's1');
    const failing = TaskDeliveryPump.create({
      broker: brokerBinding(h, {
        ...delivery,
        disposeWithheld: async () =>
          failWithDetail('index offline', { code: 'storage-unavailable', retry: 'safe' })
      }),
      delivery: binding(h)
    }).orThrow();
    expect(await failing.disposeWithheld('x')).toFailWith(/withheld obligations: index offline/);
  });
});

describe('a refused acknowledgement gives up its receipt', () => {
  test('the receipt is released and the object spent; the revision is withheld from then on', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    const pump = pumpOver(h);
    await track(h.writer, 't1');
    const p = await prepared(pump);
    h.policy.denyOn('acknowledge', 't1');
    expect(await pump.acknowledge(p)).toFailWith(/its receipt was released/);
    expect(await pump.delivery.issued()).toSucceedWith([]);
    expect(await pump.dispose(p, 'x')).toFailWith(/not a delivery this pump prepared/);
    expect(await pump.next()).toSucceedWith(undefined);
  });

  test('a release that also fails is reported with the refusal', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    await track(h.writer, 't1');
    const delivery = deliveryOf(h, 's1');
    const leaky = pumpOver(
      h,
      brokerBinding(h, {
        ...delivery,
        pending: delivery.pending.bind(delivery),
        prepare: delivery.prepare.bind(delivery),
        issued: delivery.issued.bind(delivery),
        acknowledge: delivery.acknowledge.bind(delivery),
        abandon: async () => failWithDetail('store offline', { code: 'storage-unavailable', retry: 'safe' })
      })
    );
    const p = await prepared(leaky);
    h.policy.denyOn('acknowledge', 't1');
    expect(await leaky.acknowledge(p)).toFailWith(/; and releasing receipt .*store offline/);
  });
});

describe('the budget failure names what is owed', () => {
  test('a release or an owed read that fails is reported in its place', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    (
      await h.writer.createTracked({
        taskId: tid('t1'),
        operationId: op('create-long'),
        title: 'long',
        description: 'x'.repeat(4000)
      })
    ).orThrow();
    const delivery = deliveryOf(h, 's1');
    const wrapped = (overrides: Partial<IBoundTaskDelivery>): TaskDeliveryPump =>
      pumpOver(
        h,
        brokerBinding(h, {
          ...delivery,
          pending: delivery.pending.bind(delivery),
          prepare: delivery.prepare.bind(delivery),
          issued: delivery.issued.bind(delivery),
          acknowledge: delivery.acknowledge.bind(delivery),
          abandon: delivery.abandon.bind(delivery),
          ...overrides
        }),
        1500
      );
    const unread = wrapped({
      pending: async (request) =>
        request?.limit === 1
          ? delivery.pending(request)
          : failWithDetail('index offline', { code: 'storage-unavailable', retry: 'safe' })
    });
    expect(await unread.next()).toFailWith(/Owed: \(owed ids unreadable: index offline\)/);
    const stuck = wrapped({
      abandon: async () => failWithDetail('store offline', { code: 'storage-unavailable', retry: 'safe' })
    });
    expect(await stuck.next()).toFailWith(/releasing receipt .*store offline/);
  });
});

describe('the record a decision reads cannot be edited through what was handed out', () => {
  test('the handed object is frozen all the way down, and dispose ends only what was prepared', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    const pump = pumpOver(h);
    await track(h.writer, 'a1');
    await track(h.writer, 'b1');
    await track(h.writer, 'c1');
    const p = await prepared(pump);
    expect(Object.isFrozen(p.entry.updateIds) && Object.isFrozen(p.receipt.included)).toBe(true);
    expect(() => (p.entry.updateIds as UpdateId[]).push('b1:1:0' as UpdateId)).toThrow();
    expect(() => (p.receipt.included[0].updateIds as UpdateId[]).push('c1:1:0' as UpdateId)).toThrow();
    expect((await pump.dispose(p, 'skip')).orThrow().discharged).toEqual(['a1:1:0']);
    expect((await deliveryOf(h, 's1').pending({ limit: 50 })).orThrow().updates.map((u) => u.id)).toEqual([
      'b1:1:0',
      'c1:1:0'
    ]);
  });
});
