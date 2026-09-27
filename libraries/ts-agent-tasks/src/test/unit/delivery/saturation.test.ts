/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityClaim,
  ITaskCommitRecord,
  ITaskUpdate,
  TaskResult,
  allCapacityDimensions,
  defaultTaskCapacityProfile,
  maximumUpdateBytes
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { encodeRecord } from '../../../packlets/storage/layout';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import { tid } from '../../helpers/brokerFixtures';
import { registration, sessionRepository } from '../../helpers/storageFixtures';
import {
  IWorld,
  Totals,
  committed,
  deltaOf,
  deliveryIn,
  drainBudget,
  journey,
  owedIds,
  populateBase,
  populatedWorld,
  emptyWorld,
  probeFor,
  reopenWorld,
  runJourney,
  saturatedWorld,
  subscribeLate,
  totalsOf,
  workTotalsOf
} from '../../helpers/saturationFixtures';

/**
 * A3's saturation journeys (implementation plan § T8): for every § 8.6 dimension, a small finite
 * profile brings ordinary admission to its ceiling; new growth is refused; and the accepted work —
 * the largest task, an uncertain command, every owed update — still completes, is drained, pruned,
 * archived and closed, and reopens to exactly what was left. Every transfer is asserted exactly.
 */

const index = (name: string): number => journey.findIndex((s) => s.name === name);

/** Transient dimensions (design § 8.6): what cleanup and archive release. */
const transient: ReadonlySet<CapacityDimension> = new Set<CapacityDimension>([
  'non-archived-tasks',
  'updates',
  'audience-links',
  'record-bytes',
  'logical-bytes',
  'resident-payload-bytes'
]);

/** Every dimension but the per-record one, which is not a repository-wide total. */
const totalled: ReadonlyArray<CapacityDimension> = allCapacityDimensions.filter((d) => d !== 'record-bytes');

async function recordOf(w: IWorld, id: string): Promise<ITaskCommitRecord> {
  return (await w.repository.readCommit(tid(id))).orThrow()!;
}

function claimsOf(record: ITaskCommitRecord, purpose: ITaskCapacityClaim['purpose']): ITaskCapacityClaim[] {
  return record.capacityClaims.filter((c) => c.purpose === purpose);
}

function chargeOf(claim: ITaskCapacityClaim, dimension: CapacityDimension): number {
  return claim.charges.find((c) => c.dimension === dimension)?.amount ?? 0;
}

function netChange(before: Totals, after: Totals, dimension: CapacityDimension): number {
  return committed(after, dimension) - committed(before, dimension);
}

function updatesOf(record: ITaskCommitRecord): ReadonlyArray<ITaskUpdate> {
  return record.recordType === 'resolved' ? record.updates : [];
}

/** The per-step transfers of the whole journey in one world. */
async function journeyDeltas(w: IWorld): Promise<Array<ReturnType<typeof deltaOf>>> {
  const out: Array<ReturnType<typeof deltaOf>> = [];
  for (const step of journey) {
    const before: Totals = totalsOf(w.repository);
    expect(await step.run(w)).toSucceed();
    // The record-bytes row names the most limiting single record, which depends on each record kind's
    // own ceiling; it is not a total, so it is compared only within one world.
    const moved = deltaOf(before, totalsOf(w.repository));
    delete moved['record-bytes'];
    out.push(moved);
  }
  return out;
}

