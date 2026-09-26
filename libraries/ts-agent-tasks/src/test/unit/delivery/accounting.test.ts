/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskRepository,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskRevision,
  TaskResult,
  allCapacityDimensions,
  defaultTaskCapacityProfile,
  taskUpdateId
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import {
  alpha,
  beta,
  op,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track,
  watch,
  watcher
} from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  committedIn,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  dimension,
  pendingIds,
  reopen,
  subscribeAs,
  subscribed
} from '../../helpers/deliveryFixtures';
import { ISourceHarness, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';

const E: number = defaultTaskCapacityProfile.encoded.maxAcknowledgementEvidenceBytes;
const op2 = (key: string): OperationId => key as OperationId;
const M: number = defaultTaskCapacityProfile.encoded.maxIssuedReceiptBytes;

function totals(repository: ITaskRepository): Record<string, number> {
  const status: ITaskCapacityStatus = repository.capacityStatus().orThrow();
  const out: Record<string, number> = {};
  for (const row of status.dimensions) {
    if (row.dimension !== 'record-bytes') {
      out[row.dimension] = row.used + row.reserved;
    }
  }
  return out;
}

function charge(claim: ITaskCapacityClaim, name: CapacityDimension): number {
  return claim.charges.find((c) => c.dimension === name)?.amount ?? 0;
}

async function claimOf(
  repository: ITaskRepository,
  id: string,
  purpose: ITaskCapacityClaim['purpose']
): Promise<ITaskCapacityClaim> {
  return (await repository.readCommit(tid(id))).orThrow()!.capacityClaims.find((c) => c.purpose === purpose)!;
}

function consumerEntry(repository: ITaskRepository, id: string): { used: number; reserved: number } {
  const entry = inspectRepository(repository)!.ledger.entry(`consumer:${id}`)!;
  return { used: entry.used['acknowledgement-ids'], reserved: entry.reserved['acknowledgement-ids'] };
}

function profileWith(
  limits: Partial<ITaskCapacityProfile['limits']>,
  extra?: Partial<ITaskCapacityProfile>
): ITaskCapacityProfile {
  return {
    ...defaultTaskCapacityProfile,
    ...extra,
    limits: { ...defaultTaskCapacityProfile.limits, ...limits }
  };
}

function backpressure(result: TaskResult<unknown>, dimensionName?: CapacityDimension): void {
  expect(result).toFail();
  expect(result.isFailure() && result.detail).toEqual(
    expect.objectContaining({
      code: 'backpressure',
      ...(dimensionName !== undefined
        ? { capacity: expect.objectContaining({ dimension: dimensionName }) }
        : {})
    })
  );
}

describe('spend, never mint: acknowledgement evidence comes out of the claims that reserved it', () => {
  // T6's hand-off, pinned by the charge rather than the behaviour: a protected step that adds audience
  // links moves their acknowledgement evidence from its own claim to the subscriptions that now hold
  // it. The repository-wide totals therefore do not move at all. Minting would add the evidence on
  // top — every functional test would still pass, and the ledger would count it twice.
  test('a terminal transition owed to a subscription moves its evidence out of the closeout: one charge, not two', async () => {
    const h = await deliveryHarness();
    await watch(h.broker);
    await track(h.writer, 't');
    const before = totals(h.repository);
    const closeoutBefore = await claimOf(h.repository, 't', 'terminal-closeout');
    const owedBefore = consumerEntry(h.repository, watcher);
    await succeedTask(h, h.writer, 't');
    const added = 2; // lifecycle and result, each owed to the watcher
    // Every repository-wide dimension is exactly where it was: the step stayed inside its reservation.
    expect(totals(h.repository)).toEqual(before);
    // The closeout claim paid for both links' acknowledgement evidence ...
    const closeoutAfter = await claimOf(h.repository, 't', 'terminal-closeout');
    expect(charge(closeoutBefore, 'acknowledgement-ids') - charge(closeoutAfter, 'acknowledgement-ids')).toBe(
      added
    );
    expect(charge(closeoutAfter, 'acknowledgement-ids')).toBe(7 * 32 - added);
    // ... and the subscription holds exactly that, as the reservation its future acknowledgements use.
    expect(consumerEntry(h.repository, watcher).reserved).toBe(owedBefore.reserved + added);
    expect(await pendingIds(deliveryOf(h, watcher, { consumer: `consumer-${watcher}` }))).toHaveLength(3);
  });

  test('at exact acknowledgement-id saturation, the terminal transition is still accepted', async () => {
    // Two tasks: the profile must still hold an unresolved registration's two bundles.
    const setup = async (h: IDeliveryHarness): Promise<void> => {
      await watch(h.broker);
      await track(h.writer, 't');
      await track(h.writer, 'u');
    };
    const probe = await deliveryHarness();
    await setup(probe);
    const full = committedIn(probe.repository, 'acknowledgement-ids');
    const h = await deliveryHarness({ profile: profileWith({ 'acknowledgement-ids': full }) });
    await setup(h);
    expect(dimension(h.repository, 'acknowledgement-ids').available).toBe(0);
    // Ordinary work owed to the watcher needs new evidence: refused.
    backpressure(
      await h.writer.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'set-progress',
        parameters: { progress: { completed: 1 } }
      }),
      'acknowledgement-ids'
    );
    // The terminal transition's evidence was reserved at acceptance: it goes through.
    expect((await succeedTask(h, h.writer, 't')).result.state).toBe('applied');
    expect(dimension(h.repository, 'acknowledgement-ids').available).toBe(0);
  });

  test("a settling external command spends T6's settlement claim for its links", async () => {
    const h: ISourceHarness = await sourceHarness({ watch: true });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.loseNextResponse = true;
    const key = op();
    (
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).orThrow();
    const settlementBefore = (await recordOf(h, 'j1')).capacityClaims.find(
      (c) => c.purpose === 'accepted-operation-settlement'
    )!;
    expect(charge(settlementBefore, 'acknowledgement-ids')).toBe(32);
    const updatesBefore =
      (await recordOf(h, 'j1')).recordType === 'resolved' ? await recordOf(h, 'j1') : undefined;
    const linksBefore = updatesBefore?.recordType === 'resolved' ? updatesBefore.updates.length : 0;
    (await h.writer.resolveCommands({ limit: 10 })).orThrow();
    const after = await recordOf(h, 'j1');
    const settlement = after.capacityClaims.find(
      (c) => c.purpose === 'accepted-operation-settlement' && c.claimId === settlementBefore.claimId
    )!;
    expect(settlement.disposition).toBe('consumed');
    const links = after.recordType === 'resolved' ? after.updates.length - linksBefore : 0;
    expect(links).toBeGreaterThan(0);
    // What it spent is exactly the evidence of the links the settlement added.
    expect(charge(settlement, 'acknowledgement-ids')).toBe(32 - links);
    expect(
      charge(settlementBefore, 'logical-bytes') - charge(settlement, 'logical-bytes')
    ).toBeGreaterThanOrEqual(links * E);
  });

  test("a source-replay feed revision spends T6's replay envelope for its links", async () => {
    const h: ISourceHarness = await sourceHarness({ history: 'source-replay', watch: true });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    (await h.broker.reconcile({ sourceId: 'exec' })).orThrow(); // resolves at feed revision 1
    const envelopeBefore = (await recordOf(h, 'j1')).capacityClaims.find(
      (c) => c.purpose === 'admitted-source-replay'
    )!;
    h.executor.change('j1', (j) => (j.attention = [{ namespace: 'review', key: 'r1' }]));
    const before = totals(h.repository);
    (await h.broker.reconcile({ sourceId: 'exec' })).orThrow();
    const envelopeAfter = (await recordOf(h, 'j1')).capacityClaims.find(
      (c) => c.purpose === 'admitted-source-replay'
    )!;
    // One required revision, one attention update owed to the watcher: the envelope paid its evidence.
    expect(charge(envelopeBefore, 'acknowledgement-ids') - charge(envelopeAfter, 'acknowledgement-ids')).toBe(
      1
    );
    expect(totals(h.repository)['acknowledgement-ids']).toBe(before['acknowledgement-ids']);
  });

  test('ordinary work owed to a subscription is admitted as new growth — it has no claim to spend', async () => {
    const h = await deliveryHarness();
    await watch(h.broker);
    await track(h.writer, 't');
    const before = totals(h.repository);
    const closeout = await claimOf(h.repository, 't', 'terminal-closeout');
    await h.writer.execute({
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: rev(1),
      command: 'set-progress',
      parameters: { progress: { completed: 1 } }
    });
    expect(totals(h.repository)['acknowledgement-ids']).toBe(before['acknowledgement-ids'] + 1);
    // The closeout reservation is untouched: ordinary work never spends someone's protected room.
    expect(await claimOf(h.repository, 't', 'terminal-closeout')).toEqual(closeout);
  });
});

