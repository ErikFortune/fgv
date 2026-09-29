/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Generated command tools (I1c), run against the simulated executor — a source that really applies
 * the commands it accepts — so an outcome the tool reports is checked against what the executor did.
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { IBoundTaskWriter, TaskCommandToolResult } from '../../../index';
import { beta, track } from '../../helpers/brokerFixtures';
import { ISourceHarness, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { IToolSet, call, commandingTools, mutatingTools, recordingView } from '../../helpers/toolFixtures';

/** The one line every refusal of authority reads as, in every task tool. */
const refusedLine = (tool: string): string =>
  `${tool}: not-found-or-denied: the task is not found or not visible, or this is not permitted on it`;

const conflictLine = (tool: string): string =>
  `${tool}: conflict: the task changed, or does not accept this change now; inspect it again before ` +
  'deciding whether to retry';

const unknownLine = (tool: string): string =>
  `${tool}: the outcome is not known: the command may or may not have been recorded or applied, and ` +
  'the host settles any that was — do not send it again; inspect the task later';

async function ready(options?: Parameters<typeof sourceHarness>[0]): Promise<ISourceHarness> {
  const h = await sourceHarness(options);
  h.executor.addJob('j1');
  await registerJob(h, 'j1');
  return h;
}

describe('a command tool sends a registered command, and reports only what the receipt says', () => {
  let h: ISourceHarness;
  let logger: Logging.InMemoryLogger;
  let tools: IToolSet;

  beforeEach(async () => {
    h = await ready();
    logger = new Logging.InMemoryLogger('detail');
    tools = commandingTools(h, h.writer, { logger });
  });

  test('applied: the executor applied it under a key the tool minted, and the model is told the revision', async () => {
    expect(
      await call<TaskCommandToolResult>(tools, 'task_command_pause', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'hold' }
      })
    ).toSucceedWith({ taskId: 'j1' as never, state: 'applied', revision: 2 as never });
    const applied = h.executor.jobs.get('j1')!.applied;
    expect(applied).toHaveLength(1);
    // The key the executor saw is the host's minted id, not anything the model named.
    expect(applied[0]).toMatch(/^pause:s-\d+$/);
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('paused');
  });

  test("accepted: the model is told only 'accepted' — the source's receipt text goes to the host", async () => {
    h.executor.acceptOnly = true;
    const result = await call<TaskCommandToolResult>(tools, 'task_command_cancel', {
      taskId: 'j1',
      expectedRevision: 1,
      parameters: { reason: 'stop' }
    });
    expect(result).toSucceedWith({ taskId: 'j1' as never, state: 'accepted' });
    expect(JSON.stringify(result.orThrow())).not.toMatch(/rcpt-/);
    expect(logger.logged.some((line) => /accepted by the source as rcpt-s-\d+/.test(line))).toBe(true);
    // Accepted is not applied: the task has not moved.
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
  });

  test('accepted with no logger still tells the model accepted, and nothing more', async () => {
    h.executor.acceptOnly = true;
    const quiet = commandingTools(h);
    expect(
      await call(quiet, 'task_command_cancel', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toSucceedWith({ taskId: 'j1', state: 'accepted' });
  });

  test("indeterminate: the model is told the outcome is unknown and not to resend — never the source's reason", async () => {
    h.executor.answerIndeterminate = true;
    const result = await call(tools, 'task_command_pause', {
      taskId: 'j1',
      expectedRevision: 1,
      parameters: { reason: 'hold' }
    });
    expect(result).toFailWith(unknownLine('task_command_pause'));
    expect(logger.logged.some((line) => line.includes('the executor could not say'))).toBe(true);
  });

  test('a source rejection is a known outcome: an invalid transition reads as conflict', async () => {
    h.executor.change(
      'j1',
      (j) => {
        j.lifecycle = { status: 'cancelled', reason: { code: 'cancelled', summary: 'done' } };
      },
      false
    );
    expect(
      await call(tools, 'task_command_resume', { taskId: 'j1', expectedRevision: 1, parameters: {} })
    ).toFailWith(conflictLine('task_command_resume'));
    expect(logger.logged.some((line) => /rejected: invalid-transition/.test(line))).toBe(true);
  });

  test('a stale revision is refused as conflict, and nothing is sent', async () => {
    expect(
      await call(tools, 'task_command_advance', {
        taskId: 'j1',
        expectedRevision: 7,
        parameters: { steps: 1 }
      })
    ).toFailWith(conflictLine('task_command_advance'));
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a command the policy denies on a visible task reads exactly as a hidden task and a foreign id', async () => {
    h.executor.addJob('j2');
    await registerJob(h, 'j2');
    h.executor.addJob('j3');
    await registerJob(h, 'j3', { scopes: [beta] });
    h.policy.denyOn('command', 'j1');
    h.policy.hide('j2');
    const lines: string[] = [];
    for (const taskId of ['j1', 'j2', 'j3', 'missing']) {
      const result = await call(tools, 'task_command_pause', {
        taskId,
        expectedRevision: 1,
        parameters: { reason: 'x' }
      });
      expect(result).toFail();
      lines.push(String(result.message));
    }
    expect(lines).toEqual(Array(4).fill(refusedLine('task_command_pause')));
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a task of another kind is refused before anything is sent — a tool is its own kind’s command', async () => {
    await track(h.writer, 't1');
    const { view, touched } = recordingView(h.writer);
    const recorded = commandingTools(h, view as IBoundTaskWriter);
    expect(
      await call(recorded, 'task_command_pause', {
        taskId: 't1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toFailWith(/^task_command_pause: unsupported: the request is not supported$/);
    expect(touched.has('execute')).toBe(false);
  });

  test('an unresolved registration of the kind is sent, and the broker refuses it as unsupported', async () => {
    h.executor.addJob('j2');
    await registerJob(h, 'j2', { unresolved: true });
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 'j2',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toFailWith(/^task_command_pause: unsupported: /);
    expect(h.executor.dispatches.size).toBe(0);
  });
});

describe('idempotency: a model must not resend a command whose outcome is unknown', () => {
  test('a lost response is unknown to the model; the pump settles it under the same key, applied once', async () => {
    const h = await ready({ lookup: true });
    const tools = commandingTools(h);
    h.executor.loseNextResponse = true;
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toFailWith(unknownLine('task_command_pause'));
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['resolved']);
    });
    // One key, applied once: the source deduplicates the pump's lookup under the key it already holds.
    expect(Array.from(h.executor.dispatches.keys())).toHaveLength(1);
    expect(h.executor.jobs.get('j1')!.applied).toHaveLength(1);
  });

  test('a model resend is a new command under a new key — so after a lost response it applies twice', async () => {
    // This is why the unknown-outcome line says not to send it again, and why the tool cannot make a
    // retry safe: it mints a fresh key per call, and a `source-key` source deduplicates only the same key.
    const h = await ready();
    const tools = commandingTools(h);
    h.executor.loseNextResponse = true;
    const args = { taskId: 'j1', expectedRevision: 1, parameters: { steps: 1 } };
    expect(await call(tools, 'task_command_advance', args)).toFailWith(unknownLine('task_command_advance'));
    // The broker does not know the first one applied, so the task is still at the revision the model read.
    expect(await call(tools, 'task_command_advance', args)).toSucceed();
    expect(Array.from(h.executor.dispatches.keys())).toHaveLength(2);
    expect(h.executor.jobs.get('j1')!.step).toBe(2);
  });
});

describe('capability checks are live — offering a command is not authorizing it', () => {
  test('a policy that denies when the tools are built, then allows, decides each call as it runs', async () => {
    const h = await ready();
    h.policy.denyOn('command', 'j1');
    const tools = commandingTools(h);
    h.policy.deny.length = 0;
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toSucceedWith({ taskId: 'j1', state: 'applied', revision: 2 });
  });

  test('command authority revoked after the tools are built is refused at the next call, and nothing is sent', async () => {
    const h = await ready();
    const tools = commandingTools(h);
    expect(
      await call(tools, 'task_command_advance', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { steps: 1 }
      })
    ).toSucceed();
    h.policy.denyOn('command', 'j1');
    expect(
      await call(tools, 'task_command_advance', {
        taskId: 'j1',
        expectedRevision: 2,
        parameters: { steps: 1 }
      })
    ).toFailWith(refusedLine('task_command_advance'));
    expect(h.executor.dispatches.size).toBe(1);
    expect(h.executor.jobs.get('j1')!.step).toBe(1);
  });

  test('building the tools asks the policy nothing', async () => {
    const h = await ready();
    const before = h.policy.calls.length;
    commandingTools(h);
    expect(h.policy.calls.length).toBe(before);
  });
});