describe('A3 saturation journeys, every § 8.6 dimension', () => {
  let saturationPoint: Totals;
  let reference: Array<ReturnType<typeof deltaOf>>;
  let referenceEnd: Totals;
  let saturationWork: Totals;
  let referenceEndWork: Totals;

  beforeAll(async () => {
    const w: IWorld = await populatedWorld();
    saturationPoint = totalsOf(w.repository);
    saturationWork = workTotalsOf(w.repository);
    reference = await journeyDeltas(w);
    referenceEnd = totalsOf(w.repository);
    referenceEndWork = workTotalsOf(w.repository);
  });

  test.each(allCapacityDimensions)(
    '%s: growth is refused at the ceiling; accepted work completes, drains, archives, closes and reopens exactly',
    async (dimension) => {
      const w: IWorld = await saturatedWorld(dimension, saturationPoint);
      const at: Totals = totalsOf(w.repository);
      // The saturated world is the reference world: only the limit — and so the manifest — moved.
      expect(workTotalsOf(w.repository)).toEqual(saturationWork);
      const row = w.repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === dimension)!;
      // Full: nothing left, or — for logical-bytes — only the widest-state margin the protocol needs.
      expect(row.available).toBe(
        row.limit - (dimension === 'record-bytes' ? row.limit : committed(at, dimension))
      );
      expect(w.repository.capacityStatus().orThrow().state).not.toBe('ok');

      // 1. New growth is refused, naming this dimension, before anything is written.
      w.faulty.clearWrites();
      const refused: TaskResult<unknown> = await probeFor[dimension](w);
      expect(refused).toFailWithDetail(
        /capacity/i,
        expect.objectContaining({
          code: 'backpressure',
          capacity: expect.objectContaining({ reason: 'capacity-exhausted', dimension })
        })
      );
      expect(totalsOf(w.repository)).toEqual(at);

      // 2–5. The journey runs at the ceiling, and every step transfers exactly what it transfers in a
      // repository with room: saturation changes nothing about what completing accepted work costs.
      expect(await journeyDeltas(w)).toEqual(reference);
      const end: Totals = totalsOf(w.repository);
      expect(workTotalsOf(w.repository)).toEqual(referenceEndWork);

      // Reopen: the ledger rebuilt from disk is exactly the one the journey left.
      const reopened: IWorld = await reopenWorld(w);
      expect(totalsOf(reopened.repository)).toEqual(end);
    }
  );

  test('transient capacity comes back; identity, acknowledgement history, dedup evidence, subscriptions and sources never shrink', () => {
    for (const dimension of totalled) {
      const before: number = saturationPoint[dimension].used;
      const after: number = referenceEnd[dimension].used;
      if (transient.has(dimension)) {
        // Every non-archived slot, update, link and payload byte the population held is released.
        if (dimension !== 'logical-bytes') {
          expect({ dimension, after }).toEqual({ dimension, after: 0 });
        }
      } else {
        expect({ dimension, shrank: after < before }).toEqual({ dimension, shrank: false });
      }
      // Nothing is left reserved once every accepted task is archived and every subscription closed.
      expect({ dimension, reserved: referenceEnd[dimension].reserved }).toEqual({ dimension, reserved: 0 });
    }
    // What stays is exactly the lifetime record: two identities, two subscriptions, one source,
    // fourteen exact acknowledgement/disposition ids and six operations of dedup evidence.
    expect({
      retained: referenceEnd['retained-tasks'].used,
      subscriptions: referenceEnd.subscriptions.used,
      sources: referenceEnd.sources.used,
      history: referenceEnd['acknowledgement-ids'].used,
      operations: referenceEnd.operations.used
    }).toEqual({ retained: 2, subscriptions: 2, sources: 1, history: 14, operations: 6 });
    // Logical bytes keep what lifetime records occupy — the tombstones, the histories, the source
    // cursor and the manifest — and nothing more.
    expect(referenceEnd['logical-bytes'].used).toBeLessThan(saturationPoint['logical-bytes'].used);
  });

  test.each(allCapacityDimensions)(
    "%s: the refusal's reclaimableByCleanup says whether the drain releases any of it",
    async (dimension) => {
      const w: IWorld = await saturatedWorld(dimension, saturationPoint);
      const refused: TaskResult<unknown> = await probeFor[dimension](w);
      const flag: boolean = refused.isFailure() && refused.detail?.capacity?.reclaimableByCleanup === true;
      await runJourney(w);
      const released: boolean =
        dimension === 'record-bytes'
          ? // Per record: the drain empties the limiting record's reservation.
            totalsOf(w.repository)['record-bytes'].reserved < saturationPoint['record-bytes'].reserved
          : committed(totalsOf(w.repository), dimension) < committed(saturationPoint, dimension);
      expect({ dimension, flag }).toEqual({ dimension, flag: released });
    }
  );

  test.each([
    'non-archived-tasks',
    'updates',
    'audience-links',
    'resident-payload-bytes',
    'logical-bytes'
  ] as const)(
    '%s: the growth refused at the ceiling is admitted once the drain has run',
    async (dimension) => {
      const w: IWorld = await saturatedWorld(dimension, saturationPoint);
      expect(await probeFor[dimension](w)).toFail();
      await runJourney(w);
      expect(await probeFor[dimension](w)).toSucceed();
    }
  );

  test.each(['retained-tasks', 'subscriptions', 'sources'] as const)(
    '%s: the growth refused at the ceiling is still refused after the drain — a lifetime ceiling',
    async (dimension) => {
      const w: IWorld = await saturatedWorld(dimension, saturationPoint);
      await runJourney(w);
      expect(await probeFor[dimension](w)).toFailWithDetail(
        /capacity/i,
        expect.objectContaining({
          capacity: expect.objectContaining({ dimension, reclaimableByCleanup: false })
        })
      );
    }
  );
});