describe('exact-ID conversion of reservations', () => {
  test('an acknowledgement converts owed evidence into history without growing anything', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    await track(h.writer, 'b');
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    const before = totals(h.repository);
    expect(consumerEntry(h.repository, 'sub')).toEqual({ used: 0, reserved: 2 });
    (await delivery.acknowledge(context.context.receipt)).orThrow();
    expect(consumerEntry(h.repository, 'sub')).toEqual({ used: 2, reserved: 0 });
    expect(totals(h.repository)['acknowledgement-ids']).toBe(before['acknowledgement-ids']);
    expect(totals(h.repository)['logical-bytes']).toBeLessThanOrEqual(before['logical-bytes']);
  });

  test('an acknowledged baseline payload leaves the record in the acknowledging write; its id stays, as history', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 'a');
    await track(h.writer, 'b');
    await subscribed(h, 'sub', { start: 'current' });
    const resident = (repository: typeof h.repository): number =>
      inspectRepository(repository)!.ledger.entry('consumer:sub')!.used['resident-payload-bytes'];
    const held: number = resident(h.repository);
    expect(held).toBeGreaterThan(0);
    const residentBefore: number = committedIn(h.repository, 'resident-payload-bytes');
    const updatesBefore: number = committedIn(h.repository, 'updates');
    const delivery = deliveryOf(h, 'sub');
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    expect(resident(h.repository)).toBe(0);
    expect(committedIn(h.repository, 'resident-payload-bytes')).toBe(residentBefore - held);
    // T8: the payloads are pruned in the same write, releasing their update slots; the exact ids stay.
    const record = await consumerRecord(h.repository, 'sub');
    expect(record.baseline).toEqual([]);
    expect(record.acknowledged).toEqual(['a:1:initial', 'b:1:initial']);
    expect(committedIn(h.repository, 'updates')).toBe(updatesBefore - 2);
    // The same after a restart: the charge is derived from the record, not remembered.
    const later = await reopen(h);
    expect(resident(later.repository)).toBe(0);
    expect(committedIn(later.repository, 'resident-payload-bytes')).toBe(residentBefore - held);
  });

  test('after an acknowledgement and a restart before any cleanup, the join counts it once, as history', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    await succeedTask(h, h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    // The acknowledged updates are still retained in the task record (pruning is T8's): a restart
    // must join them to the subscription's history by exact id.
    expect((await recordOf(h, 'a')).recordType === 'resolved' && (await recordOf(h, 'a'))).toBeTruthy();
    const statusBefore = h.repository.capacityStatus().orThrow();
    const later = await reopen(h);
    expect(later.repository.capacityStatus().orThrow()).toEqual(statusBefore);
    expect(consumerEntry(later.repository, 'sub')).toEqual({ used: 3, reserved: 0 });
    expect(await pendingIds(deliveryOf(later, 'sub'))).toEqual([]);
    // And the next commit of the task does not revive them.
    await later.writer.archive({
      taskId: tid('a'),
      operationId: op(),
      expectedRevision: await revisionOf(later.repository, 'a')
    });
    expect(await pendingIds(deliveryOf(later, 'sub'))).toEqual([]);
  });

  test('duplicate receipts consume no second slot', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    const first = (await delivery.prepare()).orThrow();
    const second = (await delivery.prepare()).orThrow();
    (await delivery.acknowledge(first.context.receipt)).orThrow();
    const after = totals(h.repository);
    const entry = consumerEntry(h.repository, 'sub');
    // The same receipt again, and a second receipt naming the same update.
    (await delivery.acknowledge(first.context.receipt)).orThrow();
    const both = (await delivery.acknowledge(second.context.receipt)).orThrow();
    expect(both.newlyAcknowledged).toEqual([]);
    expect(both.alreadyAcknowledged).toEqual([taskUpdateId('a' as TaskId, 1 as TaskRevision, 'lifecycle')]);
    expect(consumerEntry(h.repository, 'sub')).toEqual(entry);
    expect(totals(h.repository)['acknowledgement-ids']).toBe(after['acknowledgement-ids']);
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(1);
  });
});