describe('the tools reach only the binding members they name', () => {
  test('execute is the sixth — never registration, scopes, lists, the pump or any stop method', async () => {
    const h = await ready();
    await track(h.writer, 't1');
    const { view, touched } = recordingView(h.writer);
    const writer = view as IBoundTaskWriter;
    const tools = mutatingTools(h, writer, {
      commands: {
        writer,
        registry: h.registry,
        environment: h.env,
        enable: [{ kind: 'sim.job' as never, detailVersion: 1, command: 'pause' }]
      }
    });
    await call(tools, 'task_query', {});
    await call(tools, 'task_inspect', { taskId: 't1' });
    await call(tools, 'task_create', { title: 'x' });
    await call(tools, 'task_update', { taskId: 't1', expectedRevision: 1, title: 'y' });
    await call(tools, 'task_reassign', { taskId: 't1', expectedRevision: 2, responsibility: null });
    expect(
      await call(tools, 'task_command_pause', {
        taskId: 'j1',
        expectedRevision: 1,
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    expect([...touched].sort()).toEqual([
      'createTracked',
      'execute',
      'inspect',
      'query',
      'reassign',
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
      'requestStop',
      'releaseStop',
      'reconcileStop',
      'inspectStop'
    ]) {
      expect(touched.has(untouched)).toBe(false);
    }
  });
});
