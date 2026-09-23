/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  FileTreeTaskRepository,
  ITaskMutationResult,
  ITaskOutcome,
  OperationId,
  TaskId,
  TaskResult,
  checkListCompletion
} from '../../../index';
import {
  IBrokerHarness,
  bindWriter,
  brokerHarness,
  brokerRegistry,
  command,
  harnessOver,
  list,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';
import { environment, registry } from '../../helpers/storageFixtures';

const outcome: ITaskOutcome = { summary: 'all done', artifacts: [] };

async function status(h: IBrokerHarness, id: string): Promise<string | undefined> {
  const record = (await h.repository.readCommit(tid(id))).orThrow()!;
  return record.recordType === 'resolved' ? record.task.envelope.lifecycle.status : undefined;
}

async function complete(h: IBrokerHarness, id: string): Promise<TaskResult<ITaskMutationResult>> {
  return h.writer.completeList({
    taskId: tid(id),
    operationId: op(),
    expectedRevision: await revisionOf(h.repository, id),
    outcome
  });
}

async function pump(h: IBrokerHarness, limit: number = 10): Promise<ReadonlyArray<string>> {
  return (await h.writer.reconcileListCompletions({ limit })).orThrow().completed.map((c) => c.taskId);
}

async function candidates(h: IBrokerHarness): Promise<ReadonlyArray<TaskId>> {
  return (await h.repository.listCompletionCandidates({ limit: 200 })).orThrow();
}

describe('list policy', () => {
  test('counts the complete child set, and never names a blocking child', () => {
    const id = tid('l');
    expect(checkListCompletion(id, [], false)).toSucceedWith(0);
    expect(checkListCompletion(id, [], true)).toFailWith(/no children/);
    expect(
      checkListCompletion(
        id,
        [
          { id: tid('a'), state: 'resolved', status: 'succeeded', archived: true },
          { id: tid('secret'), state: 'unresolved', archived: false }
        ],
        true
      )
    ).toFailWith(/^list l: 1 child task\(s\) have not succeeded$/);
  });
});

describe('empty, manual and automatic lists', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
  });

  test('an empty automatic list is never a candidate; it completes only explicitly', async () => {
    await list(h.writer, 'l');
    expect(await candidates(h)).toEqual([]);
    expect(await pump(h)).toEqual([]);
    expect(await complete(h, 'l')).toSucceedWith(
      expect.objectContaining({ disposition: 'changed', revision: 2 })
    );
    expect(await status(h, 'l')).toBe('succeeded');
  });

  test('an empty manual list completes explicitly', async () => {
    await list(h.writer, 'l', 'manual');
    expect(await complete(h, 'l')).toSucceed();
  });

  test('a manual list whose children all succeeded is never a candidate', async () => {
    await list(h.writer, 'l', 'manual');
    await track(h.writer, 'c', { parentId: 'l' });
    await succeedTask(h, h.writer, 'c');
    expect(await candidates(h)).toEqual([]);
    expect(await pump(h)).toEqual([]);
    expect(await complete(h, 'l')).toSucceed();
  });

  test('explicit completion needs every child succeeded, and a completed list is not completed again', async () => {
    await list(h.writer, 'l');
    await track(h.writer, 'a', { parentId: 'l' });
    await track(h.writer, 'b', { parentId: 'l' });
    await succeedTask(h, h.writer, 'a');
    expect(await complete(h, 'l')).toFailWith(/1 child task\(s\) have not succeeded/);
    await command(h, h.writer, 'b', 'fail', { reason: { code: 'x', summary: 'broke' } });
    // A failed child leaves the list open for host action.
    expect(await candidates(h)).toEqual([]);
    expect(await complete(h, 'l')).toFailWith(/have not succeeded/);
    expect(
      await command(h, h.writer, 'l', 'fail', { reason: { code: 'x', summary: 'child failed' } })
    ).toEqual(expect.objectContaining({ result: { state: 'applied', appliedRevision: 2 } }));
    expect(await complete(h, 'l')).toFailWith(/already complete/);
  });

  test('completeList is for lists only', async () => {
    await track(h.writer, 't');
    expect(await complete(h, 't')).toFailWith(/is not a task list/);
  });
});

