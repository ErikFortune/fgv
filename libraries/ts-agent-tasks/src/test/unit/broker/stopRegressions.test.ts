/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

// Regressions for the seven defects the T9 semantic antagonist demonstrated (agent-tasks-t9 result.md
// § Review). Each test asserts the corrected behaviour of its probe.

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  IStopIntent,
  IStopLatch,
  ITaskCapacityProfile,
  ITaskFailure,
  OperationId,
  TaskId,
  defaultTaskCapacityProfile
} from '../../../index';
import {
  IBrokerHarness,
  TestPolicy,
  alpha,
  bindWriter,
  brokerHarness,
  brokerRegistry,
  command,
  op,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { converters } from '../../helpers/fixtures';
import { environment, memoryRoot, registration } from '../../helpers/storageFixtures';
import {
  CapabilityScript,
  faultyWriter,
  node,
  persisted,
  pump,
  release,
  states,
  stop
} from '../../helpers/stopFixtures';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { stopAttemptBundle } from '../../../packlets/storage/stopLedger';

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

// Copilot, round 1 on #701: each finding's corrected behaviour.
describe('T9 Copilot round 1 regressions', () => {
  /** A job whose stop command is recorded and never sent: the policy moved at the dispatch boundary. */
  async function unsent(): Promise<{ h: ISourceHarness; key: string }> {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    let decisions = 0;
    const policy = h.policy;
    policy.afterDecision = (r) => {
      if (
        r.action === 'stop' &&
        r.role === 'stop-target' &&
        r.task?.envelope.id === 'job' &&
        ++decisions === 2
      ) {
        policy.epoch = 'epoch-2';
      }
    };
    (await pump(h.writer, accepted)).orThrow();
    policy.afterDecision = undefined;
    return { h, key: (await persisted(h, accepted)).targets[1].operationId };
  }

  test("a stop's command is resolved only under stop authority on its target, whichever path sends it", async () => {
    const { h, key } = await unsent();
    // Ordinary command authority stands; stop authority on the target is withdrawn.
    h.policy.deny.push(
      (r) => r.action === 'stop' && r.role === 'stop-target' && r.task?.envelope.id === 'job'
    );
    const report = (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(report.resolutions).toEqual([expect.objectContaining({ operationId: key, action: 'denied' })]);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a pass that changes nothing under a moved policy revalidates nothing', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    // A second broker instance over the same repository has revalidated nothing yet.
    const other = harnessWith(h.repository, h.env, h.root, h.logger, h.executor, h.source, h.registry);
    const policy = other.policy;
    policy.afterDecision = (r) => {
      if (r.action === 'stop' && r.role === 'stop-target' && r.task?.envelope.id === 'job') {
        policy.epoch = 'epoch-2';
      }
    };
    expect((await pump(other.writer, accepted)).orThrow().state).toBe('pending');
    policy.afterDecision = undefined;
    expect(
      (await other.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow().state
    ).toBe('pending');
    expect((await pump(other.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('a profile whose largest stop reservation is not representable yields no attempt bundle', () => {
    const wide: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 2 ** 40 }
    };
    expect(stopAttemptBundle(wide)).toFailWith(/stop reservation: .* is not exactly representable/);
  });

  test('storage refuses a summary that records a target confirmed while it is not stopped', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = await persisted(h, (await stop(h, h.writer, 'root', 'pause')).orThrow());
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const forged = {
      ...accepted,
      targets: accepted.targets.map((t, i) => (i === 1 ? { ...t, state: 'confirmed' as const } : t))
    };
    expect(
      await h.repository.withWriter((writer) =>
        writer.commit({
          purpose: 'maintenance',
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: root.operations,
            updates: root.updates,
            archived: false,
            stops: [forged]
          }
        })
      )
    ).toFailWith(/target c is recorded confirmed, and nothing holds it stopped/);
  });

  describe('a target confirmed by a pass that leaves the stopped set before the summary', () => {
    async function withLaterTarget(): Promise<ISourceHarness> {
      const h = await withJob();
      await node(h.writer, 'z', { parentId: 'root' });
      return h;
    }

    test('is not recorded confirmed: the summary keeps what it held', async () => {
      const h = await withLaterTarget();
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      const policy = h.policy;
      policy.afterDecision = async (r) => {
        if (r.action === 'stop' && r.role === 'stop-target' && r.task?.envelope.id === 'z') {
          policy.afterDecision = undefined;
          h.executor.change('job', (j) => {
            j.lifecycle = { status: 'running' };
          });
          (await h.broker.observe(tid('job'))).orThrow();
        }
      };
      const result = (await pump(h.writer, accepted)).orThrow();
      expect((await persisted(h, accepted)).targets[1].state).toBe('unexamined');
      expect(result.state).not.toBe('satisfied');
    });

    test.each([
      ['cannot be read, fails the pass', 'fail'],
      ['reads as gone, is not recorded confirmed', 'gone']
    ])('whose record %s', async (__, how) => {
      const h = await withLaterTarget();
      // The job is already paused: nothing is written to it, so the summary is the first to re-read it.
      h.executor.change('job', (j) => {
        j.lifecycle = { status: 'paused', reason: { code: 'manual', summary: 'held' } };
      });
      (await h.broker.observe(tid('job'))).orThrow();
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      const faulty = faultyWriter(h, {
        writerPatch: (w) => ({
          readCommit: async (id: TaskId) =>
            id !== 'job'
              ? w.readCommit(id)
              : how === 'fail'
              ? failWithDetail<never, ITaskFailure>('storage down', {
                  code: 'storage-unavailable',
                  retry: 'safe'
                })
              : succeedWithDetail<undefined, ITaskFailure>(undefined)
        })
      });
      const result = await pump(faulty, accepted);
      if (how === 'fail') {
        expect(result).toFailWith(/storage down/);
      } else {
        expect(result).toSucceed();
        expect((await persisted(h, accepted)).targets[1].state).toBe('unexamined');
      }
    });
  });

  test('a conflict whose refresh fails is not re-attempted on the stale precondition', async () => {
    const h = await withJob();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    let reads = 0;
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: async (id: TaskId) =>
          id === 'job' && ++reads === 2
            ? failWithDetail<never, ITaskFailure>('storage down', {
                code: 'storage-unavailable',
                retry: 'safe'
              })
            : r.readCommit(id)
      })
    });
    expect(states((await pump(faulty, accepted)).orThrow()).job).toBe('refused');
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
  });
});

