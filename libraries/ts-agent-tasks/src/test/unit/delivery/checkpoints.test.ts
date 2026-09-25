/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCheckpointStore,
  SubscriptionId,
  TaskId,
  TaskRevision,
  taskUpdateId
} from '../../../index';
import { brokerRegistry, succeedTask, track } from '../../helpers/brokerFixtures';
import {
  CheckpointFault,
  IDeliveryHarness,
  InMemoryCheckpointStore,
  TestClock,
  clockedEnvironment,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  harnessFor,
  pendingIds,
  reopen,
  subscribeAs,
  subscribed
} from '../../helpers/deliveryFixtures';
import { memoryRoot, nodeRoot } from '../../helpers/storageFixtures';

const uid = (task: string, revision: number, category: Parameters<typeof taskUpdateId>[2]): string =>
  taskUpdateId(task as TaskId, revision as TaskRevision, category);

function consumerFiles(root: FileTree.IFileTreeDirectoryItem): string[] {
  return root
    .getChildren()
    .orThrow()
    .map((c) => c.name)
    .filter((n) => n.startsWith('consumer-'));
}

describe('an injected checkpoint store holds the subscriptions', () => {
  let store: InMemoryCheckpointStore;
  let h: IDeliveryHarness;
  beforeEach(async () => {
    store = new InMemoryCheckpointStore();
    h = await deliveryHarness({ checkpoints: store });
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    await track(h.writer, 'b');
  });

  test('records live in the store, not the root', async () => {
    expect(Array.from(store.records.keys())).toEqual(['sub']);
    expect(consumerFiles(h.root)).toEqual([]);
  });

  test('an acknowledgement survives reopen through the same store', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    (await delivery.acknowledge(context.context.receipt)).orThrow();
    await succeedTask(h, h.writer, 'a');
    const later = await reopen(h);
    expect(await pendingIds(deliveryOf(later, 'sub'))).toEqual([
      uid('a', 2, 'lifecycle'),
      uid('a', 2, 'result')
    ]);
    expect((await consumerRecord(later.repository, 'sub')).acknowledged).toEqual([
      uid('a', 1, 'lifecycle'),
      uid('b', 1, 'lifecycle')
    ]);
  });

  test('an issued receipt survives reopen and is acknowledged after it', async () => {
    const context = (await deliveryOf(h, 'sub').prepare()).orThrow();
    const later = await reopen(h);
    expect(
      (await deliveryOf(later, 'sub').acknowledge(context.context.receipt)).orThrow().newlyAcknowledged
    ).toEqual([uid('a', 1, 'lifecycle'), uid('b', 1, 'lifecycle')]);
  });

  test('the subscription itself survives reopen, and keeps being owed updates', async () => {
    const later = await reopen(h);
    expect(later.repository.subscription('sub' as SubscriptionId)).toSucceedAndSatisfy((s) =>
      expect(s?.consumerId).toBe('consumer-sub')
    );
    await track(later.writer, 'c');
    expect(await pendingIds(deliveryOf(later, 'sub'))).toEqual([
      uid('a', 1, 'lifecycle'),
      uid('b', 1, 'lifecycle'),
      uid('c', 1, 'lifecycle')
    ]);
  });
});

describe('a checkpoint store that fails is never trusted into an acknowledgeable context', () => {
  let store: InMemoryCheckpointStore;
  let h: IDeliveryHarness;
  beforeEach(async () => {
    store = new InMemoryCheckpointStore();
    h = await deliveryHarness({ checkpoints: store });
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
  });

  test.each<[CheckpointFault, RegExp, string]>([
    ['neutered', /reported a write it does not hold/i, 'storage-corrupt'],
    ['stale', /reported a write it does not hold|returned record/i, 'storage-corrupt'],
    ['throw', /exploded/i, 'storage-corrupt'],
    ['foreign', /returned subscription/i, 'storage-corrupt'],
    ['garbage', /checkpoint sub/i, 'storage-corrupt'],
    ['fail-unknown', /may have landed/i, 'storage-unavailable'],
    ['not-a-result', /may have landed/i, 'storage-unavailable']
  ])(
    'a store that is %s: prepare returns nothing and the repository fences',
    async (fault, message, code) => {
      await subscribed(h, 'other');
      store.fault = fault;
      const delivery = deliveryOf(h, 'sub');
      expect(await delivery.prepare()).toFailWithDetail(message, expect.objectContaining({ code }));
      expect(h.repository.health().state).toBe('unavailable');
      // Nothing more is served until the repository is rebuilt from what the store actually holds.
      expect(await delivery.pending()).toFail();
      store.fault = 'none';
      expect(await h.repository.rebuildIndexes()).toSucceed();
      // Whatever landed, nothing was acknowledged: the obligation is still owed.
      expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([uid('a', 1, 'lifecycle')]);
    }
  );

  test('a store that fails saying nothing changed leaves the repository usable, and the call retryable', async () => {
    store.fault = 'fail-unchanged';
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.prepare()).toFailWithDetail(
      /before anything became visible/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(h.repository.health().state).toBe('ready');
    store.fault = 'none';
    expect(await delivery.prepare()).toSucceed();
  });

  test('an acknowledgement through a store that stops persisting is refused, never reported', async () => {
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    store.fault = 'neutered';
    expect(await delivery.acknowledge(context.context.receipt)).toFailWithDetail(
      /reported a write it does not hold/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    store.fault = 'none';
    (await h.repository.rebuildIndexes()).orThrow();
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([uid('a', 1, 'lifecycle')]);
  });

  test("a store that answers another subscription's record at open blocks the open", async () => {
    await subscribed(h, 'other');
    h.repository.close().orThrow();
    store.fault = 'foreign';
    const { env } = clockedEnvironment(h.clock);
    const opened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: env,
        registry: brokerRegistry(),
        checkpoints: store
      })
    ).orThrow();
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues.map((i) => i.code)).toContain('record-invalid');
      opened.recovery.close();
    }
  });

  test('a store that loses a named record blocks the open', async () => {
    h.repository.close().orThrow();
    store.records.clear();
    const { env } = clockedEnvironment(h.clock);
    const opened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: env,
        registry: brokerRegistry(),
        checkpoints: store
      })
    ).orThrow();
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues).toEqual([
        expect.objectContaining({ code: 'record-missing', recordName: 'consumer-sub.json' })
      ]);
      opened.recovery.close();
    }
  });

  test('a store that throws at open blocks the open', async () => {
    h.repository.close().orThrow();
    store.fault = 'throw';
    const { env } = clockedEnvironment(h.clock);
    const opened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: env,
        registry: brokerRegistry(),
        checkpoints: store
      })
    ).orThrow();
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues.map((i) => i.code)).toEqual(['unreadable']);
      opened.recovery.close();
    }
  });

  test('registering over a record the store already holds, which this repository never wrote, is refused', async () => {
    const stray = structuredClone(store.records.get('sub')!);
    store.records.set('stray', { ...stray, id: 'stray' as SubscriptionId });
    expect(await subscribeAs(h, 'stray')).toFailWithDetail(
      /already holds a record this repository never committed/i,
      expect.objectContaining({ code: 'conflict' })
    );
  });
});

