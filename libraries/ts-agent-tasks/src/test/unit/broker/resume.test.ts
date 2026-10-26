/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  IBoundTaskWriter,
  ICreateTrackedTask,
  ITaskRepository,
  TaskId,
  taskListKind
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  IBrokerHarness,
  alpha,
  beta,
  bindWriter,
  brokerHarness,
  brokerRegistry,
  harnessOver,
  op,
  tid,
  track
} from '../../helpers/brokerFixtures';
import { jobKind, sourceHarness } from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

/** A broker over a root whose `task-<id>.json` write fails once, leaving that registration pending. */
async function withPending(
  id: string,
  create: (h: IBrokerHarness) => Promise<unknown>
): Promise<{ readonly h: IBrokerHarness; readonly faulty: FaultyRoot }> {
  const faulty = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
  const h = await brokerHarness({ root: faulty as unknown as FileTree.IFileTreeDirectoryItem });
  faulty.faults.push({ name: `task-${id}.json`, when: 'before', visibility: 'unchanged' });
  await create(h);
  return { h, faulty };
}

async function reopen(h: IBrokerHarness, root: FileTree.IFileTreeDirectoryItem): Promise<IBrokerHarness> {
  h.repository.close().orThrow();
  const { env } = environment('r');
  const opened = (
    await FileTreeTaskRepository.open({ root, mode: 'session', environment: env, registry: brokerRegistry() })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error('expected a ready repository');
  }
  return harnessOver(opened.repository, env, root);
}

function pendingIds(repository: ITaskRepository): ReadonlyArray<TaskId> {
  return repository
    .outstanding()
    .orThrow()
    .pendingRegistrations.map((p) => p.taskId);
}

