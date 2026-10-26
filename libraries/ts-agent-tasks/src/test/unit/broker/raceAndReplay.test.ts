/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  IBoundTaskWriter,
  ICreateTrackedTask,
  ITaskFailure,
  ITaskMutationResult,
  ITaskRepository,
  TaskBroker,
  TaskResult
} from '../../../index';
import { succeedWithDetail } from '@fgv/ts-utils';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  IBrokerHarness,
  TestPolicy,
  alpha,
  beta,
  bindWriter,
  brokerHarness,
  op,
  rev,
  tid
} from '../../helpers/brokerFixtures';
import { jobKind, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { memoryRoot } from '../../helpers/storageFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

/** A harness over a root whose `task-t.json` write fails once, leaving `t` pending, and two views. */
async function pendingT(): Promise<{
  readonly h: IBrokerHarness;
  readonly a: IBoundTaskWriter;
  readonly b: IBoundTaskWriter;
}> {
  const faulty = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
  const h = await brokerHarness({
    root: faulty as unknown as FileTree.IFileTreeDirectoryItem,
    scopes: [alpha, beta]
  });
  faulty.faults.push({ name: 'task-t.json', when: 'before', visibility: 'unchanged' });
  const a = bindWriter(h, { scopes: [alpha], creationScopes: [alpha] });
  expect(
    await a.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
  ).toFail();
  return { h, a, b: viewB(h) };
}

/** View B: selects and creates in beta only, and its policy forbids creating in alpha. */
function viewB(h: IBrokerHarness): IBoundTaskWriter {
  const policy = new TestPolicy();
  policy.deny.push((q) => q.action === 'create' && (q.scopes ?? []).some((s) => s.key === alpha.key));
  return bindWriter(h, { scopes: [beta], creationScopes: [beta], authorization: policy });
}

/** The invariant a race must keep: one success, committed in the winner's scopes; the loser refused. */
async function expectOneWinner(
  h: IBrokerHarness,
  results: ReadonlyArray<{
    readonly scopes: ReadonlyArray<typeof alpha>;
    readonly result: TaskResult<ITaskMutationResult>;
  }>,
  loserMessage: RegExp = /not found or not visible|not permitted/
): Promise<void> {
  const won = results.filter((r) => r.result.isSuccess());
  const lost = results.filter((r) => r.result.isFailure());
  expect(won).toHaveLength(1);
  expect(lost).toHaveLength(1);
  expect(lost[0].result).toFailWithDetail(loserMessage, code('not-found-or-denied'));
  const committed = (await h.repository.readCommit(tid('t'))).orThrow()!;
  expect(committed.recordType === 'resolved' && committed.task.envelope.scopes).toEqual(won[0].scopes);
}

describe('a resume that loses a race replays through the replay checks', () => {
  test('alpha first: the beta view, authorized only for beta, is refused rather than handed the alpha task', async () => {
    const { h, a, b } = await pendingT();
    const [ra, rb] = await Promise.all([
      a.resumePendingRegistration(tid('t')),
      b.resumePendingRegistration(tid('t'))
    ]);
    await expectOneWinner(
      h,
      [
        { scopes: [alpha], result: ra },
        { scopes: [beta], result: rb }
      ],
      /^resumePendingRegistration: no pending registration t$/
    );
  });

  test('beta first: whichever commits, the other is refused', async () => {
    const { h, a, b } = await pendingT();
    const [rb, ra] = await Promise.all([
      b.resumePendingRegistration(tid('t')),
      a.resumePendingRegistration(tid('t'))
    ]);
    await expectOneWinner(
      h,
      [
        { scopes: [alpha], result: ra },
        { scopes: [beta], result: rb }
      ],
      /^resumePendingRegistration: no pending registration t$/
    );
  });
});

describe('an identical createTracked that loses a race replays through the replay checks', () => {
  const request: ICreateTrackedTask = { taskId: tid('t'), operationId: op('create-t'), title: 'the task' };

  test('alpha first', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    const a = bindWriter(h, { scopes: [alpha], creationScopes: [alpha] });
    const b = viewB(h);
    const [ra, rb] = await Promise.all([a.createTracked(request), b.createTracked(request)]);
    await expectOneWinner(h, [
      { scopes: [alpha], result: ra },
      { scopes: [beta], result: rb }
    ]);
  });

  test('beta first', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    const a = bindWriter(h, { scopes: [alpha], creationScopes: [alpha] });
    const b = viewB(h);
    const [rb, ra] = await Promise.all([b.createTracked(request), a.createTracked(request)]);
    await expectOneWinner(h, [
      { scopes: [alpha], result: ra },
      { scopes: [beta], result: rb }
    ]);
  });

  test('a replay from a view with other creation scopes is authorized for the committed scopes', async () => {
    const h = await brokerHarness({ scopes: [alpha, beta] });
    const a = bindWriter(h, { scopes: [alpha, beta], creationScopes: [alpha] });
    expect(await a.createTracked(request)).toSucceed();
    h.policy.deny.push((q) => q.action === 'create' && (q.scopes ?? []).some((s) => s.key === alpha.key));
    const other = bindWriter(h, { scopes: [alpha, beta], creationScopes: [beta] });
    expect(await other.createTracked(request)).toFailWithDetail(
      /'create' is not permitted/,
      code('not-found-or-denied')
    );
  });
});

