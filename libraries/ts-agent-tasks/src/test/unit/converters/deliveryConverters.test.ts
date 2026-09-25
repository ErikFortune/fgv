/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonObject } from '@fgv/ts-json-base';
import { TaskId, TaskRevision, baselineUpdateId } from '../../../index';
import { converters } from '../../helpers/fixtures';
import { at, update } from '../../helpers/contextFixtures';

const bid = (id: string, revision: number): string =>
  baselineUpdateId(id as unknown as TaskId, revision as unknown as TaskRevision);

const delivery = converters.delivery;

/** A minimal, valid `from-now` consumer record, with `extra` merged over it. */
function record(extra: JsonObject = {}): JsonObject {
  return {
    formatVersion: 1,
    id: 'sub-1',
    recordRevision: 1,
    registration: { operationId: 'op-1', principalKey: 'alice' },
    consumerId: 'consumer-1',
    selection: { scopes: [{ namespace: 'project', key: 'alpha' }], lifecycleClass: 'all' },
    start: 'from-now',
    policy: {
      schemaVersion: 1,
      durability: 'session',
      history: 'observed-state',
      categories: ['attention', 'lifecycle', 'result']
    },
    state: 'active',
    createdAt: at,
    baseline: [],
    acknowledged: [],
    issued: [],
    capacityClaims: [],
    ...extra
  };
}

describe('delivery categories', () => {
  test('must be strictly ascending, not merely a valid set', () => {
    expect(delivery.categories.convert(['attention', 'lifecycle', 'result'])).toSucceed();
    expect(delivery.categories.convert(['result', 'attention', 'lifecycle'])).toFailWith(
      /must be unique and ascending/
    );
  });
});

describe('an issued receipt naming another delivery', () => {
  test('is refused', () => {
    const receipt = {
      version: 1,
      deliveryId: 'd-2',
      included: [{ taskId: 't', revision: 1, updateIds: ['t:1:0'] }],
      completeness: 'complete'
    };
    expect(
      delivery.issued.convert({
        deliveryId: 'd-1',
        receipt,
        issuedAt: at,
        expiresAt: '2026-09-22T13:00:00.000Z',
        acknowledged: false
      })
    ).toFailWith(/its receipt names another delivery/);
  });
});

describe('consumer record invariants', () => {
  test('a record with no history round-trips', () => {
    expect(delivery.consumerRecord.convert(record())).toSucceed();
  });

  test('acknowledged ids must be unique and ascending', () => {
    expect(delivery.consumerRecord.convert(record({ acknowledged: ['t:2:0', 't:1:0'] }))).toFailWith(
      /acknowledged ids must be unique and ascending/
    );
  });

  test('issued receipts must be unique and ascending by delivery id', () => {
    const issued = (deliveryId: string): JsonObject => ({
      deliveryId,
      receipt: {
        version: 1,
        deliveryId,
        included: [],
        completeness: 'complete'
      },
      issuedAt: at,
      expiresAt: '2026-09-22T13:00:00.000Z',
      acknowledged: false
    });
    expect(delivery.consumerRecord.convert(record({ issued: [issued('d-2'), issued('d-1')] }))).toFailWith(
      /issued receipts must be unique and ascending by delivery id/
    );
  });

  test('a from-now subscription may not carry a baseline', () => {
    expect(
      delivery.consumerRecord.convert(
        record({ baseline: [update(baselineUpdateId('t' as never, 1 as never), 't', 1, 'lifecycle', true)] })
      )
    ).toFailWith(/a from-now subscription has no baseline/);
  });

  test('baseline obligations must be unique and ascending', () => {
    const a = update(baselineUpdateId('a' as never, 1 as never), 'a', 1, 'lifecycle', true);
    const b = update(baselineUpdateId('b' as never, 1 as never), 'b', 1, 'lifecycle', true);
    expect(delivery.consumerRecord.convert(record({ start: 'current', baseline: [b, a] }))).toFailWith(
      /baseline obligations must be unique and ascending/
    );
  });

  test('a baseline entry whose identity disagrees with its content is refused', () => {
    const bad = update('t:1:0', 't', 1, 'lifecycle', true);
    expect(delivery.consumerRecord.convert(record({ start: 'current', baseline: [bad] }))).toFailWith(
      /identity disagrees with its content/
    );
  });

  test('a baseline entry owed to any audience but its own subscription is refused', () => {
    const wrongAudience = {
      ...update(baselineUpdateId('a' as never, 1 as never), 'a', 1, 'lifecycle', true),
      audience: ['someone-else']
    };
    expect(
      delivery.consumerRecord.convert(record({ start: 'current', baseline: [wrongAudience] }))
    ).toFailWith(/owed to its own subscription only/);
  });

  test('a baseline entry that is not required is refused', () => {
    const optional = update(baselineUpdateId('a' as never, 1 as never), 'a', 1, 'lifecycle', false);
    expect(delivery.consumerRecord.convert(record({ start: 'current', baseline: [optional] }))).toFailWith(
      /a baseline obligation is required/
    );
  });
});

describe('the consumer inventory', () => {
  test('refuses two entries sharing one id', () => {
    expect(
      delivery.consumerInventory.convert([
        { id: 'sub-1', state: 'live' },
        { id: 'sub-1', state: 'live' }
      ])
    ).toFailWith(/duplicate 'sub-1'/);
  });
});
