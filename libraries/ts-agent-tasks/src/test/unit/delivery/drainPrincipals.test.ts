/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { failWithDetail, succeed } from '@fgv/ts-utils';
import {
  IBoundTaskDelivery,
  IBoundTaskDeliveryParams,
  IBoundTaskViewParams,
  ITaskAuthorization,
  ITaskConsumerRecord,
  ITaskFailure,
  ITaskSubscription,
  SubscriptionId,
  TaskDeliveryPump,
  TaskResult,
  drainPrincipalsOf,
  maxDrainPrincipals,
  trustedKindAuthority
} from '../../../index';
import { TestPolicy, alpha, beta, track } from '../../helpers/brokerFixtures';
import { converters as taskConverters } from '../../helpers/fixtures';
import {
  IDeliveryHarness,
  InMemoryCheckpointStore,
  allowEverything,
  consumerRecord,
  deliveryHarness,
  faultyDelivery,
  pendingIds,
  reopen,
  subscribeAs,
  subscribed
} from '../../helpers/deliveryFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });
const sid = (id: string): SubscriptionId => id as SubscriptionId;

/** `principal`'s binding of `s1`'s delivery, as a result. */
function bindAs(
  h: IDeliveryHarness,
  principal: string,
  overrides?: Partial<IBoundTaskDeliveryParams>
): ReturnType<IDeliveryHarness['broker']['bindDelivery']> {
  return h.broker.bindDelivery({
    principal,
    scopes: [alpha],
    authorization: h.policy,
    subscriptionId: sid('s1'),
    consumerId: 'consumer-s1' as never,
    ...(overrides ?? {})
  });
}

/** `principal`'s binding of `s1`'s delivery; throws when refused. */
function drainer(
  h: IDeliveryHarness,
  principal: string,
  authorization?: ITaskAuthorization
): IBoundTaskDelivery {
  return bindAs(h, principal, authorization !== undefined ? { authorization } : undefined).orThrow();
}

/** The registering principal's host binding, for trusted host operations. */
function owner(overrides?: Partial<IBoundTaskViewParams>): IBoundTaskViewParams {
  return { principal: 'alice', scopes: [alpha], authorization: allowEverything, ...(overrides ?? {}) };
}

/** Replaces `s1`'s drain authority through its owner, throwing on failure. */
async function setDrain(
  h: IDeliveryHarness,
  drainPrincipals: ReadonlyArray<string>,
  policyIdentity?: string
): Promise<ITaskSubscription> {
  return (
    await h.broker.setSubscriptionDrain(owner(), {
      subscriptionId: 's1',
      drainPrincipals,
      ...(policyIdentity !== undefined ? { policyIdentity } : {})
    })
  ).orThrow();
}

