/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  Instant,
  DeliveryId,
  IBoundTaskDelivery,
  IPreparedTaskContext,
  ITaskInclusionReceipt,
  SubscriptionId,
  TaskContextRenderer,
  TaskId,
  TaskRevision,
  UpdateId,
  baselineUpdateId,
  taskUpdateId
} from '../../../index';
import { alpha, command, op, revisionOf, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import { at } from '../../helpers/storageFixtures';
import {
  IDeliveryHarness,
  committedIn,
  consumerRecord,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  reopen,
  subscribed
} from '../../helpers/deliveryFixtures';

const uid = (task: string, revision: number, category: Parameters<typeof taskUpdateId>[2]): UpdateId =>
  taskUpdateId(task as TaskId, revision as TaskRevision, category);

/** Raises attention on a task (a required `attention` update) and returns the new revision. */
async function raiseAttention(h: IDeliveryHarness, id: string, description?: string): Promise<number> {
  const expectedRevision = await revisionOf(h.repository, id);
  (
    await h.writer.updateTracked({
      taskId: tid(id),
      operationId: op(),
      expectedRevision,
      patch: {
        attention: [{ namespace: 'review', key: `r-${id}` }],
        ...(description !== undefined ? { description } : {})
      }
    })
  ).orThrow();
  return revisionOf(h.repository, id);
}

async function progress(h: IDeliveryHarness, id: string, completed: number): Promise<void> {
  await command(h, h.writer, id, 'set-progress', { progress: { completed } });
}

async function prepared(delivery: IBoundTaskDelivery, maxChars?: number): Promise<IPreparedTaskContext> {
  return (
    await delivery.prepare(maxChars !== undefined ? { maxItems: 20, maxDepth: 3, maxChars } : undefined)
  ).orThrow();
}

describe('exact-ID acknowledgement: the falsifier', () => {
  // The plan's gate, written before the acknowledgement path was finished: an omitted revision-3
  // attention change and an included revision-4 progress change. A revision watermark acknowledges
  // "everything up to 4" and clears revision 3; exact-ID acknowledgement must not.
  test('a receipt that omits revision-3 attention and includes revision-4 progress does not clear revision 3', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    // Revision 2 raises attention and carries a long description; revision 3 reports progress and
    // clears the description, so its own presentation is short.
    expect(await raiseAttention(h, 't', 'x'.repeat(3000))).toBe(2);
    (
      await h.writer.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: 2 as TaskRevision,
        patch: { progress: { completed: 1 }, clear: ['description'] }
      })
    ).orThrow();
    const owedBefore = await pendingIds(delivery);
    const attention = uid('t', 2, 'attention');
    const progressId = uid('t', 3, 'progress');
    expect(owedBefore).toEqual(expect.arrayContaining([attention, progressId]));

    // A budget in which revision 2's long payload cannot be delivered whole, while revision 3's can:
    // the renderer abbreviates revision 2 and receipts none of its update ids.
    const context = await prepared(delivery, 1500);
    const receipt: ITaskInclusionReceipt = context.context.receipt;
    const included: UpdateId[] = receipt.included.flatMap((e) => e.updateIds);
    expect(included).toContain(progressId);
    expect(included).not.toContain(attention);
    expect(receipt.included.map((e) => e.revision)).toContain(3);

    const ack = (await delivery.acknowledge(receipt)).orThrow();
    expect(ack.newlyAcknowledged).toEqual(included);
    // Revision 2's attention is still owed, although a later revision was acknowledged.
    expect(await pendingIds(delivery)).toContain(attention);
    expect(await pendingIds(delivery)).not.toContain(progressId);
    const record = await consumerRecord(h.repository, 'sub');
    expect(record.acknowledged).not.toContain(attention);
    // The history is the exact ids, nothing else: there is no revision field anywhere to watermark.
    expect(Object.keys(record).sort()).toEqual([
      'acknowledged',
      'baseline',
      'capacityClaims',
      'consumerId',
      'createdAt',
      'disposed',
      'formatVersion',
      'id',
      'issued',
      'policy',
      'recordRevision',
      'registration',
      'selection',
      'start',
      'state'
    ]);
  });

  test('an old receipt cannot consume an obligation committed after it was issued', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    const old = await prepared(delivery);
    // A newer revision lands while the host is processing the old context.
    await succeedTask(h, h.writer, 't');
    const ack = (await delivery.acknowledge(old.context.receipt)).orThrow();
    expect(ack.newlyAcknowledged).toEqual([uid('t', 1, 'lifecycle')]);
    expect(await pendingIds(delivery)).toEqual([uid('t', 2, 'lifecycle'), uid('t', 2, 'result')]);
  });

  test('acknowledging a newer receipt leaves an older unacknowledged receipt for exactly its own ids', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 'a');
    const first = await prepared(delivery);
    await track(h.writer, 'b');
    const second = await prepared(delivery);
    expect((await delivery.acknowledge(second.context.receipt)).orThrow().newlyAcknowledged).toEqual([
      uid('a', 1, 'lifecycle'),
      uid('b', 1, 'lifecycle')
    ]);
    // The older receipt's one id is already acknowledged: a replay of history, never a new slot.
    const replay = (await delivery.acknowledge(first.context.receipt)).orThrow();
    expect(replay.newlyAcknowledged).toEqual([]);
    expect(replay.alreadyAcknowledged).toEqual([uid('a', 1, 'lifecycle')]);
  });
});

