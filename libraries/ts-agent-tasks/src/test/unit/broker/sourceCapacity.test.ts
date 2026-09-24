/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  SubscriptionId,
  TaskAudienceResolver,
  TaskResult,
  defaultTaskCapacityProfile
} from '../../../index';
import { op, rev, tid } from '../../helpers/brokerFixtures';
import { ISourceHarness, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';

const everyone: TaskAudienceResolver = () => ['watcher' as SubscriptionId];

function profileWith(limits: Partial<ITaskCapacityProfile['limits']>): ITaskCapacityProfile {
  return { ...defaultTaskCapacityProfile, limits: { ...defaultTaskCapacityProfile.limits, ...limits } };
}

function backpressure(result: TaskResult<unknown>, dimension: CapacityDimension): void {
  expect(result).toFail();
  expect(result.isFailure() && result.detail).toEqual(
    expect.objectContaining({
      code: 'backpressure',
      capacity: expect.objectContaining({ reason: 'capacity-exhausted', dimension })
    })
  );
}

function held(h: ISourceHarness, dimension: CapacityDimension): number {
  const row = h.repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
  return row.used + row.reserved;
}

async function claimsOf(h: ISourceHarness, id: string): Promise<ReadonlyArray<ITaskCapacityClaim>> {
  return (await recordOf(h, id)).capacityClaims;
}

describe('A3: an external command reserves its settlement before dispatch', () => {
  test('without room for the settlement the intent is refused before anything is recorded or sent', async () => {
    // Exactly two registrations' closeout reservations, and nothing more.
    const probe = await sourceHarness();
    for (const job of ['j1', 'j2']) {
      probe.executor.addJob(job);
      await registerJob(probe, job);
    }
    const full = held(probe, 'resident-payload-bytes');
    const h = await sourceHarness({ profile: profileWith({ 'resident-payload-bytes': full }) });
    for (const job of ['j1', 'j2']) {
      h.executor.addJob(job);
      await registerJob(h, job);
    }
    const before = await recordOf(h, 'j1');
    backpressure(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      }),
      'resident-payload-bytes'
    );
    expect(await recordOf(h, 'j1')).toEqual(before);
    expect(h.executor.dispatches.size).toBe(0);
    // Raising the limit is new admission; the same command is then accepted.
    const raised = profileWith({ 'resident-payload-bytes': full + 64 * 1024 });
    expect(await h.repository.withWriter((w) => w.raiseCapacityLimits(raised))).toSucceed();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceedAndSatisfy((receipt) => expect(receipt.result.state).toBe('applied'));
  });

  test('an accepted uncertain command still settles once the repository is otherwise full', async () => {
    const h0 = await sourceHarness();
    h0.executor.addJob('j1');
    await registerJob(h0, 'j1');
    const oneTask = held(h0, 'resident-payload-bytes');
    const settlement = 64 * 1024;
    // Room for two registrations and one settlement.
    const h = await sourceHarness({
      profile: profileWith({ 'resident-payload-bytes': 2 * oneTask + settlement })
    });
    h.executor.addJob('j1');
    h.executor.addJob('j2');
    await registerJob(h, 'j1');
    h.executor.loseNextResponse = true;
    const key = op();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    await registerJob(h, 'j2');
    // Full: no further settlement fits anywhere.
    backpressure(
      await h.writer.execute({
        taskId: tid('j2'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'y' }
      }),
      'resident-payload-bytes'
    );
    // The accepted command settles out of its own reservation.
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['resolved']);
    });
    const settled = (await claimsOf(h, 'j1')).find((c) => c.purpose === 'accepted-operation-settlement');
    expect(settled?.disposition).toBe('consumed');
    // Consuming it freed exactly its remaining reservation: j2's command now fits.
    expect(
      await h.writer.execute({
        taskId: tid('j2'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'y' }
      })
    ).toSucceed();
  });
});

