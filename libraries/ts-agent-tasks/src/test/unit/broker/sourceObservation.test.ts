/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Instant, ITaskEnvelope } from '../../../index';
import { bob, op, rev, tid } from '../../helpers/brokerFixtures';
import { observedAt, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';

const later: Instant = '2026-09-24T11:00:00.000Z' as Instant;

function envelopeOf(record: Awaited<ReturnType<typeof recordOf>>): ITaskEnvelope {
  if (record.recordType !== 'resolved') {
    throw new Error('expected a resolved record');
  }
  return record.task.envelope;
}

describe('observed-state observation ordering', () => {
  test('a newer revision commits the execution fields and advances the task revision', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => {
      j.lifecycle = { status: 'waiting', reason: { code: 'input', summary: 'needs input' } };
      j.step = 3;
    });
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('applied');
      expect(report.revision).toBe(2);
    });
    const record = await recordOf(h, 'j1');
    expect(envelopeOf(record).lifecycle.status).toBe('waiting');
    expect(record.recordType === 'resolved' && record.task.details).toEqual({ step: 3, ref: 'exec-a/j1' });
    expect(record.recordType === 'resolved' && record.sourceRevision).toEqual({ epoch: 'e1', token: '2' });
  });

  test('an older revision is stale and changes nothing', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    h.executor.change('j1', (j) => (j.step = 1));
    await registerJob(h, 'j1'); // registered at token 2
    h.executor.jobs.get('j1')!.token = 1; // the source now reports an older revision
    const before = await recordOf(h, 'j1');
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('stale');
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('the same revision and projection observed again at the same time is unchanged', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('unchanged');
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('an unchanged revision with a later observedAt is a freshness refresh, not a contract violation', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    const read = h.executor.read.bind(h.executor);
    h.executor.read = (binding) => read(binding, later);
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('refreshed');
      // No semantic revision: the task revision is where it was.
      expect(report.revision).toBe(1);
    });
    const after = await recordOf(h, 'j1');
    expect(envelopeOf(after).revision).toBe(envelopeOf(before).revision);
    expect(envelopeOf(after).observation).toEqual({ state: 'current', observedAt: later });
    // Freshness is maintenance: the record revision moved, nothing semantic did, no update is owed.
    expect(after.recordRevision).toBe(before.recordRevision + 1);
    expect(after.recordType === 'resolved' && after.updates).toEqual([]);
    expect(after.recordType === 'resolved' && after.sourceRevision).toEqual(
      before.recordType === 'resolved' ? before.sourceRevision : undefined
    );
  });

  test('the same revision with a different projection is a contract violation and commits nothing', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 7), false);
    h.executor.jobs.get('j1')!.token = 1; // same token, different content
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('contract-violation');
      expect(report.message).toMatch(/already committed with a different projection/);
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('a different epoch is incomparable and ignored until explicit recovery', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    h.executor.change('j1', (j) => {
      j.epoch = 'e2';
      j.step = 9;
    });
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('incomparable');
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
    // Recovery establishes the new epoch as the baseline.
    expect(await h.broker.recover(tid('j1'))).toSucceedAndSatisfy((outcome) => {
      expect(outcome.result).toBe('reattached');
      expect(outcome.observation?.outcome).toBe('applied');
    });
    const after = await recordOf(h, 'j1');
    expect(after.recordType === 'resolved' && after.sourceRevision?.epoch).toBe('e2');
  });

  test('a comparator that fails is a contract violation', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 2));
    h.executor.jobs.get('j1')!.token = Number.NaN;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('contract-violation');
      expect(report.message).toMatch(/compare/);
    });
  });

  test('a terminal task is absorbing: a newer projection that reopens it is a contract violation', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1', { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } });
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.lifecycle = { status: 'running' }));
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('contract-violation');
      expect(report.message).toMatch(/absorbing/);
    });
    expect(envelopeOf(await recordOf(h, 'j1')).lifecycle.status).toBe('succeeded');
  });

  test('an observation takes execution fields only: a reassignment committed meanwhile is kept', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(
      await h.writer.reassign({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: rev(1),
        responsibility: bob
      })
    ).toSucceed();
    h.executor.change('j1', (j) => (j.step = 5));
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    const envelope = envelopeOf(await recordOf(h, 'j1'));
    expect(envelope.responsibility).toEqual(bob);
    expect(envelope.binding).toEqual(h.executor.binding('j1'));
    expect(envelope.revision).toBe(3);
  });

  test('an absent progress in a newer projection clears the committed one', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    h.executor.change('j1', (j) => (j.progress = { completed: 1, total: 10 }));
    await registerJob(h, 'j1');
    expect(envelopeOf(await recordOf(h, 'j1')).progress).toEqual({ completed: 1, total: 10 });
    h.executor.change('j1', (j) => delete j.progress);
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    expect(envelopeOf(await recordOf(h, 'j1')).progress).toBeUndefined();
  });

  test('the first observation resolves an unresolved registration, preserving its catalog metadata', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { unresolved: true });
    expect((await recordOf(h, 'j1')).recordType).toBe('unresolved');
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('applied');
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType).toBe('resolved');
    const envelope = envelopeOf(record);
    expect(envelope.title).toBe('job j1');
    expect(envelope.recovery).toBe('reattach');
    expect(envelope.revision).toBe(2);
  });
});

