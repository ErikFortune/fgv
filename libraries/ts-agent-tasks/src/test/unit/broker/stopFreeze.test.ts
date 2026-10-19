/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IResolvedTaskCommitRecord, IStopResult } from '../../../index';
import { IBrokerHarness, brokerHarness, command, op, revisionOf, tid } from '../../helpers/brokerFixtures';
import { recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { CapabilityScript, node, pump, release, statusOf, stop } from '../../helpers/stopFixtures';

/** root ── a ── c, plus an unrelated `free` task outside the tree. */
async function latched(h: IBrokerHarness, mode: 'pause' | 'cancel' = 'pause'): Promise<IStopResult> {
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'a', { parentId: 'root' });
  await node(h.writer, 'c', { parentId: 'a' });
  await node(h.writer, 'free');
  return (await stop(h, h.writer, 'root', mode)).orThrow();
}

describe('the admission freeze while a stop latches', () => {
  test('no new child anywhere in the subtree, including below descendants; creation outside it is ordinary', async () => {
    const h = await brokerHarness();
    await latched(h);
    for (const parent of ['root', 'a', 'c']) {
      expect(
        await h.writer.createTracked({
          taskId: tid(`n-${parent}`),
          operationId: op(),
          title: 'n',
          parentId: tid(parent)
        })
      ).toFailWith(/stop-active/);
    }
    expect(
      await h.writer.createTracked({
        taskId: tid('n-free'),
        operationId: op(),
        title: 'n',
        parentId: tid('free')
      })
    ).toSucceed();
  });

  test('reparent out of, within and into the subtree is refused', async () => {
    const h = await brokerHarness();
    await latched(h);
    const move = async (id: string, parent: string | 'root'): Promise<unknown> =>
      h.writer.reparent({
        taskId: tid(id),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, id),
        parent: parent === 'root' ? 'root' : { taskId: tid(parent) }
      });
    expect(await move('c', 'free')).toFailWith(/stop-active: task c .* cannot be moved/);
    expect(await move('c', 'root')).toFailWith(/stop-active/);
    expect(await move('a', 'root')).toFailWith(/stop-active/);
    expect(await move('free', 'a')).toFailWith(/stop-active: task a .* takes no new child/);
  });

  test('start, resume and paused → waiting are refused as stop-active, whatever the command', async () => {
    const h = await brokerHarness();
    const accepted = await latched(h);
    // Before the pump: a pending child under a pause latch cannot start.
    expect(await command(h, h.writer, 'c', 'start')).toMatchObject({
      result: { state: 'rejected', reason: 'stop-active' }
    });
    (await pump(h.writer, accepted)).orThrow();
    expect(await statusOf(h, 'c')).toBe('paused');
    const reason = { reason: { code: 'x', summary: 'x' } };
    expect(await command(h, h.writer, 'c', 'resume')).toMatchObject({ result: { reason: 'stop-active' } });
    expect(await command(h, h.writer, 'c', 'wait', reason)).toMatchObject({
      result: { reason: 'stop-active' }
    });
    // A move into the stopped set, or a metadata change, is not refused.
    expect(await command(h, h.writer, 'c', 'set-title', { title: 'renamed' })).toMatchObject({
      result: { state: 'applied' }
    });
    expect(await command(h, h.writer, 'c', 'cancel', reason)).toMatchObject({ result: { state: 'applied' } });
    expect(await statusOf(h, 'c')).toBe('cancelled');
  });

  test('update tools cannot route around it: patches, scopes and reassignment change no lifecycle or edge', async () => {
    const h = await brokerHarness();
    await latched(h);
    const at = async (id: string): Promise<{ taskId: never; operationId: never; expectedRevision: never }> =>
      ({ taskId: tid(id), operationId: op(), expectedRevision: await revisionOf(h.repository, id) } as never);
    expect(
      await h.writer.updateTracked({ ...(await at('c')), patch: { title: 'still frozen' } })
    ).toSucceed();
    expect(await h.writer.reassign({ ...(await at('c')), responsibility: 'unassigned' })).toSucceed();
    const record = (await recordOf(h, 'c')) as IResolvedTaskCommitRecord;
    expect(record.task.envelope.lifecycle.status).toBe('pending');
    expect(record.task.envelope.parentId).toBe('a');
  });

  test('a list under a latch does not complete, explicitly or by the pump', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel', list: true });
    await node(h.writer, 'x', { parentId: 'root' });
    await command(h, h.writer, 'x', 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(
      await h.writer.completeList({
        taskId: tid('root'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'root'),
        outcome: { summary: 'all done', artifacts: [] }
      })
    ).toFailWith(/stop-active: task root .* cannot complete/);
    (await release(h, h.writer, accepted)).orThrow();
    expect(await statusOf(h, 'root')).toBe('pending');
  });

  test('a latched task cannot be archived; its terminal state is kept for the stop', async () => {
    const h = await brokerHarness();
    await latched(h);
    await command(h, h.writer, 'c', 'succeed', { outcome: { summary: 'done', artifacts: [] } });
    expect(
      await h.writer.archive({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'c')
      })
    ).toFailWith(/under another task's stop latch, which must settle or be released first/);
  });

  test('storage refuses the bypass itself: a raw writer commit that moves a latched task', async () => {
    const h = await brokerHarness();
    await latched(h);
    const current = (await recordOf(h, 'c')) as IResolvedTaskCommitRecord;
    const raw = op('raw');
    const moved = await h.repository.withWriter(async (writer) =>
      writer.commit({
        purpose: 'operation',
        operationId: raw,
        taskId: tid('c'),
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: {
          recordType: 'resolved',
          task: {
            ...current.task,
            envelope: {
              ...current.task.envelope,
              revision: (current.task.envelope.revision + 1) as never,
              lifecycle: { status: 'running' }
            }
          },
          operations: [
            ...current.operations,
            {
              type: 'catalog',
              operationId: raw,
              operation: 'update-tracked',
              request: {},
              principalKey: 'raw',
              receipt: {}
            }
          ],
          updates: current.updates,
          archived: false
        }
      })
    );
    expect(moved).toFailWith(/stop-active/);
  });

  test('a concurrently arriving child either lands before capture and is a target, or is refused after', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    // The child's creation is authorized, then the stop commits while it waits for the writer.
    let stopped: Promise<unknown> | undefined;
    h.policy.afterDecision = (request) => {
      if (request.action === 'create' && request.role === 'parent' && stopped === undefined) {
        stopped = stop(h, h.writer, 'root', 'pause');
      }
    };
    const child = h.writer.createTracked({
      taskId: tid('late'),
      operationId: op(),
      title: 'late',
      parentId: tid('root')
    });
    const [created] = await Promise.all([child, Promise.resolve()]);
    const accepted = (await stopped) as { isSuccess(): boolean; value: IStopResult };
    const tree = accepted.value.targets.map((t) => t.taskId);
    if (created.isSuccess()) {
      expect(tree).toContain('late');
    } else {
      expect(created).toFailWith(/stop-active/);
      expect(tree).not.toContain('late');
    }
  });

  test('an external child: no new command reaches its source; a command recorded before the latch is not sent', async () => {
    const declared = new CapabilityScript();
    const h = await sourceHarness({ capabilities: declared.ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    // Recorded, never sent: the policy moves between the intent and the dispatch marker.
    let checks = 0;
    h.policy.afterDecision = (request) => {
      if (request.action === 'command' && ++checks === 2) {
        h.policy.epoch = 'epoch-2';
      }
    };
    const early = await h.writer.execute({
      taskId: tid('job'),
      operationId: op('early'),
      expectedRevision: await revisionOf(h.repository, 'job'),
      command: 'advance',
      parameters: { steps: 1 }
    });
    expect(early).toFailWith(/intent is recorded and was not sent/);
    (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // The pump that would send it finds the latch: settled refused, never sent.
    const resolved = (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(resolved.resolutions[0]).toMatchObject({ result: { state: 'rejected', reason: 'stop-active' } });
    expect(await command(h, h.writer, 'job', 'resume', {})).toMatchObject({
      result: { state: 'rejected', reason: 'stop-active' }
    });
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a registration naming a latched parent is refused; unparented registration is ordinary', async () => {
    const h = await sourceHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    (await stop(h, h.writer, 'root', 'pause')).orThrow();
    h.executor.addJob('late');
    await expect(registerJob(h, 'late', { parentId: tid('root') })).rejects.toThrow(/stop-active/);
    h.executor.addJob('solo');
    await expect(registerJob(h, 'solo')).resolves.toBe('solo');
  });

  test('after release, admission is ordinary again', async () => {
    const h = await brokerHarness();
    const accepted = await latched(h);
    (await release(h, h.writer, accepted)).orThrow();
    expect(
      await h.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('c') })
    ).toSucceed();
    expect(await command(h, h.writer, 'c', 'start')).toMatchObject({ result: { state: 'applied' } });
  });
});
