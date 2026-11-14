/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Result } from '@fgv/ts-utils';
import {
  IBoundTaskWriter,
  defaultTaskProjector,
  withEnvelopeFields,
  ITaskInspectResolvedToolResult,
  ITaskMutationToolResult,
  TaskInspectToolResult
} from '../../../index';
import {
  IBrokerHarness,
  ada,
  alpha,
  beta,
  bindWriter,
  bob,
  brokerHarness,
  registerVendor,
  track
} from '../../helpers/brokerFixtures';
import { IToolSet, call, mutatingTools, recordingView, shownIds } from '../../helpers/toolFixtures';

async function inspectRevision(tools: IToolSet, taskId: string): Promise<number> {
  const inspected = (await call<TaskInspectToolResult>(tools, 'task_inspect', { taskId })).orThrow();
  return (inspected as ITaskInspectResolvedToolResult).revision;
}

/** The failure message with one id replaced, so two refusals can be compared for what they disclose. */
function scrubbed(result: Result<unknown>, id: string): string | undefined {
  return result.isFailure() ? result.message.split(id).join('<id>') : undefined;
}

describe('task_create', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 'root');
    await track(h.writer, 'hidden');
    h.policy.hide('hidden');
    tools = mutatingTools(h);
  });

  test('creates a tracked task under an id the tool minted, visible to the view that created it', async () => {
    const created = await call<ITaskMutationToolResult>(tools, 'task_create', {
      title: 'write the report',
      description: 'the long version',
      parentId: 'root',
      responsibility: { namespace: 'agent', key: 'ada' }
    });
    expect(created).toSucceedAndSatisfy((result) => {
      expect(Object.keys(result).sort()).toEqual(['disposition', 'revision', 'taskId']);
      expect(result.revision).toBe(1);
      expect(result.disposition).toBe('changed');
      expect(result.taskId).toMatch(/^b-/);
    });
    const taskId: string = created.orThrow().taskId;
    const page = (await call<{ context: string }>(tools, 'task_query', { parentId: 'root' })).orThrow();
    expect(shownIds(page.context)).toEqual([taskId]);
    const envelope = (await h.writer.inspect(created.orThrow().taskId)).orThrow();
    expect(envelope).toEqual(
      expect.objectContaining({
        state: 'resolved',
        envelope: expect.objectContaining({
          title: 'write the report',
          parentId: 'root',
          responsibility: ada,
          scopes: [alpha],
          stopPolicy: 'none'
        })
      })
    );
  });

  test('two identical calls are two operations, and create two tasks', async () => {
    const a = (await call<ITaskMutationToolResult>(tools, 'task_create', { title: 'x' })).orThrow();
    const b = (await call<ITaskMutationToolResult>(tools, 'task_create', { title: 'x' })).orThrow();
    expect(a.taskId).not.toEqual(b.taskId);
  });

  test('a hidden parent and a foreign parent are refused identically', async () => {
    const hidden = await call(tools, 'task_create', { title: 'x', parentId: 'hidden' });
    const foreign = await call(tools, 'task_create', { title: 'x', parentId: 'nosuch' });
    expect(hidden).toFailWith(/^task_create: not-found-or-denied: /);
    expect(scrubbed(hidden, 'hidden')).toEqual(scrubbed(foreign, 'nosuch'));
    expect(hidden).not.toFailWith(/hidden/);
  });

  test('a creation the policy refuses is refused, and says no more than a missing task would', async () => {
    h.policy.deny.push((r) => r.action === 'create');
    expect(await call(tools, 'task_create', { title: 'x' })).toFailWith(
      /^task_create: not-found-or-denied: the task is not found or not visible, or this is not permitted on it$/
    );
  });

  test('a responsibility the policy will not let this principal name is refused', async () => {
    // What constrains the party a model may name: the converter (a bounded `{ namespace, key }`), then
    // the host's policy, asked with the target responsibility when the call runs.
    const before: number = h.policy.calls.length;
    h.policy.deny.push((r) =>
      r.targetResponsibility !== undefined && r.targetResponsibility !== 'unassigned'
        ? r.targetResponsibility.namespace === 'system'
        : false
    );
    expect(
      await call(tools, 'task_create', { title: 'x', responsibility: { namespace: 'system', key: 'root' } })
    ).toFailWith(/^task_create: not-found-or-denied: /);
    expect(
      await call(tools, 'task_create', { title: 'x', responsibility: { namespace: 'agent', key: 'ada' } })
    ).toSucceed();
    const asked = h.policy.calls
      .slice(before)
      .filter((r) => r.action === 'create')
      .map((r) => r.targetResponsibility);
    expect(asked).toEqual([{ namespace: 'system', key: 'root' }, ada]);
  });

  test('a title the writer would refuse is described as the model argument it is', async () => {
    expect(await call(tools, 'task_create', { title: 'two\nlines' })).toFailWith(
      /^task_create: invalid arguments: .*title/
    );
  });
});