describe('the completion pump', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await list(h.writer, 'l');
    await track(h.writer, 'a', { parentId: 'l' });
    await track(h.writer, 'b', { parentId: 'l' });
  });

  test('a list becomes a candidate when its last child succeeds, and the pump completes it', async () => {
    await succeedTask(h, h.writer, 'a');
    expect(await candidates(h)).toEqual([]);
    await succeedTask(h, h.writer, 'b');
    expect(await candidates(h)).toEqual(['l']);
    // Child success returned without completing the parent: completion is a separate, pumped step.
    expect(await status(h, 'l')).toBe('pending');
    const report = (await h.writer.reconcileListCompletions({ limit: 10 })).orThrow();
    expect(report.completed).toEqual([
      expect.objectContaining({
        taskId: 'l',
        revision: 2,
        operationId: 'complete-list-r1',
        disposition: 'changed'
      })
    ]);
    const record = (await h.repository.readCommit(tid('l'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle).toEqual({
      status: 'succeeded',
      outcome: { summary: 'All 2 child task(s) succeeded.', artifacts: [] }
    });
    expect(await candidates(h)).toEqual([]);
    expect(await pump(h)).toEqual([]);
  });

  test("a caller operation already holding the pump's key does not block the list: the pump takes the next key", async () => {
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    // An unchanged reassignment records its id without moving the list's revision — here, the id
    // the pump derives from that revision, and then the next in its sequence.
    for (const claimed of ['complete-list-r1', 'complete-list-r1-1']) {
      expect(
        await h.writer.reassign({
          taskId: tid('l'),
          operationId: claimed as OperationId,
          expectedRevision: rev(1),
          responsibility: 'unassigned'
        })
      ).toSucceedWith(expect.objectContaining({ disposition: 'unchanged' }));
    }
    const report = (await h.writer.reconcileListCompletions({ limit: 10 })).orThrow();
    expect(report.completed).toEqual([
      expect.objectContaining({ taskId: 'l', operationId: 'complete-list-r1-2', disposition: 'changed' })
    ]);
    expect(await status(h, 'l')).toBe('succeeded');
  });

  test('completing a list makes its parent list eligible in turn', async () => {
    await list(h.writer, 'outer');
    await h.writer.reparent({
      taskId: tid('l'),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, 'l'),
      parent: { taskId: tid('outer') }
    });
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    expect(await pump(h)).toEqual(['l']);
    expect(await pump(h)).toEqual(['outer']);
  });

  test('hidden children count, and a hidden unfinished child blocks without being named', async () => {
    h.policy.hide('b');
    await succeedTask(h, h.writer, 'a');
    expect(await complete(h, 'l')).toFailWith(/^list l: 1 child task\(s\) have not succeeded$/);
    const other = bindWriter(h, { principal: 'b-owner' });
    // b's owner can see it; the list's completer cannot. The list still completes on b's success.
    h.policy.deny.splice(0);
    await succeedTask(h, other, 'b');
    h.policy.hide('b');
    expect(await pump(h)).toEqual(['l']);
  });

  test('a principal without complete-list authority completes nothing; the candidate stays', async () => {
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    h.policy.denyOn('complete-list', 'l');
    expect(await pump(h)).toEqual([]);
    expect(await candidates(h)).toEqual(['l']);
    h.policy.hide('l');
    expect(await pump(h)).toEqual([]);
  });

  test('membership that changes after the pump authorizes a candidate is rechecked under the writer', async () => {
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    const other = bindWriter(h, { principal: 'late' });
    const policy = h.policy;
    policy.afterDecision = async (request) => {
      if (request.action === 'complete-list') {
        policy.afterDecision = undefined;
        // A new, unfinished child joins after authorization and before the gated completion.
        await track(other, 'late', { parentId: 'l' });
      }
    };
    expect(await pump(h)).toEqual([]);
    expect(await status(h, 'l')).toBe('pending');
    expect(await candidates(h)).toEqual([]);
  });

  test('an unresolved child prevents completion; so does an unreadable one', async () => {
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    await registerVendor(h, 'u', { unresolved: true, parentId: 'l' });
    expect(await candidates(h)).toEqual([]);
    expect(await complete(h, 'l')).toFailWith(/1 child task\(s\) have not succeeded/);
  });

  test('archived children count by their final status', async () => {
    await succeedTask(h, h.writer, 'a');
    (
      await h.writer.archive({
        taskId: tid('a'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'a')
      })
    ).orThrow();
    await succeedTask(h, h.writer, 'b');
    expect(await candidates(h)).toEqual(['l']);
    expect(await pump(h)).toEqual(['l']);
  });

  test('a pass is bounded and resumable', async () => {
    for (const id of ['m', 'n']) {
      await list(h.writer, id);
      await track(h.writer, `${id}-child`, { parentId: id });
      await succeedTask(h, h.writer, `${id}-child`);
    }
    const first = (await h.writer.reconcileListCompletions({ limit: 1 })).orThrow();
    expect(first.completed.map((c) => c.taskId)).toEqual(['m']);
    expect(first.next).toBe('m');
    const second = (await h.writer.reconcileListCompletions({ limit: 1, after: first.next })).orThrow();
    expect(second.completed.map((c) => c.taskId)).toEqual(['n']);
    expect(await h.writer.reconcileListCompletions({ limit: 0 })).toFailWith(/reconcileListCompletions/);
  });

  test('the idempotency key names the list and its eligibility revision', async () => {
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    (await h.writer.reconcileListCompletions({ limit: 10 })).orThrow();
    const record = (await h.repository.readCommit(tid('l'))).orThrow()!;
    expect(record.operations.map((o) => o.operationId)).toContain('complete-list-r1');
  });
});