describe('observation health', () => {
  test('an outage marks observation unavailable without touching the lifecycle; recovery restores it', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('source-unavailable');
    });
    let envelope = envelopeOf(await recordOf(h, 'j1'));
    expect(envelope.lifecycle.status).toBe('running');
    expect(envelope.observation).toEqual(
      expect.objectContaining({ state: 'unavailable', lastObservedAt: observedAt })
    );
    expect(envelope.revision).toBe(2);
    // A repeat of the same outage is not a new revision.
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    expect(envelopeOf(await recordOf(h, 'j1')).revision).toBe(2);
    // Back: the same source revision with health restored is its own revision.
    h.executor.down = false;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('health-changed');
    });
    envelope = envelopeOf(await recordOf(h, 'j1'));
    expect(envelope.observation).toEqual({ state: 'current', observedAt });
    expect(envelope.revision).toBe(3);
    expect(envelope.lifecycle.status).toBe('running');
  });

  test('a missing binding marks observation stale; it is never a cancellation', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.jobs.delete('j1');
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('missing');
    });
    const envelope = envelopeOf(await recordOf(h, 'j1'));
    expect(envelope.lifecycle.status).toBe('running');
    expect(envelope.observation.state).toBe('stale');
  });

  test('a source that is not attached leaves the task exactly as it is', async () => {
    const h = await sourceHarness({ attach: false });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const before = await recordOf(h, 'j1');
    expect(await h.broker.observe(tid('j1'))).toFailWithDetail(/not attached/, {
      code: 'source-unavailable',
      retry: 'after-host-action'
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toFailWithDetail(/not attached/, {
      code: 'source-unavailable',
      retry: 'after-host-action'
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
  });
});

describe('push hints', () => {
  test('a push triggers a fresh read, never an overwrite from the push', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 4));
    expect(await h.broker.hint(h.executor.binding('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('applied');
      expect(report.taskId).toBe('j1');
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.details).toEqual({ step: 4, ref: 'exec-a/j1' });
  });

  test('a push for a binding no task holds creates nothing', async () => {
    const h = await sourceHarness();
    expect(await h.broker.hint(h.executor.binding('nobody'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('unknown-binding');
    });
  });

  test('a push that is not a binding is invalid', async () => {
    const h = await sourceHarness();
    expect(
      await h.broker.hint({ sourceId: 'exec' } as unknown as ReturnType<typeof h.executor.binding>)
    ).toFailWith(/observe/);
  });
});