describe('who may bind a subscription’s delivery', () => {
  test('by default only the registering principal may bind; the descriptor says so', async () => {
    const h = await deliveryHarness();
    const s = await subscribed(h, 's1');
    expect(s.drainPrincipals).toEqual(['alice']);
    expect(s.policyIdentity).toBeUndefined();
    expect((await consumerRecord(h.repository, 's1')).drainPrincipals).toEqual(['alice']);
    expect(bindAs(h, 'alice')).toSucceed();
    expect(bindAs(h, 'bob')).toFailWithDetail(
      /no subscription s1 for this consumer/,
      code('not-found-or-denied')
    );
  });

  test('a named drain principal may bind; the registrant is not added implicitly', async () => {
    const h = await deliveryHarness();
    const s = await subscribed(h, 's1', { drainPrincipals: ['agent:ada'] });
    expect(s.drainPrincipals).toEqual(['agent:ada']);
    expect(s.principalKey).toBe('alice');
    expect(bindAs(h, 'agent:ada')).toSucceed();
    expect(bindAs(h, 'alice')).toFailWithDetail(/no subscription s1/, code('not-found-or-denied'));
  });

  test('an unnamed principal gets exactly the answer a missing subscription or a wrong consumer gets', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada', 'alice'] });
    const unnamed = bindAs(h, 'bob');
    const missing = bindAs(h, 'bob', { subscriptionId: sid('nope') });
    const wrongConsumer = bindAs(h, 'agent:ada', { consumerId: 'consumer-other' as never });
    const answers = [unnamed, missing, wrongConsumer].map((r) =>
      r.isFailure() ? { message: r.message.replace(/nope/, 's1'), detail: r.detail } : 'bound'
    );
    expect(answers[0]).toEqual(answers[1]);
    expect(answers[0]).toEqual(answers[2]);
    expect(answers[0]).toEqual({
      message: 'bindDelivery: no subscription s1 for this consumer',
      detail: expect.objectContaining({ code: 'not-found-or-denied' })
    });
  });

  test('a host that subscribes on an agent’s behalf names the agent, and the agent drains', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada'] });
    await track(h.writer, 't1');
    const ada = drainer(h, 'agent:ada');
    const prepared = (await ada.prepare()).orThrow();
    (await ada.acknowledge(prepared.context.receipt)).orThrow();
    expect(await pendingIds(ada)).toEqual([]);
  });

  test('the request list is de-duplicated and stored ascending', async () => {
    const h = await deliveryHarness();
    const s = await subscribed(h, 's1', { drainPrincipals: ['zed', 'alice', 'zed', 'bob'] });
    expect(s.drainPrincipals).toEqual(['alice', 'bob', 'zed']);
    expect((await consumerRecord(h.repository, 's1')).drainPrincipals).toEqual(['alice', 'bob', 'zed']);
  });

  test('a subscribe request with an empty, oversized or malformed list is refused', async () => {
    const h = await deliveryHarness();
    const too: string[] = [...Array(maxDrainPrincipals + 1).keys()].map((i) => `p${i}`);
    // An empty list is refused at the request, before anything is captured.
    expect(await subscribeAs(h, 's1', { drainPrincipals: [] })).toFailWithDetail(
      /^subscribe: .*drain principals must name at least one principal/,
      code('invalid')
    );
    for (const drainPrincipals of [too, [''], ['two\nlines'], [7]]) {
      expect(
        await subscribeAs(h, 's1', { drainPrincipals: drainPrincipals as unknown as string[] })
      ).toFailWithDetail(/drain principals|principal key/, code('invalid'));
    }
    expect(await subscribeAs(h, 's1', { policyIdentity: '' })).toFailWithDetail(
      /policy identity/,
      code('invalid')
    );
    expect(h.repository.subscription(sid('s1'))).toSucceedWith(undefined);
  });

  test('a retry must repeat the drain authority exactly', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada'] });
    expect(await subscribeAs(h, 's1', { drainPrincipals: ['agent:ada'] })).toSucceed();
    expect(await subscribeAs(h, 's1', { drainPrincipals: ['agent:bob'] })).toFailWithDetail(
      /different operation or specification/,
      code('conflict')
    );
    expect(
      await subscribeAs(h, 's1', { drainPrincipals: ['agent:ada'], policyIdentity: 'p' })
    ).toFailWithDetail(/different operation or specification/, code('conflict'));
  });

  test('a retry of a registration that recorded an identity replays; after a change it conflicts', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1', { policyIdentity: 'alice-policy' });
    expect(await subscribeAs(h, 's1', { policyIdentity: 'alice-policy' })).toSucceedAndSatisfy((s) => {
      expect(s.policyIdentity).toBe('alice-policy');
    });
    await setDrain(h, ['alice', 'bob'], 'alice-policy');
    expect(await subscribeAs(h, 's1', { policyIdentity: 'alice-policy' })).toFailWithDetail(
      /different operation or specification/,
      code('conflict')
    );
  });

  test('a subscription recorded before drain principals existed is drained by its registrant alone', async () => {
    const checkpoints = new InMemoryCheckpointStore();
    const first = await deliveryHarness({ checkpoints });
    await subscribed(first, 's1');
    await track(first.writer, 't1');
    // Rewrite the stored record as an earlier release wrote it: no drain principals.
    const stored: ITaskConsumerRecord = checkpoints.records.get('s1')!;
    const { drainPrincipals: dropped, ...legacy } = stored;
    expect(dropped).toEqual(['alice']);
    checkpoints.records.set('s1', legacy);
    const h = await reopen(first);
    const record: ITaskConsumerRecord = await consumerRecord(h.repository, 's1');
    expect(record.drainPrincipals).toBeUndefined();
    expect(drainPrincipalsOf(record)).toEqual(['alice']);
    expect(h.repository.subscription(sid('s1'))).toSucceedAndSatisfy((s) => {
      expect(s!.drainPrincipals).toEqual(['alice']);
    });
    expect(bindAs(h, 'bob')).toFailWithDetail(/no subscription s1/, code('not-found-or-denied'));
    expect(await pendingIds(drainer(h, 'alice'))).toEqual(['t1:1:0']);
    // Its owner can give it drain principals; it is then exactly like any other.
    expect(await setDrain(h, ['bob'])).toEqual(expect.objectContaining({ drainPrincipals: ['bob'] }));
    expect(await pendingIds(drainer(h, 'bob'))).toEqual(['t1:1:0']);
  });

  test('the pump is refused construction the same way, and built for a named drainer', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada'] });
    const params = (principal: string): IBoundTaskDeliveryParams => ({
      principal,
      scopes: [alpha],
      authorization: h.policy,
      subscriptionId: sid('s1'),
      consumerId: 'consumer-s1' as never
    });
    expect(TaskDeliveryPump.create({ broker: h.broker, delivery: params('alice') })).toFailWith(
      /no subscription s1 for this consumer/
    );
    expect(TaskDeliveryPump.create({ broker: h.broker, delivery: params('agent:ada') })).toSucceed();
  });
});

