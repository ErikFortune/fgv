/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  TaskResult,
  defaultTaskCapacityProfile
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import { op, revisionOf, succeedTask, tid } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  reopen,
  subscribeAs,
  subscribed
} from '../../helpers/deliveryFixtures';
import { registerJob } from '../../helpers/sourceFixtures';
import {
  IWorld,
  Totals,
  committed,
  deliveryIn,
  drainBudget,
  emptyWorld,
  hostBinding,
  journey,
  newCommand,
  newSubscription,
  newTask,
  owedIds,
  populate,
  populateBase,
  populatedWorld,
  reopenWorld,
  runJourney,
  saturatedWorld,
  subscribeLate,
  totalsOf
} from '../../helpers/saturationFixtures';

/**
 * The rest of A3's saturation list (implementation plan § T8): lifetime acknowledgement exhaustion,
 * already-admitted events at zero headroom, repeated and rejected command identities, pinned
 * receipts, oversized results, claimed-but-never-resolved registrations — and that cleanup at the
 * ceiling invents no outcome, ends no obligation without authority and passes no blocker.
 */

const index = (name: string): number => journey.findIndex((s) => s.name === name);

function refusedOn(result: TaskResult<unknown>, dimension: CapacityDimension): void {
  expect(result).toFailWithDetail(
    /capacity/i,
    expect.objectContaining({
      code: 'backpressure',
      capacity: expect.objectContaining({ dimension })
    })
  );
}

function withLimits(
  limits: Partial<ITaskCapacityProfile['limits']>,
  perOwner?: Partial<ITaskCapacityProfile['perOwner']>
): ITaskCapacityProfile {
  return {
    ...defaultTaskCapacityProfile,
    limits: { ...defaultTaskCapacityProfile.limits, ...limits },
    perOwner: { ...defaultTaskCapacityProfile.perOwner, ...perOwner }
  };
}

/** Tracks a task, succeeds it, acknowledges everything owed to `sub`, prunes and archives it. */
async function cycle(h: IDeliveryHarness, id: string, sub: string): Promise<TaskResult<unknown>> {
  const created = await h.writer.createTracked({ taskId: tid(id), operationId: op(), title: id });
  if (created.isFailure()) {
    return created;
  }
  await succeedTask(h, h.writer, id);
  const delivery = deliveryOf(h, sub);
  while ((await pendingIds(delivery)).length > 0) {
    const prepared = (await delivery.prepare()).orThrow();
    (await delivery.acknowledge(prepared.context.receipt)).orThrow();
  }
  (await h.broker.cleanup({ limit: 10 })).orThrow();
  return h.writer.archive({
    taskId: tid(id),
    operationId: op(),
    expectedRevision: await revisionOf(h.repository, id)
  });
}

