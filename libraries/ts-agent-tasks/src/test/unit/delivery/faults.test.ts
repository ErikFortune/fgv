/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  DeliveryId,
  IBoundTaskDelivery,
  ITaskFailure,
  ITaskRepository,
  ITaskRepositoryWriter,
  SubscriptionId,
  TaskBroker,
  TaskConverters,
  TaskEnvironment,
  TaskId,
  TaskResult,
  defaultTaskCapacityProfile
} from '../../../index';
import { alpha, op, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  subscribed
} from '../../helpers/deliveryFixtures';

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

function bindAll(w: ITaskRepositoryWriter): ITaskRepositoryWriter {
  return {
    readCommit: (id) => w.readCommit(id),
    register: (r) => w.register(r),
    commit: (r) => w.commit(r),
    readSource: (id) => w.readSource(id),
    commitSource: (r) => w.commitSource(r),
    extendReplayEnvelope: (id, add) => w.extendReplayEnvelope(id, add),
    raiseCapacityLimits: (p) => w.raiseCapacityLimits(p),
    registerSubscription: (r) => w.registerSubscription(r),
    readSubscription: (id) => w.readSubscription(id),
    issueReceipt: (r) => w.issueReceipt(r),
    acknowledgeReceipt: (r) => w.acknowledgeReceipt(r),
    abandonReceipt: (r) => w.abandonReceipt(r)
  };
}

/**
 * A delivery harness over a repository that misbehaves: `patch` replaces repository methods, and
 * `writerPatch` replaces methods of the writer a gated section receives. Everything else delegates.
 */
function faultyDelivery(
  h: IDeliveryHarness,
  patch: (r: ITaskRepository) => Partial<ITaskRepository>,
  writerPatch?: (w: ITaskRepositoryWriter) => Partial<ITaskRepositoryWriter>
): IDeliveryHarness {
  const real: ITaskRepository = h.repository;
  const repository: ITaskRepository = Object.assign(Object.create(real), {
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<TaskResult<T>>) =>
      real.withWriter((w) => action(writerPatch !== undefined ? { ...bindAll(w), ...writerPatch(w) } : w)),
    ...patch(real)
  });
  const broker: TaskBroker = TaskBroker.create({
    repository,
    environment: h.env,
    ...(h.defaults !== undefined ? { delivery: h.defaults } : {})
  }).orThrow();
  const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: h.policy }).orThrow();
  return { ...h, repository, broker, writer };
}

describe('subscribe: reads outside and inside the gated section', () => {
  test('a selection capture failure (start: current) is reported', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    const faulty = faultyDelivery(h, () => ({ query: async () => storageDown() }));
    expect(
      await faulty.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: faulty.policy },
        {
          subscriptionId: 'sub',
          operationId: 'subscribe-sub',
          consumerId: 'consumer-sub',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'current'
        }
      )
    ).toFailWith(/storage down/);
  });

  test('a policy epoch that cannot be read stops the subscription', async () => {
    const h = await deliveryHarness();
    const broken = {
      check: async (): Promise<ReturnType<typeof succeed<boolean>>> => succeed(true),
      policyEpoch: (): string => {
        throw new Error('epoch gone');
      }
    };
    expect(
      await h.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: broken },
        {
          subscriptionId: 'sub',
          operationId: 'subscribe-sub',
          consumerId: 'consumer-sub',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'from-now'
        }
      )
    ).toFailWith(/policy epoch unavailable/);
  });

  test('a host clock that fails stops the subscription before anything is written', async () => {
    const h = await deliveryHarness();
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('id')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    expect(
      await broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        {
          subscriptionId: 'sub',
          operationId: 'subscribe-sub',
          consumerId: 'consumer-sub',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'from-now'
        }
      )
    ).toFailWith(/clock/);
    expect(h.repository.subscription('sub' as SubscriptionId)).toSucceedWith(undefined);
  });

  test('a recapture failure inside the gated section (start: current) is reported and nothing commits', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    let calls: number = 0;
    const faulty = faultyDelivery(h, (real) => ({
      query: async (request) => {
        calls++;
        return calls === 1 ? real.query(request) : storageDown();
      }
    }));
    expect(
      await faulty.broker.subscribe(
        { principal: 'alice', scopes: [alpha], authorization: faulty.policy },
        {
          subscriptionId: 'sub',
          operationId: 'subscribe-sub',
          consumerId: 'consumer-sub',
          selection: { scopes: [alpha], lifecycleClass: 'all' },
          start: 'current'
        }
      )
    ).toFailWith(/storage down/);
    expect(h.repository.subscription('sub' as SubscriptionId)).toSucceedWith(undefined);
  });
});

