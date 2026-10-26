/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { TaskPrepareCurrentState, TaskRevision } from '../../../index';
import { op, tid, track } from '../../helpers/brokerFixtures';
import { IDeliveryHarness, deliveryHarness, deliveryOf, subscribed } from '../../helpers/deliveryFixtures';

const one = { maxItems: 1, maxDepth: 3, maxChars: 8000 };

describe("IBoundTaskDelivery.prepare — currentState: 'owed-only'", () => {
  let h: IDeliveryHarness;

  beforeEach(async () => {
    h = await deliveryHarness();
    await subscribed(h, 's1');
    // a1's attention is delivered and acknowledged: its current state is owed nothing, and ranks first.
    await track(h.writer, 'a1');
    (
      await h.writer.updateTracked({
        taskId: tid('a1'),
        operationId: op('attend-a1'),
        expectedRevision: 1 as TaskRevision,
        patch: { attention: [{ namespace: 'review', key: 'r' }] }
      })
    ).orThrow();
    const delivery = deliveryOf(h, 's1');
    const all = (await delivery.prepare({ maxItems: 5, maxDepth: 3, maxChars: 8000 })).orThrow();
    (await delivery.acknowledge(all.context.receipt)).orThrow();
    (await delivery.abandon(all.deliveryId)).orThrow();
    await track(h.writer, 'b1');
  });

  test('by default a current task owed nothing can take the only slot and deliver nothing', async () => {
    const prepared = (await deliveryOf(h, 's1').prepare(one)).orThrow();
    expect(prepared.context.entries.map((e) => [e.summary.envelope.id, e.updateIds])).toEqual([['a1', []]]);
  });

  test('owed-only renders only owed revisions, so the owed one is delivered', async () => {
    const prepared = (await deliveryOf(h, 's1').prepare(one, { currentState: 'owed-only' })).orThrow();
    expect(prepared.context.entries.map((e) => [e.summary.envelope.id, e.updateIds])).toEqual([
      ['b1', ['b1:1:0']]
    ]);
    expect(await deliveryOf(h, 's1').acknowledge(prepared.context.receipt)).toSucceed();
  });

  test("'include' is the default spelled out", async () => {
    const prepared = (await deliveryOf(h, 's1').prepare(one, { currentState: 'include' })).orThrow();
    expect(prepared.context.entries[0].summary.envelope.id).toBe('a1');
  });

  test('an unknown mode is refused before anything is issued', async () => {
    const delivery = deliveryOf(h, 's1');
    expect(
      await delivery.prepare(one, { currentState: 'everything' as unknown as TaskPrepareCurrentState })
    ).toFailWith(/currentState must be 'include' or 'owed-only'/);
    expect(await delivery.issued()).toSucceedWith([]);
  });
});