describe('resumePendingRegistration — a native registration left pending', () => {
  test('the repository answers the pending registration with the request it stored', async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    expect(h.repository.pendingRegistration(tid('t'))).toSucceedAndSatisfy((pending) => {
      expect(pending).toEqual(
        expect.objectContaining({
          taskId: 't',
          operation: 'create-tracked',
          principalKey: 'alice',
          recordType: 'resolved',
          request: expect.objectContaining({ taskId: 't', title: 'the task' })
        })
      );
    });
    expect(h.repository.pendingRegistration(tid('nope'))).toSucceedWith(undefined);
  });

  test('resumes after a reopen from the stored request alone, and the task is then live', async () => {
    const { h, faulty } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    const r = await reopen(h, faulty as unknown as FileTree.IFileTreeDirectoryItem);
    expect(pendingIds(r.repository)).toEqual(['t']);
    expect(await r.writer.resumePendingRegistration(tid('t'))).toSucceedAndSatisfy((receipt) => {
      expect(receipt.taskId).toBe('t');
      expect(receipt.revision).toBe(1);
    });
    expect(pendingIds(r.repository)).toEqual([]);
    expect(await r.repository.read(tid('t'))).toSucceedAndSatisfy((read) => {
      expect(read?.state === 'resolved' && read.task.envelope.title).toBe('the task');
      expect(read?.state === 'resolved' && read.task.envelope.scopes).toEqual([alpha]);
    });
    // A second resume — the first one's response lost — replays the committed receipt.
    const first = (await r.repository.readCommit(tid('t'))).orThrow()!;
    expect(await r.writer.resumePendingRegistration(tid('t'))).toSucceedAndSatisfy((receipt) => {
      expect(receipt.taskId).toBe('t');
      expect(receipt.operationId).toBe(first.operations[0].operationId);
    });
    // And it is re-authorized: a policy that now denies the task's scope refuses the replay.
    r.policy.deny.push((request) => request.action === 'create');
    expect(await r.writer.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /'create' is not permitted/,
      code('not-found-or-denied')
    );
  });

  test('resumes a pending task list as a list', async () => {
    const { h } = await withPending('l', (h) =>
      h.writer.createTaskList({
        taskId: tid('l'),
        operationId: op('create-l'),
        title: 'the list',
        completion: 'manual'
      })
    );
    expect(await h.writer.resumePendingRegistration(tid('l'))).toSucceed();
    expect(await h.repository.read(tid('l'))).toSucceedAndSatisfy((read) => {
      expect(read?.state === 'resolved' && read.task.envelope.kind).toBe(taskListKind);
    });
  });

  test('create is authorized again at the resume: a policy that now denies it refuses, and the registration stays pending', async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    h.policy.deny.push((r) => r.action === 'create');
    expect(await h.writer.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /'create' is not permitted/,
      code('not-found-or-denied')
    );
    expect(pendingIds(h.repository)).toEqual(['t']);
    // Lifted, it resumes.
    h.policy.deny.splice(0);
    expect(await h.writer.resumePendingRegistration(tid('t'))).toSucceed();
  });

  test('a policy epoch that moves after the resume is authorized refuses it inside the writer', async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    h.policy.afterDecision = (request) => {
      if (request.action === 'create') {
        h.policy.epoch = 'epoch-2';
      }
    };
    expect(await h.writer.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /authorization policy/i,
      code('conflict')
    );
    expect(pendingIds(h.repository)).toEqual(['t']);
  });

  test("another principal's pending registration is answered exactly as an id with none", async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    const bob = bindWriter(h, { principal: 'bob' });
    const foreign = await bob.resumePendingRegistration(tid('t'));
    const none = await bob.resumePendingRegistration(tid('none'));
    expect(foreign).toFailWithDetail(/no pending registration t$/, code('not-found-or-denied'));
    expect(none).toFailWithDetail(/no pending registration none$/, code('not-found-or-denied'));
    expect(pendingIds(h.repository)).toEqual(['t']);
  });

  test('a record never written takes the resuming view’s creation scopes, which the stored request does not carry', async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    const wide = bindWriter(h, { scopes: [alpha, beta], creationScopes: [beta] });
    expect(await wide.resumePendingRegistration(tid('t'))).toSucceed();
    expect(await h.repository.read(tid('t'))).toSucceedAndSatisfy((read) => {
      expect(read?.state === 'resolved' && read.task.envelope.scopes).toEqual([beta]);
    });
  });

  test('a malformed id is invalid, and a live task replays its creation', async () => {
    const h = await brokerHarness();
    await track(h.writer, 'live');
    expect(await h.writer.resumePendingRegistration('' as TaskId)).toFailWithDetail(
      /resumePendingRegistration/,
      code('invalid')
    );
    // A live task its own catalog creation made is answered as a resume whose response was lost.
    expect(await h.writer.resumePendingRegistration(tid('live'))).toSucceedAndSatisfy((receipt) =>
      expect(receipt.taskId).toBe('live')
    );
  });

  test('a fenced repository refuses to answer which registrations are pending', async () => {
    const { h } = await withPending('t', (h) =>
      h.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    h.repository.close().orThrow();
    expect(await h.writer.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /closed/,
      code('storage-unavailable')
    );
  });
});

describe('resumePendingRegistration — an external registration left pending', () => {
  async function pendingExternal(): Promise<Awaited<ReturnType<typeof sourceHarness>>> {
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
    return h;
  }

  test('resumes through the broker under the principal it was accepted for', async () => {
    const h = await pendingExternal();
    expect(h.repository.pendingRegistration(tid('j1'))).toSucceedAndSatisfy((pending) => {
      expect(pending?.operation).toBe('register-external');
      expect(pending?.principalKey).toBe('host');
    });
    expect(await h.broker.resumePendingRegistration(tid('j1'))).toSucceedAndSatisfy((registered) => {
      expect(registered.state).toBe('unresolved');
    });
    expect(h.repository.pendingRegistration(tid('j1'))).toSucceedWith(undefined);
    // A second resume, its first response lost, replays the registration.
    expect(await h.broker.resumePendingRegistration(tid('j1'))).toSucceedAndSatisfy((registered) =>
      expect(registered.state).toBe('unresolved')
    );
  });

  test('each kind resumes only through its own entry point', async () => {
    const h = await pendingExternal();
    const writer = h.broker.bind({ principal: 'host', scopes: [alpha], authorization: h.policy }).orThrow();
    expect(await writer.resumePendingRegistration(tid('j1'))).toFailWithDetail(
      /external registration; resume it through TaskBroker/,
      code('invalid')
    );
    const native = await withPending('t', (n) =>
      n.writer.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'the task' })
    );
    expect(await native.h.broker.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /native registration; resume it through a bound writer/,
      code('invalid')
    );
    expect(await native.h.broker.resumePendingRegistration('' as TaskId)).toFailWithDetail(
      /resumePendingRegistration/,
      code('invalid')
    );
  });
});