describe('exact transfers, checked against the records’ own claims', () => {
  let w: IWorld;

  beforeEach(async () => {
    w = await populatedWorld();
  });

  test('completing the largest task spends its closeout claim: no repository-wide total moves', async () => {
    const closeout = claimsOf(await recordOf(w, 't'), 'terminal-closeout')[0];
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('complete the largest task')].run(w)).toSucceed();
    const after: Totals = totalsOf(w.repository);
    for (const dimension of totalled) {
      expect({ dimension, net: netChange(before, after, dimension) }).toEqual({ dimension, net: 0 });
    }
    // The claim paid exactly the growth the ledger now counts as used.
    const spent = claimsOf(await recordOf(w, 't'), 'terminal-closeout')[0];
    for (const dimension of ['updates', 'audience-links', 'resident-payload-bytes'] as const) {
      expect(chargeOf(closeout, dimension) - chargeOf(spent, dimension)).toBe(
        after[dimension].used - before[dimension].used
      );
    }
  });

  test('settling the uncertain command releases exactly the settlement claim’s unspent remainder', async () => {
    await runJourney(w, 0, index('settle the uncertain command'));
    const before: Totals = totalsOf(w.repository);
    const held = claimsOf(await recordOf(w, 'j'), 'accepted-operation-settlement');
    expect(held.map((c) => c.disposition)).toEqual(['reserved']);
    expect(await journey[index('settle the uncertain command')].run(w)).toSucceed();
    const settled = claimsOf(await recordOf(w, 'j'), 'accepted-operation-settlement');
    expect(settled.map((c) => c.disposition)).toEqual(['consumed']);
    const after: Totals = totalsOf(w.repository);
    for (const dimension of [
      'updates',
      'audience-links',
      'acknowledgement-ids',
      'resident-payload-bytes'
    ] as const) {
      expect({ dimension, net: netChange(before, after, dimension) }).toEqual({
        dimension,
        net: 0 - chargeOf(settled[0], dimension)
      });
    }
  });

  test('acknowledged-but-unpruned: acknowledgement moves ids from reserved to used and releases no payload', async () => {
    await runJourney(w, 0, index('acknowledge every update owed to watcher'));
    const owed: number = (await owedIds(deliveryIn(w, 'watcher'))).length;
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('acknowledge every update owed to watcher')].run(w)).toSucceed();
    const after: Totals = totalsOf(w.repository);
    expect(after['acknowledgement-ids'].used - before['acknowledgement-ids'].used).toBe(owed);
    expect(after['acknowledgement-ids'].reserved - before['acknowledgement-ids'].reserved).toBe(-owed);
    // The payloads stay charged: they leave only when a prune proves every audience discharged them.
    for (const dimension of ['updates', 'audience-links', 'resident-payload-bytes'] as const) {
      expect({ dimension, after: after[dimension] }).toEqual({ dimension, after: before[dimension] });
    }
    // And that state survives a reopen exactly.
    expect(totalsOf((await reopenWorld(w)).repository)).toEqual(after);
  });

  test('disposing a subscription’s baselines releases their payload with the obligation', async () => {
    await runJourney(w, 0, index('dispose every update owed to late'));
    const owed: number = (await owedIds(deliveryIn(w, 'late'))).length;
    const lateEntry = inspectRepository(w.repository)!.ledger.entry('consumer:late')!;
    const baselines: number = lateEntry.used.updates;
    expect(baselines).toBeGreaterThan(0);
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('dispose every update owed to late')].run(w)).toSucceed();
    const after: Totals = totalsOf(w.repository);
    expect(after['acknowledgement-ids'].used - before['acknowledgement-ids'].used).toBe(owed);
    expect(netChange(before, after, 'acknowledgement-ids')).toBe(0);
    expect(after.updates.used - before.updates.used).toBe(-baselines);
    expect(after['resident-payload-bytes'].used - before['resident-payload-bytes'].used).toBe(
      -lateEntry.used['resident-payload-bytes']
    );
  });

  test('a prune releases exactly the encoded bytes, payloads and links of the updates it removes', async () => {
    await runJourney(w, 0, index('prune'));
    const records = { t: await recordOf(w, 't'), j: await recordOf(w, 'j') };
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('prune')].run(w)).toSucceed();
    const after: Totals = totalsOf(w.repository);
    let bytes: number = 0;
    let count: number = 0;
    let links: number = 0;
    for (const id of ['t', 'j'] as const) {
      const kept = new Set(updatesOf(await recordOf(w, id)).map((u) => u.id));
      for (const update of updatesOf(records[id]).filter((u) => !kept.has(u.id))) {
        bytes += encodeRecord(update).orThrow().bytes;
        count += 1;
        links += update.audience.length;
      }
    }
    expect(count).toBeGreaterThan(0);
    expect(after['resident-payload-bytes'].used - before['resident-payload-bytes'].used).toBe(-bytes);
    expect(after.updates.used - before.updates.used).toBe(-count);
    expect(after['audience-links'].used - before['audience-links'].used).toBe(-links);
    // Pruning ends no obligation: the exact history is exactly where it was.
    expect(after['acknowledgement-ids']).toEqual(before['acknowledgement-ids']);
  });

  test.each(['t', 'j'])(
    'archiving %s releases its non-archived slot and exactly what its closeout left unspent',
    async (id) => {
      await runJourney(w, 0, index(`archive ${id}`));
      const before: Totals = totalsOf(w.repository);
      expect(await journey[index(`archive ${id}`)].run(w)).toSucceed();
      const after: Totals = totalsOf(w.repository);
      const closeout = claimsOf(await recordOf(w, id), 'terminal-closeout')[0];
      expect(closeout.disposition).toBe('consumed');
      expect(netChange(before, after, 'non-archived-tasks')).toBe(-1);
      for (const dimension of [
        'updates',
        'audience-links',
        'acknowledgement-ids',
        'operations',
        'resident-payload-bytes',
        'logical-bytes'
      ] as const) {
        expect({ dimension, net: netChange(before, after, dimension) }).toEqual({
          dimension,
          net: 0 - chargeOf(closeout, dimension)
        });
      }
    }
  );

  test('closing a subscription releases its receipt-preparation claim, and keeps its identity and history', async () => {
    await runJourney(w, 0, index('close late, retaining'));
    const before: Totals = totalsOf(w.repository);
    expect(await journey[index('close late, retaining')].run(w)).toSucceed();
    const after: Totals = totalsOf(w.repository);
    expect(after['logical-bytes'].reserved - before['logical-bytes'].reserved).toBe(
      -defaultTaskCapacityProfile.encoded.maxIssuedReceiptBytes
    );
    expect(after.subscriptions).toEqual(before.subscriptions);
    expect(after['acknowledgement-ids']).toEqual(before['acknowledgement-ids']);
  });
});