describe('task_update', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    await track(h.writer, 'hidden');
    await track(h.writer, 'parent');
    await track(h.writer, 'hiddenChild', { parentId: 'parent' });
    h.policy.hide('hidden');
    h.policy.hide('hiddenChild');
    tools = mutatingTools(h);
  });

  test('changes a task at the revision task_inspect returned, and returns the next revision', async () => {
    const revision: number = await inspectRevision(tools, 't1');
    expect(
      await call<ITaskMutationToolResult>(tools, 'task_update', {
        taskId: 't1',
        expectedRevision: revision,
        title: 'renamed',
        progress: { phase: 'drafting', completed: 1, total: 3 }
      })
    ).toSucceedWith({
      taskId: 't1',
      revision: revision + 1,
      disposition: 'changed'
    } as ITaskMutationToolResult);
    expect(await inspectRevision(tools, 't1')).toBe(revision + 1);
    expect(
      await call<ITaskMutationToolResult>(tools, 'task_update', {
        taskId: 't1',
        expectedRevision: revision + 1,
        clear: ['progress']
      })
    ).toSucceedWith({
      taskId: 't1',
      revision: revision + 2,
      disposition: 'changed'
    } as ITaskMutationToolResult);
  });

  test('a stale revision is refused, and the task is left as it is', async () => {
    const revision: number = await inspectRevision(tools, 't1');
    // A host change lands between the model's inspection and its update.
    (
      await h.writer.updateTracked({
        taskId: 't1' as never,
        operationId: 'host-1' as never,
        expectedRevision: revision as never,
        patch: { title: 'host' }
      })
    ).orThrow();
    expect(
      await call(tools, 'task_update', { taskId: 't1', expectedRevision: revision, title: 'model' })
    ).toFailWith(/^task_update: conflict: .*inspect it again/);
    expect((await h.writer.inspect('t1' as never)).orThrow()).toEqual(
      expect.objectContaining({ envelope: expect.objectContaining({ title: 'host' }) })
    );
  });

  test('a hidden task, a hidden child and a foreign id are refused identically', async () => {
    const args = (taskId: string): object => ({ taskId, expectedRevision: 1, title: 'x' });
    const hidden = await call(tools, 'task_update', args('hidden'));
    const child = await call(tools, 'task_update', args('hiddenChild'));
    const foreign = await call(tools, 'task_update', args('nosuch'));
    expect(hidden).toFailWith(/^task_update: not-found-or-denied: /);
    expect(scrubbed(hidden, 'hidden')).toEqual(scrubbed(foreign, 'nosuch'));
    expect(scrubbed(child, 'hiddenChild')).toEqual(scrubbed(foreign, 'nosuch'));
  });

  test('an update the policy refuses on a visible task says no more than a missing task would', async () => {
    h.policy.denyOn('update-tracked', 't1');
    const denied = await call(tools, 'task_update', { taskId: 't1', expectedRevision: 1, title: 'x' });
    const foreign = await call(tools, 'task_update', { taskId: 'nosuch', expectedRevision: 1, title: 'x' });
    expect(scrubbed(denied, 't1')).toEqual(scrubbed(foreign, 'nosuch'));
  });

  test('an unresolved external task takes no update, and the refusal names no binding', async () => {
    await registerVendor(h, 'ext', { unresolved: true });
    const refused = await call(tools, 'task_update', { taskId: 'ext', expectedRevision: 1, title: 'x' });
    expect(refused).toFailWith(/^task_update: unsupported: the request is not supported$/);
  });
});