describe('resumePendingRegistration — a record that landed before it was marked live', () => {
  /** The pending entry is written, the record lands, and the write marking it live fails. */
  async function landed(): Promise<{ readonly h: IBrokerHarness; readonly creator: IBoundTaskWriter }> {
    const faulty = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const h = await brokerHarness({
      root: faulty as unknown as FileTree.IFileTreeDirectoryItem,
      scopes: [alpha, beta]
    });
    const creator = bindWriter(h, { scopes: [alpha, beta], creationScopes: [alpha] });
    faulty.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(
      await creator.createTracked({ taskId: tid('t'), operationId: op('create-t'), title: 'secret task' })
    ).toFail();
    return { h, creator };
  }

  test('the repository reports the scopes the landed record carries', async () => {
    const { h } = await landed();
    expect(h.repository.pendingRegistration(tid('t'))).toSucceedAndSatisfy((pending) =>
      expect(pending?.landedScopes).toEqual([alpha])
    );
  });

  test('create is authorized against the landed record’s scopes, not the resuming view’s', async () => {
    const { h } = await landed();
    h.policy.deny.push(
      (request) => request.action === 'create' && (request.scopes ?? []).some((s) => s.key === alpha.key)
    );
    const elsewhere = bindWriter(h, { scopes: [alpha, beta], creationScopes: [beta] });
    expect(await elsewhere.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /'create' is not permitted/,
      code('not-found-or-denied')
    );
    expect(pendingIds(h.repository)).toEqual(['t']);
    expect(h.policy.calls.filter((c) => c.action === 'create').map((c) => c.scopes)).toContainEqual([alpha]);
    // Allowed again, it commits the record as it landed.
    h.policy.deny.splice(0);
    expect(await elsewhere.resumePendingRegistration(tid('t'))).toSucceed();
    expect(await h.repository.read(tid('t'))).toSucceedAndSatisfy((read) =>
      expect(read?.state === 'resolved' && read.task.envelope.scopes).toEqual([alpha])
    );
  });

  test('a view that does not select the landed scopes cannot resume it', async () => {
    const { h } = await landed();
    const narrow = bindWriter(h, { scopes: [beta] });
    expect(await narrow.resumePendingRegistration(tid('t'))).toFailWithDetail(
      /no pending registration t/,
      code('not-found-or-denied')
    );
    expect(pendingIds(h.repository)).toEqual(['t']);
  });

  test('an identical createTracked retry from a view with other creation scopes is refused, not adopted', async () => {
    const located = await landed();
    const { h } = located;
    const elsewhere = bindWriter(h, { scopes: [alpha, beta], creationScopes: [beta] });
    expect(
      await elsewhere.createTracked({ taskId: tid('t'), operationId: op('create-t-retry'), title: 'secret task' })
    ).toFail();
    const pending = h.repository.pendingRegistration(tid('t')).orThrow()!;
    const retry = await elsewhere.createTracked(pending.request as unknown as ICreateTrackedTask);
    expect(retry).toFailWithDetail(/landed with scopes other than/, code('conflict'));
    expect(pendingIds(h.repository)).toEqual(['t']);
    // Through the view it was created in, the same retry completes it.
    const { creator } = located;
    expect(await creator.createTracked(pending.request as unknown as ICreateTrackedTask)).toSucceed();
    expect(pendingIds(h.repository)).toEqual([]);
  });
});