describe('lifetime acknowledgement exhaustion', () => {
  test('on one subscription: its history fills from drained, archived work, never shrinks, and then refuses new obligations', async () => {
    const h = await deliveryHarness({
      profile: withLimits({}, { maxAcknowledgementIdsPerSubscription: 40 })
    });
    await subscribed(h, 'sub');
    const history: number[] = [];
    let refused: TaskResult<unknown> | undefined;
    for (let i = 0; i < 40 && refused === undefined; i++) {
      const outcome = await cycle(h, `t${i}`, 'sub');
      if (outcome.isFailure()) {
        refused = outcome;
      } else {
        history.push((await consumerRecord(h.repository, 'sub')).acknowledged.length);
      }
    }
    // Several tasks completed and were archived first; each added its ids to the exact history.
    expect(history.length).toBeGreaterThan(2);
    expect(history).toEqual([...history].sort((a, b) => a - b));
    expect(new Set(history).size).toBe(history.length);
    refusedOn(refused!, 'acknowledgement-ids');
    // Nothing is owed and nothing is open: what refuses the next task is history alone.
    expect(await pendingIds(deliveryOf(h, 'sub'))).toEqual([]);
    expect(h.repository.outstanding()).toSucceedAndSatisfy((o) => {
      expect(o.prunable).toEqual([]);
      expect(o.subscriptions).toEqual([
        expect.objectContaining({ subscriptionId: 'sub', owed: 0, pinned: 0 })
      ]);
    });
    const full: number = history[history.length - 1];
    // Closing ends the subscription's future obligations — work may be admitted again — but keeps
    // every id it acknowledged, which reopen finds exactly.
    (
      await h.broker.closeSubscription(hostBinding, { subscriptionId: 'sub', obligations: 'retain' })
    ).orThrow();
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(full);
    expect(
      await h.writer.createTracked({ taskId: tid('after'), operationId: op(), title: 'after' })
    ).toSucceed();
    const later = await reopen(h);
    expect((await consumerRecord(later.repository, 'sub')).acknowledged).toHaveLength(full);
    expect(
      inspectRepository(later.repository)!.ledger.entry('consumer:sub')!.used['acknowledgement-ids']
    ).toBe(full);
  });

  test('across many closed subscriptions: closed histories alone reach the repository-wide ceiling, which cleanup cannot reclaim', async () => {
    // Room for one live task's closeout (224 ids) plus a few dozen cycles of history.
    const h = await deliveryHarness({ profile: withLimits({ 'acknowledgement-ids': 560 }) });
    let refused: TaskResult<unknown> | undefined;
    let closed: number = 0;
    for (let i = 0; i < 200 && refused === undefined; i++) {
      const sub: string = `s${i}`;
      const subscribedNow = await subscribeAs(h, sub, { categories: ['attention', 'lifecycle', 'result'] });
      if (subscribedNow.isFailure()) {
        refused = subscribedNow;
        break;
      }
      const outcome = await cycle(h, `t${i}`, sub);
      if (outcome.isFailure()) {
        refused = outcome;
        break;
      }
      (
        await h.broker.closeSubscription(hostBinding, { subscriptionId: sub, obligations: 'retain' })
      ).orThrow();
      closed += 1;
    }
    expect(closed).toBeGreaterThan(10);
    refusedOn(refused!, 'acknowledgement-ids');
    // No task holds a reservation any more — every one is archived — so draining could release none
    // of it, and the refusal says so.
    expect(refused!.isFailure() && refused!.detail?.capacity?.reclaimableByCleanup).toBe(false);
    // Every closed subscription's history is still counted, exactly.
    let sum: number = 0;
    for (let i = 0; i < closed; i++) {
      sum += (await consumerRecord(h.repository, `s${i}`)).acknowledged.length;
    }
    const row = h.repository
      .capacityStatus()
      .orThrow()
      .dimensions.find((d) => d.dimension === 'acknowledgement-ids')!;
    expect(row.used).toBe(sum);
    const later = await reopen(h);
    expect(
      later.repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === 'acknowledgement-ids')!.used
    ).toBe(sum);
  });
});

describe('an already-admitted required event needs no new acknowledgement space', () => {
  test('at acknowledgement-id saturation the terminal transition, the settled result and the source terminal all commit, and headroom stays zero', async () => {
    const at: Totals = totalsOf((await populatedWorld()).repository);
    const w: IWorld = await saturatedWorld('acknowledgement-ids', at);
    refusedOn(await newTask(w), 'acknowledgement-ids');
    for (const name of [
      'complete the largest task',
      'settle the uncertain command',
      'observe the job finish at its source'
    ]) {
      const before: Totals = totalsOf(w.repository);
      expect(await journey[index(name)].run(w)).toSucceed();
      const after: Totals = totalsOf(w.repository);
      // Every link these required updates added was paid from the claim that reserved it: the
      // repository-wide acknowledgement figure never went up, so nothing unreserved was spent.
      expect({
        name,
        grew: committed(after, 'acknowledgement-ids') > committed(before, 'acknowledgement-ids')
      }).toEqual({
        name,
        grew: false
      });
    }
    // The owed updates really were added — and are owed to both subscriptions.
    expect((await owedIds(deliveryIn(w, 'watcher'))).length).toBeGreaterThan(0);
  });
});

