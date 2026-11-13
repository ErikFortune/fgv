/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IBoundTaskDelivery,
  IBoundTaskViewParams,
  ITaskConsumerRecord,
  ITaskSubscription,
  SubscriptionId,
  TaskResult
} from '../../../index';
import { TestPolicy, alpha, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  InMemoryCheckpointStore,
  allowEverything,
  consumerRecord,
  deliveryHarness,
  pendingIds,
  reopen,
  subscribed
} from '../../helpers/deliveryFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });
const sid = (id: string): SubscriptionId => id as SubscriptionId;

/** `principal`'s host binding over `alpha`, under `authorization` (default: allow everything). */
function as(
  principal: string,
  authorization: IBoundTaskViewParams['authorization'] = allowEverything
): IBoundTaskViewParams {
  return { principal, scopes: [alpha], authorization };
}

/** `principal`'s binding of `s1`'s delivery; throws when refused. */
function drainer(h: IDeliveryHarness, principal: string): IBoundTaskDelivery {
  return h.broker
    .bindDelivery({
      principal,
      scopes: [alpha],
      authorization: h.policy,
      subscriptionId: sid('s1'),
      consumerId: 'consumer-s1' as never
    })
    .orThrow();
}

/** Replaces `s1`'s drain principals through its registering principal, `alice`. */
async function setDrain(
  h: IDeliveryHarness,
  drainPrincipals: ReadonlyArray<string>
): Promise<ITaskSubscription> {
  return (
    await h.broker.setSubscriptionDrain(as('alice'), { subscriptionId: 's1', drainPrincipals })
  ).orThrow();
}

/** A result's message and detail, with the subscription id normalized, for comparing refusals. */
function answer<T>(result: TaskResult<T>): unknown {
  return result.isFailure()
    ? { message: result.message.replace(/nope/g, 's1'), detail: result.detail }
    : 'ok';
}

const owed: string = 't1:1:0';

async function dispose(
  h: IDeliveryHarness,
  binding: IBoundTaskViewParams,
  id: string = 's1'
): Promise<TaskResult<unknown>> {
  return h.broker.dispose(binding, { subscriptionId: id, updateIds: [owed], reason: 'ended' });
}

async function close(
  h: IDeliveryHarness,
  binding: IBoundTaskViewParams,
  obligations: 'retain' | 'dispose',
  id: string = 's1'
): Promise<TaskResult<ITaskSubscription>> {
  return h.broker.closeSubscription(binding, {
    subscriptionId: id,
    obligations,
    ...(obligations === 'dispose' ? { reason: 'ended' } : {})
  });
}