describe('the stored drain-principal list', () => {
  const converters = taskConverters.delivery;

  test('is non-empty, bounded, unique and ascending', () => {
    expect(converters.drainPrincipals.convert(['a', 'b'])).toSucceedWith(['a', 'b']);
    expect(converters.drainPrincipals.convert(['b', 'a'])).toFailWith(/unique and ascending/);
    expect(converters.drainPrincipals.convert(['a', 'a'])).toFailWith(/unique and ascending/);
    expect(converters.drainPrincipals.convert([])).toFailWith(/non-empty/);
    expect(
      converters.drainPrincipals.convert([...Array(maxDrainPrincipals + 1).keys()].map((i) => `p${i}`))
    ).toFailWith(/exceeds the maximum/);
  });

  test('a consumer record with a malformed list or identity is refused', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 's1');
    const record: ITaskConsumerRecord = await consumerRecord(h.repository, 's1');
    expect(converters.consumerRecord.convert(record)).toSucceed();
    expect(converters.consumerRecord.convert({ ...record, drainPrincipals: [] })).toFailWith(/non-empty/);
    expect(converters.consumerRecord.convert({ ...record, policyIdentity: '' })).toFailWith(
      /policy identity/
    );
  });
});

describe('changing a subscription’s drain principals', () => {
  let h: IDeliveryHarness;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1');
    await track(h.writer, 't1');
  });

  test('the owner names a new drainer: it binds, and the previous one is refused from then on', async () => {
    const alice = drainer(h, 'alice');
    const updated = await setDrain(h, ['agent:ada']);
    expect(updated.drainPrincipals).toEqual(['agent:ada']);
    expect(await pendingIds(drainer(h, 'agent:ada'))).toEqual(['t1:1:0']);
    expect(bindAs(h, 'alice')).toFailWithDetail(/no subscription s1/, code('not-found-or-denied'));
    // A binding made before the change is held to the subscription as it stands now.
    expect(await alice.pending()).toFailWithDetail(/pending s1: not permitted/, code('not-found-or-denied'));
    expect(await alice.prepare()).toFailWithDetail(/prepare s1: not permitted/, code('not-found-or-denied'));
    expect(await alice.issued()).toFailWithDetail(/issued s1: not permitted/, code('not-found-or-denied'));
    expect(await alice.disposeWithheld({ reason: 'x' })).toFailWithDetail(
      /disposeWithheld s1: not permitted/,
      code('not-found-or-denied')
    );
  });

  test('a receipt a removed principal prepared cannot be acknowledged or abandoned by it', async () => {
    const alice = drainer(h, 'alice');
    const prepared = (await alice.prepare()).orThrow();
    await setDrain(h, ['agent:ada']);
    expect(await alice.acknowledge(prepared.context.receipt)).toFailWithDetail(
      /acknowledge s1: not permitted/,
      code('not-found-or-denied')
    );
    expect(await alice.abandon(prepared.deliveryId)).toFailWithDetail(
      /abandon s1: not permitted/,
      code('not-found-or-denied')
    );
    // The receipt stays issued, and the principal still named sees it and may end it.
    const ada = drainer(h, 'agent:ada');
    expect((await ada.issued()).orThrow().map((r) => r.deliveryId)).toEqual([prepared.deliveryId]);
    expect(await ada.abandon(prepared.deliveryId)).toSucceedWith(prepared.deliveryId);
    expect(await pendingIds(ada)).toEqual(['t1:1:0']);
  });

  test('a request that changes nothing writes nothing', async () => {
    const before: number = (await consumerRecord(h.repository, 's1')).recordRevision;
    expect((await setDrain(h, ['alice'])).recordRevision).toBe(before);
    const withIdentity = await setDrain(h, ['alice'], 'alice-policy');
    expect(withIdentity.recordRevision).toBe(before + 1);
    expect(withIdentity.policyIdentity).toBe('alice-policy');
    expect((await setDrain(h, ['alice'], 'alice-policy')).recordRevision).toBe(before + 1);
  });

  test('an omitted policy identity removes the recorded one', async () => {
    await setDrain(h, ['alice'], 'alice-policy');
    const removed = await setDrain(h, ['alice']);
    expect(removed.policyIdentity).toBeUndefined();
    expect(Object.keys(await consumerRecord(h.repository, 's1'))).not.toContain('policyIdentity');
  });

  test('a closed subscription’s drain principals may still change', async () => {
    (await h.broker.closeSubscription(owner(), { subscriptionId: 's1', obligations: 'retain' })).orThrow();
    expect((await setDrain(h, ['bob'])).state).toBe('closed');
    expect(await pendingIds(drainer(h, 'bob'))).toEqual(['t1:1:0']);
  });

  test('only the owner may change them, and only with what registering required', async () => {
    const denied = async (binding: IBoundTaskViewParams, subscriptionId: string = 's1'): Promise<void> => {
      expect(
        await h.broker.setSubscriptionDrain(binding, { subscriptionId, drainPrincipals: ['mallory'] })
      ).toFailWithDetail(/setSubscriptionDrain (s1|nope): not permitted/, code('not-found-or-denied'));
    };
    // A drain principal is not an owner.
    await setDrain(h, ['alice', 'bob']);
    await denied(owner({ principal: 'bob' }));
    // Selectors that do not cover the selection.
    await denied(owner({ scopes: [beta] }));
    // A policy that does not grant subscribe.
    const noSubscribe = trustedKindAuthority({ scopes: [alpha], actions: ['read'], epoch: 'e' }).orThrow();
    await denied(owner({ authorization: noSubscribe }));
    // No such subscription.
    await denied(owner(), 'nope');
    expect(h.repository.subscription(sid('s1'))).toSucceedAndSatisfy((s) => {
      expect(s!.drainPrincipals).toEqual(['alice', 'bob']);
    });
  });

  test('a malformed request or binding is refused as invalid', async () => {
    for (const drainPrincipals of [[], ['a\nb']]) {
      expect(
        await h.broker.setSubscriptionDrain(owner(), { subscriptionId: 's1', drainPrincipals })
      ).toFailWithDetail(/setSubscriptionDrain: .*drain principals|principal key/, code('invalid'));
    }
    expect(
      await h.broker.setSubscriptionDrain(owner({ principal: '' }), {
        subscriptionId: 's1',
        drainPrincipals: ['a']
      })
    ).toFailWithDetail(/bind:/, code('invalid'));
  });

  test('a policy epoch that cannot be read, or moves before the write, commits nothing', async () => {
    const broken: ITaskAuthorization = {
      check: async () => succeed(true),
      policyEpoch: (): string => {
        throw new Error('epoch gone');
      }
    };
    expect(
      await h.broker.setSubscriptionDrain(owner({ authorization: broken }), {
        subscriptionId: 's1',
        drainPrincipals: ['bob']
      })
    ).toFailWith(/policy epoch unavailable/);
    const moving = new TestPolicy();
    moving.afterDecision = (request) => {
      if (request.action === 'subscribe') {
        moving.epoch = 'epoch-2';
      }
    };
    expect(
      await h.broker.setSubscriptionDrain(owner({ authorization: moving }), {
        subscriptionId: 's1',
        drainPrincipals: ['bob']
      })
    ).toFailWithDetail(/changed after the operation was authorized/, code('conflict'));
    expect((await consumerRecord(h.repository, 's1')).drainPrincipals).toEqual(['alice']);
  });
});

