/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';
import {
  ICommandReceipt,
  IStoredCommandOperation,
  ITaskCommitRequest,
  ITaskRepository,
  ITaskRepositoryWriter,
  OperationId,
  TaskResult
} from '../../../index';
import { alpha, bob, bindWriter, op, rev, tid } from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  harnessWith,
  recordOf,
  registerJob,
  sourceHarness
} from '../../helpers/sourceFixtures';

/** Runs a job command at the task's current revision. */
async function run(
  h: { readonly repository: ITaskRepository; readonly writer: ISourceHarness['writer'] },
  job: string,
  command: string,
  parameters: object,
  key: OperationId = op(`${command}-${job}`),
  writer: ISourceHarness['writer'] = h.writer
): Promise<TaskResult<ICommandReceipt>> {
  const record = await recordOf(h, job);
  const expectedRevision = record.recordType === 'resolved' ? record.task.envelope.revision : rev(1);
  return writer.execute({
    taskId: tid(job),
    operationId: key,
    expectedRevision,
    command,
    parameters: parameters as never
  });
}

async function commandOf(h: ISourceHarness, job: string, key: OperationId): Promise<IStoredCommandOperation> {
  const found = (await recordOf(h, job)).operations.find((o) => o.operationId === key);
  if (found === undefined || found.type !== 'command') {
    throw new Error(`no command ${key}`);
  }
  return found;
}

/** A repository whose writer runs `hook` around each commit. */
function hooked(
  repository: ITaskRepository,
  hook: (
    request: ITaskCommitRequest,
    next: () => ReturnType<ITaskRepositoryWriter['commit']>
  ) => ReturnType<ITaskRepositoryWriter['commit']>
): ITaskRepository {
  return Object.assign(Object.create(repository), {
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<T>) =>
      repository.withWriter(
        (w) =>
          action({
            readCommit: (id) => w.readCommit(id),
            register: (r) => w.register(r),
            commit: (r) => hook(r, () => w.commit(r)),
            readSource: (id) => w.readSource(id),
            commitSource: (r) => w.commitSource(r),
            extendReplayEnvelope: (id, add) => w.extendReplayEnvelope(id, add),
            raiseCapacityLimits: (p) => w.raiseCapacityLimits(p),
            registerSubscription: (r) => w.registerSubscription(r),
            readSubscription: (id) => w.readSubscription(id),
            issueReceipt: (r) => w.issueReceipt(r),
            acknowledgeReceipt: (r) => w.acknowledgeReceipt(r),
            abandonReceipt: (r) => w.abandonReceipt(r),
            disposeObligations: (r) => w.disposeObligations(r),
            closeSubscription: (r) => w.closeSubscription(r),
            pruneTask: (id) => w.pruneTask(id)
          }) as never
      )
  });
}

async function ready(options?: Parameters<typeof sourceHarness>[0]): Promise<ISourceHarness> {
  const h = await sourceHarness(options);
  h.executor.addJob('j1');
  await registerJob(h, 'j1');
  return h;
}

