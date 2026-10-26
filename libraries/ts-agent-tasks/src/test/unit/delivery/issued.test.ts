/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTreeTaskRepository } from '../../../index';
import { brokerRegistry, track } from '../../helpers/brokerFixtures';
import {
  TestClock,
  clockedEnvironment,
  deliveryHarness,
  deliveryOf,
  harnessFor,
  subscribed
} from '../../helpers/deliveryFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

describe('IBoundTaskDelivery.issued', () => {
  test('lists nothing before a receipt is issued, then each unacknowledged receipt oldest first', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    expect(await delivery.issued()).toSucceedWith([]);
    await track(h.writer, 'a');
    const first = (await delivery.prepare()).orThrow();
    h.clock.advance(1000);
    const second = (await delivery.prepare()).orThrow();
    expect(await delivery.issued()).toSucceedAndSatisfy((issued) => {
      expect(issued.map((r) => r.deliveryId)).toEqual([first.deliveryId, second.deliveryId]);
      expect(issued[1].expiresAt).toBe(second.expiresAt);
      // Identities and times only: never what a receipt included.
      expect(Object.keys(issued[0]).sort()).toEqual(['deliveryId', 'expiresAt', 'issuedAt']);
    });
    expect(await delivery.acknowledge(first.context.receipt)).toSucceed();
    expect(await delivery.issued()).toSucceedAndSatisfy((issued) =>
      expect(issued.map((r) => r.deliveryId)).toEqual([second.deliveryId])
    );
    expect(await delivery.abandon(second.deliveryId)).toSucceed();
    expect(await delivery.issued()).toSucceedWith([]);
  });

  test('after a restart, a host finds the receipt a crash left behind and can release it', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    const left = (await deliveryOf(h, 'sub').prepare()).orThrow();
    h.repository.close().orThrow();
    const clock = new TestClock();
    clock.now = h.clock.now;
    const { env, logger } = clockedEnvironment(clock);
    const opened = (
      await FileTreeTaskRepository.open({ root: h.root, mode: 'session', environment: env, registry: brokerRegistry() })
    ).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      const again = harnessFor(opened.repository, env, logger, h.root, clock);
      const delivery = deliveryOf(again, 'sub');
      expect(await delivery.issued()).toSucceedAndSatisfy((issued) =>
        expect(issued.map((r) => r.deliveryId)).toEqual([left.deliveryId])
      );
      expect(await delivery.abandon(left.deliveryId)).toSucceed();
      expect(await delivery.issued()).toSucceedWith([]);
      opened.repository.close();
    }
  });

  test('a moment, not a hold: an acknowledgement after the listing, then an abandon of what was listed', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    await track(h.writer, 'a');
    const delivery = deliveryOf(h, 'sub');
    const prepared = (await delivery.prepare()).orThrow();
    const listed = (await delivery.issued()).orThrow();
    expect(listed.map((r) => r.deliveryId)).toEqual([prepared.deliveryId]);
    // Acknowledged after the listing was read.
    expect(await delivery.acknowledge(prepared.context.receipt)).toSucceed();
    // The host acts on its stale listing: the manifest goes, the history it produced stays.
    expect(await delivery.abandon(listed[0].deliveryId)).toSucceed();
    expect(await delivery.issued()).toSucceedWith([]);
    expect(await delivery.pending()).toSucceedAndSatisfy((page) => expect(page.updates).toEqual([]));
    // A replay of the acknowledgement no longer matches a held manifest.
    expect(await delivery.acknowledge(prepared.context.receipt)).toFailWithDetail(
      /not a receipt this delivery issued/,
      code('invalid-receipt')
    );
  });

  test('a closed repository refuses the listing', async () => {
    const h = await deliveryHarness();
    await subscribed(h, 'sub');
    const delivery = deliveryOf(h, 'sub');
    h.repository.close().orThrow();
    expect(await delivery.issued()).toFailWithDetail(/closed/, code('storage-unavailable'));
  });
});