describe('a drain principal removed while an operation is under way', () => {
  let h: IDeliveryHarness;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada', 'alice'] });
    await track(h.writer, 't1');
  });

  /** Removes alice the next time her policy is asked `action`. */
  function removeAliceOn(action: string): void {
    let done: boolean = false;
    h.policy.afterDecision = async (request) => {
      if (!done && request.action === action) {
        done = true;
        await setDrain(h, ['agent:ada']);
      }
    };
  }

  test('pending: decided while she was named, answered after she was not — refused', async () => {
    const alice = drainer(h, 'alice');
    removeAliceOn('read');
    expect(await alice.pending()).toFailWithDetail(/pending s1: not permitted/, code('not-found-or-denied'));
  });

  test('prepare: captured while she was named — the issuing section sees the record move, and the recapture refuses', async () => {
    const alice = drainer(h, 'alice');
    removeAliceOn('read');
    expect(await alice.prepare()).toFailWithDetail(/prepare s1: not permitted/, code('not-found-or-denied'));
    expect((await consumerRecord(h.repository, 's1')).issued).toEqual([]);
  });

  test('acknowledge: authorized while she was named — the committing section refuses', async () => {
    const alice = drainer(h, 'alice');
    const prepared = (await alice.prepare()).orThrow();
    removeAliceOn('acknowledge');
    expect(await alice.acknowledge(prepared.context.receipt)).toFailWithDetail(
      /acknowledge s1: not permitted/,
      code('not-found-or-denied')
    );
    expect((await consumerRecord(h.repository, 's1')).acknowledged).toEqual([]);
  });

  test('disposeWithheld: authorized while she was named — the writing section refuses', async () => {
    const policy: TestPolicy = h.policy;
    policy.policyIdentity = 'alice-policy';
    policy.denyOn('acknowledge', 't1');
    await setDrain(h, ['agent:ada', 'alice'], 'alice-policy');
    const alice = drainer(h, 'alice');
    removeAliceOn('dispose-obligation');
    expect(await alice.disposeWithheld({ reason: 'x' })).toFailWithDetail(
      /disposeWithheld s1: not permitted/,
      code('not-found-or-denied')
    );
    expect((await consumerRecord(h.repository, 's1')).disposed).toEqual([]);
  });

  test('disposeWithheld: the recorded identity replaced before the write — refused', async () => {
    const policy: TestPolicy = h.policy;
    policy.policyIdentity = 'alice-policy';
    policy.denyOn('acknowledge', 't1');
    await setDrain(h, ['agent:ada', 'alice'], 'alice-policy');
    const alice = drainer(h, 'alice');
    let done: boolean = false;
    policy.afterDecision = async (request) => {
      if (!done && request.action === 'dispose-obligation') {
        done = true;
        await setDrain(h, ['agent:ada', 'alice'], 'another-policy');
      }
    };
    expect(await alice.disposeWithheld({ reason: 'x' })).toFailWithDetail(
      /disposeWithheld s1: not permitted/,
      code('not-found-or-denied')
    );
    expect((await consumerRecord(h.repository, 's1')).disposed).toEqual([]);
  });
});

