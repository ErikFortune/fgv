/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { failWithDetail, succeed } from '@fgv/ts-utils';
import {
  IResolvedTaskCommitRecord,
  ITaskAuthorization,
  ITaskFailure,
  OperationId,
  TaskBroker,
  TaskEnvironment,
  TaskId,
  TaskResult,
  TaskRevision
} from '../../../index';
import { alpha, op, revisionOf, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  deliveryHarness,
  faultyDelivery,
  subscribed
} from '../../helpers/deliveryFixtures';

// Every failure a disposition, closure, abandonment or cleanup can meet from the repository, the
// policy or the clock is propagated — nothing is written, and nothing is reported done.

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

const brokenEpoch: ITaskAuthorization = {
  check: async () => succeed(true),
  policyEpoch: (): string => {
    throw new Error('epoch gone');
  }
};

function host(
  h: IDeliveryHarness,
  authorization: ITaskAuthorization = h.policy
): Parameters<TaskBroker['dispose']>[0] {
  return { principal: 'alice', scopes: [alpha], authorization };
}

async function owing(): Promise<IDeliveryHarness> {
  const h = await deliveryHarness();
  await subscribed(h, 'sub');
  await track(h.writer, 't');
  return h;
}

/** Records an external intent that was never sent on tracked task `t`: something abandonable. */
async function plantIntent(h: IDeliveryHarness): Promise<void> {
  const current = (await h.repository.readCommit('t' as TaskId)).orThrow() as IResolvedTaskCommitRecord;
  const operationId = 'intent-1' as OperationId;
  const request = {
    taskId: 't' as TaskId,
    operationId,
    expectedRevision: 1 as TaskRevision,
    command: 'pause',
    parameters: {}
  };
  (
    await h.repository.withWriter((w) =>
      w.commit({
        purpose: 'operation',
        operationId,
        taskId: 't' as TaskId,
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: {
          recordType: 'resolved',
          task: current.task,
          operations: [
            ...current.operations,
            {
              type: 'command',
              operationId,
              request,
              principalKey: 'host',
              dispatch: 'not-sent',
              receipt: { taskId: 't' as TaskId, operationId, command: 'pause', result: { state: 'accepted' } }
            }
          ],
          updates: current.updates,
          archived: false
        }
      })
    )
  ).orThrow();
}

const dispose = { subscriptionId: 'sub', updateIds: ['t:1:0'], reason: 'r' };
const closeDispose = { subscriptionId: 'sub', obligations: 'dispose', reason: 'r' };

