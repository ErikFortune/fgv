/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { op, revisionOf, succeedTask, tid, track } from '../../helpers/brokerFixtures';
import { deliveryHarness, deliveryOf, pendingIds, subscribed } from '../../helpers/deliveryFixtures';

/**
 * What filling the audience seam does to `archive` — evidence for T8, which replaces the inherited
 * rule. T7 does not change the rule: `archive` refuses while any retained update names an audience,
 * and nothing in T7 prunes an audience, because pruning is T8's acknowledgement/disposition evidence.
 */
describe('archive under a live subscription (inherited retention rule; T8 replaces it)', () => {
  test('with no subscription an update is owed to no one, and a terminal task archives', async () => {
    const h = await deliveryHarness();
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toSucceed();
  });

  test('a matching subscription makes every terminal task retention-blocked — even once fully acknowledged', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    const delivery = deliveryOf(h, 'sub');
    const archive = async (): Promise<unknown> =>
      h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      });
    expect(await archive()).toFailWithDetail(
      /updates are still owed/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    // Acknowledge everything the subscription is owed: its exact history now holds every id.
    const prepared = (await delivery.prepare()).orThrow();
    expect((await delivery.acknowledge(prepared.context.receipt)).orThrow().newlyAcknowledged).toEqual([
      't:1:0',
      't:2:0',
      't:2:3'
    ]);
    expect(await pendingIds(delivery)).toEqual([]);
    // Still refused: the retained updates keep their stored audience until T8 prunes against evidence.
    expect(await archive()).toFailWithDetail(
      /updates are still owed/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
  });

  test('a subscription whose selection does not match the task does not block it', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub', { selection: { parentId: 'nobody' } });
    await track(h.writer, 't');
    await succeedTask(h, h.writer, 't');
    expect(
      await h.writer.archive({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 't')
      })
    ).toSucceed();
  });
});