describe('disposeWithheld requires the consumer’s own policy, by identity', () => {
  let h: IDeliveryHarness;

  beforeEach(async () => {
    h = await deliveryHarness();
  });

  /** A policy like alice's that withholds t1 (it may not acknowledge it), with `identity`. */
  function withholding(identity: string | undefined): TestPolicy {
    const policy = new TestPolicy();
    policy.policyIdentity = identity;
    policy.denyOn('acknowledge', 't1');
    return policy;
  }

  const ended = { subscriptionId: sid('s1'), disposed: 1, pinned: 0, more: false };

  test('a subscription that recorded no identity refuses every binding', async () => {
    await subscribed(h, 's1');
    await track(h.writer, 't1');
    expect(
      await drainer(h, 'alice', withholding('alice-policy')).disposeWithheld({ reason: 'x' })
    ).toFailWithDetail(/disposeWithheld s1: not permitted/, code('not-found-or-denied'));
    expect(
      await drainer(h, 'alice', withholding(undefined)).disposeWithheld({ reason: 'x' })
    ).toFailWithDetail(/disposeWithheld s1: not permitted/, code('not-found-or-denied'));
  });

  test('a binding whose policy has no identity, or another one, is refused', async () => {
    await subscribed(h, 's1', { policyIdentity: 'alice-policy' });
    await track(h.writer, 't1');
    for (const identity of [undefined, 'narrower-policy']) {
      expect(
        await drainer(h, 'alice', withholding(identity)).disposeWithheld({ reason: 'x' })
      ).toFailWithDetail(/disposeWithheld s1: not permitted/, code('not-found-or-denied'));
    }
    expect((await consumerRecord(h.repository, 's1')).disposed).toEqual([]);
  });

  test('the registrant through the recorded identity ends what it withholds', async () => {
    await subscribed(h, 's1', { policyIdentity: 'alice-policy' });
    await track(h.writer, 't1');
    expect(
      await drainer(h, 'alice', withholding('alice-policy')).disposeWithheld({ reason: 'x' })
    ).toSucceedWith(ended);
  });

  test('a named drainer through the recorded identity ends what it withholds', async () => {
    await subscribed(h, 's1', { drainPrincipals: ['agent:ada'], policyIdentity: 'ada-policy' });
    await track(h.writer, 't1');
    expect(
      await drainer(h, 'agent:ada', withholding('ada-policy')).disposeWithheld({ reason: 'x' })
    ).toSucceedWith(ended);
  });

  test('the identity is read once, at binding: a policy that changes it later is judged by the first', async () => {
    await subscribed(h, 's1', { policyIdentity: 'alice-policy' });
    await track(h.writer, 't1');
    const policy = withholding('alice-policy');
    const delivery = drainer(h, 'alice', policy);
    policy.policyIdentity = 'something-else';
    expect(await delivery.disposeWithheld({ reason: 'x' })).toSucceedWith(ended);
  });

  test('a policy whose identity cannot be read, or is not one line, cannot be bound', async () => {
    await subscribed(h, 's1');
    await track(h.writer, 't1');
    const throwing: ITaskAuthorization = {
      check: async () => succeed(true),
      policyEpoch: () => 'e',
      get policyIdentity(): string {
        throw new Error('identity gone');
      }
    };
    expect(bindAs(h, 'alice', { authorization: throwing })).toFailWithDetail(
      /identity gone/,
      code('invalid')
    );
    expect(bindAs(h, 'alice', { authorization: withholding('two\nlines') })).toFailWithDetail(
      /policy identity/,
      code('invalid')
    );
  });

  test('trustedKindAuthority carries an identity when given one', () => {
    expect(
      trustedKindAuthority({ scopes: [alpha], actions: ['read'], epoch: 'e', policyIdentity: 'p' }).orThrow()
        .policyIdentity
    ).toBe('p');
    expect(
      trustedKindAuthority({ scopes: [alpha], actions: ['read'], epoch: 'e' }).orThrow().policyIdentity
    ).toBeUndefined();
  });
});

