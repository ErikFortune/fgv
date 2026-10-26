/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result, fail, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskDelivery,
  IBoundTaskDeliveryParams,
  ITaskFailure,
  IPreparedTaskDelivery,
  ITaskHostWriteGuard,
  ITaskUpdate,
  SubscriptionId,
  TaskBroker,
  TaskDeliveryPump,
  DeferredObligations,
  UpdateId,
  allTaskActions,
  trustedKindAuthority,
  TaskResult,
  TaskRevision
} from '../../../index';
import { alpha, op, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  reopen,
  subscribed
} from '../../helpers/deliveryFixtures';

const minute: number = 60 * 1000;

function binding(h: IDeliveryHarness, id: string = 's1'): IBoundTaskDeliveryParams {
  return {
    principal: 'alice',
    scopes: [alpha],
    authorization: h.policy,
    subscriptionId: id as SubscriptionId,
    consumerId: `consumer-${id}` as never
  };
}

function pumpOver(
  h: IDeliveryHarness,
  extra?: {
    readonly guard?: ITaskHostWriteGuard;
    readonly maxChars?: number;
  }
): TaskDeliveryPump {
  return TaskDeliveryPump.create({
    broker: h.broker,
    delivery: binding(h),
    ...(extra?.guard !== undefined ? { guard: extra.guard } : {}),
    ...(extra?.maxChars !== undefined ? { budget: { maxChars: extra.maxChars } } : {})
  }).orThrow();
}

async function prepared(pump: TaskDeliveryPump): Promise<IPreparedTaskDelivery> {
  const next = (await pump.next()).orThrow();
  if (next === undefined) {
    throw new Error('expected a prepared delivery');
  }
  return next;
}

async function owed(h: IDeliveryHarness): Promise<ReadonlyArray<ITaskUpdate>> {
  return (await deliveryOf(h, 's1').pending({ limit: 200 })).orThrow().updates;
}

async function command(
  h: IDeliveryHarness,
  id: string,
  revision: number,
  name: string,
  parameters: Record<string, unknown> = {}
): Promise<void> {
  (
    await h.writer.execute({
      taskId: tid(id),
      operationId: op(`${name}-${id}`),
      expectedRevision: revision as TaskRevision,
      command: name,
      parameters: parameters as never
    })
  ).orThrow();
}

async function raiseAttention(h: IDeliveryHarness, id: string, revision: number): Promise<void> {
  (
    await h.writer.updateTracked({
      taskId: tid(id),
      operationId: op(`attend-${id}`),
      expectedRevision: revision as TaskRevision,
      patch: { attention: [{ namespace: 'review', key: `r-${id}` }] }
    })
  ).orThrow();
}

const succeeded = { outcome: { summary: 'done', artifacts: [] } };

/** Presents and acknowledges until nothing is owed. */
async function drain(pump: TaskDeliveryPump): Promise<void> {
  for (let next = (await pump.next()).orThrow(); next !== undefined; next = (await pump.next()).orThrow()) {
    (await pump.acknowledge(next)).orThrow();
  }
}

describe('TaskDeliveryPump.create', () => {
  test('refuses an unknown subscription', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    expect(TaskDeliveryPump.create({ broker: h.broker, delivery: binding(h, 'nope') })).toFailWith(
      /no subscription nope/
    );
    expect(
      TaskDeliveryPump.create({ broker: h.broker, delivery: binding(h), budget: { maxDepth: 1 } })
    ).toSucceed();
    expect(TaskDeliveryPump.create({ broker: h.broker, delivery: binding(h) })).toSucceedAndSatisfy(
      (pump) => {
        expect(pump.delivery.subscriptionId).toBe('s1');
      }
    );
  });
});