describe('prepare: capture, mint, render and issue failures', () => {
  test('a subscription read failure outside the writer is reported', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    // The first call binds the delivery (must succeed); prepare()'s own read is the one that fails.
    let calls: number = 0;
    const faulty = faultyDelivery(h, (real) => ({
      subscription: (id) => (++calls === 1 ? real.subscription(id) : storageDown())
    }));
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/storage down/);
  });

  test('a policy epoch that cannot be read stops preparation before anything is read', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const broken = {
      check: async (): Promise<ReturnType<typeof succeed<boolean>>> => succeed(true),
      policyEpoch: (): string => {
        throw new Error('epoch gone');
      }
    };
    const delivery = h.broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: broken,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await delivery.prepare()).toFailWith(/policy epoch unavailable/);
  });

  test('a receipt lifetime long enough to overflow the calendar refuses preparation', async () => {
    const h = await deliveryHarness({ defaults: { receiptLifetimeMs: Number.MAX_SAFE_INTEGER } });
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.prepare()).toFailWith(/prepare: /);
  });

  test('a listOwed failure while capturing input is reported', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const faulty = faultyDelivery(h, () => ({ listOwed: async () => storageDown() }));
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/storage down/);
  });

  test('a query failure for the selection while capturing input is reported', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const faulty = faultyDelivery(h, () => ({ query: async () => storageDown() }));
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/storage down/);
  });

  test('a delivery-id mint failure stops preparation', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => h.clock.now,
      newId: () => succeed('bad id with spaces')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    const delivery = broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await delivery.prepare()).toFailWith(/delivery id/);
  });

  test('a host clock that fails stops preparation after the input is captured', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('d-1')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    const delivery = broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await delivery.prepare()).toFailWith(/clock/);
  });

  test('a renderer failure (a budget too small to render anything) is reported', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.prepare({ maxItems: 0, maxDepth: 1, maxChars: 1 })).toFailWith(/./);
  });

  test('an issue failure inside the gated section, other than a stale manifest, is reported', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ issueReceipt: async () => storageDown() })
    );
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/storage down/);
  });

  test('preparation gives up after repeated recapture and reports a safe conflict', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    // Every call sees a strictly higher recordRevision than the one before it, so the
    // outside-the-writer capture and the inside-the-writer re-check never agree.
    let counter: number = 0;
    const faulty = faultyDelivery(h, (real) => ({
      subscription: (id) => {
        const result = real.subscription(id);
        return result.isSuccess() && result.value !== undefined
          ? succeedWithDetail({ ...result.value, recordRevision: ++counter })
          : result;
      }
    }));
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/kept changing while its context was prepared; retry/);
  });
});

describe('acknowledge and abandon: reads outside and inside the gated section', () => {
  let h: IDeliveryHarness;
  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
  });

  test('a policy epoch that cannot be read stops acknowledgement after the receipt is matched', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    const broken = {
      check: async (): Promise<ReturnType<typeof succeed<boolean>>> => succeed(true),
      policyEpoch: (): string => {
        throw new Error('epoch gone');
      }
    };
    const brokenDelivery = h.broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: broken,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await brokenDelivery.acknowledge(context.context.receipt)).toFailWith(/policy epoch unavailable/);
  });

  test('a host clock that fails stops acknowledgement after authorization', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('id')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    const brokenDelivery = broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await brokenDelivery.acknowledge(context.context.receipt)).toFailWith(/clock/);
  });

  test('a re-read failure inside the committing section is reported', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    let reads: number = 0;
    const faulty = faultyDelivery(
      h,
      () => ({}),
      (real) => ({
        readSubscription: async (id) => (++reads === 2 ? storageDown() : real.readSubscription(id))
      })
    );
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.acknowledge(context.context.receipt)).toFailWith(/storage down/);
  });

  test('a policy epoch that changes between authorization and commit is refused, acknowledging nothing', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    // readSubscription is called once for the "is this receipt still issued" check (before the
    // epoch is even captured) and again inside the section that commits: the policy is changed
    // exactly between those two reads, so it is caught only at the second.
    let reads: number = 0;
    const faulty = faultyDelivery(
      h,
      () => ({}),
      (real) => ({
        readSubscription: async (id) => {
          const read = await real.readSubscription(id);
          reads++;
          if (reads === 2) {
            faulty.policy.epoch = `${faulty.policy.epoch}+`;
          }
          return read;
        }
      })
    );
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.acknowledge(context.context.receipt)).toFailWith(
      /the authorization policy changed; re-present the receipt/
    );
    expect(await pendingIds(faultyDeliveryHandle)).toEqual(
      expect.arrayContaining([expect.stringContaining('t:1:0')])
    );
  });

  test('a subscription record read failure inside abandon is reported', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ readSubscription: async () => storageDown() })
    );
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.abandon(context.deliveryId)).toFailWith(/storage down/);
  });
});