describe('crash after the last child succeeds, before list completion', () => {
  test('reopen rebuilds the candidate, and the pump rechecks and completes it', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l');
    await track(h.writer, 'a', { parentId: 'l' });
    await track(h.writer, 'b', { parentId: 'l' });
    await succeedTask(h, h.writer, 'a');
    await succeedTask(h, h.writer, 'b');
    // The process "dies" here: no pump ran. Nothing but the records survives.
    h.repository.close().orThrow();
    const { env } = environment('reopen');
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    if (reopened.state !== 'ready') {
      throw new Error('expected ready');
    }
    const again = harnessOver(reopened.repository, env, h.root);
    expect(await again.repository.listCompletionCandidates({ limit: 10 })).toSucceedWith([tid('l')]);
    // Before completing, membership changes again: the pump uses the complete set as it is now.
    await track(again.writer, 'c', { parentId: 'l' });
    expect(await pump(again)).toEqual([]);
    await succeedTask(again, again.writer, 'c');
    expect(await pump(again)).toEqual(['l']);
  });

  test('rebuildIndexes reconstructs candidates from the records', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l');
    await track(h.writer, 'a', { parentId: 'l' });
    await succeedTask(h, h.writer, 'a');
    (await h.repository.rebuildIndexes()).orThrow();
    expect(await candidates(h)).toEqual(['l']);
  });

  test('a list whose kind is unregistered on reopen is never a candidate', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l');
    await track(h.writer, 'a', { parentId: 'l' });
    await succeedTask(h, h.writer, 'a');
    h.repository.close().orThrow();
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: environment().env,
        registry: registry({ withoutVendor: true })
      })
    ).orThrow();
    expect(reopened.state).toBe('ready');
    if (reopened.state === 'ready') {
      expect(await reopened.repository.listCompletionCandidates({ limit: 10 })).toSucceedWith([]);
      expect(await reopened.repository.childStates(tid('l'))).toSucceedWith([
        { id: tid('a'), state: 'resolved', status: 'succeeded', archived: false }
      ]);
      expect(await reopened.repository.childStates(tid('nope'))).toFailWith(/not a live task/);
      expect(await reopened.repository.childStates('../x' as TaskId)).toFailWith(/not a valid task id/);
    }
  });
});