describe('TaskDeliveryPump', () => {
  let h: IDeliveryHarness;
  let pump: TaskDeliveryPump;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1');
    pump = pumpOver(h);
  });

  test('nothing owed: next answers undefined and issues nothing', async () => {
    expect(await pump.next()).toSucceedWith(undefined);
    expect(await pump.delivery.issued()).toSucceedWith([]);
  });

  test('next prepares exactly one owed revision, with its categories and receipt', async () => {
    await track(h.writer, 't1');
    await track(h.writer, 't2');
    const p = await prepared(pump);
    expect(p.entry.taskId).toBe('t1');
    expect(p.entry.revision).toBe(1);
    expect(p.entry.terminal).toBe(false);
    expect(p.entry.categories).toEqual(['lifecycle']);
    expect(p.receipt.included).toEqual([{ taskId: 't1', revision: 1, updateIds: p.entry.updateIds }]);
    expect(p.context.entries).toHaveLength(1);
    expect((await pump.delivery.issued()).orThrow().map((r) => r.deliveryId)).toEqual([p.deliveryId]);
  });

  test('never acknowledges on its own: an undecided revision is presented again', async () => {
    await track(h.writer, 't1');
    const first = await prepared(pump);
    const again = await prepared(pump);
    expect(again.entry.updateIds).toEqual(first.entry.updateIds);
    expect(again.deliveryId).not.toBe(first.deliveryId);
    expect((await consumerRecord(h.repository, 's1')).acknowledged).toEqual([]);
    expect((await owed(h)).map((u) => u.id)).toEqual(first.entry.updateIds);
  });

  test('abandon releases the receipt, and what it named is presented again', async () => {
    await track(h.writer, 't1');
    const first = await prepared(pump);
    expect(await pump.abandon(first)).toSucceedWith(first.deliveryId);
    expect(await pump.delivery.issued()).toSucceedWith([]);
    expect((await prepared(pump)).entry.updateIds).toEqual(first.entry.updateIds);
    // Decided once: the same object again is no longer this pump's to decide.
    expect(await pump.abandon(first)).toFailWith(/abandoning a delivery: not a delivery this pump prepared/);
  });

  test('acknowledge discharges, then releases the receipt', async () => {
    await track(h.writer, 't1');
    const p = await prepared(pump);
    expect(await pump.acknowledge(p)).toSucceedAndSatisfy((discharge) => {
      expect(discharge.outcome).toBe('acknowledged');
      expect(discharge.discharged).toEqual(p.entry.updateIds);
      expect(discharge.alreadyDischarged).toEqual([]);
      expect(discharge.superseded).toEqual([]);
      expect(discharge.issues).toEqual([]);
    });
    expect((await consumerRecord(h.repository, 's1')).issued).toEqual([]);
    expect(await owed(h)).toEqual([]);
    expect(await pump.next()).toSucceedWith(undefined);
    // A second acknowledgement of a released receipt is refused, and discharges nothing more.
    expect(await pump.acknowledge(p)).toFailWith(/not a delivery this pump prepared/);
  });

  test('dispose releases the receipt first, then records the reason', async () => {
    await track(h.writer, 't1');
    const p = await prepared(pump);
    expect(await pump.dispose(p, 'its recipient is gone')).toSucceedAndSatisfy((discharge) => {
      expect(discharge.outcome).toBe('disposed');
      expect(discharge.discharged).toEqual(p.entry.updateIds);
    });
    const record = await consumerRecord(h.repository, 's1');
    expect(record.issued).toEqual([]);
    expect(record.disposed).toEqual(
      p.entry.updateIds.map((updateId) => ({ updateId, reason: 'its recipient is gone' }))
    );
  });

  test('superseded revisions are disposed after a terminal discharge only', async () => {
    await track(h.writer, 't1');
    await track(h.writer, 't2');
    await command(h, 't2', 1, 'start');
    await command(h, 't1', 1, 'start');
    // A non-terminal discharge leaves the task's other owed revisions alone.
    const early = await prepared(pump);
    expect(early.entry.revision).toBe(1);
    expect((await pump.acknowledge(early)).orThrow().superseded).toEqual([]);
    expect((await owed(h)).filter((u) => u.taskId === 't1').map((u) => u.revision)).toEqual([2]);
    await command(h, 't1', 2, 'succeed', succeeded);
    // The outcome is presented first, and discharging it ends the revision it supersedes.
    const outcome = await prepared(pump);
    expect(outcome.entry.revision).toBe(3);
    expect(outcome.entry.terminal).toBe(true);
    expect(outcome.entry.categories).toEqual(['lifecycle', 'result']);
    const discharged = (await pump.acknowledge(outcome)).orThrow();
    expect(discharged.superseded).toEqual(['t1:2:0']);
    // Only the discharged task's older revisions: another task's are left owed.
    expect((await owed(h)).map((u) => u.id)).toEqual(['t2:1:0', 't2:2:0']);
    expect((await consumerRecord(h.repository, 's1')).disposed).toEqual([
      { updateId: 't1:2:0', reason: 'superseded by revision 3 of the same task' }
    ]);
  });

  test('a terminal discharge with nothing older owed disposes nothing', async () => {
    await track(h.writer, 't1');
    await drain(pump);
    await command(h, 't1', 1, 'succeed', succeeded);
    const outcome = await prepared(pump);
    expect((await pump.acknowledge(outcome)).orThrow()).toEqual(
      expect.objectContaining({ superseded: [], issues: [] })
    );
  });

  test('a terminal disposal also clears the older revisions', async () => {
    await track(h.writer, 't1');
    await command(h, 't1', 1, 'succeed', succeeded);
    const outcome = await prepared(pump);
    expect(outcome.entry.revision).toBe(2);
    expect((await pump.dispose(outcome, 'nobody to tell')).orThrow().superseded).toEqual(['t1:1:0']);
    expect(await owed(h)).toEqual([]);
  });

  test('an older revision is presented on its own after a newer one is acknowledged', async () => {
    await track(h.writer, 't1');
    await raiseAttention(h, 't1', 1);
    // Attention is presented first; the revision it followed is still owed, and is presented next
    // from its own snapshot — the current state, owed nothing, never takes its place.
    const attention = await prepared(pump);
    expect(attention.entry.revision).toBe(2);
    (await pump.acknowledge(attention)).orThrow();
    const older = await prepared(pump);
    expect([older.entry.taskId, older.entry.revision]).toEqual(['t1', 1]);
    expect(older.entry.envelope.attention).toEqual([]);
    (await pump.acknowledge(older)).orThrow();
    expect(await pump.next()).toSucceedWith(undefined);
    expect(await pump.delivery.issued()).toSucceedWith([]);
  });

  test('a task owed nothing never blocks another: acknowledged attention', async () => {
    await track(h.writer, 'a1');
    await raiseAttention(h, 'a1', 1);
    await drain(pump);
    await track(h.writer, 'b1');
    expect((await prepared(pump)).entry.taskId).toBe('b1');
  });

  test('a task owed nothing never blocks another: an acknowledged, unarchived outcome', async () => {
    await track(h.writer, 'a1');
    await command(h, 'a1', 1, 'succeed', succeeded);
    await drain(pump);
    await track(h.writer, 'b1');
    expect((await prepared(pump)).entry.taskId).toBe('b1');
  });

  test('a task owed nothing never blocks another: a waiting obligation', async () => {
    const obligations = DeferredObligations.create({
      broker: h.broker,
      principal: 'host',
      authorization: trustedKindAuthority({ scopes: [alpha], actions: allTaskActions, epoch: 'e' }).orThrow(),
      scope: alpha,
      idPrefix: 'wake',
      roles: ['address']
    }).orThrow();
    (
      await obligations.defer({
        key: { changeRef: 'c1', role: 'address' },
        title: 'deliver c1',
        notBefore: h.clock.now + minute,
        attention: [{ namespace: 'room', key: 'r1' }]
      })
    ).orThrow();
    await drain(pump);
    await track(h.writer, 'b1');
    expect((await prepared(pump)).entry.taskId).toBe('b1');
  });

  test('an update withheld from the principal neither blocks nor is presented', async () => {
    await track(h.writer, 'a1');
    await track(h.writer, 'b1');
    h.policy.hide('a1');
    expect((await prepared(pump)).entry.taskId).toBe('b1');
    const only = pumpOver(h);
    h.policy.hide('b1');
    expect(await only.next()).toSucceedWith(undefined);
  });

  test('a revision too large for the budget fails loudly, holding no receipt', async () => {
    const tiny = pumpOver(h, { maxChars: 1500 });
    (
      await h.writer.createTracked({
        taskId: tid('t1'),
        operationId: op('create-long'),
        title: 'long',
        description: 'x'.repeat(4000)
      })
    ).orThrow();
    expect(await tiny.next()).toFailWith(
      /t1@1, which renders abbreviated; it cannot be delivered within this budget/
    );
    expect(await tiny.delivery.issued()).toSucceedWith([]);
    expect(await owed(h)).toHaveLength(1);
    // A budget that fits delivers it.
    expect((await prepared(pump)).entry.taskId).toBe('t1');
  });

  test('a render that omits the owed revision is released and refused; one with nothing visible is empty', async () => {
    await track(h.writer, 't1');
    const delivery = deliveryOf(h, 's1');
    const rendering = (visibleItems: number): TaskDeliveryPump =>
      TaskDeliveryPump.create({
        broker: brokerBinding(h, {
          ...delivery,
          pending: delivery.pending.bind(delivery),
          abandon: delivery.abandon.bind(delivery),
          issued: delivery.issued.bind(delivery),
          acknowledge: delivery.acknowledge.bind(delivery),
          prepare: async (budget, options) =>
            (await delivery.prepare(budget, options)).onSuccess((p) =>
              ok({
                ...p,
                context: { ...p.context, entries: [], omissions: { ...p.context.omissions, visibleItems } }
              })
            )
        }),
        delivery: binding(h)
      }).orThrow();
    expect(await rendering(1).next()).toFailWith(/does not fit the render budget/);
    expect(await delivery.issued()).toSucceedWith([]);
    expect(await rendering(0).next()).toSucceedWith(undefined);
    expect(await delivery.issued()).toSucceedWith([]);
  });

  test("decisions read the pump's own record, never the object handed back", async () => {
    await track(h.writer, 't1');
    await track(h.writer, 't2');
    const p = await prepared(pump);
    expect(Object.isFrozen(p) && Object.isFrozen(p.entry)).toBe(true);
    const forged: IPreparedTaskDelivery = {
      ...p,
      entry: { ...p.entry, terminal: true, updateIds: ['t2:1:0' as UpdateId] }
    };
    expect(await pump.dispose(forged, 'x')).toFailWith(/not a delivery this pump prepared/);
    expect(await pump.acknowledge({ ...p })).toFailWith(/not a delivery this pump prepared/);
    expect(await pumpOver(h).acknowledge(p)).toFailWith(/not a delivery this pump prepared/);
    expect((await owed(h)).map((u) => u.id)).toEqual(['t1:1:0', 't2:1:0']);
    expect(await pump.acknowledge(p)).toSucceedAndSatisfy((discharge) => {
      expect(discharge.prepared).toBe(p);
      expect(discharge.discharged).toEqual(['t1:1:0']);
    });
    expect((await owed(h)).map((u) => u.id)).toEqual(['t2:1:0']);
  });

  test('every write goes through the guard; a refusing guard prepares nothing', async () => {
    await track(h.writer, 't1');
    const calls: string[] = [];
    let refuse: boolean = false;
    const guarded = pumpOver(h, {
      guard: {
        guard: async <T>(write: () => Promise<Result<T>>): Promise<Result<T>> => {
          calls.push('guard');
          return refuse ? fail<T>('paused for a snapshot') : write();
        }
      }
    });
    const a = await prepared(guarded);
    await guarded.abandon(a);
    const b = await prepared(guarded);
    await guarded.acknowledge(b);
    await track(h.writer, 't2');
    const c = await prepared(guarded);
    await guarded.dispose(c, 'x');
    expect(calls).toHaveLength(6);
    refuse = true;
    await track(h.writer, 't3');
    expect(await guarded.next()).toFailWith(/paused for a snapshot/);
    expect(await guarded.delivery.issued()).toSucceedWith([]);
  });
});