describe('external commands: the source owns execution truth', () => {
  test('an applied command is applied by the executor and reconciled into a committed projection', async () => {
    const h = await ready();
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'hold' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'applied', appliedRevision: 2 });
    });
    // The executor really applied it — this is the evidence an empty command set cannot supply.
    expect(h.executor.jobs.get('j1')!.applied).toEqual([`pause:${key}`]);
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('paused');
    const stored = await commandOf(h, 'j1', key);
    expect(stored.dispatch).toBe('settled');
    // The settlement reservation is consumed now the command has settled.
    expect(
      record.capacityClaims.find((c) => c.purpose === 'accepted-operation-settlement')?.disposition
    ).toBe('consumed');
  });

  test('accepted differs from applied: the broker never sets the status an accepted command implies', async () => {
    const h = await ready();
    h.executor.acceptOnly = true;
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'stop' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'accepted', sourceReceipt: `rcpt-${key}` });
    });
    let record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
    // The executor applies it later; only an observation moves the task.
    h.executor.settleAccepted();
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('cancelled');
  });

  test('a command the kind does not declare is unsupported, recorded, and reserves nothing', async () => {
    const h = await ready();
    const key = op();
    expect(await run(h, 'j1', 'teleport', {}, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'unsupported' });
    });
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('settled');
    expect(
      (await recordOf(h, 'j1')).capacityClaims.some((c) => c.purpose === 'accepted-operation-settlement')
    ).toBe(false);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('parameters the kind’s schema refuses are invalid and record nothing', async () => {
    const h = await ready();
    const before = await recordOf(h, 'j1');
    expect(await run(h, 'j1', 'pause', { reason: 7 })).toFailWith(/pause/);
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('a denied command is refused and not recorded', async () => {
    const h = await ready();
    h.policy.denyOn('command', 'j1');
    const before = await recordOf(h, 'j1');
    expect(await run(h, 'j1', 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'denied' });
    });
    expect(await recordOf(h, 'j1')).toEqual(before);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a stale expected revision is a recorded conflict that is never sent', async () => {
    const h = await ready();
    const key = op();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(9),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'conflict' });
    });
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a conditional command carries the source precondition; a source conflict is refusal, not a status', async () => {
    const h = await ready();
    // The executor moved on without the broker hearing: the committed source revision is stale.
    h.executor.change('j1', (j) => (j.step = 1));
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'conflict' });
    });
    expect(h.executor.jobs.get('j1')!.applied).toEqual([]);
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('settled');
  });

  test('the executor refusing a transition settles the command rejected', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1', { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } });
    await registerJob(h, 'j1');
    expect(await run(h, 'j1', 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'invalid-transition' });
    });
  });
});

describe('deduplication', () => {
  test('the same key and request replays the evolving receipt without dispatching again', async () => {
    const h = await ready();
    h.executor.acceptOnly = true;
    const key = op();
    const first = (await run(h, 'j1', 'pause', { reason: 'x' }, key)).orThrow();
    // Replayed at the (now stale) revision the first attempt carried.
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceedWith(first);
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('the same key with a different payload is an idempotency conflict', async () => {
    const h = await ready();
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'other' }
      })
    ).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'idempotency-conflict' });
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('the same key from a different principal is an idempotency conflict', async () => {
    const h = await ready();
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    const carol = bindWriter(h as never, { principal: 'carol' });
    expect(
      await carol.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'idempotency-conflict' });
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('dedup evidence is loaded on demand from an archived task', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const key = op();
    const receipt = (await run(h, 'j1', 'cancel', { reason: 'done' }, key)).orThrow();
    const archived = await recordOf(h, 'j1');
    const revision = archived.recordType === 'resolved' ? archived.task.envelope.revision : rev(0);
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: revision })
    ).toSucceed();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'cancel',
        parameters: { reason: 'done' }
      })
    ).toSucceedWith(receipt);
    expect(h.executor.dispatches.get(key)).toBe(1);
  });
});

