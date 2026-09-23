/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ITaskChildState, TaskResult } from '../../../index';
import {
  IBrokerHarness,
  alpha,
  beta,
  bindWriter,
  brokerHarness,
  command,
  list,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';

async function parentOf(h: IBrokerHarness, id: string): Promise<string | undefined> {
  const record = (await h.repository.readCommit(tid(id))).orThrow()!;
  return record.recordType === 'resolved' ? record.task.envelope.parentId : record.reference.parentId;
}

async function reparent(
  h: IBrokerHarness,
  id: string,
  parent: string | 'root'
): Promise<TaskResult<unknown>> {
  return h.writer.reparent({
    taskId: tid(id),
    operationId: op(`reparent-${id}`),
    expectedRevision: await revisionOf(h.repository, id),
    parent: parent === 'root' ? 'root' : { taskId: tid(parent) }
  });
}

async function archiveTask(h: IBrokerHarness, id: string): Promise<void> {
  (
    await h.writer.archive({
      taskId: tid(id),
      operationId: op(`archive-${id}`),
      expectedRevision: await revisionOf(h.repository, id)
    })
  ).orThrow();
}

describe('creation under a parent', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 'p');
  });

  test('records the edge on the child, and the parent learns of it from the graph', async () => {
    await track(h.writer, 'c', { parentId: 'p' });
    expect(await parentOf(h, 'c')).toBe('p');
    expect(await h.repository.childStates(tid('p'))).toSucceedWith([
      { id: tid('c'), state: 'resolved', status: 'pending', archived: false }
    ]);
    // The parent's own record is untouched by gaining a child.
    expect(await revisionOf(h.repository, 'p')).toBe(1);
  });

  test("a view lists a parent's visible children, and only those", async () => {
    await track(h.writer, 'c1', { parentId: 'p' });
    await track(h.writer, 'c2', { parentId: 'p' });
    h.policy.hide('c2');
    expect(await h.writer.query({ filter: { parentId: tid('p') } })).toSucceedAndSatisfy((page) => {
      expect(page.items.map((i) => i.envelope.id)).toEqual(['c1']);
    });
  });

  test('a missing or hidden parent fails exactly as a foreign id, naming only what the caller named', async () => {
    h.policy.hide('p');
    const hidden = await h.writer.createTracked({
      taskId: tid('c'),
      operationId: op(),
      title: 'c',
      parentId: tid('p')
    });
    const missing = await h.writer.createTracked({
      taskId: tid('c'),
      operationId: op(),
      title: 'c',
      parentId: tid('nope')
    });
    expect(hidden).toFailWith(/^task p: not found or not visible$/);
    expect(missing).toFailWith(/^task nope: not found or not visible$/);
  });

  test('a parent the principal may not create under is refused the same way', async () => {
    h.policy.deny.push((r) => r.action === 'create' && r.role === 'parent');
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('p') })
    ).toFailWith(/^task p: not found or not visible$/);
  });

  test('a terminal, archived or unresolved parent takes no new child', async () => {
    await succeedTask(h, h.writer, 'p');
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('p') })
    ).toFailWith(/parent is terminal; terminal parent membership is immutable/);
    await archiveTask(h, 'p');
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('p') })
    ).toFailWith(/parent is terminal/);
    await registerVendor(h, 'u', { unresolved: true });
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('u') })
    ).toFailWith(/unresolved registration and takes no children/);
  });

  test('a parent that turns terminal between authorization and commit is caught inside the writer', async () => {
    const other = bindWriter(h, { principal: 'bob' });
    const policy = h.policy;
    policy.afterDecision = async (request) => {
      if (request.action === 'create' && request.role === 'subject') {
        policy.afterDecision = undefined;
        await succeedTask(h, other, 'p');
      }
    };
    expect(
      await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c', parentId: tid('p') })
    ).toFailWith(/the parent of c changed after the operation was authorized/);
    expect(await h.repository.readCommit(tid('c'))).toSucceedWith(undefined);
  });
});