describe('one reusable receipt preparation per subscription', () => {
  test('the first manifest converts the reservation; eviction and abandonment restore it; history stays', async () => {
    const h = await deliveryHarness({ defaults: { receiptLifetimeMs: 60 * 1000 } });
    await subscribed(h, 'sub');
    const preparation = (): number =>
      charge(
        inspectRepository(h.repository)!
          .book.subscriptions.get('sub' as SubscriptionId)!
          .claims.find((c) => c.purpose === 'receipt-preparation')!,
        'logical-bytes'
      );
    expect(preparation()).toBe(M);
    await track(h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    const before = totals(h.repository)['logical-bytes'];
    const first = (await delivery.prepare()).orThrow();
    const manifestBytes: number = M - preparation();
    expect(manifestBytes).toBeGreaterThan(0);
    // Issuing the first manifest grew nothing: its bytes came out of the preparation reservation.
    expect(totals(h.repository)['logical-bytes']).toBe(before);
    (await delivery.acknowledge(first.context.receipt)).orThrow();
    // A second concurrent manifest is ordinary headroom.
    await track(h.writer, 'b');
    const second = (await delivery.prepare()).orThrow();
    expect((await consumerRecord(h.repository, 'sub')).issued).toHaveLength(2);
    // Expiry: the next preparation evicts both expired manifests, keeps the history, and the
    // reservation is whole again apart from the new manifest.
    h.clock.advance(61 * 1000);
    await track(h.writer, 'c');
    const third = (await delivery.prepare()).orThrow();
    const record = await consumerRecord(h.repository, 'sub');
    expect(record.issued.map((m) => m.deliveryId)).toEqual([third.deliveryId]);
    expect(record.acknowledged).toEqual([taskUpdateId('a' as TaskId, 1 as TaskRevision, 'lifecycle')]);
    expect(await delivery.acknowledge(second.context.receipt)).toFailWithDetail(
      /not a receipt/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    (await delivery.abandon(third.deliveryId)).orThrow();
    expect(preparation()).toBe(M);
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(1);
  });

  test('at most the per-subscription limit of unexpired manifests are held', async () => {
    const profile = profileWith(
      {},
      {
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOutstandingReceiptsPerSubscription: 2 }
      }
    );
    const h = await deliveryHarness({ profile });
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    const first = (await delivery.prepare()).orThrow();
    (await delivery.prepare()).orThrow();
    backpressure(await delivery.prepare());
    // Abandoning one frees a slot; acknowledging does not (an acknowledged manifest stays valid for
    // replay until it expires).
    (await delivery.acknowledge(first.context.receipt)).orThrow();
    backpressure(await delivery.prepare());
    (await delivery.abandon(first.deliveryId)).orThrow();
    expect(await delivery.prepare()).toSucceed();
  });
});

describe('prepare and acknowledge drain at ordinary admission saturation', () => {
  test('with every additive dimension exactly full, new work is refused and delivery still drains', async () => {
    // Fixed operation ids, so the probe and the saturated repository write records of one size.
    const create = async (h: IDeliveryHarness, id: string): Promise<void> => {
      (
        await h.writer.createTracked({ taskId: tid(id), operationId: op2(`create-${id}`), title: id })
      ).orThrow();
    };
    const finish = async (h: IDeliveryHarness, id: string, key: string): Promise<void> => {
      (
        await h.writer.execute({
          taskId: tid(id),
          operationId: op2(key),
          expectedRevision: await revisionOf(h.repository, id),
          command: 'succeed',
          parameters: { outcome: { summary: `${id} done`, artifacts: [] } }
        })
      ).orThrow();
    };
    const setup = async (h: IDeliveryHarness): Promise<void> => {
      await subscribed(h, 'sub');
      await create(h, 'a');
      await finish(h, 'a', 'succeed-a');
      await create(h, 'b');
    };
    const probe = await deliveryHarness();
    await setup(probe);
    const full: Record<string, number> = {};
    for (const name of allCapacityDimensions) {
      if (name !== 'record-bytes') {
        full[name] = Math.max(1, committedIn(probe.repository, name));
      }
    }
    // Registration's pending manifest entry briefly carries the creation request (T3), so the peak
    // during setup is a little above the settled total: logical bytes get that much room, no more.
    full['logical-bytes'] += 1024;
    const h = await deliveryHarness({
      profile: profileWith(full as Partial<ITaskCapacityProfile['limits']>)
    });
    await setup(h);
    expect(h.repository.capacityStatus().orThrow().state).toBe('draining');
    expect(dimension(h.repository, 'acknowledgement-ids').available).toBe(0);
    // (The stored profile's smaller numbers make its manifest a few bytes shorter than the probe's.)
    expect(dimension(h.repository, 'logical-bytes').available).toBeLessThan(2048);
    backpressure(await h.writer.createTracked({ taskId: tid('c'), operationId: op(), title: 'c' }));
    const delivery = deliveryOf(h, 'sub');
    const context = (await delivery.prepare()).orThrow();
    expect(context.context.receipt.included.flatMap((e) => e.updateIds)).toHaveLength(4);
    expect((await delivery.acknowledge(context.context.receipt)).orThrow().newlyAcknowledged).toHaveLength(4);
    expect(await pendingIds(delivery)).toEqual([]);
    // And the reserved terminal path still finishes the other task.
    await finish(h, 'b', 'succeed-b');
    expect(await pendingIds(delivery)).toHaveLength(2);
  });
});

describe('the potential audience is capped at what the claims reserved', () => {
  const lean: ITaskCapacityProfile = profileWith(
    {},
    {
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxAudiencePerUpdate: 2 }
    }
  );

  test('a third subscription covering a task is refused at activation', async () => {
    const h = await deliveryHarness({ profile: lean });
    await track(h.writer, 't');
    await subscribed(h, 's1');
    await subscribed(h, 's2');
    backpressure(await subscribeAs(h, 's3'), 'audience-links');
    // One that does not cover the task is fine.
    expect(await subscribeAs(h, 's3', { scopes: [beta] })).toSucceed();
  });

  test('a task cannot be moved or created under more subscriptions than its claims can pay for', async () => {
    const h = await deliveryHarness({ profile: lean });
    await subscribed(h, 's1');
    await subscribed(h, 's2');
    await subscribed(h, 'b1', { scopes: [beta] });
    await track(h.writer, 't');
    const writer = h.broker
      .bind({ principal: 'alice', scopes: [alpha, beta], authorization: h.policy })
      .orThrow();
    backpressure(
      await writer.changeScopes({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        add: [beta]
      }),
      'audience-links'
    );
    const both = h.broker
      .bind({
        principal: 'alice',
        scopes: [alpha, beta],
        creationScopes: [alpha, beta],
        authorization: h.policy
      })
      .orThrow();
    backpressure(
      await both.createTracked({ taskId: tid('u'), operationId: op(), title: 'u' }),
      'audience-links'
    );
  });

  test('a move that adds no update audience is still refused when it would cover the task with too many potential subscribers', async () => {
    // None of these subscriptions take 'relationship', so the change-scopes update itself is owed
    // to nobody; only the *potential* coverage — everyone whose selection now matches — is over max.
    const h = await deliveryHarness({ profile: lean });
    const mandatoryOnly = { categories: ['attention', 'lifecycle', 'result'] as const };
    await subscribed(h, 's1', mandatoryOnly);
    await subscribed(h, 's2', mandatoryOnly);
    await subscribed(h, 'b1', { scopes: [beta], ...mandatoryOnly });
    await track(h.writer, 't');
    const writer = h.broker
      .bind({ principal: 'alice', scopes: [alpha, beta], authorization: h.policy })
      .orThrow();
    backpressure(
      await writer.changeScopes({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't'),
        add: [beta]
      }),
      'audience-links'
    );
  });
});