describe('command identities at the ceiling', () => {
  test("repeating an admitted command's identity replays it at no cost; a new identity is new admission, refused", async () => {
    const at: Totals = totalsOf((await populatedWorld()).repository);
    const w: IWorld = await saturatedWorld('operations', at);
    const before: Totals = totalsOf(w.repository);
    const replay = await w.writer.execute({
      taskId: tid('j'),
      operationId: 'pause-j' as never,
      expectedRevision: await revisionOf(w.repository, 'j'),
      command: 'pause',
      parameters: { reason: 'hold' }
    });
    expect(replay).toSucceed();
    expect(totalsOf(w.repository)).toEqual(before);
    refusedOn(await newCommand(w), 'operations');
    expect(totalsOf(w.repository)).toEqual(before);
  });

  test('a command the source rejects after admission keeps its evidence, frees its settlement, and replays as rejected', async () => {
    const w: IWorld = await populatedWorld();
    await runJourney(w, 0, index('settle the uncertain command') + 1);
    // The job finishes at its source, unseen by the broker: the next command is admitted, then rejected.
    w.executor.change('j', (j) => {
      j.lifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };
    });
    const before: Totals = totalsOf(w.repository);
    const request = {
      taskId: tid('j'),
      operationId: 'resume-late' as never,
      expectedRevision: await revisionOf(w.repository, 'j'),
      command: 'resume',
      parameters: {}
    };
    const receipt = (await w.writer.execute(request)).orThrow();
    expect(receipt.result.state).toBe('rejected');
    const after: Totals = totalsOf(w.repository);
    const record: ITaskCommitRecord = (await w.repository.readCommit(tid('j'))).orThrow()!;
    const stored = record.operations.find((o) => o.operationId === 'resume-late');
    expect(stored).toEqual(expect.objectContaining({ type: 'command', dispatch: 'settled' }));
    // Its evidence is one more operation, kept for dedup; its settlement reserve is gone.
    expect(after.operations.used - before.operations.used).toBe(1);
    expect(committed(after, 'resident-payload-bytes')).toBeLessThanOrEqual(
      committed(before, 'resident-payload-bytes')
    );
    const settlements = record.capacityClaims.filter(
      (c) => c.purpose === 'accepted-operation-settlement' && c.disposition === 'reserved'
    );
    expect(settlements).toEqual([]);
    // The same identity again is that receipt, at no cost.
    expect((await w.writer.execute(request)).orThrow().result).toEqual(receipt.result);
    expect(totalsOf(w.repository)).toEqual(after);
  });
});

describe('pinned receipts at the ceiling', () => {
  test('a receipt nobody acknowledged pins what it names: cleanup keeps the payload until the receipt is abandoned', async () => {
    const at: Totals = totalsOf((await populatedWorld()).repository);
    const w: IWorld = await saturatedWorld('resident-payload-bytes', at);
    await runJourney(w, 0, index('acknowledge every update owed to watcher'));
    const delivery = deliveryIn(w, 'watcher');
    // One receipt is issued and never acknowledged; a second, naming the same ids, is.
    const pinning = (await delivery.prepare(drainBudget)).orThrow();
    const acked = (await delivery.prepare(drainBudget)).orThrow();
    (await delivery.acknowledge(acked.context.receipt)).orThrow();
    expect(await owedIds(delivery)).toEqual([]);
    await runJourney(w, index('dispose every update owed to late'), index('prune'));
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('prune')].run(w)).toSucceed();
    const pinned: Totals = totalsOf(w.repository);
    // What the open receipt names is still charged: resident payload did not fall to zero.
    expect(pinned['resident-payload-bytes'].used).toBeGreaterThan(0);
    expect(w.repository.outstanding()).toSucceedAndSatisfy((o) =>
      expect(o.subscriptions.find((s) => s.subscriptionId === 'watcher')!.pinned).toBeGreaterThan(0)
    );
    expect(await delivery.abandon(pinning.deliveryId)).toSucceed();
    expect(await journey[index('prune')].run(w)).toSucceed();
    expect(totalsOf(w.repository)['resident-payload-bytes'].used).toBe(0);
    // Nothing here went through a door the ceiling closed: the prune only ever released.
    expect(committed(pinned, 'resident-payload-bytes')).toBeLessThanOrEqual(
      committed(before, 'resident-payload-bytes')
    );
  });
});