// Copilot, round 2 on #701.
describe('T9 Copilot round 2 regressions', () => {
  test('a possibly-sent command recorded before a latch is not resent under it, and is after release', async () => {
    const h = await sourceHarness({ capabilities: new CapabilityScript().ask, lookup: true });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    // A deduplicating command whose send failed: uncertain, eligible for a resend by its key.
    h.executor.down = true;
    const key = op('pause');
    const job = (await recordOf(h, 'job')) as IResolvedTaskCommitRecord;
    (
      await h.writer.execute({
        taskId: tid('job'),
        operationId: key,
        expectedRevision: job.task.envelope.revision,
        command: 'pause',
        parameters: { reason: 'operator' }
      })
    ).orThrow();
    h.executor.down = false;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const report = (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(report.resolutions).toEqual([expect.objectContaining({ operationId: key, action: 'held' })]);
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      dispatch: 'possibly-sent'
    });
    (await release(h, h.writer, accepted)).orThrow();
    (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    expect(h.executor.dispatches.get(key)).toBe(2);
  });
});

// Copilot, round 3 on #701.
describe('T9 Copilot round 3 regressions', () => {
  test('a bounded pass racing a complete one neither overwrites its progress nor withdraws its verdict', async () => {
    const h = await withJob();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // While the bounded pass is authorizing its first target, a complete pass runs to satisfaction.
    const policy = h.policy;
    let raced = false;
    policy.afterDecision = async (r) => {
      if (!raced && r.action === 'stop' && r.role === 'stop-target' && r.task?.envelope.id === 'root') {
        raced = true;
        expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
      }
    };
    // One unit: the bounded pass spends it on the root and cannot so much as ask the job's source.
    const bounded = (await pump(h.writer, accepted, 1)).orThrow();
    policy.afterDecision = undefined;
    const stored = await persisted(h, accepted);
    expect(stored.targets.map((t) => t.state)).toEqual(['confirmed', 'confirmed']);
    expect(stored.state).toBe('satisfied');
    expect(bounded.targets.map((t) => t.state)).toEqual(['confirmed', 'confirmed']);
  });

  test('an archived record holding a latching stop is not a record this repository wrote', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'r', { stopPolicy: 'cascade-cancel' });
    await command(h, h.writer, 'r', 'cancel', { reason: { code: 'done', summary: 'done' } });
    (
      await h.writer.archive({
        taskId: tid('r'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'r')
      })
    ).orThrow();
    const archived = (await h.repository.readCommit(tid('r'))).orThrow() as IResolvedTaskCommitRecord;
    expect(converters.storage.record.convert(JSON.parse(JSON.stringify(archived)))).toSucceed();
    const latching = {
      id: 's',
      rootId: 'r',
      mode: 'cancel',
      requestedBy: 'alice',
      targets: [{ taskId: 'r', attempt: 1, operationId: 'k', state: 'unexamined' }],
      state: 'pending',
      topologyGeneration: 0
    };
    expect(
      converters.storage.record.convert({ ...JSON.parse(JSON.stringify(archived)), stops: [latching] })
    ).toFailWith(/an archived record holds stop s, still pending/);
  });

  test('storage refuses to record an external target confirmed without its stable-stop evidence', async () => {
    const h = await withJob();
    h.executor.change('job', (j) => {
      j.lifecycle = { status: 'paused', reason: { code: 'manual', summary: 'held' } };
    });
    (await h.broker.observe(tid('job'))).orThrow();
    const accepted = await persisted(h, (await stop(h, h.writer, 'root', 'cancel')).orThrow());
    const paused = await persisted(h, (await stop(h, h.writer, 'root', 'pause')).orThrow());
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const forged = {
      ...paused,
      targets: paused.targets.map((t, i) => (i === 1 ? { ...t, state: 'confirmed' as const } : t))
    };
    expect(
      await h.repository.withWriter((writer) =>
        writer.commit({
          purpose: 'maintenance',
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: root.operations,
            updates: root.updates,
            archived: false,
            stops: [accepted, forged]
          }
        })
      )
    ).toFailWith(/target job is recorded confirmed, and nothing holds it stopped/);
  });

  test('storage refuses to record a target confirmed that has no lifecycle yet', async () => {
    const h = await sourceHarness({ capabilities: new CapabilityScript().ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root'), unresolved: true });
    const paused = await persisted(h, (await stop(h, h.writer, 'root', 'pause')).orThrow());
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const forged = {
      ...paused,
      targets: paused.targets.map((t, i) => (i === 1 ? { ...t, state: 'confirmed' as const } : t))
    };
    expect(
      await h.repository.withWriter((writer) =>
        writer.commit({
          purpose: 'maintenance',
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: root.operations,
            updates: root.updates,
            archived: false,
            stops: [forged]
          }
        })
      )
    ).toFailWith(/target job is recorded confirmed, and nothing holds it stopped/);
  });
});