describe('a subscription history is a lifetime charge', () => {
  test('grows with acknowledgements, independently of how many tasks are open or archived, and survives reopen', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    for (let i = 0; i < 5; i++) {
      await track(h.writer, `t${i}`);
      await succeedTask(h, h.writer, `t${i}`);
      (await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).orThrow();
    }
    expect(consumerEntry(h.repository, 'sub').used).toBe(15);
    // A task no subscription was ever owed anything about can be archived; the history does not move.
    const outside = h.broker.bind({ principal: 'alice', scopes: [beta], authorization: h.policy }).orThrow();
    await track(outside, 'x');
    await succeedTask(h, outside, 'x');
    (await outside.archive({ taskId: tid('x'), operationId: op(), expectedRevision: rev(2) })).orThrow();
    expect(consumerEntry(h.repository, 'sub').used).toBe(15);
    const later = await reopen(h);
    expect(consumerEntry(later.repository, 'sub').used).toBe(15);
    expect(dimension(later.repository, 'acknowledgement-ids').used).toBe(15);
  });

  test('the per-subscription history limit refuses new obligations, never an acknowledgement', async () => {
    // Room for the history of: a task's two future links on each category the subscription takes
    // ... it is easiest stated by measuring.
    const probe = await deliveryHarness();
    await subscribed(probe, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    await track(probe.writer, 'a');
    const commitment = inspectRepository(probe.repository)!.ledger.entry('consumer:sub')!.perOwner!.amount;
    const h = await deliveryHarness({
      profile: profileWith(
        {},
        {
          perOwner: {
            ...defaultTaskCapacityProfile.perOwner,
            maxAcknowledgementIdsPerSubscription: commitment
          }
        }
      )
    });
    await subscribed(h, 'sub', { categories: ['attention', 'lifecycle', 'result'] });
    await track(h.writer, 'a');
    // A second task would be two more future terminal links for this subscription: refused.
    backpressure(
      await h.writer.createTracked({ taskId: tid('b'), operationId: op(), title: 'b' }),
      'acknowledgement-ids'
    );
    // Acknowledgement never grows the commitment.
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.acknowledge((await delivery.prepare()).orThrow().context.receipt)).toSucceed();
    expect((await succeedTask(h, h.writer, 'a')).result.state).toBe('applied');
  });

  test('a start-current registration whose own baseline and open units already exceed the limit is refused at activation', async () => {
    const probe = await deliveryHarness();
    await track(probe.writer, 'a');
    await subscribed(probe, 'sub', { start: 'current', categories: ['attention', 'lifecycle', 'result'] });
    const commitment = inspectRepository(probe.repository)!.ledger.entry('consumer:sub')!.perOwner!.amount;
    const h = await deliveryHarness({
      profile: profileWith(
        {},
        {
          perOwner: {
            ...defaultTaskCapacityProfile.perOwner,
            maxAcknowledgementIdsPerSubscription: commitment - 1
          }
        }
      )
    });
    await track(h.writer, 'a');
    backpressure(
      await subscribeAs(h, 'sub', { start: 'current', categories: ['attention', 'lifecycle', 'result'] }),
      'acknowledgement-ids'
    );
    expect(h.repository.subscription('sub' as SubscriptionId)).toSucceedWith(undefined);
  });
});
