/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { failWithDetail, succeed } from '@fgv/ts-utils';
import {
  IBoundTaskDelivery,
  ITaskAuthorization,
  ITaskFailure,
  SubscriptionId,
  TaskBroker,
  TaskEnvironment,
  TaskResult
} from '../../../index';
import { alpha, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  deliveryHarness,
  deliveryOf,
  faultyDelivery,
  subscribed
} from '../../helpers/deliveryFixtures';

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

async function harness(): Promise<IDeliveryHarness> {
  const h = await deliveryHarness();
  await subscribed(h, 'sub');
  await track(h.writer, 't');
  return h;
}

function boundWith(
  h: IDeliveryHarness,
  broker: TaskBroker,
  authorization?: ITaskAuthorization
): IBoundTaskDelivery {
  return broker
    .bindDelivery({
      principal: 'alice',
      scopes: [alpha],
      authorization: authorization ?? h.policy,
      subscriptionId: 'sub' as SubscriptionId,
      consumerId: 'consumer-sub' as never
    })
    .orThrow();
}

describe('pending and disposeWithheld: reads that fail are reported', () => {
  test('a policy epoch that cannot be read stops both before anything is decided', async () => {
    const h = await harness();
    const broken: ITaskAuthorization = {
      check: async () => succeed(true),
      policyEpoch: (): string => {
        throw new Error('epoch gone');
      }
    };
    const delivery = boundWith(h, h.broker, broken);
    expect(await delivery.pending()).toFailWith(/policy epoch unavailable/);
    expect(await delivery.disposeWithheld({ reason: 'x' })).toFailWith(/policy epoch unavailable/);
  });

  test('a task record that cannot be read fails the decision — first read or re-read', async () => {
    const h = await harness();
    const first = faultyDelivery(h, () => ({ readCommit: async () => storageDown() }));
    expect(await deliveryOf(first, 'sub').pending()).toFailWith(/storage down/);
    expect(await deliveryOf(first, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
    expect(await deliveryOf(first, 'sub').prepare()).toFailWith(/storage down/);
    let reads: number = 0;
    const second = faultyDelivery(h, (real) => ({
      readCommit: async (id) => (++reads === 1 ? real.readCommit(id) : storageDown())
    }));
    expect(await deliveryOf(second, 'sub').pending()).toFailWith(/storage down/);
  });

  test('a subscription descriptor that cannot be read fails disposeWithheld before anything is asked', async () => {
    const h = await harness();
    let reads: number = 0;
    // The first read is bindDelivery's.
    const faulty = faultyDelivery(h, (real) => ({
      subscription: (id) => (++reads === 1 ? real.subscription(id) : storageDown())
    }));
    expect(await deliveryOf(faulty, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
    expect(h.policy.calls.filter((c) => c.action === 'dispose-obligation')).toEqual([]);
  });

  test('an owed listing that fails fails disposeWithheld', async () => {
    const h = await harness();
    const faulty = faultyDelivery(h, () => ({ listOwed: async () => storageDown() }));
    expect(await deliveryOf(faulty, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
  });

  test('a subscription record or task re-read that fails inside the writer fails disposeWithheld', async () => {
    const h = await harness();
    const record = faultyDelivery(
      h,
      () => ({}),
      () => ({ readSubscription: async () => storageDown() })
    );
    expect(await deliveryOf(record, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
    const task = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    expect(await deliveryOf(task, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
  });

  test('a disposal storage refuses fails disposeWithheld', async () => {
    const h = await harness();
    h.policy.denyOn('acknowledge', 't');
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ disposeObligations: async () => storageDown() })
    );
    expect(await deliveryOf(faulty, 'sub').disposeWithheld({ reason: 'x' })).toFailWith(/storage down/);
  });

  test('a host clock that fails stops disposeWithheld before the writer', async () => {
    const h = await harness();
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('d-1')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    expect(await boundWith(h, broker).disposeWithheld({ reason: 'x' })).toFailWith(/clock/);
  });

  test("a disclosure re-read that fails inside prepare's writer section is reported", async () => {
    const h = await harness();
    const faulty = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    expect(await deliveryOf(faulty, 'sub').prepare(undefined, { currentState: 'owed-only' })).toFailWith(
      /storage down/
    );
  });
});
