/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IReassignmentResult,
  IResolvedTaskCommitRecord,
  ITaskCommitRecord,
  OperationId,
  TaskResult
} from '../../../index';
import {
  IBrokerHarness,
  ada,
  bindWriter,
  bob,
  brokerHarness,
  list,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track,
  vendorBinding
} from '../../helpers/brokerFixtures';

async function record(h: IBrokerHarness, id: string): Promise<IResolvedTaskCommitRecord> {
  const found: ITaskCommitRecord = (await h.repository.readCommit(tid(id))).orThrow()!;
  if (found.recordType !== 'resolved') {
    throw new Error(`${id} is not resolved`);
  }
  return found;
}

async function reassign(
  h: IBrokerHarness,
  id: string,
  responsibility: typeof ada | 'unassigned',
  operationId: OperationId = op(`reassign-${id}`)
): Promise<TaskResult<IReassignmentResult>> {
  return h.writer.reassign({
    taskId: tid(id),
    operationId,
    expectedRevision: await revisionOf(h.repository, id),
    responsibility
  });
}

describe('reassignment changes responsibility and nothing else', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await list(h.writer, 'parent');
    await track(h.writer, 'child', { parentId: 'parent', responsibility: ada });
    await track(h.writer, 'grandchild', { parentId: 'child', responsibility: ada });
  });

  test('ID, record path, parent, children, scopes, details, claims and prior evidence are preserved', async () => {
    const before = await record(h, 'child');
    const outcome = await reassign(h, 'child', bob);
    expect(outcome).toSucceedWith({
      taskId: tid('child'),
      revision: rev(2),
      operationId: expect.any(String),
      disposition: 'changed',
      updateIds: [],
      previous: ada,
      current: bob
    });
    const after = await record(h, 'child');
    const { responsibility: was, revision: r0, changedAt: c0, ...restBefore } = before.task.envelope;
    const { responsibility: now, revision: r1, changedAt: c1, ...restAfter } = after.task.envelope;
    expect([was, now, r0, r1]).toEqual([ada, bob, 1, 2]);
    expect(typeof c0 === 'string' && typeof c1 === 'string').toBe(true);
    expect(restAfter).toEqual(restBefore);
    expect(after.task.details).toEqual(before.task.details);
    expect(after.capacityClaims).toEqual(before.capacityClaims);
    expect(after.operations.slice(0, before.operations.length)).toEqual(before.operations);
    expect(after.operations).toHaveLength(before.operations.length + 1);
    expect(after.operations[after.operations.length - 1]).toMatchObject({
      type: 'catalog',
      operation: 'reassign',
      principalKey: 'alice'
    });
    // The record keeps its name: it is still found by the same id, and the children still hang off it.
    expect(await h.repository.childStates(tid('child'))).toSucceedWith([
      expect.objectContaining({ id: tid('grandchild') })
    ]);
  });

  test('no child is reassigned implicitly', async () => {
    const grandchild = await record(h, 'grandchild');
    expect(await reassign(h, 'child', bob)).toSucceed();
    expect(await reassign(h, 'parent', bob)).toSucceed();
    expect(await record(h, 'grandchild')).toEqual(grandchild);
  });

  test('responsibility grants nothing: no scope, no artifact, no visibility change', async () => {
    await succeedTask(h, h.writer, 'grandchild');
    const before = await record(h, 'grandchild');
    expect(await reassign(h, 'grandchild', bob)).toSucceed();
    const after = await record(h, 'grandchild');
    expect(after.task.envelope.scopes).toEqual(before.task.envelope.scopes);
    expect(after.task.envelope.lifecycle).toEqual(before.task.envelope.lifecycle);
    // Bob, newly responsible, sees exactly what his binding lets him see — here, nothing outside
    // his scopes — and a view that can see it still gets no artifact references.
    const bobsView = h.broker
      .bindView({
        principal: 'bob',
        scopes: [{ namespace: 'project', key: 'elsewhere' }],
        authorization: h.policy
      })
      .orThrow();
    expect(await bobsView.inspect(tid('grandchild'))).toFailWith(/not found or not visible/);
  });

  test('explicit unassignment; an omitted responsibility is refused, never an accidental unassignment', async () => {
    expect(await reassign(h, 'child', 'unassigned')).toSucceedAndSatisfy((result) => {
      expect(result).toEqual(expect.objectContaining({ previous: ada }));
      expect('current' in result).toBe(false);
    });
    expect('responsibility' in (await record(h, 'child')).task.envelope).toBe(false);
    expect(
      await h.writer.reassign({ taskId: tid('child'), operationId: op(), expectedRevision: rev(2) } as never)
    ).toFailWith(/responsibility/);
  });

  test('the same responsibility again is recorded but changes no revision; a replay returns its receipt', async () => {
    const key = op();
    const first = (await reassign(h, 'child', ada, key)).orThrow();
    expect(first).toEqual(expect.objectContaining({ disposition: 'unchanged', revision: 1 }));
    const recordRevision = (await record(h, 'child')).recordRevision;
    // The replay carries the same request: its expected revision is still 1.
    expect(
      await h.writer.reassign({
        taskId: tid('child'),
        operationId: key,
        expectedRevision: rev(1),
        responsibility: ada
      })
    ).toSucceedWith(first);
    expect((await record(h, 'child')).recordRevision).toBe(recordRevision);
    // The same key with a different request conflicts.
    expect(
      await h.writer.reassign({
        taskId: tid('child'),
        operationId: key,
        expectedRevision: rev(1),
        responsibility: bob
      })
    ).toFailWith(/already recorded with a different request/);
  });

  test('a replay is re-authorized before its receipt is returned', async () => {
    const key = op();
    await reassign(h, 'child', bob, key);
    h.policy.denyOn('reassign', 'child');
    expect(
      await h.writer.reassign({
        taskId: tid('child'),
        operationId: key,
        expectedRevision: rev(1),
        responsibility: bob
      })
    ).toFailWith(/'reassign' is not permitted/);
  });

  test('the policy is told the proposed target, and may refuse it', async () => {
    h.policy.deny.push((r) => r.action === 'reassign' && r.targetResponsibility === 'unassigned');
    expect(await reassign(h, 'child', 'unassigned')).toFailWith(/not permitted/);
    expect(await reassign(h, 'child', bob)).toSucceed();
  });

  test('a terminal task may still be reassigned; its outcome is untouched', async () => {
    await succeedTask(h, h.writer, 'grandchild');
    const lifecycle = (await record(h, 'grandchild')).task.envelope.lifecycle;
    expect(await reassign(h, 'grandchild', bob)).toSucceed();
    expect((await record(h, 'grandchild')).task.envelope.lifecycle).toEqual(lifecycle);
  });
});