describe('oversized results', () => {
  test('a command result over the bounds is a source-contract issue: nothing is truncated, the command stays uncertain, its reservation stays', async () => {
    const w: IWorld = await populatedWorld();
    await runJourney(w, 0, index('settle the uncertain command'));
    // The executor applied the command; the answer it will give for the key carries a projection
    // whose details are over the kind's byte bound.
    const answer = w.executor.keys.get('pause-j')!;
    if (answer.state !== 'applied') {
      throw new Error('the lost pause was not applied');
    }
    w.executor.keys.set('pause-j', {
      ...answer,
      observation: { ...answer.observation, details: { step: 0, ref: 'r'.repeat(70 * 1024) } }
    });
    const before: Totals = totalsOf(w.repository);
    const outcome = await journey[index('settle the uncertain command')].run(w);
    expect(outcome).toSucceed();
    expect(await w.repository.unsettledCommands({ limit: 10 })).toSucceedWith([tid('j')]);
    const record: ITaskCommitRecord = (await w.repository.readCommit(tid('j'))).orThrow()!;
    const stored = record.operations.find((o) => o.operationId === 'pause-j');
    // Recorded as what it is — an answer that broke the source's contract, named in a bounded
    // diagnostic — and never as an applied receipt with its result cut down to fit.
    expect(stored).toEqual(
      expect.objectContaining({
        dispatch: 'possibly-sent',
        receipt: expect.objectContaining({
          result: {
            state: 'indeterminate',
            reason: expect.stringMatching(
              /breaks its contract.*details is \d+ bytes, over the bound of 65536/
            )
          }
        })
      })
    );
    // The settlement reservation is held in full; only the diagnostic's own bytes changed.
    const after: Totals = totalsOf(w.repository);
    for (const dimension of Object.keys(before) as CapacityDimension[]) {
      expect({ dimension, reserved: after[dimension].reserved }).toEqual({
        dimension,
        reserved: before[dimension].reserved
      });
      if (dimension !== 'logical-bytes' && dimension !== 'record-bytes') {
        expect({ dimension, used: after[dimension].used }).toEqual({
          dimension,
          used: before[dimension].used
        });
      }
    }
    // An answer within bounds settles it as usual.
    w.executor.keys.set('pause-j', answer);
    expect(await journey[index('settle the uncertain command')].run(w)).toSucceed();
    expect(await w.repository.unsettledCommands({ limit: 10 })).toSucceedWith([]);
  });
});

describe('claimed but never resolved', () => {
  test('a pending registration the process never finished keeps its whole reservation through a full drain, is named, and resumes at no new charge', async () => {
    const w: IWorld = await populatedWorld();
    w.faulty.faults.push({ name: 'task-u.json', when: 'before', visibility: 'unchanged' });
    expect(await newTask(w)).toFail();
    const pending: Totals = totalsOf(w.repository);
    const reopened: IWorld = await reopenWorld(w);
    expect(totalsOf(reopened.repository)).toEqual(pending);
    expect(reopened.repository.outstanding()).toSucceedAndSatisfy((o) =>
      expect(o.pendingRegistrations).toEqual([{ taskId: 'u', operationId: 'create-u' }])
    );
    const held = inspectRepository(reopened.repository)!.ledger.entry('task:u')!;
    await runJourney(reopened);
    // Everything else drained, archived and closed; the pending registration still holds exactly what
    // it held — no drain step, prune or closure releases a reservation nobody has settled.
    const after = inspectRepository(reopened.repository)!.ledger.entry('task:u')!;
    expect(after.reserved).toEqual(held.reserved);
    expect(totalsOf(reopened.repository)['non-archived-tasks'].used).toBe(1);
    // Retrying the same registration completes it; its reservation moves to the record, uncharged twice.
    const reserved = totalsOf(reopened.repository).updates.reserved;
    expect(await newTask(reopened)).toSucceed();
    expect(totalsOf(reopened.repository).updates.reserved).toBe(reserved);
  });

  test('an external task never first-observed keeps both of its bundles through a full drain, and cannot be archived away', async () => {
    // The executor does not know the job yet, so no reconciliation pass can resolve it.
    const w: IWorld = await emptyWorld();
    await registerJob(w, 'k', { unresolved: true, operationId: 'register-k' as never });
    await populate(w);
    const record: ITaskCommitRecord = (await w.repository.readCommit(tid('k'))).orThrow()!;
    expect(record.recordType).toBe('unresolved');
    expect(record.capacityClaims.map((c) => [c.purpose, c.disposition]).sort()).toEqual([
      ['first-resolution', 'reserved'],
      ['terminal-closeout', 'reserved']
    ]);
    const held = inspectRepository(w.repository)!.ledger.entry('task:k')!;
    await runJourney(w);
    expect(inspectRepository(w.repository)!.ledger.entry('task:k')!.reserved).toEqual(held.reserved);
    expect(
      await w.writer.archive({
        taskId: tid('k'),
        operationId: op(),
        expectedRevision: await revisionOf(w.repository, 'k')
      })
    ).toFail();
    expect(inspectRepository(w.repository)!.ledger.entry('task:k')!.reserved).toEqual(held.reserved);
  });
});