describe('adversarial receipts', () => {
  let h: IDeliveryHarness;
  let delivery: IBoundTaskDelivery;
  let issued: IPreparedTaskContext;
  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 'sub');
    await subscribed(h, 'other');
    delivery = deliveryOf(h, 'sub');
    await track(h.writer, 'a');
    await track(h.writer, 'b');
    await raiseAttention(h, 'b');
    issued = await prepared(delivery);
  });

  async function refused(receipt: unknown): Promise<void> {
    const before = await consumerRecord(h.repository, 'sub');
    expect(await delivery.acknowledge(receipt)).toFailWithDetail(
      /not a receipt this delivery issued/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    // Nothing moved.
    expect(await consumerRecord(h.repository, 'sub')).toEqual(before);
  }

  test('the genuine receipt acknowledges exactly what it included', async () => {
    const ids: UpdateId[] = issued.context.receipt.included.flatMap((e) => e.updateIds);
    expect(ids).toEqual([uid('a', 1, 'lifecycle'), uid('b', 1, 'lifecycle'), uid('b', 2, 'attention')]);
    expect((await delivery.acknowledge(issued.context.receipt)).orThrow().newlyAcknowledged).toEqual(ids);
    expect(await pendingIds(delivery)).toEqual([]);
  });

  test('a fabricated delivery id matches nothing', async () => {
    await refused({ ...issued.context.receipt, deliveryId: 'fabricated' });
  });

  test('a modified task, revision or update list matches nothing', async () => {
    const r = issued.context.receipt;
    const [first, ...rest] = r.included;
    await refused({ ...r, included: [{ ...first, taskId: 'z' }, ...rest] });
    await refused({ ...r, included: [first, { ...rest[0], revision: 9 }, rest[1]] });
    await refused({
      ...r,
      included: [first, rest[0], { ...rest[1], updateIds: [uid('b', 2, 'progress')] }]
    });
  });

  test('a shortened receipt matches nothing — and cannot consume what it dropped', async () => {
    const r = issued.context.receipt;
    await refused({ ...r, included: r.included.slice(0, 1) });
    await refused({ ...r, included: [{ ...r.included[0], updateIds: [] }, ...r.included.slice(1)] });
  });

  test('an enlarged receipt matches nothing', async () => {
    const r = issued.context.receipt;
    await refused({
      ...r,
      included: [...r.included, { taskId: 'c', revision: 1, updateIds: [uid('c', 1, 'lifecycle')] }]
    });
  });

  test('duplicate entries do not even convert', async () => {
    const r = issued.context.receipt;
    await refused({ ...r, included: [r.included[0], r.included[0], ...r.included.slice(1)] });
    await refused({
      ...r,
      included: [{ ...r.included[0], updateIds: [...r.included[0].updateIds, ...r.included[0].updateIds] }]
    });
  });

  test("another subscription's receipt, presented here, matches nothing", async () => {
    const theirs = await prepared(deliveryOf(h, 'other'));
    await refused(theirs.context.receipt);
    // And the other way round: ours, presented to theirs.
    expect(await deliveryOf(h, 'other').acknowledge(issued.context.receipt)).toFailWithDetail(
      /not a receipt/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
  });

  test("another store's receipt — a different repository's issuance — matches nothing", async () => {
    const elsewhere = await deliveryHarness();
    await subscribed(elsewhere, 'sub');
    await track(elsewhere.writer, 'a');
    const foreign = await prepared(deliveryOf(elsewhere, 'sub'));
    await refused(foreign.context.receipt);
  });

  test('a snapshot-only receipt — no delivery id — is not an issued receipt', async () => {
    const { deliveryId, ...snapshotOnly } = issued.context.receipt;
    expect(deliveryId).toBeDefined();
    await refused(snapshotOnly);
    // Nor is a pure render's receipt, echoing a delivery id nobody issued.
    const renderer = TaskContextRenderer.create().orThrow();
    const updates = (await delivery.pending({ limit: 200 })).orThrow().updates;
    const pure = renderer
      .render({ tasks: [], updates, deliveryId: 'self-made' as DeliveryId, completeness: 'complete' })
      .orThrow();
    await refused(pure.receipt);
  });

  test('a malformed receipt is refused the same way', async () => {
    await refused(undefined);
    await refused('receipt');
    await refused({ ...issued.context.receipt, version: 2 });
    await refused({ ...issued.context.receipt, extra: true });
  });

  test('a copied valid receipt is a replay: already acknowledged, no second slot', async () => {
    (await delivery.acknowledge(issued.context.receipt)).orThrow();
    const used = committedIn(h.repository, 'acknowledgement-ids');
    const copy = JSON.parse(JSON.stringify(issued.context.receipt));
    const replay = (await delivery.acknowledge(copy)).orThrow();
    expect(replay.newlyAcknowledged).toEqual([]);
    expect(replay.alreadyAcknowledged).toHaveLength(3);
    expect(committedIn(h.repository, 'acknowledgement-ids')).toBe(used);
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(3);
  });

  test('replay after expiry is refused and changes no checkpoint; still-owed work can be prepared again', async () => {
    h.clock.advance(24 * 60 * 60 * 1000);
    const before = await consumerRecord(h.repository, 'sub');
    expect(await delivery.acknowledge(issued.context.receipt)).toFailWithDetail(
      /expired/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await consumerRecord(h.repository, 'sub')).toEqual(before);
    const again = await prepared(delivery);
    expect(again.context.receipt.included.flatMap((e) => e.updateIds)).toHaveLength(3);
  });

  test('replay after acknowledgement and then expiry is refused, and the history stays', async () => {
    (await delivery.acknowledge(issued.context.receipt)).orThrow();
    h.clock.advance(24 * 60 * 60 * 1000 + 1);
    expect(await delivery.acknowledge(issued.context.receipt)).toFailWithDetail(
      /expired/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(3);
  });

  test('an abandoned receipt is invalid afterwards; its obligations stay owed', async () => {
    const id = issued.deliveryId;
    expect(await delivery.abandon(id)).toSucceedWith(id);
    await refused(issued.context.receipt);
    expect(await pendingIds(delivery)).toHaveLength(3);
    expect(await delivery.abandon(id)).toFailWithDetail(
      /not a receipt/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await delivery.abandon('bad id' as DeliveryId)).toFailWithDetail(
      /not a receipt/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
  });

  test('abandoning after acknowledgement keeps the history and invalidates replay', async () => {
    (await delivery.acknowledge(issued.context.receipt)).orThrow();
    (await delivery.abandon(issued.deliveryId)).orThrow();
    await refused(issued.context.receipt);
    expect((await consumerRecord(h.repository, 'sub')).acknowledged).toHaveLength(3);
  });
});

describe('the host processes before anything is acknowledged', () => {
  test('prepare writes a manifest and acknowledges nothing; the renderer writes nothing', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    const before = await consumerRecord(h.repository, 'sub');
    const context = await prepared(delivery);
    const after = await consumerRecord(h.repository, 'sub');
    expect(after.acknowledged).toEqual(before.acknowledged);
    expect(after.issued.map((m) => m.deliveryId)).toEqual([context.deliveryId]);
    expect(after.issued[0].acknowledged).toBe(false);
    expect(after.issued[0].receipt).toEqual(context.context.receipt);
    expect(await pendingIds(delivery)).toEqual([uid('t', 1, 'lifecycle')]);
    // The pure renderer, given the same owed updates, writes nothing: no checkpoint, no generation.
    const record = await consumerRecord(h.repository, 'sub');
    const generation = h.repository.health().generation;
    const updates = (await delivery.pending({ limit: 200 })).orThrow().updates;
    const renderer = TaskContextRenderer.create().orThrow();
    expect(
      renderer.render({ tasks: [], updates, deliveryId: context.deliveryId, completeness: 'complete' })
    ).toSucceed();
    expect(await consumerRecord(h.repository, 'sub')).toEqual(record);
    expect(h.repository.health().generation).toBe(generation);
  });

  test('a host/provider abort acknowledges nothing: the receipt is simply never presented', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    await prepared(delivery);
    // ...the model call fails; the host does not acknowledge...
    expect(await pendingIds(delivery)).toEqual([uid('t', 1, 'lifecycle')]);
    const retry = await prepared(delivery);
    expect(retry.context.receipt.included.flatMap((e) => e.updateIds)).toEqual([uid('t', 1, 'lifecycle')]);
  });

  test('a deliberate abstention is acknowledged only when the host policy decides to', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    const context = await prepared(delivery);
    // The model abstained; the host's policy counts a durable abstention as processed.
    const abstentionIsProcessed = true;
    if (abstentionIsProcessed) {
      (await delivery.acknowledge(context.context.receipt)).orThrow();
    }
    expect(await pendingIds(delivery)).toEqual([]);
  });

  test('an update committed during host processing stays owed after the acknowledgement', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    await track(h.writer, 't');
    const context = await prepared(delivery);
    await progress(h, 't', 1);
    (await delivery.acknowledge(context.context.receipt)).orThrow();
    expect(await pendingIds(delivery)).toEqual([uid('t', 2, 'progress')]);
  });
});