describe('external tasks', () => {
  test('an observation-only registration permits authorized catalog reassignment, and its source binding and lookup do not move', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'v1', { responsibility: ada });
    const before = await record(h, 'v1');
    // The kind declares no commands, so the task is observation-only: nothing can be dispatched to
    // it (T6: the source is not even attached here, and the refusal records nothing).
    expect(
      await h.writer.execute({
        taskId: tid('v1'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'cancel',
        parameters: {}
      })
    ).toFailWithDetail(/not attached/i, { code: 'source-unavailable', retry: 'after-host-action' });
    expect(await reassign(h, 'v1', bob)).toSucceed();
    const after = await record(h, 'v1');
    expect(after.task.envelope.binding).toEqual(before.task.envelope.binding);
    expect(after.task.envelope.binding).toEqual(vendorBinding('v1'));
    expect(after.sourceRevision).toEqual(before.sourceRevision);
    // Source lookup still resolves the original actor-local binding to this task — never through
    // the new assignee.
    expect(await h.repository.lookupSource(vendorBinding('v1'))).toSucceedWith(tid('v1'));
    expect(after.task.envelope.responsibility).toEqual(bob);
  });

  test('an external task presents its source-owned fields only through its source', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'v1');
    expect(
      await h.writer.updateTracked({
        taskId: tid('v1'),
        operationId: op(),
        expectedRevision: rev(1),
        patch: { title: 'x' }
      })
    ).toFailWith(/externally executed/);
  });
});

describe('one writer: concurrent A→B versus a stale A write', () => {
  test('the stale write is refused on its revision, whichever order the two were authorized in', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't', { responsibility: ada });
    const actorA = bindWriter(h, { principal: 'actor-a' });
    const [moved, stale] = await Promise.all([
      h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: bob
      }),
      actorA.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        patch: { title: 'stale' }
      })
    ]);
    expect(moved).toSucceed();
    expect(stale).toFailWith(/expected revision 1, found resolved revision 2/);
    expect(stale.isFailure() && stale.detail).toEqual(
      expect.objectContaining({ code: 'conflict', retry: 'reconcile-first' })
    );
    const final = await record(h, 't');
    expect(final.task.envelope.responsibility).toEqual(bob);
    expect(final.task.envelope.title).toBe('task t');
  });

  test('a stale command in the same race is refused without being recorded', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't', { responsibility: ada });
    const actorA = bindWriter(h, { principal: 'actor-a' });
    const key = op();
    const [moved, stale] = await Promise.all([
      h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: bob
      }),
      actorA.execute({
        taskId: tid('t'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ]);
    expect(moved).toSucceed();
    expect(stale).toFailWith(/task t changed after the operation was authorized/);
    expect((await record(h, 't')).operations.some((o) => o.operationId === key)).toBe(false);
    // A→B then a command that knows the new revision proceeds: reassignment does not quiesce or
    // lock the task.
    expect(
      await actorA.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(2),
        command: 'start',
        parameters: {}
      })
    ).toSucceedWith(expect.objectContaining({ result: { state: 'applied', appliedRevision: 3 } }));
  });

  test('a reassignment in flight that finds its own key committed replays instead of applying twice', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't');
    const key = op();
    const request = { taskId: tid('t'), operationId: key, expectedRevision: rev(1), responsibility: bob };
    const [a, b] = await Promise.all([h.writer.reassign(request), h.writer.reassign(request)]);
    expect(a).toSucceed();
    expect(b).toSucceedWith(a.orThrow());
    expect((await record(h, 't')).operations.filter((o) => o.operationId === key)).toHaveLength(1);
  });
});