describe('every crash point of the journey: the ledger rebuilt from disk is the one in memory, and a retry converges', () => {
  /**
   * The world after the journey's first `step` steps, with writes counted from here.
   */
  async function before(step: number): Promise<IWorld> {
    const w: IWorld = await populatedWorld();
    await runJourney(w, 0, step);
    w.faulty.clearWrites();
    return w;
  }

  const cases: Array<[string, number]> = journey.map((s, i) => [s.name, i]);

  test.each(cases)('%s', async (name, step) => {
    // The uncrashed step: how many atomic writes it makes, and where it leaves the ledger.
    const clean: IWorld = await before(step);
    expect(await journey[step].run(clean)).toSucceed();
    const writes: number = clean.faulty.writes.length;
    const post: Totals = totalsOf(clean.repository);
    expect(writes).toBeGreaterThan(0);

    for (let landed = 0; landed < writes; landed++) {
      const w: IWorld = await before(step);
      // Writes 1..landed reach disk; write landed+1 fails having changed nothing — the process stops
      // there. The in-memory ledger is what this instance believed; the reopened one is what is true.
      w.faulty.faults.push({ name: /.*/, when: 'before', visibility: 'unchanged', skip: landed });
      await journey[step].run(w);
      const believed: Totals = totalsOf(w.repository);
      const reopened: IWorld = await reopenWorld(w);
      // Every step here is a single-record replacement per write, so what open rebuilds is exactly what
      // the stopped instance believed: nothing released that is still owed, nothing charged twice.
      expect({ name, landed, totals: totalsOf(reopened.repository) }).toEqual({
        name,
        landed,
        totals: believed
      });
      // The retry completes the step from wherever it stopped.
      expect(await journey[step].run(reopened)).toSucceed();
      // A receipt issued before the stop is held by no process now: the only way back to the uncrashed
      // result is to abandon it, and it is found in the subscription's record, never guessed.
      const orphans: number = await abandonOrphans(reopened);
      expect({ name, landed, orphans: orphans > 0 }).toEqual({
        name,
        landed,
        orphans: name === 'acknowledge every update owed to watcher' && landed % 2 === 1
      });
      expect({ name, landed, totals: totalsOf(reopened.repository) }).toEqual({ name, landed, totals: post });
    }
  });

  test('pending subscription activation: every crash point reopens pending or activated, never between, and a retry activates it exactly', async () => {
    const clean: IWorld = await populateBase(await emptyWorld());
    const pre: Totals = totalsOf(clean.repository);
    clean.faulty.clearWrites();
    expect(await subscribeLate(clean)).toSucceed();
    // A pending entry, the consumer record with its baselines, the live entry.
    expect(clean.faulty.writes).toEqual(['repository.json', 'consumer-late.json', 'repository.json']);
    const post: Totals = totalsOf(clean.repository);
    const reopenedAt: Totals[] = [];
    for (let landed = 0; landed < clean.faulty.writes.length; landed++) {
      const w: IWorld = await populateBase(await emptyWorld());
      w.faulty.faults.push({ name: /.*/, when: 'before', visibility: 'unchanged', skip: landed });
      expect(await subscribeLate(w)).toFail();
      const believed: Totals = totalsOf(w.repository);
      const reopened: IWorld = await reopenWorld(w);
      const found: Totals = totalsOf(reopened.repository);
      reopenedAt.push(found);
      // Either exactly what the stopped instance believed, or — once the consumer record with its
      // baselines is durable — exactly the activated subscription, which open completes.
      expect([believed, post]).toContainEqual(found);
      expect(await subscribeLate(reopened)).toSucceed();
      expect({ landed, totals: totalsOf(reopened.repository) }).toEqual({ landed, totals: post });
    }
    // Before the pending entry: nothing. Pending entry only: the activation's reservations are held,
    // so no other admission can take the room its baselines need. With the consumer record: activated.
    expect(reopenedAt[0]).toEqual(pre);
    expect(reopenedAt[2]).toEqual(post);
    expect(committed(reopenedAt[1], 'resident-payload-bytes')).toBe(
      committed(post, 'resident-payload-bytes')
    );
    expect(committed(reopenedAt[1], 'audience-links')).toBe(committed(post, 'audience-links'));
  });
});