describe('reads that fail on the drain paths are reported', () => {
  const storageDown = <T>(): TaskResult<T> =>
    failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

  let h: IDeliveryHarness;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1');
    await track(h.writer, 't1');
  });

  test('pending: a descriptor read that fails, before or after deciding, and a listing that fails', async () => {
    // Read 1 is bindDelivery's; read 2 is pending's first check; read 3 its last.
    for (const failing of [2, 3]) {
      let reads: number = 0;
      const faulty = faultyDelivery(h, (real) => ({
        subscription: (id) => (++reads === failing ? storageDown() : real.subscription(id))
      }));
      expect(await drainer(faulty, 'alice').pending()).toFailWith(/storage down/);
    }
    const unlisted = faultyDelivery(h, () => ({ listOwed: async () => storageDown() }));
    expect(await drainer(unlisted, 'alice').pending()).toFailWith(/storage down/);
  });

  test('setSubscriptionDrain: a descriptor read or an in-writer record read that fails commits nothing', async () => {
    const descriptor = faultyDelivery(h, () => ({ subscription: () => storageDown() }));
    expect(
      await descriptor.broker.setSubscriptionDrain(owner(), {
        subscriptionId: 's1',
        drainPrincipals: ['bob']
      })
    ).toFailWith(/storage down/);
    const record = faultyDelivery(
      h,
      () => ({}),
      () => ({ readSubscription: async () => storageDown() })
    );
    expect(
      await record.broker.setSubscriptionDrain(owner(), { subscriptionId: 's1', drainPrincipals: ['bob'] })
    ).toFailWith(/storage down/);
    expect((await consumerRecord(h.repository, 's1')).drainPrincipals).toEqual(['alice']);
  });

  test('storage refuses a malformed drain change', async () => {
    const revision: number = (await consumerRecord(h.repository, 's1')).recordRevision;
    expect(
      await h.repository.withWriter((w) =>
        w.setSubscriptionDrain({
          subscriptionId: sid('s1'),
          expectedRecordRevision: revision,
          drainPrincipals: ['b', 'a']
        })
      )
    ).toFailWithDetail(/setSubscriptionDrain: .*unique and ascending/, code('invalid'));
  });
});