describe('durability: a weak checkpoint cannot be paired with durable task state', () => {
  test('a process-crash repository refuses a session store, at initialize and at open', async () => {
    const { root } = nodeRoot();
    const clock = new TestClock();
    const { env } = clockedEnvironment(clock);
    expect(
      await FileTreeTaskRepository.initialize({
        root,
        mode: { durable: 'process-crash' },
        environment: env,
        registry: brokerRegistry(),
        checkpoints: new InMemoryCheckpointStore('session')
      })
    ).toFailWithDetail(/not process-crash durable/i, expect.objectContaining({ code: 'unsupported' }));
    const created = (
      await FileTreeTaskRepository.initialize({
        root,
        mode: { durable: 'process-crash' },
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    created.close().orThrow();
    expect(
      await FileTreeTaskRepository.open({
        root,
        mode: { durable: 'process-crash' },
        environment: env,
        registry: brokerRegistry(),
        checkpoints: new InMemoryCheckpointStore('session')
      })
    ).toFailWithDetail(/not process-crash durable/i, expect.objectContaining({ code: 'unsupported' }));
  });

  test('a store whose durability cannot be read is refused', async () => {
    const odd: ITaskCheckpointStore = {
      get durability(): 'session' {
        throw new Error('no');
      },
      read: () => {
        throw new Error('unused');
      },
      write: () => {
        throw new Error('unused');
      }
    };
    const clock = new TestClock();
    const { env } = clockedEnvironment(clock);
    expect(
      await FileTreeTaskRepository.initialize({
        root: memoryRoot(),
        mode: 'session',
        environment: env,
        registry: brokerRegistry(),
        checkpoints: odd
      })
    ).toFailWithDetail(/not process-crash durable/i, expect.objectContaining({ code: 'unsupported' }));
  });

  test('a durable policy is refused over a session repository, and over a durable one with a session-only store', async () => {
    const h = await deliveryHarness();
    expect(await subscribeAs(h, 'sub', { policy: { durability: 'process-crash' } })).toFailWithDetail(
      /session-only/i,
      expect.objectContaining({ code: 'unsupported' })
    );
  });

  test('a process-crash subscription, reopened in a session repository, refuses delivery rather than weaken it', async () => {
    const { root } = nodeRoot();
    const h = await deliveryHarness({ root, mode: { durable: 'process-crash' } });
    await subscribed(h, 'sub', { policy: { durability: 'process-crash' } });
    await track(h.writer, 'a');
    h.repository.close().orThrow();
    const clock = new TestClock();
    const { env, logger } = clockedEnvironment(clock);
    const opened = (
      await FileTreeTaskRepository.open({
        root,
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      const weak = harnessFor(opened.repository, env, logger, root, clock);
      expect(await deliveryOf(weak, 'sub').prepare()).toFailWithDetail(
        /requires process-crash delivery/i,
        expect.objectContaining({ code: 'unsupported' })
      );
      // Reading what is owed is still possible; nothing is acknowledged under the weaker guarantee.
      expect(await pendingIds(deliveryOf(weak, 'sub'))).toEqual([uid('a', 1, 'lifecycle')]);
      opened.repository.close();
    }
  });

  test('the default durable store keeps subscriptions in the root, strictly decoded', async () => {
    const { root } = nodeRoot();
    const h = await deliveryHarness({ root, mode: { durable: 'process-crash' } });
    await subscribed(h, 'sub', { policy: { durability: 'process-crash' } });
    await track(h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    expect(consumerFiles(root)).toEqual(['consumer-sub.json']);
    const later = await reopen(h);
    expect((await consumerRecord(later.repository, 'sub')).acknowledged).toEqual([uid('a', 1, 'lifecycle')]);
    later.repository.close();
  });
});