describe('an external registration replayed after a lost response', () => {
  test('replays even after its parent closed', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    expect(
      await h.writer.createTracked({ taskId: tid('p'), operationId: op('create-p'), title: 'parent' })
    ).toSucceed();
    const register = {
      taskId: tid('j1'),
      operationId: op('register-j1'),
      kind: jobKind,
      detailVersion: 1,
      title: 'j1',
      parentId: tid('p'),
      scopes: [alpha],
      binding: h.executor.binding('j1'),
      recovery: 'reattach'
    };
    expect(await h.broker.registerExternal('host', register)).toSucceed();
    expect(
      await h.writer.execute({
        taskId: tid('p'),
        operationId: op('cancel-p'),
        expectedRevision: rev(1),
        command: 'cancel',
        parameters: { reason: { code: 'done', summary: 'closed' } }
      })
    ).toSucceed();
    // The same registration again — its first response lost — replays.
    expect(await h.broker.registerExternal('host', register)).toSucceedAndSatisfy((r) =>
      expect(r.state).toBe('unresolved')
    );
    expect(await h.broker.resumePendingRegistration(tid('j1'))).toSucceed();
    // A different registration under the id is still refused.
    expect(await h.broker.registerExternal('host', { ...register, title: 'other' })).toFail();
  });
});

describe('resumeNative and a pending external registration', () => {
  test('a view that selects none of its scopes is told nothing about it', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const h = await sourceHarness({ root: root as unknown as FileTree.IFileTreeDirectoryItem });
    h.executor.addJob('j1');
    root.faults.push({ name: 'task-j1.json', when: 'before', visibility: 'unchanged' });
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op('register-j1'),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach'
      })
    ).toFail();
    const blind = h.broker.bind({ principal: 'host', scopes: [beta], authorization: h.policy }).orThrow();
    expect(await blind.resumePendingRegistration(tid('j1'))).toFailWithDetail(
      /no pending registration j1$/,
      code('not-found-or-denied')
    );
    const seeing = h.broker.bind({ principal: 'host', scopes: [alpha], authorization: h.policy }).orThrow();
    expect(await seeing.resumePendingRegistration(tid('j1'))).toFailWithDetail(
      /external registration/,
      code('invalid')
    );
  });
});

describe('resumeNative and a live external registration', () => {
  test('is pointed at the broker only when the view selects the live task’s scopes', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op('register-j1'),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach'
      })
    ).toSucceed();
    const seeing = h.broker.bind({ principal: 'host', scopes: [alpha], authorization: h.policy }).orThrow();
    expect(await seeing.resumePendingRegistration(tid('j1'))).toFailWithDetail(
      /external registration/,
      code('invalid')
    );
    const blind = h.broker.bind({ principal: 'host', scopes: [beta], authorization: h.policy }).orThrow();
    expect(await blind.resumePendingRegistration(tid('j1'))).toFailWithDetail(
      /no pending registration j1$/,
      code('not-found-or-denied')
    );
  });
});