describe('baseline obligations', () => {
  test('are receipted and acknowledged by their exact baseline ids', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await subscribed(h, 'sub', { start: 'current' });
    const delivery = deliveryOf(h, 'sub');
    const baseline = baselineUpdateId('t' as TaskId, 1 as TaskRevision);
    expect(await pendingIds(delivery)).toEqual([baseline]);
    const context = await prepared(delivery);
    expect(context.context.receipt.included).toEqual([{ taskId: 't', revision: 1, updateIds: [baseline] }]);
    expect((await delivery.acknowledge(context.context.receipt)).orThrow().newlyAcknowledged).toEqual([
      baseline
    ]);
    expect(await pendingIds(delivery)).toEqual([]);
  });

  test('an acknowledged baseline stays acknowledged across reopen', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await subscribed(h, 'sub', { start: 'current' });
    const delivery = deliveryOf(h, 'sub');
    const context = await prepared(delivery);
    (await delivery.acknowledge(context.context.receipt)).orThrow();
    const again = await reopen(h);
    expect(await pendingIds(deliveryOf(again, 'sub'))).toEqual([]);
    expect((await consumerRecord(again.repository, 'sub')).acknowledged).toEqual([
      baselineUpdateId('t' as TaskId, 1 as TaskRevision)
    ]);
  });

  test("a baseline id for a task outside the subscription's baseline cannot be issued", async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await subscribed(h, 'sub', { start: 'current' });
    await track(h.writer, 'u');
    expect(
      await h.repository.withWriter((w) =>
        w.issueReceipt({
          subscriptionId: 'sub' as SubscriptionId,
          expectedRecordRevision: 1,
          receipt: {
            version: 1,
            deliveryId: 'forged' as DeliveryId,
            included: [
              {
                taskId: 'u' as TaskId,
                revision: 1 as TaskRevision,
                updateIds: [baselineUpdateId('u' as TaskId, 1 as TaskRevision)]
              }
            ]
          } as unknown as ITaskInclusionReceipt,
          issuedAt: at as Instant,
          expiresAt: '2030-01-01T00:00:00.000Z' as Instant
        })
      )
    ).toFailWithDetail(/u:1:initial/i, expect.objectContaining({ code: 'invalid-receipt' }));
  });
});

describe('bound delivery identity', () => {
  test('a foreign consumer cannot bind a subscription, and an unknown one is the same answer', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const bind = (subscriptionId: string, consumerId: string): unknown =>
      h.broker.bindDelivery({
        principal: 'alice',
        scopes: [alpha],
        authorization: h.policy,
        subscriptionId: subscriptionId as SubscriptionId,
        consumerId: consumerId as never
      });
    expect(bind('sub', 'someone-else')).toFailWithDetail(
      /no subscription sub for this consumer/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(bind('nope', 'consumer-sub')).toFailWithDetail(
      /no subscription nope for this consumer/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(bind('bad id!', 'consumer-sub')).toFailWithDetail(
      /subscription/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(bind('sub', 'bad id!')).toFailWithDetail(
      /no subscription sub for this consumer/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
  });
});