describe('uncertain outcomes', () => {
  test('a lost response is indeterminate, keeps the operation id and holds its reservation', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.operationId).toBe(key);
      expect(receipt.result.state).toBe('indeterminate');
    });
    // The executor did apply it; the broker does not know, and does not guess.
    expect(h.executor.jobs.get('j1')!.applied).toHaveLength(1);
    const stored = await commandOf(h, 'j1', key);
    expect(stored.dispatch).toBe('possibly-sent');
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
    expect(
      record.capacityClaims.find((c) => c.purpose === 'accepted-operation-settlement')?.disposition
    ).toBe('reserved');
    expect(await h.repository.unsettledCommands({ limit: 10 })).toSucceedWith([tid('j1')]);
  });

  test('a non-idempotent uncertain command is held, never resent', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceed();
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([
        expect.objectContaining({
          operationId: key,
          action: 'held',
          result: expect.objectContaining({ state: 'indeterminate' })
        })
      ]);
    });
    // Held again on the next pass, still without a send.
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['held']);
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect(h.executor.jobs.get('j1')!.applied).toHaveLength(1);
  });

  test('a source-key command is resent under the same key, and the source deduplicates it', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([
        expect.objectContaining({
          operationId: key,
          action: 'resolved',
          result: expect.objectContaining({ state: 'applied' })
        })
      ]);
    });
    expect(h.executor.dispatches.get(key)).toBe(2);
    // Applied exactly once, although sent twice.
    expect(h.executor.jobs.get('j1')!.applied).toEqual([`pause:${key}`]);
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('settled');
    expect(await h.repository.unsettledCommands({ limit: 10 })).toSucceedWith([]);
  });

  test('a lookup resolves an uncertain command by its key', async () => {
    const h = await ready({ lookup: true });
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceed();
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([expect.objectContaining({ action: 'resolved' })]);
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('cancelled');
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a lookup that finds nothing does not make a non-idempotent resend safe', async () => {
    const h = await ready({ lookup: true });
    h.executor.down = true;
    const key = op();
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceed();
    h.executor.down = false;
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['held']);
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('an expired source key converts retry eligibility to held, even for a source-key command', async () => {
    const h = await ready({ lookup: true });
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    h.executor.expired.add(key);
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([expect.objectContaining({ action: 'held' })]);
    });
    // Without a lookup, the recorded expiry still forbids the resend.
    const noLookup = harnessWith(h.repository, h.env, h.root, h.logger, h.executor, h.source, h.registry);
    Object.assign(h.source, { lookupCommand: undefined });
    expect(await noLookup.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['held']);
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a source that cannot say keeps the command uncertain', async () => {
    const h = await ready();
    h.executor.answerIndeterminate = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'indeterminate', reason: 'the executor could not say' });
    });
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
  });

  test('a failure persisting the result is commit-indeterminate with the operation id; the pump settles it', async () => {
    const h = await ready();
    const key = op();
    let refuse = true;
    const repository = hooked(h.repository, (request, next) =>
      refuse &&
      request.record.operations.some(
        (o) => o.operationId === key && o.type === 'command' && o.dispatch === 'settled'
      )
        ? Promise.resolve(fail('disk full') as never)
        : next()
    );
    const broken = harnessWith(repository, h.env, h.root, h.logger, h.executor, h.source, h.registry);
    expect(await run(broken, 'j1', 'pause', { reason: 'x' }, key)).toFailWithDetail(
      /persisting its outcome failed/,
      {
        code: 'commit-indeterminate',
        retry: 'reconcile-first',
        operationId: key
      }
    );
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
    refuse = false;
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['resolved']);
    });
    expect(h.executor.jobs.get('j1')!.applied).toEqual([`pause:${key}`]);
  });

  test('an unsettled command blocks archive', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    expect(await run(h, 'j1', 'cancel', { reason: 'x' })).toSucceed();
    h.executor.change('j1', (j) => (j.step = 1));
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    const record = await recordOf(h, 'j1');
    const revision = record.recordType === 'resolved' ? record.task.envelope.revision : rev(0);
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('cancelled');
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: revision })
    ).toFailWithDetail(/unsettled/, { code: 'retention-blocked', retry: 'after-host-action' });
  });
});