/** Abandons every unacknowledged receipt the journey's subscriptions still hold, returning how many. */
async function abandonOrphans(w: IWorld): Promise<number> {
  let count: number = 0;
  for (const id of ['watcher', 'late'] as const) {
    const record = (
      await w.repository.withWriter((writer) => writer.readSubscription(id as never))
    ).orThrow()!;
    for (const issued of record.issued.filter((i) => !i.acknowledged)) {
      expect(await deliveryIn(w, id).abandon(issued.deliveryId)).toSucceed();
      count += 1;
    }
  }
  return count;
}

describe('delivery at the default context budget', () => {
  test('an older revision of the largest task never fits beside its current one; it stays owed, never lost, until a larger budget or a disposal', async () => {
    const w: IWorld = await populatedWorld();
    await runJourney(w, 0, index('acknowledge every update owed to watcher'));
    const delivery = deliveryIn(w, 'watcher');
    for (let round = 0; round < 3; round++) {
      const prepared = (await delivery.prepare()).orThrow();
      (await delivery.acknowledge(prepared.context.receipt)).orThrow();
    }
    expect(await owedIds(delivery)).toEqual(['t:1:0']);
    const prepared = (await delivery.prepare(drainBudget)).orThrow();
    expect((await delivery.acknowledge(prepared.context.receipt)).orThrow().newlyAcknowledged).toEqual([
      't:1:0'
    ]);
    expect(await owedIds(delivery)).toEqual([]);
  });
});