describe('task_reassign', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1', { responsibility: ada });
    await track(h.writer, 'hidden');
    h.policy.hide('hidden');
    tools = mutatingTools(h);
  });

  test('reassigns, and unassigns only when null is given explicitly', async () => {
    expect(
      await call<ITaskMutationToolResult>(tools, 'task_reassign', {
        taskId: 't1',
        expectedRevision: 1,
        responsibility: bob
      })
    ).toSucceedWith({ taskId: 't1', revision: 2, disposition: 'changed' } as ITaskMutationToolResult);
    expect((await h.writer.inspect('t1' as never)).orThrow()).toEqual(
      expect.objectContaining({ envelope: expect.objectContaining({ responsibility: bob }) })
    );
    expect(
      await call<ITaskMutationToolResult>(tools, 'task_reassign', {
        taskId: 't1',
        expectedRevision: 2,
        responsibility: null
      })
    ).toSucceedWith({ taskId: 't1', revision: 3, disposition: 'changed' } as ITaskMutationToolResult);
    expect((await h.writer.inspect('t1' as never)).orThrow()).toEqual(
      expect.objectContaining({
        envelope: expect.not.objectContaining({ responsibility: expect.anything() })
      })
    );
    // An omitted party is an argument error, never an unassignment.
    expect(await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 3 })).toFailWith(
      /^task_reassign: invalid arguments/
    );
  });

  test('a forged responsible party is refused by the policy asked at execution', async () => {
    h.policy.deny.push(
      (r) =>
        r.action === 'reassign' &&
        r.targetResponsibility !== undefined &&
        r.targetResponsibility !== 'unassigned' &&
        r.targetResponsibility.namespace === 'system'
    );
    expect(
      await call(tools, 'task_reassign', {
        taskId: 't1',
        expectedRevision: 1,
        responsibility: { namespace: 'system', key: 'root' }
      })
    ).toFailWith(/^task_reassign: not-found-or-denied: /);
    // A party outside the identifier syntax never reaches the policy.
    const asked: number = h.policy.calls.length;
    expect(
      await call(tools, 'task_reassign', {
        taskId: 't1',
        expectedRevision: 1,
        responsibility: { namespace: 'not an identifier', key: 'x' }
      })
    ).toFailWith(/^task_reassign: invalid arguments/);
    expect(h.policy.calls.length).toBe(asked);
  });

  test('reassigning grants the new party nothing', async () => {
    (
      await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 1, responsibility: bob })
    ).orThrow();
    const bobsView = bindWriter(h, { principal: 'bob', scopes: [beta] });
    expect(await bobsView.inspect('t1' as never)).toFailWith(/not found or not visible/);
  });

  test('a hidden task and a foreign id are refused identically', async () => {
    const args = (taskId: string): object => ({ taskId, expectedRevision: 1, responsibility: bob });
    const hidden = await call(tools, 'task_reassign', args('hidden'));
    const foreign = await call(tools, 'task_reassign', args('nosuch'));
    expect(hidden).toFailWith(/^task_reassign: not-found-or-denied: /);
    expect(scrubbed(hidden, 'hidden')).toEqual(scrubbed(foreign, 'nosuch'));
  });

  test('a stale revision is refused', async () => {
    expect(
      await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 7, responsibility: bob })
    ).toFailWith(/^task_reassign: conflict: /);
  });

  test('the previous party is never returned: a projector may withhold it from this principal', async () => {
    const withheld = bindWriter(h, {
      projector: {
        envelope: (envelope) =>
          defaultTaskProjector.envelope(withEnvelopeFields(envelope, { responsibility: undefined }))
      }
    });
    const tools = mutatingTools(h, withheld);
    const inspected = (
      await call<Record<string, unknown>>(tools, 'task_inspect', { taskId: 't1' })
    ).orThrow();
    expect(JSON.stringify(inspected)).not.toContain('"ada"');
    const moved = await call(tools, 'task_reassign', {
      taskId: 't1',
      expectedRevision: 1,
      responsibility: bob
    });
    expect(moved).toSucceedWith({
      taskId: 't1',
      revision: 2,
      disposition: 'changed'
    } as ITaskMutationToolResult);
    expect(JSON.stringify(moved.orThrow())).not.toContain('ada');
  });
});

describe('capability checks are live — opting in is not authorizing', () => {
  let h: IBrokerHarness;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
  });

  test('a policy that denies when the tools are built, then allows, decides each call as it runs', async () => {
    const policy = h.policy;
    policy.deny.push(() => true);
    const tools = mutatingTools(h);
    expect(await call(tools, 'task_create', { title: 'x' })).toFailWith(/not-found-or-denied/);
    policy.deny.splice(0);
    expect(await call(tools, 'task_create', { title: 'x' })).toSucceed();
  });

  test('a grant revoked after the tools are built is refused at the next call', async () => {
    const tools = mutatingTools(h);
    expect(await call(tools, 'task_update', { taskId: 't1', expectedRevision: 1, title: 'a' })).toSucceed();
    h.policy.denyOn('update-tracked', 't1');
    expect(await call(tools, 'task_update', { taskId: 't1', expectedRevision: 2, title: 'b' })).toFailWith(
      /not-found-or-denied/
    );
  });

  test('the tools reach only the writer members they name — never registration or the external surface', async () => {
    const { view, touched } = recordingView(h.writer);
    const writer = view as IBoundTaskWriter;
    const tools = mutatingTools(h, writer);
    await call(tools, 'task_query', {});
    await call(tools, 'task_inspect', { taskId: 't1' });
    await call(tools, 'task_create', { title: 'x' });
    await call(tools, 'task_update', { taskId: 't1', expectedRevision: 1, title: 'y' });
    await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 2, responsibility: bob });
    expect([...touched].sort()).toEqual(['createTracked', 'inspect', 'query', 'reassign', 'updateTracked']);
  });
});