describe('abandoning a command whose outcome is unknown (T8)', () => {
  const host = (
    h: ISourceHarness
  ): { principal: string; scopes: [typeof alpha]; authorization: typeof h.policy } => ({
    principal: 'alice',
    scopes: [alpha],
    authorization: h.policy
  });

  /** A held command: a non-idempotent cancel whose answer was lost, on a task the source then cancelled. */
  async function held(): Promise<{ h: ISourceHarness; key: OperationId }> {
    const h = await ready();
    const key = op('cancel-j1');
    h.executor.loseNextResponse = true;
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceed();
    h.executor.change('j1', (j) => (j.step = 1));
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
    return { h, key };
  }

  test('ends tracking without claiming an outcome, releases the settlement reservation, and unblocks archive', async () => {
    const { h, key } = await held();
    const settlements = (): number =>
      h.repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === 'resident-payload-bytes')!.reserved;
    const reservedBefore = settlements();
    expect(h.repository.outstanding()).toSucceedAndSatisfy((o) =>
      expect(o.unsettledCommands).toEqual([tid('j1')])
    );
    const receipt = (
      await h.broker.abandonCommand(host(h), {
        taskId: 'j1',
        operationId: key,
        reason: 'abandoned: outcome unknown'
      })
    ).orThrow();
    // The falsifier for "cleanup invents an outcome": the receipt is neither applied nor rejected.
    expect(receipt.result).toEqual({
      state: 'abandoned',
      reason: 'abandoned: outcome unknown',
      from: 'possibly-sent'
    });
    const stored = await commandOf(h, 'j1', key);
    expect(stored.dispatch).toBe('settled');
    expect(stored.receipt.result.state).toBe('abandoned');
    expect(settlements()).toBe(reservedBefore - 64 * 1024);
    // The pump no longer sees it; archive proceeds.
    expect(await h.repository.unsettledCommands({ limit: 10 })).toSucceedWith([]);
    const record = await recordOf(h, 'j1');
    const revision = record.recordType === 'resolved' ? record.task.envelope.revision : rev(0);
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: revision })
    ).toSucceed();
    // Nothing was resent: the executor applied the lost cancel exactly once.
    expect(h.executor.jobs.get('j1')!.applied.filter((a) => a.startsWith('cancel'))).toHaveLength(1);
  });

  test('a repeat returns the recorded abandonment; a settled command is not abandoned', async () => {
    const { h, key } = await held();
    const first = (
      await h.broker.abandonCommand(host(h), { taskId: 'j1', operationId: key, reason: 'r1' })
    ).orThrow();
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j1', operationId: key, reason: 'r2' })
    ).toSucceedWith(first);
    const settled = op('pause-j2');
    h.executor.addJob('j2');
    await registerJob(h, 'j2');
    expect(await run(h, 'j2', 'pause', { reason: 'x' }, settled)).toSucceed();
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j2', operationId: settled, reason: 'r' })
    ).toFailWithDetail(/is settled \(applied\)/i, expect.objectContaining({ code: 'conflict' }));
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j2', operationId: op('nope'), reason: 'r' })
    ).toFailWithDetail(/no command/i, expect.objectContaining({ code: 'not-found-or-denied' }));
  });

  test('without dispose-obligation authority nothing is abandoned', async () => {
    const { h, key } = await held();
    h.policy.denyOn('dispose-obligation', 'j1');
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j1', operationId: key, reason: 'r' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
    // A hidden task gets the same answer as a missing one.
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'ghost', operationId: key, reason: 'r' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
  });

  test('a policy that moves before the write, or a task that moves after authorization, abandons nothing', async () => {
    const { h, key } = await held();
    h.policy.afterDecision = (r) => {
      if (r.action === 'dispose-obligation') {
        h.policy.epoch = 'epoch-2';
      }
    };
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j1', operationId: key, reason: 'r' })
    ).toFailWithDetail(/policy changed/i, expect.objectContaining({ code: 'conflict', retry: 'safe' }));
    h.policy.afterDecision = async (r) => {
      if (r.action === 'dispose-obligation') {
        h.policy.afterDecision = undefined;
        h.executor.change('j1', (j) => (j.step = 2));
        (await h.broker.observe(tid('j1'))).orThrow();
      }
    };
    expect(
      await h.broker.abandonCommand(host(h), { taskId: 'j1', operationId: key, reason: 'r' })
    ).toFailWithDetail(
      /changed after it was authorized/i,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
  });

  test('a malformed request is invalid', async () => {
    const { h } = await held();
    expect(await h.broker.abandonCommand(host(h), { taskId: 'j1' })).toFailWithDetail(
      /abandonCommand/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('authority at the dispatch boundary', () => {
  test('authority revoked after intent and before dispatch settles the command denied; nothing is sent', async () => {
    const h = await ready();
    const key = op();
    const repository = hooked(h.repository, async (request, next) => {
      const committed = await next();
      if (request.purpose === 'operation' && request.operationId === key) {
        h.policy.denyOn('command', 'j1');
      }
      return committed;
    });
    const gated = harnessWith(repository, h.env, h.root, h.logger, h.executor, h.source, h.registry);
    // The same policy object governs both writers.
    Object.assign(gated.policy, { deny: h.policy.deny });
    const writer = gated.broker
      .bind({ principal: 'alice', scopes: [{ namespace: 'project', key: 'alpha' }], authorization: h.policy })
      .orThrow();
    expect(await run(gated, 'j1', 'pause', { reason: 'x' }, key, writer)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'denied' });
    });
    expect(h.executor.dispatches.size).toBe(0);
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('settled');
  });

  test('a pump run by a principal without authority leaves the command as it is', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    h.policy.denyOn('command', 'j1');
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([expect.objectContaining({ operationId: key, action: 'denied' })]);
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
  });

  test('a policy change between the pump authorization and its resend refuses the resend', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 0) {
          h.policy.epoch = 'epoch-2';
        }
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toFailWithDetail(/not resent/, {
      code: 'conflict',
      retry: 'safe',
      operationId: key
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
    // The next pass, authorized under the policy as it now is, resends.
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['resolved']);
    });
    expect(h.executor.dispatches.get(key)).toBe(2);
    expect(h.executor.jobs.get('j1')!.applied).toEqual([`pause:${key}`]);
  });

  test('a catalog change between the pump authorization and its resend refuses the resend', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 0) {
          const record = await recordOf(h, 'j1');
          expect(
            await h.writer.reassign({
              taskId: tid('j1'),
              operationId: op(),
              expectedRevision: record.recordType === 'resolved' ? record.task.envelope.revision : rev(1),
              responsibility: bob
            })
          ).toSucceed();
        }
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toFailWithDetail(/task j1 changed.*not resent/, {
      code: 'conflict',
      retry: 'safe',
      operationId: key
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a command another pump settled while this one was deciding is reported, not resent', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 0) {
          expect(await h.writer.resolveCommands({ limit: 10 })).toSucceed();
        }
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([
        expect.objectContaining({
          operationId: key,
          action: 'resolved',
          result: expect.objectContaining({ state: 'applied' })
        })
      ]);
    });
    // Sent twice in all — the original and the inner pump's resend — never a third time.
    expect(h.executor.dispatches.get(key)).toBe(2);
  });

  test('a pump passes over tasks its principal cannot see', async () => {
    const h = await ready();
    h.executor.loseNextResponse = true;
    expect(await run(h, 'j1', 'pause', { reason: 'x' })).toSucceed();
    h.policy.hide('j1');
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedWith({ resolutions: [] });
  });

  test('a pump request is a limit only', async () => {
    const h = await ready();
    expect(await h.writer.resolveCommands({ limit: 1, after: 'x' } as never)).toFailWith(/resolveCommands/);
  });
});