describe('TaskDeliveryPump windows', () => {
  let h: IDeliveryHarness;
  let pump: TaskDeliveryPump;

  beforeEach(async () => {
    h = await deliveryHarness({ defaults: { receiptLifetimeMs: 15 * minute } });
    await subscribed(h, 's1');
    pump = pumpOver(h);
  });

  test('a revision arriving after prepare stays owed: acknowledging discharges only what was prepared', async () => {
    await track(h.writer, 't1');
    const p = await prepared(pump);
    await command(h, 't1', 1, 'start');
    (await pump.acknowledge(p)).orThrow();
    expect((await owed(h)).map((u) => u.revision)).toEqual([2]);
    expect((await prepared(pump)).entry.revision).toBe(2);
  });

  test('a revision arriving during prepare is never lost', async () => {
    const policy = h.policy;
    await track(h.writer, 't1');
    let moved: boolean = false;
    policy.afterDecision = async (request) => {
      if (!moved && request.action === 'read') {
        moved = true;
        await command(h, 't1', 1, 'start');
      }
    };
    const p = await prepared(pump);
    policy.afterDecision = undefined;
    expect(moved).toBe(true);
    (await pump.acknowledge(p)).orThrow();
    const left = (await owed(h)).map((u) => u.id);
    const all = [...p.entry.updateIds, ...left].sort();
    expect(all).toEqual(['t1:1:0', 't1:2:0']);
  });

  test('acknowledge and dispose racing on one prepared revision record each id exactly once', async () => {
    await track(h.writer, 't1');
    const p = await prepared(pump);
    const [acknowledged, disposed] = await Promise.all([pump.acknowledge(p), pump.dispose(p, 'raced')]);
    expect(acknowledged.isSuccess() || disposed.isSuccess()).toBe(true);
    const record = await consumerRecord(h.repository, 's1');
    const history = [...record.acknowledged, ...record.disposed.map((d) => d.updateId)];
    expect(history).toEqual(p.entry.updateIds);
    expect(await owed(h)).toEqual([]);
  });

  test('a terminal task takes no newer revision while it is owed; once discharged it archives', async () => {
    await track(h.writer, 't1');
    await command(h, 't1', 1, 'succeed', succeeded);
    const outcome = await prepared(pump);
    // Terminal is absorbing, and archiving is refused while anything is owed: no revision can
    // arrive between the terminal render and its discharge for the disposal to sweep up.
    expect(
      await h.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive-early'),
        expectedRevision: 2 as TaskRevision
      })
    ).toFailWith(/still owed/);
    const discharged = (await pump.acknowledge(outcome)).orThrow();
    expect(discharged.superseded).toEqual(['t1:1:0']);
    expect(
      await h.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive-t1'),
        expectedRevision: 2 as TaskRevision
      })
    ).toSucceed();
    expect((await owed(h)).every((u) => u.revision > 2)).toBe(true);
  });

  test('superseded disposal pinned by another receipt is an issue; the acknowledgement stands', async () => {
    await track(h.writer, 't1');
    await command(h, 't1', 1, 'succeed', succeeded);
    const outcome = await prepared(pump);
    // Another reader holds a receipt over every revision of the task.
    const wide = (await deliveryOf(h, 's1').prepare({ maxItems: 5, maxDepth: 3, maxChars: 8000 })).orThrow();
    expect(wide.context.receipt.included.map((e) => e.revision)).toEqual([1, 2]);
    const discharged = (await pump.acknowledge(outcome)).orThrow();
    expect(discharged.discharged).toEqual(outcome.entry.updateIds);
    expect(discharged.superseded).toEqual([]);
    expect(discharged.issues).toEqual([expect.stringMatching(/clearing superseded revisions of t1/)]);
    expect((await owed(h)).map((u) => u.id)).toEqual(['t1:1:0']);
  });

  test('a receipt a crash left behind: acknowledge works, dispose is refused until it expires', async () => {
    await track(h.writer, 't1');
    // The process that prepared this stopped before deciding it.
    await prepared(pump);
    const r = await reopen(h);
    const restarted = TaskDeliveryPump.create({ broker: r.broker, delivery: binding(r) }).orThrow();
    const again = await prepared(restarted);
    expect(await restarted.dispose(again, 'undeliverable')).toFailWith(/disposing of t1@1/);
    // The failed disposal already gave up its own receipt, so that object is spent.
    expect(await restarted.acknowledge(again)).toFailWith(/not a delivery this pump prepared/);
    // Nothing was lost: it is presented again.
    const third = await prepared(restarted);
    expect(third.entry.updateIds).toEqual(again.entry.updateIds);
    r.clock.advance(16 * minute);
    const fresh = await prepared(restarted);
    expect(await restarted.dispose(fresh, 'undeliverable')).toSucceed();
    expect(await owed(r)).toEqual([]);
  });

  test("the start-up recipe — issued() then abandon — ends a crash-left receipt's reach", async () => {
    await track(h.writer, 't1');
    await command(h, 't1', 1, 'succeed', succeeded);
    // The crashed process held a receipt over both revisions.
    (await deliveryOf(h, 's1').prepare({ maxItems: 5, maxDepth: 3, maxChars: 8000 })).orThrow();
    const r = await reopen(h);
    const restarted = TaskDeliveryPump.create({ broker: r.broker, delivery: binding(r) }).orThrow();
    for (const stale of (await restarted.delivery.issued()).orThrow()) {
      (await restarted.delivery.abandon(stale.deliveryId)).orThrow();
    }
    const outcome = await prepared(restarted);
    expect((await restarted.acknowledge(outcome)).orThrow()).toEqual(
      expect.objectContaining({ superseded: ['t1:1:0'], issues: [] })
    );
    expect(
      await r.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive'),
        expectedRevision: 2 as TaskRevision
      })
    ).toSucceed();
  });

  test('without the recipe the stale receipt blocks the superseded disposal and the archive', async () => {
    await track(h.writer, 't1');
    await command(h, 't1', 1, 'succeed', succeeded);
    (await deliveryOf(h, 's1').prepare({ maxItems: 5, maxDepth: 3, maxChars: 8000 })).orThrow();
    const r = await reopen(h);
    const restarted = TaskDeliveryPump.create({ broker: r.broker, delivery: binding(r) }).orThrow();
    const discharged = (await restarted.acknowledge(await prepared(restarted))).orThrow();
    expect(discharged.issues).toEqual([expect.stringMatching(/named by an issued receipt/)]);
    expect(
      await r.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive'),
        expectedRevision: 2 as TaskRevision
      })
    ).toFailWith(/still owed/);
    // The older revision is presented on its own and can be acknowledged — but the stale receipt
    // still names it, and pins the task's archive even past its expiry, until it is abandoned.
    (await restarted.acknowledge(await prepared(restarted))).orThrow();
    r.clock.advance(16 * minute);
    expect(
      await r.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive-2'),
        expectedRevision: 2 as TaskRevision
      })
    ).toFailWith(/named by an issued receipt/);
    for (const stale of (await restarted.delivery.issued()).orThrow()) {
      (await restarted.delivery.abandon(stale.deliveryId)).orThrow();
    }
    expect(
      await r.writer.archive({
        taskId: tid('t1'),
        operationId: op('archive-3'),
        expectedRevision: 2 as TaskRevision
      })
    ).toSucceed();
  });

  test('after a crash, acknowledging the re-presented revision is not refused', async () => {
    await track(h.writer, 't1');
    await prepared(pump);
    const r = await reopen(h);
    const restarted = TaskDeliveryPump.create({ broker: r.broker, delivery: binding(r) }).orThrow();
    expect(await restarted.acknowledge(await prepared(restarted))).toSucceed();
    expect(await owed(r)).toEqual([]);
  });

  test('a failed release after an acknowledgement is an issue, not a failure', async () => {
    await track(h.writer, 't1');
    await track(h.writer, 't2');
    const delivery = deliveryOf(h, 's1');
    const leaky = TaskDeliveryPump.create({
      broker: brokerBinding(h, {
        ...delivery,
        pending: delivery.pending.bind(delivery),
        prepare: delivery.prepare.bind(delivery),
        issued: delivery.issued.bind(delivery),
        acknowledge: delivery.acknowledge.bind(delivery),
        abandon: async () => failWithDetail('store offline', { code: 'storage-unavailable', retry: 'safe' })
      }),
      delivery: binding(h)
    }).orThrow();
    const p = await prepared(leaky);
    expect(await leaky.acknowledge(p)).toSucceedAndSatisfy((discharge) => {
      expect(discharge.issues).toEqual([expect.stringMatching(/releasing receipt .*store offline/)]);
    });
    const q = await prepared(leaky);
    expect(await leaky.dispose(q, 'x')).toFailWith(/disposing of t2@1: releasing receipt .*store offline/);
    expect(await leaky.abandon(q)).toFailWith(/abandoning t2@1: releasing receipt .*store offline/);
  });

  test('an owed listing that fails fails the pass', async () => {
    await track(h.writer, 't1');
    const delivery = deliveryOf(h, 's1');
    const blind = TaskDeliveryPump.create({
      broker: brokerBinding(h, {
        ...delivery,
        prepare: delivery.prepare.bind(delivery),
        issued: delivery.issued.bind(delivery),
        acknowledge: delivery.acknowledge.bind(delivery),
        abandon: delivery.abandon.bind(delivery),
        pending: async () => failWithDetail('index offline', { code: 'storage-unavailable', retry: 'safe' })
      }),
      delivery: binding(h)
    }).orThrow();
    expect(await blind.next()).toFailWith(/reading what is owed: index offline/);
  });

  test('a listing that fails after the first page fails the pass, holding nothing', async () => {
    await track(h.writer, 't1');
    const delivery = deliveryOf(h, 's1');
    const flaky = TaskDeliveryPump.create({
      broker: brokerBinding(h, {
        ...delivery,
        prepare: delivery.prepare.bind(delivery),
        issued: delivery.issued.bind(delivery),
        acknowledge: delivery.acknowledge.bind(delivery),
        abandon: delivery.abandon.bind(delivery),
        pending: async (request) =>
          request?.limit === 1
            ? delivery.pending(request)
            : failWithDetail('index offline', { code: 'storage-unavailable', retry: 'safe' })
      }),
      delivery: binding(h)
    }).orThrow();
    expect(await flaky.next()).toFailWith(/reading what is owed: index offline/);
    expect(await delivery.issued()).toSucceedWith([]);
  });

  test('owed updates are read across pages', async () => {
    for (let i = 0; i < 205; i++) {
      await track(h.writer, `t${String(i).padStart(3, '0')}`);
    }
    const p = await prepared(pump);
    expect(p.entry.taskId).toBe('t000');
    expect(p.entry.categories).toEqual(['lifecycle']);
    (await pump.abandon(p)).orThrow();
    // An outcome on the last page: its superseded revision is found by reading every page.
    await command(h, 't204', 1, 'succeed', succeeded);
    const outcome = await prepared(pump);
    expect(outcome.entry.taskId).toBe('t204');
    expect((await pump.acknowledge(outcome)).orThrow().superseded).toEqual(['t204:1:0']);
  });
});

/** A successful task result. */
function ok<T>(value: T): TaskResult<T> {
  return succeedWithDetail<T, ITaskFailure>(value);
}

/** A broker whose `bindDelivery` answers `delivery` for every binding. */
function brokerBinding(h: IDeliveryHarness, delivery: IBoundTaskDelivery): TaskBroker {
  const broker: TaskBroker = Object.create(h.broker);
  broker.bindDelivery = () => ok(delivery);
  return broker;
}