describe('an identical external registration that loses a race', () => {
  test('replays the registration the winner committed', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    const register = {
      taskId: tid('j1'),
      operationId: op('register-j1'),
      kind: jobKind,
      detailVersion: 1,
      title: 'j1',
      scopes: [alpha],
      binding: h.executor.binding('j1'),
      recovery: 'reattach'
    };
    // Hold the first registration inside the writer until the second has read and found nothing.
    const gate: { release?: () => void; held: boolean } = { held: true };
    const broker = TaskBroker.create({
      repository: h.repository,
      environment: h.env,
      sources: [h.source],
      writeGuard: {
        guard: async <T>(write: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> => {
          if (gate.held) {
            gate.held = false;
            await new Promise<void>((resolve) => (gate.release = resolve));
          }
          return write();
        }
      }
    }).orThrow();
    const firstCall = broker.registerExternal('host', register);
    await new Promise((resolve) => setImmediate(resolve));
    const secondCall = broker.registerExternal('host', register);
    await new Promise((resolve) => setImmediate(resolve));
    gate.release!();
    const [first, second] = await Promise.all([firstCall, secondCall]);
    expect(first).toSucceedAndSatisfy((r) => expect(r.state).toBe('unresolved'));
    expect(second).toSucceedAndSatisfy((r) => expect(r.state).toBe('unresolved'));
  });
});

describe('retries are bounded when the repository keeps missing the live task', () => {
  /** A repository whose outside-the-writer `readCommit` never sees a task; the writer's does. */
  function lagging(real: ITaskRepository): ITaskRepository {
    return new Proxy(real, {
      get(target: ITaskRepository, key: string | symbol): unknown {
        if (key === 'readCommit') {
          return async () => succeedWithDetail<undefined, ITaskFailure>(undefined);
        }
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  }

  test('a creation answers conflict after one retry, instead of looping', async () => {
    const h = await brokerHarness();
    expect(
      await h.writer.createTracked({ taskId: tid('x'), operationId: op('create-x'), title: 'x' })
    ).toSucceed();
    const broker = TaskBroker.create({ repository: lagging(h.repository), environment: h.env }).orThrow();
    const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: h.policy }).orThrow();
    const again = await writer.createTracked({ taskId: tid('x'), operationId: op('create-x-2'), title: 'x' });
    expect(again).toFailWithDetail(/kept changing/, code('conflict'));
    expect(again.detail?.retry).toBe('safe');
  });

  test('an external registration answers conflict after one retry, instead of looping', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { unresolved: true });
    const broker = TaskBroker.create({
      repository: lagging(h.repository),
      environment: h.env,
      sources: [h.source]
    }).orThrow();
    const again = await broker.registerExternal('host', {
      taskId: tid('j1'),
      operationId: op('register-j1-2'),
      kind: jobKind,
      detailVersion: 1,
      title: 'job j1',
      scopes: [alpha],
      binding: h.executor.binding('j1'),
      recovery: 'reattach'
    });
    expect(again).toFailWithDetail(/kept changing/, code('conflict'));
  });
});

describe('an external replay is idempotent whatever became of its source', () => {
  test('a committed source-replay registration replays after its source is detached', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    const request = {
      taskId: tid('j1'),
      operationId: op('register-j1'),
      kind: jobKind,
      detailVersion: 1,
      title: 'job j1',
      scopes: [alpha],
      binding: h.executor.binding('j1'),
      recovery: 'reattach',
      history: {
        history: 'source-replay',
        envelope: { remainingRequiredUpdates: 16, remainingRequiredBytes: 16 * 1024 }
      }
    };
    expect(await h.broker.registerExternal('host', request)).toSucceed();
    // No source attached: a first registration would be refused; its replay is not.
    const detached = TaskBroker.create({ repository: h.repository, environment: h.env }).orThrow();
    expect(
      await detached.registerExternal('host', { ...request, taskId: tid('j2'), operationId: op('r-j2') })
    ).toFailWithDetail(/not an attached source-replay source/, code('unsupported'));
    expect(await detached.registerExternal('host', request)).toSucceed();
  });
});