describe('merging a result onto the latest record', () => {
  test('a reassignment during an in-flight command survives the result', async () => {
    const h = await ready();
    Object.assign(h.executor, {
      onDispatch: async () => {
        expect(
          await h.writer.reassign({
            taskId: tid('j1'),
            operationId: op(),
            expectedRevision: rev(1),
            responsibility: bob
          })
        ).toSucceed();
      }
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'applied', appliedRevision: 3 });
    });
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.responsibility).toEqual(bob);
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('paused');
  });
});

describe('observation-only sources', () => {
  test('a kind with no commands refuses every command as unsupported, and nothing reaches the source', async () => {
    const h = await ready({ observationOnly: true });
    expect(await run(h, 'j1', 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'rejected', reason: 'unsupported' });
    });
    expect(h.executor.dispatches.size).toBe(0);
    // And it still permits authorized catalog reassignment.
    const record = await recordOf(h, 'j1');
    const revision = record.recordType === 'resolved' ? record.task.envelope.revision : rev(0);
    expect(
      await h.writer.reassign({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: revision,
        responsibility: bob
      })
    ).toSucceed();
  });
});

describe('source-replay commands', () => {
  test('an applied answer stays accepted until the feed reaches its revision, then applies there', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const key = op();
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'accepted' });
    });
    // The command's own observation did not move the task: the feed has not reached it.
    let record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('running');
    expect((await commandOf(h, 'j1', key)).awaiting).toEqual({
      revision: { epoch: 'e1', token: '2' },
      execution: expect.any(String)
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('paused');
    const stored = await commandOf(h, 'j1', key);
    expect(stored.receipt.result).toEqual({ state: 'applied', appliedRevision: 3 });
    expect(stored.awaiting).toBeUndefined();
  });

  test('a feed revision contradicting the awaited answer leaves the receipt accepted, not applied', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const key = op();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      // The answer names the revision the feed will carry, but claims other content there.
      dispatch: async (...args: Parameters<typeof dispatch>) =>
        (await dispatch(...args)).onSuccess((a) =>
          succeed(
            a.state === 'applied'
              ? { ...a, observation: { ...a.observation, details: { ...a.observation.details, step: 77 } } }
              : a
          )
        )
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'accepted' });
    });
    expect((await commandOf(h, 'j1', key)).awaiting).toBeDefined();
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    // The feed committed the revision — its own projection — and the command stops waiting unconfirmed.
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('paused');
    const stored = await commandOf(h, 'j1', key);
    expect(stored.receipt.result).toEqual({ state: 'accepted' });
    expect(stored.awaiting).toBeUndefined();
  });

  test('an applied answer contradicting the committed projection at that revision is indeterminate', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const key = op();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<typeof dispatch>) => {
        const answer = await dispatch(...args);
        expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
        // The source then reports the revision the feed committed, with other content.
        return answer.onSuccess((a) =>
          succeed(
            a.state === 'applied'
              ? { ...a, observation: { ...a.observation, details: { ...a.observation.details, step: 99 } } }
              : a
          )
        );
      }
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({
        state: 'indeterminate',
        reason: expect.stringMatching(/different projection/)
      });
    });
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('possibly-sent');
  });

  test('a command still awaiting its feed revision blocks archive of a terminal task', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const key = op();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      // An applied answer at a revision the feed cannot order against, so it is never reached.
      dispatch: async (...args: Parameters<typeof dispatch>) =>
        (await dispatch(...args)).onSuccess((a) =>
          succeed(
            a.state === 'applied'
              ? { ...a, observation: { ...a.observation, revision: { epoch: 'elsewhere', token: '1' } } }
              : a
          )
        )
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceed();
    h.executor.change('j1', (j) => {
      j.lifecycle = { status: 'cancelled', reason: { code: 'cancelled', summary: 'stop' } };
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.lifecycle.status).toBe('cancelled');
    const stored = await commandOf(h, 'j1', key);
    expect(stored.dispatch).toBe('settled');
    expect(stored.awaiting).toBeDefined();
    expect(h.repository.outstanding()).toSucceedAndSatisfy((o) =>
      expect(o.awaitingCommands).toEqual([tid('j1')])
    );
    const revision = record.recordType === 'resolved' ? record.task.envelope.revision : rev(0);
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: revision })
    ).toFailWithDetail(/awaiting its feed/, { code: 'retention-blocked', retry: 'after-host-action' });
    // T8: the host abandons the wait; the receipt stays unclaimed, and the task can be archived.
    const abandoned = (
      await h.broker.abandonCommand(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { taskId: 'j1', operationId: key, reason: 'the feed will never reach it' }
      )
    ).orThrow();
    expect(abandoned.result).toEqual({
      state: 'abandoned',
      reason: 'the feed will never reach it',
      from: 'awaiting-feed'
    });
    expect((await commandOf(h, 'j1', key)).awaiting).toBeUndefined();
    expect(h.repository.outstanding()).toSucceedAndSatisfy((o) => expect(o.awaitingCommands).toEqual([]));
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: revision })
    ).toSucceed();
  });

  test('an applied answer at a revision the feed already committed applies immediately', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const key = op();
    // The executor applies, then the feed is reconciled before the answer is persisted.
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<typeof dispatch>) => {
        const answer = await dispatch(...args);
        expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
        return answer;
      }
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result.state).toBe('applied');
    });
  });
});