describe('only the consumer ends what a subscription is owed', () => {
  let h: IDeliveryHarness;

  // `alice` registers `s1` on `agent:ada`'s behalf: ada is its only drain principal.
  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada'] });
    await track(h.writer, 't1');
  });

  test('dispose: a principal not named gets the missing-subscription answer, before any task is authorized', async () => {
    for (const principal of ['alice', 'bob']) {
      const policy = new TestPolicy();
      const refused = await dispose(h, as(principal, policy));
      expect(refused).toFailWithDetail(/dispose s1: not found or not permitted/, code('not-found-or-denied'));
      expect(answer(refused)).toEqual(answer(await dispose(h, as(principal, policy), 'nope')));
      // Refused on the subscription alone: no task was put to its policy.
      expect(policy.calls.filter((c) => c.action === 'dispose-obligation')).toEqual([]);
    }
    expect(await pendingIds(drainer(h, 'agent:ada'))).toEqual([owed]);
    expect(await dispose(h, as('agent:ada'))).toSucceedAndSatisfy((r) => {
      expect(r).toEqual(expect.objectContaining({ newlyDisposed: [owed] }));
    });
    expect(await pendingIds(drainer(h, 'agent:ada'))).toEqual([]);
  });

  test('closeSubscription disposing: only a drain principal — the registrant is refused', async () => {
    for (const principal of ['alice', 'bob']) {
      const refused = await close(h, as(principal), 'dispose');
      expect(refused).toFailWithDetail(
        /closeSubscription s1: not found or not permitted/,
        code('not-found-or-denied')
      );
      expect(answer(refused)).toEqual(answer(await close(h, as(principal), 'dispose', 'nope')));
    }
    expect((await consumerRecord(h.repository, 's1')).state).toBe('active');
    expect(await close(h, as('agent:ada'), 'dispose')).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('closed');
    });
    expect((await consumerRecord(h.repository, 's1')).disposed.map((d) => d.updateId)).toEqual([owed]);
  });

  test('closeSubscription retaining: the registrant or a drain principal, nobody else', async () => {
    const refused = await close(h, as('bob'), 'retain');
    expect(refused).toFailWithDetail(
      /closeSubscription s1: not found or not permitted/,
      code('not-found-or-denied')
    );
    expect(answer(refused)).toEqual(answer(await close(h, as('bob'), 'retain', 'nope')));
    expect(await close(h, as('alice'), 'retain')).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('closed');
    });
    // Retained: still owed, and still drainable by the consumer.
    expect(await pendingIds(drainer(h, 'agent:ada'))).toEqual([owed]);
  });

  test('closeSubscription retaining by a drain principal that is not the registrant', async () => {
    expect(await close(h, as('agent:ada'), 'retain')).toSucceedAndSatisfy((s) => {
      expect(s.state).toBe('closed');
    });
  });

  test('a subscription recorded before drain principals existed is ended by its registrant', async () => {
    const checkpoints = new InMemoryCheckpointStore();
    const first = await deliveryHarness({ checkpoints });
    await subscribed(first, 's1');
    await track(first.writer, 't1');
    const { drainPrincipals: dropped, ...legacy } = checkpoints.records.get('s1')!;
    expect(dropped).toEqual(['alice']);
    checkpoints.records.set('s1', legacy);
    const reopened = await reopen(first);
    expect(await dispose(reopened, as('bob'))).toFailWithDetail(
      /not found or not permitted/,
      code('not-found-or-denied')
    );
    expect(await dispose(reopened, as('alice'))).toSucceed();
    expect((await consumerRecord(reopened.repository, 's1')).disposed.map((d) => d.updateId)).toEqual([owed]);
  });
});

describe('a drain principal removed while an ending is authorized', () => {
  let h: IDeliveryHarness;

  /** Replaces the drain principals the next time `h.policy` is asked `dispose-obligation`. */
  function replaceOnDispose(drainPrincipals: ReadonlyArray<string>): void {
    let done: boolean = false;
    h.policy.afterDecision = async (request) => {
      if (!done && request.action === 'dispose-obligation') {
        done = true;
        await setDrain(h, drainPrincipals);
      }
    };
  }

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada', 'bob'] });
    await track(h.writer, 't1');
  });

  test('dispose: the writing section refuses, and nothing ends', async () => {
    replaceOnDispose(['agent:ada']);
    expect(await dispose(h, as('bob', h.policy))).toFailWithDetail(
      /dispose s1: not found or not permitted/,
      code('not-found-or-denied')
    );
    expect((await consumerRecord(h.repository, 's1')).disposed).toEqual([]);
  });

  test('closeSubscription disposing: the writing section refuses, and the subscription stays open', async () => {
    replaceOnDispose(['agent:ada']);
    expect(await close(h, as('bob', h.policy), 'dispose')).toFailWithDetail(
      /closeSubscription s1: not found or not permitted/,
      code('not-found-or-denied')
    );
    const record: ITaskConsumerRecord = await consumerRecord(h.repository, 's1');
    expect(record.state).toBe('active');
    expect(record.disposed).toEqual([]);
  });

  test('closeSubscription retaining, by a drain principal that is not the registrant: refused too', async () => {
    replaceOnDispose(['agent:ada']);
    expect(await close(h, as('bob', h.policy), 'retain')).toFailWithDetail(
      /closeSubscription s1: not found or not permitted/,
      code('not-found-or-denied')
    );
    expect((await consumerRecord(h.repository, 's1')).state).toBe('active');
  });
});