describe('the escape hatches every retry loop ends in', () => {
  test('an acknowledgement gives up after repeated retries and reports a safe conflict', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    // Every fence check sees the fenced task's record revision as having moved.
    const faulty = faultyDelivery(
      h,
      () => ({}),
      (real) => ({
        readCommit: async (id: TaskId) => {
          const read = await real.readCommit(id);
          return read.isSuccess() && read.value !== undefined && read.value.recordType === 'resolved'
            ? succeedWithDetail({
                ...read.value,
                recordRevision: read.value.recordRevision + 1000
              })
            : read;
        }
      })
    );
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.acknowledge(context.context.receipt)).toFailWith(
      /kept changing while it was authorized; retry/
    );
  });
});

describe('acknowledgement authorization', () => {
  test('a denied principal is refused the same way as one who cannot see the task', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    // Denied acknowledgement: the receipt is well-formed but this principal is refused.
    const denied = h.broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: {
          check: async (r) => succeed(r.action !== 'acknowledge'),
          policyEpoch: () => 'e'
        },
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await denied.acknowledge(context.context.receipt)).toFailWith(
      /the receipt includes a task this principal may not acknowledge/
    );
  });

  test('a task record read failure (outside the writer) while authorizing an entry is treated as denial', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    const faulty = faultyDelivery(h, () => ({ readCommit: async () => storageDown() }));
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.acknowledge(context.context.receipt)).toFailWith(
      /the receipt includes a task this principal may not acknowledge/
    );
  });
});

describe('the fence every commit re-checks', () => {
  test('a readCommit failure while fencing a prepared context is reported, not silently retried', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    expect(await delivery.prepare()).toFailWith(/storage down/);
  });

  test('a readCommit failure while fencing an acknowledgement is reported, not silently retried', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    // `_mayAcknowledge` reads outside the writer, through the unpatched repository; only the
    // fence re-check inside the committing section uses the writer's own `readCommit`.
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    const faultyDeliveryHandle = deliveryOf(faulty, 'sub');
    expect(await faultyDeliveryHandle.acknowledge(context.context.receipt)).toFailWith(/storage down/);
  });
});

describe('the writer takes exactly one entry per fenced task', () => {
  test('abandon fails cleanly when the deliveryId does not convert', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.abandon('' as DeliveryId)).toFailWith(/not a receipt/);
  });
});

describe('capturing input: a current read racing an owed read', () => {
  test('a current summary older than what is already owed is dropped, not presented as stale', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    // Captured once, at revision 1 — what a "current" read taken before the next commit would see.
    const stale = (await h.repository.query({ selection: { scopes: [alpha], lifecycleClass: 'all' } }))
      .orThrow()
      .items.find((i) => i.envelope.id === 't')!;
    // The task moves on; its owed updates now include a later revision than the frozen summary.
    await h.writer.execute({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: 1 as never,
      command: 'set-progress',
      parameters: { progress: { completed: 1 } }
    });
    // A marker that would show up in the rendered text only if the stale "current" summary were
    // presented instead of being dropped.
    const marked = { ...stale, envelope: { ...stale.envelope, title: 'STALE-MARKER-SHOULD-NOT-RENDER' } };
    const faulty = faultyDelivery(h, (real) => ({
      query: async (request) => {
        const page = await real.query(request);
        return page.onSuccess((value) =>
          succeedWithDetail({
            ...value,
            items: value.items.map((i) => (i.envelope.id === 't' ? marked : i))
          })
        );
      }
    }));
    const delivery: IBoundTaskDelivery = deliveryOf(faulty, 'sub');
    const prepared = await delivery.prepare();
    expect(prepared).toSucceedAndSatisfy((context) => {
      expect(context.context.text).not.toContain('STALE-MARKER-SHOULD-NOT-RENDER');
      // Its owed updates (lifecycle at revision 1, progress at revision 2) still carry it.
      expect(context.context.receipt.included.filter((e) => e.taskId === 't').map((e) => e.revision)).toEqual(
        [1, 2]
      );
    });
  });
});