describe('reparent: self, cycles and missing parents', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 'a');
    await track(h.writer, 'b', { parentId: 'a' });
    await track(h.writer, 'c', { parentId: 'b' });
  });

  test('self', async () => {
    expect(await reparent(h, 'a', 'a')).toFailWith(/cannot be its own parent/);
  });

  test('a cycle through descendants', async () => {
    expect(await reparent(h, 'a', 'c')).toFailWith(/would close a cycle/);
    expect(await parentOf(h, 'a')).toBeUndefined();
  });

  test('missing', async () => {
    expect(await reparent(h, 'c', 'nope')).toFailWith(/^task nope: not found or not visible$/);
  });

  test('move, move to root, and no change', async () => {
    expect(await reparent(h, 'c', 'a')).toSucceedWith(
      expect.objectContaining({ disposition: 'changed', revision: 2 })
    );
    expect(await parentOf(h, 'c')).toBe('a');
    expect(await reparent(h, 'c', 'a')).toSucceedWith(
      expect.objectContaining({ disposition: 'unchanged', revision: 2 })
    );
    expect(await reparent(h, 'c', 'root')).toSucceedWith(expect.objectContaining({ disposition: 'changed' }));
    expect(await parentOf(h, 'c')).toBeUndefined();
    expect(await h.repository.childStates(tid('b'))).toSucceedWith([]);
  });

  test('two concurrent moves that together would close a cycle: one commits, the other is refused', async () => {
    await track(h.writer, 'x');
    await track(h.writer, 'y');
    const [first, second] = await Promise.all([reparent(h, 'x', 'y'), reparent(h, 'y', 'x')]);
    // Both were authorized against a graph with no edge between them. The writer serializes the
    // commits, and the cycle check runs inside it against the graph as it is by then.
    expect(first).toSucceed();
    // y's new parent x moved after y's move was authorized, so y's move is refused before it
    // reaches the cycle check.
    expect(second).toFailWith(/a task related to y changed after/);
    expect(await parentOf(h, 'x')).toBe('y');
    expect(await parentOf(h, 'y')).toBeUndefined();
  });

  test('a cycle formed through a task neither move touches is caught by the in-writer cycle check', async () => {
    // z sits under y. Concurrently: move y under x, and move x under z. Neither move's subject or
    // parents change when the other commits — only y does, which is z's parent, not x's — so both
    // pass revalidation. Committed in order, the second would make x → z → y → x.
    await track(h.writer, 'x');
    await track(h.writer, 'y');
    await track(h.writer, 'z', { parentId: 'y' });
    const [first, second] = await Promise.all([reparent(h, 'y', 'x'), reparent(h, 'x', 'z')]);
    expect(first).toSucceed();
    expect(second).toFailWith(/parent z would close a cycle/);
    expect(await parentOf(h, 'y')).toBe('x');
    expect(await parentOf(h, 'x')).toBeUndefined();
  });

  test('each affected parent is authorized in its role', async () => {
    await track(h.writer, 'd');
    h.policy.calls.splice(0);
    expect(await reparent(h, 'c', 'd')).toSucceed();
    const roles = h.policy.calls
      .filter((c) => c.action === 'reparent')
      .map((c) => [c.role, c.task?.envelope.id]);
    expect(roles).toEqual([
      ['subject', 'c'],
      ['previous-parent', 'b'],
      ['new-parent', 'd']
    ]);
  });

  test('a hidden current parent refuses the move without being named', async () => {
    await track(h.writer, 'd');
    h.policy.hide('b');
    const outcome = await reparent(h, 'c', 'd');
    expect(outcome).toFailWith(/not permitted on its current parent/);
    expect(outcome.isFailure() && outcome.message).not.toMatch(/\bb\b/);
    h.policy.deny.splice(0);
    h.policy.deny.push((r) => r.action === 'reparent' && r.role === 'previous-parent');
    expect(await reparent(h, 'c', 'd')).toFailWith(/not permitted on its current parent/);
  });

  test('a new parent the principal may not move under is refused as not found', async () => {
    await track(h.writer, 'd');
    h.policy.deny.push((r) => r.action === 'reparent' && r.role === 'new-parent');
    expect(await reparent(h, 'c', 'd')).toFailWith(/^task d: not found or not visible$/);
  });

  test('a parent that changes between authorization and commit refuses the move', async () => {
    await track(h.writer, 'd');
    const other = bindWriter(h, { principal: 'bob' });
    const policy = h.policy;
    policy.afterDecision = async (request) => {
      if (request.action === 'reparent' && request.role === 'new-parent') {
        policy.afterDecision = undefined;
        await command(h, other, 'd', 'set-title', { title: 'moved on' });
      }
    };
    expect(await reparent(h, 'c', 'd')).toFailWith(/a task related to c changed after/);
    expect(await parentOf(h, 'c')).toBe('b');
  });
});