describe('A3: source-replay envelopes', () => {
  test('registration reserves the declared finite envelope', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { envelope: { remainingRequiredUpdates: 2, remainingRequiredBytes: 100 } });
    const claim = (await claimsOf(h, 'j1')).find((c) => c.purpose === 'admitted-source-replay');
    expect(claim).toEqual(
      expect.objectContaining({
        disposition: 'reserved',
        envelope: { remainingRequiredUpdates: 2, remainingRequiredBytes: 100 }
      })
    );
  });

  test('an envelope inconsistent with the update bound is refused at registration', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: 'sim.job',
        detailVersion: 1,
        title: 'j1',
        scopes: [{ namespace: 'project', key: 'alpha' }],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 10 * 1024 * 1024 }
        }
      })
    ).toFailWith(/more than they can carry/);
  });

  test('an envelope larger than the repository can hold is refused as backpressure, not accepted unreserved', async () => {
    const h = await sourceHarness({ history: 'source-replay', profile: profileWith({ updates: 20 }) });
    h.executor.addJob('j1');
    const refused = await h.broker.registerExternal('host', {
      taskId: tid('j1'),
      operationId: op(),
      kind: 'sim.job',
      detailVersion: 1,
      title: 'j1',
      scopes: [{ namespace: 'project', key: 'alpha' }],
      binding: h.executor.binding('j1'),
      recovery: 'reattach',
      history: {
        history: 'source-replay',
        envelope: { remainingRequiredUpdates: 100, remainingRequiredBytes: 100 }
      }
    });
    backpressure(refused, 'updates');
  });

  test('a feed that exceeds its declared envelope is a source-contract failure; the cursor stays; extension is new admission', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    // First resolution plus one more required update.
    await registerJob(h, 'j1', { envelope: { remainingRequiredUpdates: 2, remainingRequiredBytes: 0 } });
    h.executor.change('j1', (j) => (j.attention = [{ namespace: 'review', key: 'a' }]));
    h.executor.change('j1', (j) => (j.attention = [{ namespace: 'review', key: 'b' }]));
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.observations.map((o) => o.outcome)).toEqual(['applied', 'applied', 'contract-violation']);
      expect(report.stopped).toBe('contract-violation');
      expect(report.issues.join()).toMatch(/declared only 0 remaining/);
      expect(report.cursor).toBeUndefined();
    });
    // No history is skipped to reach the next state: extend, and the same feed resumes.
    expect(
      await h.broker.extendReplayEnvelope(tid('j1'), {
        remainingRequiredUpdates: 1,
        remainingRequiredBytes: 0
      })
    ).toSucceedWith({
      remainingRequiredUpdates: 1,
      remainingRequiredBytes: 0
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      // Revision 1 is older than what is committed, revision 2 is the same: safe duplicates.
      expect(report.observations.map((o) => o.outcome)).toEqual(['stale', 'unchanged', 'applied']);
      expect(report.cursor).toBe('3');
    });
  });

  test('extension is refused when it does not fit, and for a task that holds no envelope', async () => {
    const h = await sourceHarness({ history: 'source-replay', profile: profileWith({ updates: 40 }) });
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 0 } });
    backpressure(
      await h.broker.extendReplayEnvelope(tid('j1'), {
        remainingRequiredUpdates: 100,
        remainingRequiredBytes: 0
      }),
      'updates'
    );
    const plain = await sourceHarness();
    plain.executor.addJob('j1');
    await registerJob(plain, 'j1');
    expect(
      await plain.broker.extendReplayEnvelope(tid('j1'), {
        remainingRequiredUpdates: 1,
        remainingRequiredBytes: 0
      })
    ).toFailWith(/no open source-replay envelope/);
    expect(
      await plain.broker.extendReplayEnvelope(tid('nobody'), {
        remainingRequiredUpdates: 1,
        remainingRequiredBytes: 0
      })
    ).toFailWith(/no live, writable task/);
    expect(
      await plain.broker.extendReplayEnvelope('' as never, {
        remainingRequiredUpdates: 1,
        remainingRequiredBytes: 0
      })
    ).toFailWith(/extendReplayEnvelope/);
    expect(
      await plain.broker.extendReplayEnvelope(tid('j1'), {
        remainingRequiredUpdates: -1,
        remainingRequiredBytes: 0
      })
    ).toFailWith(/extendReplayEnvelope/);
  });

  test('a terminal feed revision releases what the envelope has left', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { envelope: { remainingRequiredUpdates: 4, remainingRequiredBytes: 1000 } });
    h.executor.change(
      'j1',
      (j) => (j.lifecycle = { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } })
    );
    const before = held(h, 'updates');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const claim = (await claimsOf(h, 'j1')).find((c) => c.purpose === 'admitted-source-replay');
    expect(claim?.disposition).toBe('consumed');
    expect(held(h, 'updates')).toBeLessThan(before);
  });

  test('backpressure on a feed revision leaves the cursor where it was', async () => {
    // The envelope reserves no bytes, so a retained update needs ordinary headroom — and there is
    // none. A second, never-resolved registration keeps the profile above the minimum a
    // repository must be able to finish.
    const setup = async (h: ISourceHarness): Promise<void> => {
      h.executor.addJob('j1');
      await registerJob(h, 'j1', { envelope: { remainingRequiredUpdates: 4, remainingRequiredBytes: 0 } });
      expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
      await registerJob(h, 'j2', { envelope: { remainingRequiredUpdates: 4, remainingRequiredBytes: 0 } });
    };
    const probe = await sourceHarness({ history: 'source-replay', audience: everyone });
    probe.executor.jobs.set('j2', { ...probe.executor.addJob('j2'), job: 'j2' });
    probe.executor.feed.pop();
    await setup(probe);
    const h = await sourceHarness({
      history: 'source-replay',
      audience: everyone,
      profile: profileWith({ 'resident-payload-bytes': held(probe, 'resident-payload-bytes') })
    });
    h.executor.jobs.set('j2', { ...h.executor.addJob('j2'), job: 'j2' });
    h.executor.feed.pop();
    await setup(h);
    h.executor.change('j1', (j) => (j.attention = [{ namespace: 'review', key: 'a' }]));
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('capacity-blocked');
      expect(report.cursor).toBe('1');
    });
  });
});