describe('capturing input: paging, disclosure and projection failures', () => {
  test('more owed updates than one preparation reads leaves the context partial, never wrong', async () => {
    const h = await deliveryHarness({
      profile: {
        ...defaultTaskCapacityProfile,
        limits: {
          ...defaultTaskCapacityProfile.limits,
          'non-archived-tasks': 2000,
          updates: 40000,
          'audience-links': 400000,
          'acknowledgement-ids': 400000,
          operations: 200000,
          'record-bytes': 64 * 1024 * 1024,
          'logical-bytes': 8 * 1024 * 1024 * 1024,
          'resident-payload-bytes': 1024 * 1024 * 1024
        }
      }
    });
    // Mandatory categories only: fewer per-task charges, so the run stays inside every other
    // dimension while still generating one required update per task.
    await subscribed(h, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    // One more than the 1000-update bound one preparation reads, so the paging loop takes the
    // bound exactly and marks what it captured partial, rather than reading forever.
    for (let i = 0; i < 1001; i++) {
      (
        await h.writer.createTracked({
          taskId: tid(`t${i}`),
          operationId: op(`create-t${i}`),
          title: `t${i}`
        })
      ).orThrow();
    }
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.prepare()).toSucceedAndSatisfy((context) => {
      expect(context.context.omissions.reasons).toContain('partial-input');
    });
  }, 30000);

  test('an owed update whose envelope a stricter projector refuses fails preparation', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    const strict = TaskConverters.create({ bounds: { maxTitleLength: 5 } }).orThrow();
    const broker = TaskBroker.create({
      repository: h.repository,
      environment: h.env,
      converters: strict
    }).orThrow();
    const delivery = broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await delivery.prepare()).toFailWith(/projection failed/);
  });

  test('a current task a stricter projector refuses, with nothing left owed, still fails preparation', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    await subscribed(h, 'sub', { start: 'current' });
    const delivery = deliveryOf(h, 'sub');
    // Nothing is owed once the baseline is acknowledged; only the current-selection projection remains.
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    const strict = TaskConverters.create({ bounds: { maxTitleLength: 5 } }).orThrow();
    const broker = TaskBroker.create({
      repository: h.repository,
      environment: h.env,
      converters: strict
    }).orThrow();
    const strictDelivery = broker
      .bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: 'sub' as SubscriptionId,
        consumerId: 'consumer-sub' as never
      })
      .orThrow();
    expect(await strictDelivery.prepare()).toFailWith(/projection failed/);
  });

  test('a current unresolved reference this principal may see is included, and one it may not is withheld', async () => {
    const h = await deliveryHarness();
    await h.broker.registerExternal('host', {
      taskId: tid('u'),
      operationId: op(),
      kind: 'acme.job' as never,
      detailVersion: 1,
      title: 'u',
      scopes: [alpha],
      binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: 'u' } },
      recovery: 'reattach'
    });
    await subscribed(h, 'sub', { start: 'current' });
    const delivery = deliveryOf(h, 'sub');
    // The baseline over 'u' is a reference, not a task update: acknowledge it so nothing is left
    // owed, and the only thing prepare() has left to capture is the current unresolved reference.
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    h.policy.hide('u');
    const withheld = await delivery.prepare();
    expect(withheld).toSucceedAndSatisfy((context) => {
      expect(context.context.receipt.included).toEqual([]);
    });
  });

  test('a start-current subscription still owed an update for a task an updated policy no longer discloses', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { start: 'current' });
    await track(h.writer, 't');
    h.policy.hide('t');
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.prepare()).toSucceedAndSatisfy((context) => {
      expect(context.context.receipt.included).toEqual([]);
    });
    expect(await pendingIds(delivery)).toEqual([]);
  });
});