describe('terminal and archived edges are immutable', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 'p');
    await track(h.writer, 'q');
    await track(h.writer, 'c', { parentId: 'p' });
  });

  test('a terminal child keeps its parent', async () => {
    await succeedTask(h, h.writer, 'c');
    expect(await reparent(h, 'c', 'q')).toFailWith(/is terminal; terminal task edges are immutable/);
  });

  test('a terminal parent keeps its children', async () => {
    await succeedTask(h, h.writer, 'p');
    expect(await reparent(h, 'c', 'q')).toFailWith(/current parent is terminal/);
    expect(await reparent(h, 'c', 'root')).toFailWith(/current parent is terminal/);
    // and takes no new one
    expect(await reparent(h, 'q', 'p')).toFailWith(/new parent is terminal/);
  });

  test('an archived tombstone takes no change at all, and still anchors its children', async () => {
    await succeedTask(h, h.writer, 'p');
    await archiveTask(h, 'p');
    expect(await reparent(h, 'p', 'q')).toFailWith(/archived tombstone is immutable/);
    expect(
      await h.writer.reassign({
        taskId: tid('p'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'p'),
        responsibility: 'unassigned'
      })
    ).toFailWith(/archived tombstone is immutable/);
    // The child still resolves its parent through the tombstone.
    expect(await parentOf(h, 'c')).toBe('p');
    expect(await h.repository.childStates(tid('p'))).toSucceedWith([
      { id: tid('c'), state: 'resolved', status: 'pending', archived: false }
    ]);
    expect(await h.writer.inspect(tid('p'))).toSucceedAndSatisfy((inspection) => {
      expect(inspection.state === 'resolved' && inspection.archived).toBe(true);
      expect(inspection.state === 'resolved' && inspection.commands).toEqual([]);
    });
    // A child under a tombstone can still do its own work.
    expect((await command(h, h.writer, 'c', 'start')).result.state).toBe('applied');
  });

  test('an archived child keeps its edge and its final status in the parent graph', async () => {
    await succeedTask(h, h.writer, 'c');
    await archiveTask(h, 'c');
    expect(await h.repository.childStates(tid('p'))).toSucceedWith([
      { id: tid('c'), state: 'resolved', status: 'succeeded', archived: true }
    ]);
    expect(await reparent(h, 'c', 'q')).toFailWith(/archived tombstone is immutable/);
  });
});

describe('cross-source children', () => {
  test('externally executed children of different sources sit under native and external parents', async () => {
    const h = await brokerHarness();
    await list(h.writer, 'l');
    await registerVendor(h, 'v1', {
      parentId: 'l',
      sourceId: 'source-one',
      lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } }
    });
    await registerVendor(h, 'v2', { sourceId: 'source-two' });
    await registerVendor(h, 'v3', { parentId: 'v2', sourceId: 'source-one' });
    await track(h.writer, 't', { parentId: 'v2' });
    const children: ReadonlyArray<ITaskChildState> = (await h.repository.childStates(tid('v2'))).orThrow();
    expect(children.map((c) => c.id)).toEqual(['t', 'v3']);
    // A list counts an external child's source-projected status like any other.
    expect(await h.writer.reconcileListCompletions({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.completed.map((c) => c.taskId)).toEqual(['l']);
    });
    // A native child can move from under an external parent to a native one.
    await track(h.writer, 'n');
    expect(await reparent(h, 't', 'n')).toSucceed();
  });

  test('host registration refuses native kinds and a terminal parent', async () => {
    const h = await brokerHarness();
    await track(h.writer, 'done');
    await succeedTask(h, h.writer, 'done');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('x'),
        operationId: op(),
        kind: 'fgv.tracked',
        detailVersion: 1,
        title: 'x',
        scopes: [alpha],
        binding: { sourceId: 's', referenceVersion: 1, reference: 1 },
        recovery: 'reattach'
      })
    ).toFailWith(/native kind/);
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('x'),
        operationId: op(),
        kind: 'acme.job',
        detailVersion: 1,
        title: 'x',
        scopes: [beta],
        parentId: tid('done'),
        binding: { sourceId: 's', referenceVersion: 1, reference: 1 },
        recovery: 'reattach'
      })
    ).toFailWith(/parent is terminal/);
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('x'),
        operationId: op(),
        kind: 'acme.job',
        detailVersion: 1,
        title: 'x',
        scopes: [beta],
        parentId: tid('missing'),
        binding: { sourceId: 's', referenceVersion: 1, reference: 1 },
        recovery: 'reattach'
      })
    ).toFailWith(/^task missing: not found/);
    expect(await h.broker.registerExternal('', {})).toFailWith(/principal/);
    expect(await h.broker.registerExternal('host', {})).toFailWith(/registerExternal/);
  });

  test('a native child of an unresolved registration is refused, and unresolved tasks take no catalog change', async () => {
    const h = await brokerHarness();
    await registerVendor(h, 'u', { unresolved: true });
    await track(h.writer, 'n');
    expect(await reparent(h, 'n', 'u')).toFailWith(/unresolved registration and takes no children/);
    expect(
      await h.writer.reassign({
        taskId: tid('u'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: 'unassigned'
      })
    ).toFailWith(/unresolved registration takes no catalog change/);
  });
});