// Copilot, round 4 on #701.
describe('T9 Copilot round 4 regressions', () => {
  test('a source-replay stop command confirmed by the feed keeps its marker, and its stop completes', async () => {
    const h = await sourceHarness({ history: 'source-replay', capabilities: new CapabilityScript().ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    (await pump(h.writer, accepted)).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    // Applied ahead of the feed: accepted, awaiting the revision the feed will carry.
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      awaiting: expect.anything(),
      stop: { intentId: accepted.intentId }
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      receipt: { result: { state: 'applied' } },
      stop: { rootId: 'root', intentId: accepted.intentId }
    });
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
  });

  test('a registration carrying a stop is refused', async () => {
    const h = await brokerHarness();
    const request = registration('n');
    const draft = request.record as IResolvedTaskRecordDraft;
    const withStop = {
      ...request,
      record: {
        ...draft,
        stops: [
          {
            id: 's' as OperationId,
            rootId: tid('n'),
            mode: 'pause' as const,
            requestedBy: 'alice',
            targets: [
              { taskId: tid('n'), attempt: 1, operationId: 'k' as OperationId, state: 'unexamined' as const }
            ],
            state: 'pending' as const,
            topologyGeneration: 0
          }
        ]
      }
    };
    expect(await h.repository.withWriter((writer) => writer.register(withStop))).toFailWith(
      /a registration carries no stop/
    );
  });
});