describe('the default profile (T8)', () => {
  test('plain registrations reach 536 and are refused by logical-bytes; resident payload is no longer the first to fill', async () => {
    const { repository } = await sessionRepository(defaultTaskCapacityProfile);
    let admitted: number = 0;
    let refused: TaskResult<unknown> | undefined;
    while (refused === undefined && admitted < 2000) {
      const outcome = await repository.withWriter((w) => w.register(registration(`r${admitted}`)));
      if (outcome.isFailure()) {
        refused = outcome;
      } else {
        admitted += 1;
      }
    }
    expect(admitted).toBe(536);
    expect(refused).toFailWithDetail(
      /'logical-bytes'/,
      expect.objectContaining({
        code: 'backpressure',
        capacity: expect.objectContaining({ dimension: 'logical-bytes', reclaimableByCleanup: true })
      })
    );
    const status = repository.capacityStatus().orThrow();
    const left = (dimension: CapacityDimension): number =>
      status.dimensions.find((d) => d.dimension === dimension)!.available;
    // Every other dimension still has room for at least one more registration's reservation.
    expect(left('resident-payload-bytes')).toBeGreaterThan(
      7 * maximumUpdateBytes(defaultTaskCapacityProfile).orThrow()
    );
    expect(left('non-archived-tasks')).toBe(1000 - 536);
    expect(left('audience-links')).toBeGreaterThan(224);
  });

  test("a consumer record's ceiling is the raised 32 MiB bound; a task record's stays 8 MiB", async () => {
    const w: IWorld = await populatedWorld();
    const ledger = inspectRepository(w.repository)!.ledger;
    expect(ledger.entry('consumer:watcher')!.recordLimit).toBe(32 * 1024 * 1024);
    expect(ledger.entry('task:t')!.recordLimit).toBe(8 * 1024 * 1024);
  });
});

describe('the fixture', () => {
  test('a reopened world still writes through its fault injector, so a second crash is a real one', async () => {
    const w: IWorld = await reopenWorld(await populatedWorld());
    w.faulty.clearWrites();
    w.faulty.faults.push({ name: /.*/, when: 'before', visibility: 'unchanged' });
    expect(await journey[index('complete the largest task')].run(w)).toFail();
    expect(w.faulty.writes).toEqual(['task-t.json']);
  });
});
