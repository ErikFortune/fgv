/*
 * Temporary adversarial probes for T9 — not part of the change.
 */

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
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { CapabilityScript, node, persisted, pump, states, stop } from '../../helpers/stopFixtures';

describe('T9 adversarial probes', () => {
  test('P1: a stop-active refusal names a hidden ancestor root and its intent id', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const bobPolicy = new TestPolicy();
    bobPolicy.hide('root');
    const bob = bindWriter(h, { principal: 'bob', authorization: bobPolicy });
    // bob cannot see root
    expect(await bob.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).toFailWith(/./);
    const refused = await bob.createTracked({
      taskId: tid('n'),
      operationId: op(),
      title: 'n',
      parentId: tid('c')
    });
    expect(refused).toFailWith(/stop-active/);
    const message = refused.isFailure() ? refused.message : '';
    console.log('P1 message:', message);
    expect(message).toContain('of root');
    expect(message).toContain(accepted.intentId);
  });

  test('P2: a capacity refusal at acceptance names a hidden descendant', async () => {
    const tight: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 5 }
    };
    const h = await brokerHarness({ profile: tight });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'secret', { parentId: 'root' });
    for (const title of ['one', 'two']) {
      const r = (await h.repository.readCommit(tid('secret'))).orThrow()! as IResolvedTaskCommitRecord;
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
    expect(refused).toFail();
    console.log('P2:', refused.isFailure() ? [refused.message, JSON.stringify(refused.detail)] : '');
    expect(refused.isFailure() && refused.message).toContain('secret');
    expect(refused.isFailure() && refused.detail?.capacity?.recordId).toBe('secret');
  });

  test('P3: storage lets an observation-purpose commit start a latched native task', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    const current = (await recordOf(h, 'c')) as IResolvedTaskCommitRecord;
    expect(current.task.envelope.lifecycle.status).toBe('paused');
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
          archived: false
        }
      })
    );
    console.log('P3:', moved.isFailure() ? moved.message : 'SUCCEEDED');
    expect(moved).toSucceed();
    expect(((await recordOf(h, 'c')) as IResolvedTaskCommitRecord).task.envelope.lifecycle.status).toBe(
      'running'
    );
  });

  test('P4: an epoch move during a post-reopen pump "revalidates" a stable stop whose contract was withdrawn', async () => {
    const inner = memoryRoot();
    const declared = new CapabilityScript();
    const h = await sourceHarness({ root: inner, capabilities: declared.ask } as never);
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');

    h.repository.close();
    const { env, logger } = environment('adv-r1');
    const opened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: env,
        registry: sourceRegistry(h.source)
      })
    ).orThrow();
    if (opened.state !== 'ready') {
      throw new Error('not ready');
    }
    const r = harnessWith(
      opened.repository,
      env,
      inner as FileTree.IFileTreeDirectoryItem,
      logger,
      h.executor,
      h.source,
      h.registry
    );
    const inspect = async (): Promise<string> =>
      (await r.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow().state;
    expect(await inspect()).toBe('pending');

    // The source withdraws its stable-stop contract across the restart.
    declared.declaration = { ...(declared.declaration as object), pause: 'sampled', contractVersion: 'v2' };
    // A policy epoch change lands while the pass is running (after the job's per-target decision).
    const policy = r.policy;
    policy.afterDecision = (request) => {
      if (request.action === 'stop' && request.task?.envelope.id === 'job') {
        policy.epoch = 'epoch-2';
      }
    };
    const result = (await pump(r.writer, accepted)).orThrow();
    console.log('P4 result:', result.state, JSON.stringify(states(result)));
    expect((await persisted(r, accepted)).state).toBe('satisfied');
    expect(result.state).toBe('satisfied');
    // And from now on this broker presents it satisfied, though revalidation actually failed.
    expect(await inspect()).toBe('satisfied');
  });

  test('P5: after an autonomous restart the intent becomes pending (not blocked), and returns to satisfied', async () => {
    const declared = new CapabilityScript();
    const h = await sourceHarness({ capabilities: declared.ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'running' };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    const repaired = (await pump(h.writer, accepted)).orThrow();
    console.log('P5 after violation pump:', repaired.state, (await persisted(h, accepted)).state);
    expect((await persisted(h, accepted)).state).toBe('pending');
  });

  test('P6: abandoning an uncertain stop command strips its marker, and the pump re-sends under a new key', async () => {
    const declared = new CapabilityScript();
    const h = await sourceHarness({ capabilities: declared.ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    h.executor.loseNextResponse = true;
    const first = (await pump(h.writer, accepted)).orThrow();
    console.log('P6 first:', first.state, JSON.stringify(states(first)));
    const key = (await persisted(h, accepted)).targets[1].operationId;
    const before = (await recordOf(h, 'job')).operations.find((o) => o.operationId === key);
    console.log('P6 stored before abandon:', JSON.stringify(before));
    (
      await h.broker.abandonCommand(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { taskId: 'job', operationId: key, reason: 'host gave up' }
      )
    ).orThrow();
    const after = (await recordOf(h, 'job')).operations.find((o) => o.operationId === key);
    console.log('P6 stored after abandon:', JSON.stringify(after));
    for (let i = 0; i < 3; i++) {
      const r = (await pump(h.writer, accepted)).orThrow();
      console.log('P6 pass', i, r.state, JSON.stringify(states(r)));
    }
    const target = (await persisted(h, accepted)).targets[1];
    console.log(
      'P6 target:',
      JSON.stringify(target),
      'applied:',
      JSON.stringify(h.executor.jobs.get('job')!.applied)
    );
    expect(target.attempt).toBe(2);
    expect(h.executor.jobs.get('job')!.applied.length).toBe(2);
  });
});