// Copilot, round 5 on #701.
describe('T9 Copilot round 5 regressions', () => {
  /** A deduplicating command left possibly-sent: its send failed, and it is eligible for a resend. */
  async function uncertain(h: ISourceHarness, key: OperationId, send: () => Promise<unknown>): Promise<void> {
    h.executor.down = true;
    await send();
    h.executor.down = false;
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      dispatch: 'possibly-sent'
    });
  }

  /** A writer that sees `outside` as the task's latches until its resend gate reads inside the writer. */
  function latchesMoveAtTheGate(
    h: ISourceHarness,
    outside: ReadonlyArray<IStopLatch>
  ): ReturnType<typeof faultyWriter> {
    let queued = true;
    return faultyWriter(h, {
      patch: (r) => ({
        stopLatches: (id: TaskId) => (queued && id === 'job' ? outside : r.stopLatches(id))
      }),
      writerPatch: (w) => ({
        readCommit: async (id: TaskId) => {
          queued = false;
          return w.readCommit(id);
        }
      })
    });
  }

  test('a latch installed while a resend waits at its gate holds the ordinary command, unsent', async () => {
    const h = await sourceHarness({ capabilities: new CapabilityScript().ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const key = op('pause');
    await uncertain(h, key, async () =>
      h.writer.execute({
        taskId: tid('job'),
        operationId: key,
        expectedRevision: await revisionOf(h.repository, 'job'),
        command: 'pause',
        parameters: { reason: 'operator' }
      })
    );
    (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const report = (await latchesMoveAtTheGate(h, []).resolveCommands({ limit: 10 })).orThrow();
    expect(report.resolutions).toEqual([expect.objectContaining({ operationId: key, action: 'held' })]);
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test("a release landing while a stop's resend waits at its gate retires the command, unsent", async () => {
    const h = await sourceHarness({ capabilities: new CapabilityScript().ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root') });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    await uncertain(h, key, () => pump(h.writer, accepted));
    const latched = h.repository.stopLatches(tid('job'));
    (await release(h, h.writer, accepted)).orThrow();
    const report = (await latchesMoveAtTheGate(h, latched).resolveCommands({ limit: 10 })).orThrow();
    expect(report.resolutions).toEqual([expect.objectContaining({ operationId: key, action: 'held' })]);
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  async function satisfiedCancel(): Promise<{ readonly h: IBrokerHarness; readonly cancel: IStopIntent }> {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    return { h, cancel: await persisted(h, accepted) };
  }

  test("storage refuses a raw commit releasing a terminal root's cancel", async () => {
    const { h, cancel } = await satisfiedCancel();
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const operationId = op('release');
    expect(
      await h.repository.withWriter((writer) =>
        writer.commit({
          purpose: 'operation',
          operationId,
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: [
              ...root.operations,
              {
                type: 'catalog',
                operationId,
                operation: 'release-stop',
                request: { taskId: 'root', intentId: cancel.id },
                principalKey: 'alice',
                receipt: { intentId: cancel.id, state: 'released' }
              }
            ],
            updates: root.updates,
            archived: false,
            stops: [{ ...cancel, state: 'released' }]
          }
        })
      )
    ).toFailWith(/a cancel of a terminal root is not released/);
  });

  test('storage settles a cancel only from its targets as they are now, not from its summary', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem &
      FileTree.IMutableFileTreeDirectoryItem;
    const h = await brokerHarness({ root: inner });
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    await node(h.writer, 'c', { parentId: 'root' });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    const cancel = await persisted(h, accepted);
    h.repository.close();
    // On disk, the target is no longer terminal: the summary's confirmation is stale.
    const file = inner
      .getChildren()
      .orThrow()
      .find((f) => f.name === 'task-c.json') as FileTree.IFileTreeFileItem;
    const c = JSON.parse(file.getRawContents().orThrow());
    c.task.envelope.lifecycle = { status: 'running' };
    inner.writeChildAtomically('task-c.json', JSON.stringify(c), { guarantee: 'session' }).orThrow();
    const opened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: environment('r5').env,
        registry: brokerRegistry()
      })
    ).orThrow();
    if (opened.state !== 'ready') {
      throw new Error(`expected a ready repository, got ${opened.state}`);
    }
    const repository = opened.repository;
    const root = (await repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const operationId = op('archive');
    expect(
      await repository.withWriter((writer) =>
        writer.commit({
          purpose: 'operation',
          operationId,
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: [
              ...root.operations,
              {
                type: 'catalog',
                operationId,
                operation: 'archive',
                request: { taskId: 'root' },
                principalKey: 'alice',
                receipt: {}
              }
            ],
            updates: root.updates,
            archived: true,
            stops: [{ ...cancel, state: 'settled' }]
          }
        })
      )
    ).toFailWith(/only an archive of its root settles a satisfied cancel/);
  });
});

// Copilot, round 6 on #701.
describe('T9 Copilot round 6 regressions', () => {
  test('storage refuses a raw release that rewrites the report it keeps', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await node(h.writer, 'c', { parentId: 'root' });
    const pending = await persisted(h, (await stop(h, h.writer, 'root', 'pause')).orThrow());
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    const release = (stops: IStopIntent): ReturnType<typeof h.repository.withWriter> => {
      const operationId = op('release');
      return h.repository.withWriter((writer) =>
        writer.commit({
          purpose: 'operation',
          operationId,
          taskId: tid('root'),
          expectedRevision: root.task.envelope.revision,
          expectedRecordRevision: root.recordRevision,
          record: {
            recordType: 'resolved',
            task: root.task,
            operations: [
              ...root.operations,
              {
                type: 'catalog',
                operationId,
                operation: 'release-stop',
                request: { taskId: 'root', intentId: pending.id },
                principalKey: 'alice',
                receipt: { intentId: pending.id, state: 'released' }
              }
            ],
            updates: root.updates,
            archived: false,
            stops: [stops]
          }
        })
      );
    };
    const rewritten: IStopIntent = {
      ...pending,
      state: 'released',
      targets: pending.targets.map((t, i) => (i === 1 ? { ...t, state: 'refused' as const } : t))
    };
    expect(await release(rewritten)).toFailWith(/a release keeps the report as it stood/);
    expect(await release({ ...pending, state: 'released' })).toSucceed();
  });
});