describe('cleanup at the ceiling', () => {
  let w: IWorld;

  beforeEach(async () => {
    const at: Totals = totalsOf((await populatedWorld()).repository);
    w = await saturatedWorld('resident-payload-bytes', at);
    await runJourney(w, 0, index('complete the largest task') + 1);
  });

  test('invents no outcome: an uncertain command stays uncertain through cleanup, and holds its task out of archive', async () => {
    const before: Totals = totalsOf(w.repository);
    expect(await w.broker.cleanup({ limit: 10 })).toSucceed();
    expect(await w.repository.unsettledCommands({ limit: 10 })).toSucceedWith([tid('j')]);
    const record: ITaskCommitRecord = (await w.repository.readCommit(tid('j'))).orThrow()!;
    expect(record.operations.find((o) => o.operationId === 'pause-j')).toEqual(
      expect.objectContaining({ dispatch: 'possibly-sent' })
    );
    // The job's own terminal state arrives from the source; the command it cannot vouch for still
    // blocks the archive.
    expect(await journey[index('observe the job finish at its source')].run(w)).toSucceed();
    expect(await w.repository.unsettledCommands({ limit: 10 })).toSucceed();
    const archive = await w.writer.archive({
      taskId: tid('j'),
      operationId: op(),
      expectedRevision: await revisionOf(w.repository, 'j')
    });
    expect(archive).toFail();
    expect(committed(totalsOf(w.repository), 'non-archived-tasks')).toBe(
      committed(before, 'non-archived-tasks')
    );
  });

  test('ends no obligation without authority: a refused disposition or abandonment releases nothing', async () => {
    w.policy.denyOn('dispose-obligation', 'j');
    const denied = { ...hostBinding, authorization: w.policy };
    const before: Totals = totalsOf(w.repository);
    const owed: string[] = await owedIds(deliveryIn(w, 'late'));
    expect(
      await w.broker.dispose(denied, { subscriptionId: 'late', updateIds: owed, reason: 'free the slot' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(
      await w.broker.abandonCommand(denied, { taskId: 'j', operationId: 'pause-j', reason: 'free the slot' })
    ).toFailWithDetail(
      /not found or not permitted/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(await w.broker.cleanup({ limit: 10 })).toSucceed();
    expect(totalsOf(w.repository)).toEqual(before);
    expect(await owedIds(deliveryIn(w, 'late'))).toEqual(owed);
  });

  test('with authority, abandonment names what was known and is never a success', async () => {
    const receipt = (
      await w.broker.abandonCommand(hostBinding, {
        taskId: 'j',
        operationId: 'pause-j',
        reason: 'outcome unknown at the ceiling'
      })
    ).orThrow();
    expect(receipt.result).toEqual({
      state: 'abandoned',
      reason: 'outcome unknown at the ceiling',
      from: 'possibly-sent'
    });
    expect(await w.repository.unsettledCommands({ limit: 10 })).toSucceedWith([]);
  });
});

describe('reopen at the ceiling', () => {
  test('a saturated repository opens ready, for reads and drain, and refuses the same growth it refused before', async () => {
    const at: Totals = totalsOf((await populatedWorld()).repository);
    const w: IWorld = await saturatedWorld('non-archived-tasks', at);
    const before: Totals = totalsOf(w.repository);
    const reopened: IWorld = await reopenWorld(w);
    expect(totalsOf(reopened.repository)).toEqual(before);
    refusedOn(await newTask(reopened), 'non-archived-tasks');
    expect(await owedIds(deliveryIn(reopened, 'late'))).toHaveLength(2);
    await runJourney(reopened);
    expect(await newTask(reopened)).toSucceed();
  });
});

describe('a raise cannot outgrow the reservations already held (antagonist HIGH-1)', () => {
  const raise = async (
    w: IWorld,
    change: (p: ITaskCapacityProfile) => ITaskCapacityProfile
  ): Promise<TaskResult<unknown>> =>
    w.repository.withWriter((writer) => writer.raiseCapacityLimits(change(w.repository.profile)));

  test.each([
    ['maxEnvelopeBytes', /closeout resident-payload-bytes/],
    ['maxDetailBytes', /closeout record-bytes/],
    ['maxStoredOperationBytes', /closeout record-bytes/],
    ['maxAcknowledgementEvidenceBytes', /closeout logical-bytes|encoded\.maxAcknowledgementEvidenceBytes/],
    ['maxIssuedReceiptBytes', /settlement record-bytes|encoded\.maxIssuedReceiptBytes/]
  ] as const)('raising %s is refused: accepted work could not finish on its claims', async (bound, named) => {
    const w: IWorld = await populatedWorld();
    const before: Totals = totalsOf(w.repository);
    expect(
      await raise(w, (p) => ({ ...p, encoded: { ...p.encoded, [bound]: p.encoded[bound] * 2 } }))
    ).toFailWithDetail(named, expect.objectContaining({ code: 'unsupported' }));
    expect(w.repository.profile).toEqual(defaultTaskCapacityProfile);
    expect(totalsOf(w.repository)).toEqual(before);
  });

  test('raising the audience per update is refused the same way', async () => {
    const w: IWorld = await emptyWorld(withLimits({}, { maxAudiencePerUpdate: 16 }));
    expect(
      await raise(w, (p) => ({ ...p, perOwner: { ...p.perOwner, maxAudiencePerUpdate: 32 } }))
    ).toFailWithDetail(/closeout audience-links/, expect.objectContaining({ code: 'unsupported' }));
  });

  test('raising maxUpdateBytes alone, or any limit, changes no reservation and is admitted', async () => {
    const w: IWorld = await populatedWorld();
    expect(
      await raise(w, (p) => ({
        ...p,
        limits: { ...p.limits, 'logical-bytes': p.limits['logical-bytes'] * 3 },
        encoded: { ...p.encoded, maxUpdateBytes: p.encoded.maxUpdateBytes * 2 }
      }))
    ).toSucceed();
    // And the accepted work still finishes on the claims it holds.
    await runJourney(w);
  });
});

describe('an activation whose record landed freezes what its baseline covers (antagonist HIGH-2)', () => {
  /** A world whose late `current` subscription wrote its first record but was not marked live. */
  async function landedNotLive(): Promise<IWorld> {
    const w: IWorld = await populateBase(await emptyWorld());
    // The pending entry and the consumer record land; the live entry fails having changed nothing.
    w.faulty.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await subscribeLate(w)).toFail();
    expect(w.repository.health().state).toBe('ready');
    return w;
  }

  const setTitle = async (w: IWorld, id: string, title: string): Promise<TaskResult<unknown>> =>
    w.writer.updateTracked({
      taskId: tid(id),
      operationId: op(),
      expectedRevision: await revisionOf(w.repository, id),
      patch: { title }
    });

  test('a change to a task the baseline covers, or a new one it would cover, is refused — never silently missed', async () => {
    const w: IWorld = await landedNotLive();
    expect(await setTitle(w, 't', 'moved on')).toFailWithDetail(
      /subscription late's activation is incomplete/,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(await newTask(w)).toFailWithDetail(
      /subscription late's activation is incomplete/,
      expect.anything()
    );
    // Retrying the registration completes it from the landed record — whose baseline is still exact.
    expect(await subscribeLate(w)).toSucceed();
    expect(await owedIds(deliveryIn(w, 'late'))).toEqual(['j:1:initial', 't:1:initial']);
    // And the work goes on, owed to it as to any live subscription.
    expect(await setTitle(w, 't', 'moved on')).toSucceed();
    expect(await owedIds(deliveryIn(w, 'late'))).toEqual(['j:1:initial', 't:1:initial', 't:2:1']);
  });

  test('a reopen completes the landed activation and lifts the freeze', async () => {
    const w: IWorld = await landedNotLive();
    const reopened: IWorld = await reopenWorld(w);
    expect(await owedIds(deliveryIn(reopened, 'late'))).toEqual(['j:1:initial', 't:1:initial']);
    expect(await newTask(reopened)).toSucceed();
    expect(await owedIds(deliveryIn(reopened, 'late'))).toEqual(['j:1:initial', 't:1:initial', 'u:1:0']);
  });

  test('a from-now registration freezes nothing, and a record that never landed is rebuilt fresh on retry', async () => {
    const w: IWorld = await populateBase(await emptyWorld());
    w.faulty.faults.push({ name: 'consumer-late.json', when: 'before', visibility: 'unchanged' });
    expect(await subscribeLate(w)).toFail();
    expect(await setTitle(w, 't', 'moved on')).toSucceed();
    expect(await subscribeLate(w)).toSucceed();
    expect(await owedIds(deliveryIn(w, 'late'))).toEqual(['j:1:initial', 't:2:initial']);

    const f: IWorld = await populateBase(await emptyWorld());
    f.faulty.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await newSubscription(f)).toFail();
    expect(await setTitle(f, 't', 'moved on')).toSucceed();
  });

  test('a rebuild completes it too, and the freeze follows', async () => {
    const w: IWorld = await landedNotLive();
    expect(await w.repository.rebuildIndexes()).toSucceed();
    expect(await setTitle(w, 't', 'moved on')).toSucceed();
  });
});