describe('dispose: failures are propagated, nothing is written', () => {
  test('an unreadable policy epoch', async () => {
    const h = await owing();
    expect(await h.broker.dispose(host(h, brokenEpoch), dispose)).toFailWith(/policy epoch unavailable/);
  });

  test('a subscription lookup that fails', async () => {
    const h = await owing();
    const f = faultyDelivery(h, () => ({ subscription: () => storageDown() }));
    expect(await f.broker.dispose(host(f), dispose)).toFailWith(/storage down/);
  });

  test('a task read that fails while authorizing', async () => {
    const h = await owing();
    const f = faultyDelivery(h, () => ({ readCommit: async () => storageDown() }));
    expect(await f.broker.dispose(host(f), dispose)).toFailWith(/storage down/);
  });

  test('an id naming a task that does not exist is the one denial', async () => {
    const h = await owing();
    expect(await h.broker.dispose(host(h), { ...dispose, updateIds: ['ghost:1:0'] })).toFailWithDetail(
      /not found or not permitted/,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
  });

  test("the subscription's record, or a fenced task, unreadable inside the writer", async () => {
    const h = await owing();
    const noRecord = faultyDelivery(
      h,
      () => ({}),
      () => ({ readSubscription: async () => storageDown() })
    );
    expect(await noRecord.broker.dispose(host(noRecord), dispose)).toFailWith(/storage down/);
    const noTask = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    expect(await noTask.broker.dispose(host(noTask), dispose)).toFailWith(/storage down/);
  });

  test('a host clock that fails', async () => {
    const h = await owing();
    const env = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('x')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: env }).orThrow();
    expect(await broker.dispose(host(h), dispose)).toFail();
  });

  test('a disposal storage refuses — an authorized task, an id it does not owe', async () => {
    const h = await owing();
    expect(await h.broker.dispose(host(h), { ...dispose, updateIds: ['t:9:0'] })).toFailWithDetail(
      /not owed/,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('closeSubscription: failures are propagated, nothing is written', () => {
  test('an unreadable policy epoch, or a subscription lookup that fails', async () => {
    const h = await owing();
    expect(await h.broker.closeSubscription(host(h, brokenEpoch), closeDispose)).toFailWith(
      /policy epoch unavailable/
    );
    const f = faultyDelivery(h, () => ({ subscription: () => storageDown() }));
    expect(await f.broker.closeSubscription(host(f), closeDispose)).toFailWith(/storage down/);
  });

  test('the owed capture fails, before or inside the writer', async () => {
    const h = await owing();
    const before = faultyDelivery(h, () => ({ listOwed: async () => storageDown() }));
    expect(await before.broker.closeSubscription(host(before), closeDispose)).toFailWith(/storage down/);
    let calls = 0;
    const inside = faultyDelivery(h, (r) => ({
      listOwed: async (q) => (++calls > 1 ? storageDown() : r.listOwed(q))
    }));
    expect(await inside.broker.closeSubscription(host(inside), closeDispose)).toFailWith(/storage down/);
  });

  test('an owed task that cannot be read while authorizing', async () => {
    const h = await owing();
    const f = faultyDelivery(h, () => ({ readCommit: async () => storageDown() }));
    expect(await f.broker.closeSubscription(host(f), closeDispose)).toFailWith(/storage down/);
  });

  test("the subscription's record, a fenced task, or the closure write, failing inside the writer", async () => {
    const h = await owing();
    for (const patch of ['readSubscription', 'readCommit', 'closeSubscription'] as const) {
      const f = faultyDelivery(
        h,
        () => ({}),
        () => ({ [patch]: async () => storageDown() })
      );
      expect(await f.broker.closeSubscription(host(f), closeDispose)).toFailWith(/storage down/);
    }
    expect(h.repository.subscription('sub' as never)).toSucceedAndSatisfy((d) =>
      expect(d!.state).toBe('active')
    );
  });

  test('an owed task that keeps moving after authorization: bounded retries, then a safe conflict', async () => {
    const h = await owing();
    const policy = h.policy;
    let moves = 0;
    policy.afterDecision = async (r) => {
      if (r.action === 'dispose-obligation' && r.task !== undefined) {
        moves++;
        (
          await h.writer.updateTracked({
            taskId: tid('t'),
            operationId: op(),
            expectedRevision: await revisionOf(h.repository, 't'),
            patch: { title: `moved ${moves}` }
          })
        ).orThrow();
      }
    };
    expect(await h.broker.closeSubscription(host(h), closeDispose)).toFailWithDetail(
      /kept changing/,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    expect(moves).toBe(3);
  });
});

describe('abandonCommand and cleanup: failures are propagated', () => {
  test('abandon: an unreadable epoch, a failed read before or inside the writer, a failed write', async () => {
    const h = await owing();
    const request = { taskId: 't', operationId: 'nope', reason: 'r' };
    expect(await h.broker.abandonCommand(host(h, brokenEpoch), request)).toFailWith(
      /policy epoch unavailable/
    );
    const outside = faultyDelivery(h, () => ({ readCommit: async () => storageDown() }));
    expect(await outside.broker.abandonCommand(host(outside), request)).toFailWith(/storage down/);
    const inside = faultyDelivery(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    expect(await inside.broker.abandonCommand(host(inside), request)).toFailWith(/storage down/);
  });

  test('abandon: a write that fails is propagated, and the intent stays open', async () => {
    const h = await owing();
    await plantIntent(h);
    const f = faultyDelivery(
      h,
      () => ({}),
      () => ({ commit: async () => storageDown() })
    );
    expect(
      await f.broker.abandonCommand(host(f), { taskId: 't', operationId: 'intent-1', reason: 'r' })
    ).toFailWith(/storage down/);
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 't', operationId: 'intent-1', reason: 'r' })
    ).toSucceedAndSatisfy((receipt) =>
      expect(receipt.result).toEqual({ state: 'abandoned', reason: 'r', from: 'not-sent' })
    );
  });

  test('abandon: a bad binding is refused before anything is read', async () => {
    const h = await owing();
    expect(
      await h.broker.abandonCommand({ principal: '', scopes: [], authorization: h.policy }, { taskId: 't' })
    ).toFail();
  });

  test('cleanup: a failed candidate read, record read or prune', async () => {
    const h = await owing();
    await succeedTask(h, h.writer, 't');
    (await h.broker.dispose(host(h), { ...dispose, updateIds: ['t:1:0', 't:2:0', 't:2:3'] })).orThrow();
    const candidates = faultyDelivery(h, () => ({ prunableTasks: async () => storageDown() }));
    expect(await candidates.broker.cleanup({ limit: 10 })).toFailWith(/storage down/);
    for (const patch of ['readCommit', 'pruneTask'] as const) {
      const f = faultyDelivery(
        h,
        () => ({}),
        () => ({ [patch]: async () => storageDown() })
      );
      expect(await f.broker.cleanup({ limit: 10 })).toFailWith(/storage down/);
    }
    expect(await h.broker.cleanup({ limit: 10 })).toSucceedWith({ pruned: [tid('t')], unchanged: [] });
  });
});
