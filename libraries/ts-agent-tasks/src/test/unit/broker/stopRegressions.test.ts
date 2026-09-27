/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

// Regressions for the seven defects the T9 semantic antagonist demonstrated (agent-tasks-t9 result.md
// § Review). Each test asserts the corrected behaviour of its probe.

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  ITaskCapacityProfile,
  defaultTaskCapacityProfile
} from '../../../index';
import { TestPolicy, alpha, bindWriter, brokerHarness, op, tid } from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { CapabilityScript, node, persisted, pump, release, states, stop } from '../../helpers/stopFixtures';

async function withJob(
  root?: FileTree.IFileTreeDirectoryItem
): Promise<ISourceHarness & { readonly declared: CapabilityScript }> {
  const declared = new CapabilityScript();
  const h = await sourceHarness({ capabilities: declared.ask, ...(root !== undefined ? { root } : {}) });
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  h.executor.addJob('job');
  await registerJob(h, 'job', { parentId: tid('root') });
  return { ...h, declared };
}

describe('T9 antagonist regressions', () => {
  test('H1: a pass whose findings were discarded under a moved policy revalidates nothing', async () => {
    const inner = memoryRoot();
    const h = await withJob(inner);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    h.repository.close();
    const { env, logger } = environment('h1');
    const opened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: env,
        registry: sourceRegistry(h.source)
      })
    ).orThrow();
    const r = harnessWith(
      opened.state === 'ready' ? opened.repository : (undefined as never),
      env,
      inner,
      logger,
      h.executor,
      h.source,
      h.registry
    );
    const inspect = async (): Promise<string> =>
      (await r.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow().state;
    h.declared.declaration = {
      ...(h.declared.declaration as object),
      pause: 'sampled',
      contractVersion: 'v2'
    };
    const policy = r.policy;
    policy.afterDecision = (request) => {
      if (request.action === 'stop' && request.task?.envelope.id === 'job') {
        policy.epoch = 'epoch-2';
      }
    };
    const result = (await pump(r.writer, accepted)).orThrow();
    expect(result.state).toBe('pending');
    expect(await inspect()).toBe('pending');
  });

  test('M1: a freeze refusal names only the task asked about, never a hidden root or its stop', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const hidden = new TestPolicy();
    hidden.hide('root');
    const bob = bindWriter(h, { principal: 'bob', authorization: hidden });
    const refused = await bob.createTracked({
      taskId: tid('n'),
      operationId: op(),
      title: 'n',
      parentId: tid('c')
    });
    expect(refused).toFailWith(/stop-active: task c is under a stop latch/);
    expect(refused.isFailure() && refused.message).not.toContain('root');
    expect(refused.isFailure() && refused.message).not.toContain(accepted.intentId);
  });

  test('M2: a capacity refusal at acceptance names no target and none of its figures', async () => {
    const tight: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 5 }
    };
    const h = await brokerHarness({ profile: tight });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'secret', { parentId: 'root' });
    for (const title of ['one', 'two']) {
      const r = (await h.repository.readCommit(tid('secret'))).orThrow() as IResolvedTaskCommitRecord;
      (
        await h.writer.updateTracked({
          taskId: tid('secret'),
          operationId: op(),
          expectedRevision: r.task.envelope.revision,
          patch: { title }
        })
      ).orThrow();
    }
    h.policy.hide('secret');
    const refused = await stop(h, h.writer, 'root', 'pause');
    expect(refused).toFailWith(/a target of the stop has no room for its attempt \('operations'\)/);
    expect(refused.isFailure() && refused.message).not.toContain('secret');
    expect(refused.isFailure() && refused.detail?.capacity).toEqual(
      expect.objectContaining({ dimension: 'operations', used: 0, reserved: 0 })
    );
    expect(refused.isFailure() && refused.detail?.capacity?.recordId).toBeUndefined();
  });

  test('M3: an observation-purpose commit cannot start a latched native task', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    const current = (await recordOf(h, 'c')) as IResolvedTaskCommitRecord;
    const moved = await h.repository.withWriter(async (writer) =>
      writer.commit({
        purpose: 'observation',
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
          sourceRevision: { epoch: 'x', token: '1' },
          operations: current.operations,
          updates: current.updates,
          archived: false,
          stops: current.stops
        }
      })
    );
    expect(moved).toFailWith(
      /stop-active: task c is under a stop latch and cannot move from 'paused' to 'running'/
    );
  });

  test('M4: an uncertain stop command can be abandoned, marker kept; the target is then archivable', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    h.executor.loseNextResponse = true;
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('indeterminate');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    (await release(h, h.writer, accepted)).orThrow();
    const abandoned = (
      await h.broker.abandonCommand(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { taskId: 'job', operationId: key, reason: 'host gave up' }
      )
    ).orThrow();
    expect(abandoned.result.state).toBe('abandoned');
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      stop: { intentId: accepted.intentId },
      dispatch: 'settled'
    });
    expect((await h.repository.unsettledCommands({ limit: 10 })).orThrow()).toEqual([]);
  });

  test('L1: a stable stop its source contradicted keeps the intent blocked until it is confirmed again', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'running' };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    // One effect: the pass records the violation and persists a new attempt — nothing is sent yet.
    const recorded = (await pump(h.writer, accepted, 2)).orThrow();
    expect(recorded.state).toBe('blocked');
    expect((await persisted(h, accepted)).state).toBe('blocked');
    const again = (await pump(h.writer, accepted)).orThrow();
    expect(again.state).toBe('satisfied');
  });

  test('L2: a denial met at the dispatch boundary is retried under a new attempt once authority returns', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    let asks = 0;
    let revoked = true;
    h.policy.deny.push(
      (r) => r.action === 'stop' && r.task?.envelope.id === 'job' && revoked && ++asks === 2
    );
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('denied');
    revoked = false;
    const retried = (await pump(h.writer, accepted)).orThrow();
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(2);
    expect(retried.state).not.toBe('satisfied');
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    expect(h.executor.jobs.get('job')!.lifecycle.status).toBe('paused');
  });
});