describe('the dispatch boundary under concurrency', () => {
  test('a caller that finds the marker already written never sends a second time', async () => {
    const h = await ready();
    const key = op();
    let checks = 0;
    let pump: Promise<unknown> | undefined;
    let reached: () => void = () => undefined;
    const pumpSending = new Promise<void>((resolve) => (reached = resolve));
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    // The pump's send (the first to reach the executor) blocks until the test releases it.
    Object.assign(h.executor, {
      onDispatch: async () => {
        reached();
        await held;
      }
    });
    // The caller's authority recheck at the dispatch boundary starts the pump, and waits until the
    // pump has written the marker and is sending — then the caller reaches the marker gate itself.
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 1) {
          pump = h.writer.resolveCommands({ limit: 10 });
          await pumpSending;
        }
      }
    });
    expect(await run(h, 'j1', 'cancel', { reason: 'x' }, key)).toSucceedAndSatisfy((receipt) => {
      // The caller did not send: it answers with the receipt as the marker left it.
      expect(receipt.result).toEqual({ state: 'accepted' });
    });
    release();
    await pump;
    expect(h.executor.dispatches.get(key)).toBe(1);
    expect(h.executor.jobs.get('j1')!.applied).toHaveLength(1);
    expect((await commandOf(h, 'j1', key)).receipt.result.state).toBe('applied');
  });

  test('a conditional command carries the source revision committed at the marker, not an earlier read', async () => {
    const h = await ready();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 1) {
          // An observation lands between the caller's first read and its marker.
          h.executor.change('j1', (j) => (j.step = 1));
          expect(await h.broker.observe(tid('j1'))).toSucceed();
        }
      }
    });
    expect(await run(h, 'j1', 'cancel', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result.state).toBe('applied');
    });
    expect(h.executor.jobs.get('j1')!.lifecycle.status).toBe('cancelled');
  });

  test('a catalog change between authorization and the marker leaves the intent unsent for the pump', async () => {
    const h = await ready();
    const key = op();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 1) {
          expect(
            await h.writer.reassign({
              taskId: tid('j1'),
              operationId: op(),
              expectedRevision: rev(1),
              responsibility: bob
            })
          ).toSucceed();
        }
      }
    });
    expect(await run(h, 'j1', 'pause', { reason: 'x' }, key)).toFailWithDetail(
      /intent is recorded and was not sent/,
      {
        code: 'conflict',
        retry: 'safe',
        operationId: key
      }
    );
    expect((await commandOf(h, 'j1', key)).dispatch).toBe('not-sent');
    expect(h.executor.dispatches.size).toBe(0);
    // A pump whose own authorization is overtaken the same way sends nothing either.
    let pumpChecks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && pumpChecks++ === 0) {
          const record = await recordOf(h, 'j1');
          expect(
            await h.writer.reassign({
              taskId: tid('j1'),
              operationId: op(),
              expectedRevision: record.recordType === 'resolved' ? record.task.envelope.revision : rev(1),
              responsibility: 'unassigned'
            })
          ).toSucceed();
        }
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toFailWithDetail(
      /intent is recorded and was not sent/,
      {
        code: 'conflict',
        retry: 'safe',
        operationId: key
      }
    );
    expect(h.executor.dispatches.size).toBe(0);
    // The pump, re-authorized against the task as it is now, dispatches it.
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions).toEqual([
        expect.objectContaining({ operationId: key, action: 'dispatched' })
      ]);
    });
    expect(h.executor.jobs.get('j1')!.applied).toEqual([`pause:${key}`]);
  });
});
