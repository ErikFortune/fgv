/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { succeed, succeedWithDetail } from '@fgv/ts-utils';
import { ExternalTaskSource, ITaskFailure, ITaskSource, RecoveryResult } from '../../../index';
import { bob, op, rev, tid, track } from '../../helpers/brokerFixtures';
import { IJobDetails, harnessWith, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';

describe('explicit recovery: every union outcome', () => {
  test('reattached: running work is reattached at the source revision', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 4));
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('reattached');
      expect(outcome.observation?.outcome).toBe('applied');
    });
  });

  test('completed: finished work is recorded', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change(
      'j1',
      (j) => (j.lifecycle = { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } })
    );
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('completed');
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('succeeded');
  });

  test('resumable: the reference goes to the host for approval and nothing changes', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change(
      'j1',
      (j) =>
        (j.lifecycle = {
          status: 'paused',
          reason: { code: 'resumable', summary: 'stopped at a checkpoint' }
        }),
      false
    );
    h.executor.jobs.get('j1')!.token = 1;
    const before = await recordOf(h, 'j1');
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('resumable');
      expect(outcome.resumable).toEqual({ state: 'resumable', reference: { resumeFrom: 0 } });
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('unrecoverable: the source-confirmed failure is applied as the source reported it', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change(
      'j1',
      (j) => (j.lifecycle = { status: 'failed', reason: { code: 'lost', summary: 'executor lost it' } })
    );
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('unrecoverable');
      expect(outcome.reason).toBe('the executor lost the job');
      expect(outcome.observation?.outcome).toBe('applied');
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle).toEqual({
      status: 'failed',
      reason: { code: 'lost', summary: 'executor lost it' }
    });
  });

  test('unavailable: only observation health changes', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.down = true;
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('unavailable');
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
    expect(record.recordType === 'resolved' && record.task.envelope.observation.state).toBe('unavailable');
  });

  test('unresolved: nothing changes', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.jobs.delete('j1');
    const before = await recordOf(h, 'j1');
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('unresolved');
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('a source that throws or fails during recovery is unavailable', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    Object.assign(h.executor, {
      recover: () => {
        throw new Error('executor crashed');
      }
    });
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('unavailable');
      expect(outcome.reason).toMatch(/executor crashed/);
    });
  });

  test('an unrecoverable result without a failed projection, or a completed one without a terminal one, breaks the contract', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    const running = { ...h.executor.projection(h.executor.jobs.get('j1')!), details: { step: 0, ref: 'x' } };
    const answers: ReadonlyArray<[unknown, string]> = [
      [{ state: 'unrecoverable', reason: 'x', value: running }, 'contract-violation'],
      [{ state: 'completed', value: running }, 'contract-violation'],
      [{ state: 'gone' }, 'contract-violation']
    ];
    for (const [answer, outcome] of answers) {
      const source: ITaskSource = {
        id: 'exec',
        history: 'observed-state',
        compare: (a, b) => h.source.compare(a, b),
        observe: (b) => h.source.observe(b),
        reconcile: (c) => h.source.reconcile(c),
        dispatch: (b, r) => h.source.dispatch(b, r),
        recover: async () => succeedWithDetail<RecoveryResult, ITaskFailure>(answer as RecoveryResult)
      };
      const broker = harnessWith(
        h.repository,
        h.env,
        h.root,
        h.logger,
        h.executor,
        source as never,
        h.registry
      ).broker;
      expect(await broker.recover(tid('j1'))).toSucceedAndSatisfy((result) => {
        expect(result.observation?.outcome).toBe(outcome);
      });
    }
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('recovery of a source-replay task is a hint: the feed decides', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('reattached');
      expect(outcome.observation?.outcome).toBe('deferred');
    });
    expect((await recordOf(h, 'j1')).recordType).toBe('unresolved');
  });

  test('a task with no source, or an unknown id, cannot be recovered', async () => {
    const h = await sourceHarness();
    await track(h.writer, 'native');
    expect(await h.broker.recover(tid('native'))).toFailWith(/broker owns its lifecycle/);
    expect(await h.broker.observe(tid('native'))).toFailWith(/broker owns its lifecycle/);
    expect(await h.broker.recover(tid('ghost'))).toFailWith(/not found/);
    expect(await h.broker.observe(tid('ghost'))).toFailWith(/not found/);
  });
});

describe('layering: executor-owned payload stays in the executor', () => {
  test('a large executor payload never enters the task or source-checkpoint records; recovery resolves the original binding', async () => {
    const h = await sourceHarness();
    const payloadBytes = 200 * 1024;
    const job = h.executor.addJob('j1', { status: 'running' }, payloadBytes);
    expect(job.payload.length).toBeGreaterThan(64 * 1024);
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => {
      j.step = 12;
      j.payload = 'y'.repeat(payloadBytes);
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    // Reassignment moves responsibility only; the binding still names the original store.
    const record0 = await recordOf(h, 'j1');
    const revision = record0.recordType === 'resolved' ? record0.task.envelope.revision : rev(0);
    expect(
      await h.writer.reassign({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: revision,
        responsibility: bob
      })
    ).toSucceed();

    // The bounded adapter projection, measured on its own, fits `details` by a wide margin.
    const projection = h.executor.projection(h.executor.jobs.get('j1')!);
    const projectionBytes = Buffer.byteLength(JSON.stringify(projection.details), 'utf8');
    expect(projectionBytes).toBeLessThan(64 * 1024);
    expect(projectionBytes).toBeLessThan(100);

    const files = h.root.getChildren().orThrow() as ReadonlyArray<FileTree.FileTreeItem>;
    const text = (name: string): string => {
      const file = files.find((f) => f.name === name) as FileTree.IFileTreeFileItem;
      return file.getRawContents().orThrow();
    };
    for (const name of ['task-j1.json', 'source-exec.json', 'repository.json']) {
      const contents = text(name);
      expect(contents).not.toContain('xxxxxxxx');
      expect(contents).not.toContain('yyyyyyyy');
      expect(contents.length).toBeLessThan(64 * 1024);
    }
    // Recovery resolves through the original binding, not the new assignee.
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.observation?.binding).toEqual(h.executor.binding('j1'));
      expect(outcome.observation?.taskId).toBe('j1');
    });
  });

  test('a projection that tries to carry the payload in details is a contract violation, never truncated', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 2));
    const leaky = ExternalTaskSource.create<IJobDetails>({
      id: 'exec',
      history: 'observed-state',
      // An adapter that copies the executor's retained text into the projection.
      encodeDetails: (d) => succeed({ step: d.step, ref: 'z'.repeat(70 * 1024) }),
      compare: (a, b) => h.executor.compare(a, b),
      read: async (b) => h.executor.read(b),
      feed: async (c) => h.executor.page(c),
      recover: async (b) => h.executor.recover(b)
    }).orThrow();
    const broker = harnessWith(h.repository, h.env, h.root, h.logger, h.executor, leaky, h.registry).broker;
    expect(await broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('contract-violation');
      expect(report.message).toMatch(/details/);
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });
});