describe('A3: observed-state sampling at capacity', () => {
  test('a reserved terminal observation commits while ordinary sampling is capacity-blocked', async () => {
    const setup = async (h: ISourceHarness): Promise<void> => {
      h.executor.addJob('a');
      h.executor.addJob('b');
      await registerJob(h, 'a');
      await registerJob(h, 'b');
    };
    const probe = await sourceHarness({ audience: everyone });
    await setup(probe);
    const h = await sourceHarness({
      audience: everyone,
      profile: profileWith({ 'resident-payload-bytes': held(probe, 'resident-payload-bytes') })
    });
    await setup(h);
    h.executor.change('a', (j) => (j.attention = [{ namespace: 'review', key: 'x' }]));
    h.executor.change(
      'b',
      (j) => (j.lifecycle = { status: 'failed', reason: { code: 'boom', summary: 'it broke' } })
    );
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.observations.map((o) => [o.taskId, o.outcome])).toEqual([
        ['a', 'capacity-blocked'],
        ['b', 'applied']
      ]);
      expect(report.stopped).toBe('capacity-blocked');
      expect(report.complete).toBe(false);
    });
    const b = await recordOf(h, 'b');
    expect(b.recordType === 'resolved' && b.task.envelope.lifecycle.status).toBe('failed');
    const a = await recordOf(h, 'a');
    expect(a.recordType === 'resolved' && a.task.envelope.attention).toEqual([]);
    // Nothing was skipped: the cursor did not move past the blocked observation.
    expect(await h.repository.readSource('exec')).toSucceedWith(undefined);
  });
});
