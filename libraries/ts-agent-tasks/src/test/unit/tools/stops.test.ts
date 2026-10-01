/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The stop tools through the real broker: a stop a model requests is recorded and frozen, the host's
 * pump carries it out, and the model observes it through `task_stop_inspect`.
 */

import '@fgv/ts-utils-jest';
import {
  IBoundTaskWriter,
  ITaskMutationToolResult,
  ITaskStopToolResult,
  TaskInspectToolResult,
  defaultTaskContextBudget,
  defaultTaskToolBudget
} from '../../../index';
import {
  IBrokerHarness,
  TestPolicy,
  bindWriter,
  brokerHarness,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import { registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { CapabilityScript, node, persisted, statusOf } from '../../helpers/stopFixtures';
import { IToolSet, call, recordingView, stoppingTools } from '../../helpers/toolFixtures';

const deniedLine: string =
  'task_stop: not-found-or-denied: the task is not found or not visible, or this is not permitted on it';

/** root ─┬─ a ── c
 *         └─ b      */
async function family(
  h: IBrokerHarness,
  policy: 'cascade-pause' | 'cascade-cancel' = 'cascade-cancel'
): Promise<void> {
  await node(h.writer, 'root', { stopPolicy: policy });
  await node(h.writer, 'a', { parentId: 'root' });
  await node(h.writer, 'b', { parentId: 'root' });
  await node(h.writer, 'c', { parentId: 'a' });
}

async function requestStop(
  tools: IToolSet,
  taskId: string,
  expectedRevision: number,
  mode: string
): Promise<ReturnType<typeof call<ITaskStopToolResult>>> {
  return call<ITaskStopToolResult>(tools, 'task_stop', { taskId, expectedRevision, mode });
}

/** The tail a stop failure carries when the stop may have been accepted. */
function unknownNote(intentId: string): string {
  return (
    `; the stop may or may not have been accepted — if it was, its intentId is ${intentId}: ` +
    'inspect it with task_stop_inspect before requesting it again'
  );
}

/** The harness with an environment that records every operation id the tools mint. */
function minting(h: IBrokerHarness): { h: IBrokerHarness; minted: string[] } {
  const minted: string[] = [];
  const env = Object.create(h.env) as IBrokerHarness['env'];
  env.newOperationId = () => {
    const id = h.env.newOperationId();
    minted.push(String(id.orDefault()));
    return id;
  };
  return { h: { ...h, env }, minted };
}

describe('task_stop — a model requests a stop, and the host carries it out', () => {
  test('a stop is recorded and frozen, nothing is dispatched, and the host pump then confirms it', async () => {
    const h = await brokerHarness();
    await family(h);
    const tools = stoppingTools(h);
    const revision = await revisionOf(h.repository, 'root');
    const accepted = (await requestStop(tools, 'root', revision, 'pause')).orThrow();
    expect(accepted).toEqual({
      intentId: accepted.intentId,
      taskId: 'root',
      mode: 'pause',
      state: 'pending',
      counts: { unexamined: 4 },
      targets: [
        { taskId: 'root', state: 'unexamined' },
        { taskId: 'a', state: 'unexamined' },
        { taskId: 'b', state: 'unexamined' },
        { taskId: 'c', state: 'unexamined' }
      ],
      remaining: 0,
      restrictedWorkRemains: false
    });
    // The intent id is the operation id the tool minted; the stop is persisted under it.
    const intent = await persisted(h, { rootId: tid('root'), intentId: accepted.intentId } as never);
    expect(intent).toMatchObject({
      id: accepted.intentId,
      mode: 'pause',
      state: 'pending',
      requestedBy: 'alice'
    });
    // Acceptance is not completion: nothing moved, not even the root's revision.
    expect(await revisionOf(h.repository, 'root')).toBe(revision);
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).toBe('pending');
    }

    // The host's pump — never a model tool — carries it out.
    expect(await h.writer.reconcileStop({ taskId: tid('root'), intentId: accepted.intentId })).toSucceed();
    expect(
      await call<ITaskStopToolResult>(tools, 'task_stop_inspect', {
        taskId: 'root',
        intentId: accepted.intentId
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result).toEqual({
        intentId: accepted.intentId,
        taskId: 'root',
        mode: 'pause',
        state: 'satisfied',
        counts: { confirmed: 4 },
        targets: ['root', 'a', 'b', 'c'].map((taskId) => ({
          taskId,
          state: 'confirmed',
          confirmedRevision: 2
        })),
        remaining: 0,
        restrictedWorkRemains: false
      });
    });
    for (const id of ['root', 'a', 'b', 'c']) {
      expect(await statusOf(h, id)).toBe('paused');
    }
  });

  test('an external child is sent its stop by the host pump, and the model sees it confirmed', async () => {
    const declared = new CapabilityScript();
    const h = await sourceHarness({ capabilities: declared.ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const tools = stoppingTools(h);
    const accepted = (
      await call<ITaskStopToolResult>(tools, 'task_stop', {
        taskId: 'root',
        expectedRevision: await revisionOf(h.repository, 'root'),
        mode: 'cancel'
      })
    ).orThrow();
    expect(h.executor.dispatches.size).toBe(0);
    expect(await h.writer.reconcileStop({ taskId: tid('root'), intentId: accepted.intentId })).toSucceed();
    expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('cancelled');
    expect(
      await call<ITaskStopToolResult>(tools, 'task_stop_inspect', {
        taskId: 'root',
        intentId: accepted.intentId
      })
    ).toSucceedAndSatisfy((result) => {
      expect(result.state).toBe('satisfied');
      expect(result.counts).toEqual({ confirmed: 2 });
      // No source evidence, attempt or command key reaches the model.
      expect(JSON.stringify(result)).not.toMatch(/contractVersion|stableSourceEvidence|attempt|operationId/);
    });
  });

  test('a target the model cannot see is not listed or counted; it learns only that restricted work remains', async () => {
    const h = await brokerHarness();
    await family(h);
    h.policy.hide('c');
    const tools = stoppingTools(h);
    expect(
      await requestStop(tools, 'root', await revisionOf(h.repository, 'root'), 'pause')
    ).toSucceedAndSatisfy((result) => {
      expect(result.targets.map((t) => t.taskId)).toEqual(['root', 'a', 'b']);
      expect(result.counts).toEqual({ unexamined: 3 });
      expect(result.restrictedWorkRemains).toBe(true);
      expect(JSON.stringify(result)).not.toContain('"c"');
    });
  });

  test('a stop the policy denies reads exactly as a hidden task and a missing id, and nothing is written', async () => {
    const h = await brokerHarness();
    await family(h);
    await node(h.writer, 'hidden', { stopPolicy: 'cascade-cancel' });
    h.policy.denyOn('stop', 'root');
    h.policy.hide('hidden');
    const recorded = minting(h);
    const tools = stoppingTools(recorded.h);
    const ids = ['root', 'hidden', 'nowhere'];
    for (const [i, taskId] of ids.entries()) {
      // The same line for all three; only the would-be intent id differs.
      expect(await requestStop(tools, taskId, 1, 'pause')).toFailWith(
        deniedLine + unknownNote(recorded.minted[i])
      );
    }
    for (const id of ['root', 'hidden']) {
      const record = (await h.repository.readCommit(tid(id))).orThrow()!;
      expect(record.recordType === 'resolved' && record.stops).toBeUndefined();
    }
  });

  test('a root hidden after the stop committed reads as not found — and the model is still told the intent id', async () => {
    const h = await brokerHarness();
    await family(h);
    // Hide the root the moment the policy has authorized the stop: the broker commits, then finds the
    // root invisible when it presents the result.
    h.policy.afterDecision = (request) => {
      if (request.action === 'stop') {
        h.policy.hide('root');
      }
    };
    const recorded = minting(h);
    const tools = stoppingTools(recorded.h);
    const told = await requestStop(tools, 'root', 1, 'pause');
    const intentId = recorded.minted[0];
    expect(told).toFailWith(deniedLine + unknownNote(intentId));
    // The stop exists, and its tree is frozen: the tail is what keeps the model from concluding
    // nothing happened.
    const record = (await h.repository.readCommit(tid('root'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.stops?.map((s) => [s.id, s.state])).toEqual([
      [intentId, 'pending']
    ]);
  });

  test('a task whose stop policy does not permit the mode is refused as unsupported — a known outcome', async () => {
    const h = await brokerHarness();
    await family(h, 'cascade-pause');
    await node(h.writer, 'plain');
    const tools = stoppingTools(h);
    // No unknown-outcome tail: the broker refuses this before it writes anything.
    const unsupported = 'task_stop: unsupported: the request is not supported';
    expect(await requestStop(tools, 'root', 1, 'cancel')).toFailWith(unsupported);
    expect(await requestStop(tools, 'plain', 1, 'pause')).toFailWith(unsupported);
  });

  test('a stale revision is a conflict that names the intent the stop would have had — which does not exist', async () => {
    const h = await brokerHarness();
    await family(h);
    const recorded = minting(h);
    const tools = stoppingTools(recorded.h);
    const result = await requestStop(tools, 'root', 7, 'pause');
    const intentId = recorded.minted[0];
    expect(result).toFailWith(
      'task_stop: conflict: the task changed, or does not accept this change now; inspect it again before ' +
        `deciding whether to retry${unknownNote(intentId)}`
    );
    expect(await call(tools, 'task_stop_inspect', { taskId: 'root', intentId })).toFailWith(
      'task_stop_inspect: not-found-or-denied: the task is not found or not visible, or this is not permitted on it'
    );
  });

  test('a second stop of a latched mode is refused; the first stands and is inspected by its own id', async () => {
    const h = await brokerHarness();
    await family(h);
    const recorded = minting(h);
    const tools = stoppingTools(recorded.h);
    const first = (await requestStop(tools, 'root', 1, 'pause')).orThrow();
    expect(await requestStop(tools, 'root', 1, 'pause')).toFailWith(/^task_stop: conflict: .*intentId is /);
    const second = recorded.minted[1];
    expect(recorded.minted[0]).toBe(first.intentId);
    expect(second).not.toBe(first.intentId);
    expect(await call(tools, 'task_stop_inspect', { taskId: 'root', intentId: second })).toFailWith(
      /not-found-or-denied/
    );
    expect(
      await call<ITaskStopToolResult>(tools, 'task_stop_inspect', {
        taskId: 'root',
        intentId: first.intentId
      })
    ).toSucceedAndSatisfy((result) => expect(result.state).toBe('pending'));
    // A cancel is a different latch, and is accepted beside the pause.
    expect(await requestStop(tools, 'root', 1, 'cancel')).toSucceed();
  });

  test('only the offered modes are accepted, and the refusal reaches nothing', async () => {
    const h = await brokerHarness();
    await family(h);
    const { view, touched } = recordingView(h.writer);
    const tools = stoppingTools(h, view as IBoundTaskWriter, undefined, ['pause']);
    expect(await requestStop(tools, 'root', 1, 'cancel')).toFailWith(/^task_stop: invalid arguments/);
    expect(touched.has('requestStop')).toBe(false);
    expect(await requestStop(tools, 'root', 1, 'pause')).toSucceed();
  });
});

describe('task_stop_inspect — paging the targets', () => {
  const small = { ...defaultTaskToolBudget, context: { ...defaultTaskContextBudget, maxItems: 2 } };

  test('targets come a page at a time, in the stop’s order; nothing is dropped and the counts are whole', async () => {
    const h = await brokerHarness();
    await family(h);
    await node(h.writer, 'd', { parentId: 'b' });
    const tools = stoppingTools(h, h.writer, { budget: small });
    const first = (await requestStop(tools, 'root', 1, 'pause')).orThrow();
    expect(first.targets.map((t) => t.taskId)).toEqual(['root', 'a']);
    expect(first).toMatchObject({ counts: { unexamined: 5 }, remaining: 3, nextAfter: 'a' });
    const page = (after: string): ReturnType<typeof call<ITaskStopToolResult>> =>
      call<ITaskStopToolResult>(tools, 'task_stop_inspect', {
        taskId: 'root',
        intentId: first.intentId,
        after
      });
    expect(await page('a')).toSucceedAndSatisfy((result) => {
      expect(result.targets.map((t) => t.taskId)).toEqual(['b', 'c']);
      expect(result).toMatchObject({ counts: { unexamined: 5 }, remaining: 1, nextAfter: 'c' });
    });
    expect(await page('c')).toSucceedAndSatisfy((result) => {
      expect(result.targets.map((t) => t.taskId)).toEqual(['d']);
      expect(result.remaining).toBe(0);
      expect(result.nextAfter).toBeUndefined();
    });
    expect(await page('d')).toSucceedAndSatisfy((result) => {
      expect(result.targets).toEqual([]);
      expect(result.remaining).toBe(0);
    });
  });

  test('continuing after a target hidden since, or never a target, reads alike: start again', async () => {
    const h = await brokerHarness();
    await family(h);
    await node(h.writer, 'elsewhere');
    const tools = stoppingTools(h, h.writer, { budget: small });
    const first = (await requestStop(tools, 'root', 1, 'pause')).orThrow();
    h.policy.hide('a');
    const stale = 'task_stop_inspect: cursor-stale: the cursor is no longer valid; query again without it';
    for (const after of ['a', 'elsewhere', 'nowhere']) {
      expect(
        await call(tools, 'task_stop_inspect', { taskId: 'root', intentId: first.intentId, after })
      ).toFailWith(stale);
    }
  });
});

describe('capability checks are live — offering a stop is not authorizing it', () => {
  test('stop authority revoked after the tools are built is refused at the next call; granted later, allowed', async () => {
    const h = await brokerHarness();
    await family(h);
    h.policy.denyOn('stop', 'root');
    const tools = stoppingTools(h);
    expect(await requestStop(tools, 'root', 1, 'pause')).toFailWith(/^task_stop: not-found-or-denied: /);
    h.policy.deny.length = 0;
    expect(await requestStop(tools, 'root', 1, 'pause')).toSucceed();
    h.policy.denyOn('stop', 'root');
    expect(await requestStop(tools, 'root', 1, 'cancel')).toFailWith(/^task_stop: not-found-or-denied: /);
  });

  test('building the stop tools asks the policy nothing', async () => {
    const h = await brokerHarness();
    await family(h);
    const before = h.policy.calls.length;
    stoppingTools(h);
    expect(h.policy.calls.length).toBe(before);
  });

  test('inspecting a stop needs only that its root is visible, and a hidden root reads as a missing one', async () => {
    const h = await brokerHarness();
    await family(h);
    const tools = stoppingTools(h);
    const accepted = (await requestStop(tools, 'root', 1, 'pause')).orThrow();
    // Another principal over the same scopes, with no stop authority, may read the stop.
    const bobsPolicy = new TestPolicy();
    bobsPolicy.deny.push((r) => r.action === 'stop');
    const reader = bindWriter(h, { principal: 'bob', authorization: bobsPolicy });
    const bobs = stoppingTools(h, reader);
    expect(
      await call(bobs, 'task_stop_inspect', { taskId: 'root', intentId: accepted.intentId })
    ).toSucceed();
    bobsPolicy.hide('root');
    expect(await call(bobs, 'task_stop_inspect', { taskId: 'root', intentId: accepted.intentId })).toFailWith(
      'task_stop_inspect: not-found-or-denied: the task is not found or not visible, or this is not permitted on it'
    );
  });
});

describe('stop-active is never disclosed — enabling the stop tools changes no other tool’s answers', () => {
  test('a creation under a stopped parent reads as conflict, identically with and without the stop tools', async () => {
    const h = await brokerHarness();
    await family(h);
    const mutations = { writer: h.writer, environment: h.env, enable: ['tracked' as const] };
    const withStops = stoppingTools(h, h.writer, { mutations });
    (await requestStop(withStops, 'root', 1, 'pause')).orThrow();
    const without = stoppingTools(h, h.writer, { mutations }, []);
    expect(without.names).not.toContain('task_stop');
    const answers: string[] = [];
    for (const tools of [withStops, without]) {
      const result = await call<ITaskMutationToolResult>(tools, 'task_create', {
        title: 'late',
        parentId: 'a'
      });
      expect(result).toFailWith(/^task_create: conflict: /);
      answers.push(result.message ?? '');
    }
    expect(answers[0]).toBe(answers[1]);
    expect(answers[0]).not.toMatch(/stop|latch/);
  });
});

describe('the binding members the packlet reaches', () => {
  test('requestStop and inspectStop are the seventh and eighth — never release, the pump, or anything else', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    await node(h.writer, 't1');
    const { view, touched } = recordingView(h.writer);
    const writer = view as IBoundTaskWriter;
    const tools = stoppingTools(h, writer, {
      mutations: { writer, environment: h.env, enable: ['tracked', 'reassign'] },
      commands: {
        writer,
        registry: h.registry,
        environment: h.env,
        enable: [{ kind: 'sim.job' as never, detailVersion: 1, command: 'pause' }]
      }
    });
    expect(await call(tools, 'task_query', {})).toSucceed();
    expect(await call<TaskInspectToolResult>(tools, 'task_inspect', { taskId: 't1' })).toSucceed();
    expect(await call(tools, 'task_create', { title: 'x' })).toSucceed();
    expect(await call(tools, 'task_update', { taskId: 't1', expectedRevision: 1, title: 'y' })).toSucceed();
    expect(
      await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 2, responsibility: null })
    ).toSucceed();
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    const stopped = (
      await call<ITaskStopToolResult>(tools, 'task_stop', {
        taskId: 'root',
        expectedRevision: 1,
        mode: 'pause'
      })
    ).orThrow();
    expect(
      await call(tools, 'task_stop_inspect', { taskId: 'root', intentId: stopped.intentId })
    ).toSucceed();
    expect([...touched].sort()).toEqual([
      'createTracked',
      'execute',
      'inspect',
      'inspectStop',
      'query',
      'reassign',
      'requestStop',
      'updateTracked'
    ]);
    for (const untouched of [
      'changeScopes',
      'reparent',
      'completeList',
      'archive',
      'reconcileListCompletions',
      'resolveCommands',
      'registerExternal',
      'createTaskList',
      'releaseStop',
      'reconcileStop'
    ]) {
      expect(touched.has(untouched)).toBe(false);
    }
  });
});
