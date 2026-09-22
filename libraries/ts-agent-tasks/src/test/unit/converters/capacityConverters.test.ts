/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { CapacityDimension, allCapacityDimensions, defaultTaskCapacityProfile } from '../../../index';
import { claim, converters } from '../../helpers/fixtures';

describe('capacity profile', () => {
  test('the default profile round-trips through its converter unchanged', () => {
    expect(converters.capacity.profile.convert(defaultTaskCapacityProfile)).toSucceedWith(
      defaultTaskCapacityProfile
    );
  });

  test('the profile is versioned, so a reopened repository cannot be reinterpreted', () => {
    expect(
      converters.capacity.profile.convert({ ...defaultTaskCapacityProfile, profileVersion: 2 })
    ).toFail();
  });

  test('rejects a profile missing a dimension', () => {
    const limits: Record<string, JsonValue> = { ...defaultTaskCapacityProfile.limits };
    delete limits.updates;
    expect(converters.capacity.profile.convert({ ...defaultTaskCapacityProfile, limits })).toFail();
  });

  test('rejects a profile naming a dimension that does not exist', () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        limits: { ...defaultTaskCapacityProfile.limits, heap: 1 }
      })
    ).toFail();
  });

  test('rejects a zero or negative limit', () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        limits: { ...defaultTaskCapacityProfile.limits, updates: 0 }
      })
    ).toFail();
  });

  test('every encoded bound is a positive safe integer', () => {
    expect(converters.capacity.encoded.convert(defaultTaskCapacityProfile.encoded)).toSucceed();
    expect(
      converters.capacity.encoded.convert({
        ...defaultTaskCapacityProfile.encoded,
        maxDetailBytes: -1
      })
    ).toFail();
  });

  test('per-owner limits are separate from repository-wide dimensions', () => {
    expect(converters.capacity.perOwner.convert(defaultTaskCapacityProfile.perOwner)).toSucceedAndSatisfy(
      (perOwner) => {
        expect(perOwner.maxOperationsPerTask).toBe(128);
        expect(perOwner.maxAudiencePerUpdate).toBe(32);
      }
    );
  });
});

describe('capacity charges', () => {
  test('a charge names a dimension and a non-negative amount', () => {
    expect(converters.capacity.charge.convert({ dimension: 'updates', amount: 7 })).toSucceed();
    expect(converters.capacity.charge.convert({ dimension: 'updates', amount: -1 })).toFail();
  });

  test('a claim may not charge the same dimension twice', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', {
          taskId: 'task-1',
          audience: [],
          charges: [
            { dimension: 'updates', amount: 7 },
            { dimension: 'updates', amount: 3 }
          ]
        })
      )
    ).toFailWith(/duplicate charge for dimension 'updates'/i);
  });

  test('a claim may charge every dimension once', () => {
    const charges: JsonValue[] = defaultTaskCapacityProfile
      ? Object.keys(defaultTaskCapacityProfile.limits).map((dimension) => ({ dimension, amount: 1 }))
      : [];
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: [], charges })
      )
    ).toSucceed();
  });
});

describe('capacity claims', () => {
  test('a terminal-closeout claim names its task and the audience it reserves for', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: ['sub-1', 'sub-2'] })
      )
    ).toSucceedAndSatisfy((converted) => {
      expect(converted.purpose).toBe('terminal-closeout');
      expect(converted.purpose === 'terminal-closeout' && converted.audience).toEqual(['sub-1', 'sub-2']);
    });
  });

  test('an accepted-operation-settlement claim names the operation it settles', () => {
    expect(
      converters.capacity.claim.convert(
        claim('accepted-operation-settlement', { taskId: 'task-1', operationId: 'op-9' })
      )
    ).toSucceedAndSatisfy((converted) => {
      expect(converted.purpose === 'accepted-operation-settlement' && converted.operationId).toBe('op-9');
    });
  });

  test('a subscription-acknowledgement claim is joined by exact subscription and update', () => {
    expect(
      converters.capacity.claim.convert(
        claim('subscription-acknowledgement', { subscriptionId: 'sub-1', updateId: 'upd-4' })
      )
    ).toSucceedAndSatisfy((converted) => {
      expect(converted.purpose === 'subscription-acknowledgement' && converted.updateId).toBe('upd-4');
    });
  });

  test('a receipt-preparation claim names only its subscription', () => {
    expect(
      converters.capacity.claim.convert(claim('receipt-preparation', { subscriptionId: 'sub-1' }))
    ).toSucceed();
  });

  test('an admitted-source-replay claim carries the finite envelope it reserved', () => {
    expect(
      converters.capacity.claim.convert(
        claim('admitted-source-replay', {
          sourceId: 'src-a',
          envelope: { remainingRequiredUpdates: 20, remainingRequiredBytes: 65536 }
        })
      )
    ).toSucceedAndSatisfy((converted) => {
      expect(
        converted.purpose === 'admitted-source-replay' && converted.envelope.remainingRequiredUpdates
      ).toBe(20);
    });
  });

  test('an admitted-source-replay claim without a finite envelope fails', () => {
    expect(
      converters.capacity.claim.convert(claim('admitted-source-replay', { sourceId: 'src-a' }))
    ).toFail();
  });

  test('a claim of an unknown purpose converts to nothing', () => {
    expect(converters.capacity.claim.convert(claim('speculative-growth', {}))).toFail();
  });

  test("a claim cannot borrow another purpose's identities", () => {
    expect(
      converters.capacity.claim.convert(
        claim('receipt-preparation', { subscriptionId: 'sub-1', updateId: 'upd-4' })
      )
    ).toFail();
  });

  test('the claim schema is versioned', () => {
    expect(
      converters.capacity.claim.convert({
        ...claim('receipt-preparation', { subscriptionId: 'sub-1' }),
        claimVersion: 2
      })
    ).toFail();
  });
});

describe('claim ownership and disposition', () => {
  test.each([
    ['task', { owner: 'task', taskId: 'task-1' }],
    ['subscription', { owner: 'subscription', subscriptionId: 'sub-1' }],
    ['operation', { owner: 'operation', taskId: 'task-1', operationId: 'op-1' }]
  ])('converts a %s owner', (owner: string, value: JsonValue) => {
    expect(converters.capacity.claimOwner.convert(value)).toSucceedAndSatisfy((converted) => {
      expect(converted.owner).toBe(owner);
    });
  });

  test('rejects an owner kind the ledger cannot join on', () => {
    expect(converters.capacity.claimOwner.convert({ owner: 'source', sourceId: 'src-a' })).toFail();
  });

  test('pending-to-live transfer keeps the same claim id and charges', () => {
    const pending: Record<string, JsonValue> = claim('receipt-preparation', { subscriptionId: 'sub-1' });
    const live: Record<string, JsonValue> = { ...pending, ownership: 'live' };
    expect(converters.capacity.claim.convert(pending)).toSucceedAndSatisfy((before) => {
      expect(converters.capacity.claim.convert(live)).toSucceedAndSatisfy((after) => {
        expect(after.claimId).toBe(before.claimId);
        expect(after.charges).toEqual(before.charges);
        expect(before.ownership).toBe('pending');
        expect(after.ownership).toBe('live');
      });
    });
  });

  test.each([['reserved'], ['consumed'], ['indeterminate']])(
    'converts the %s disposition',
    (disposition: string) => {
      expect(
        converters.capacity.claim.convert({
          ...claim('receipt-preparation', { subscriptionId: 'sub-1' }),
          disposition
        })
      ).toSucceed();
    }
  );

  test('reserved-to-used conversion is a disposition change, not a charge change', () => {
    const reserved: Record<string, JsonValue> = claim('subscription-acknowledgement', {
      subscriptionId: 'sub-1',
      updateId: 'upd-4'
    });
    expect(converters.capacity.claim.convert({ ...reserved, disposition: 'consumed' })).toSucceedAndSatisfy(
      (consumed) => {
        expect(consumed.charges).toEqual([{ dimension: 'updates', amount: 7 }]);
        expect(consumed.disposition).toBe('consumed');
      }
    );
  });

  test('rejects an unknown ownership or disposition', () => {
    const base: Record<string, JsonValue> = claim('receipt-preparation', { subscriptionId: 'sub-1' });
    expect(converters.capacity.claim.convert({ ...base, ownership: 'orphaned' })).toFail();
    expect(converters.capacity.claim.convert({ ...base, disposition: 'released' })).toFail();
  });
});

describe('capacity status', () => {
  function row(dimension: CapacityDimension, overrides: Record<string, JsonValue> = {}): JsonValue {
    return {
      dimension,
      used: 16000,
      reserved: 2000,
      available: 2000,
      limit: 20000,
      pressure: true,
      limitingRecordIds: ['task-3'],
      ...overrides
    };
  }

  function everyRow(): JsonValue[] {
    return allCapacityDimensions.map((d) => row(d));
  }

  test('converts a status reporting every dimension', () => {
    expect(
      converters.capacity.status.convert({
        profileVersion: 1,
        state: 'pressure',
        dimensions: everyRow()
      })
    ).toSucceedAndSatisfy((status) => {
      expect(status.state).toBe('pressure');
      expect(status.dimensions).toHaveLength(allCapacityDimensions.length);
      expect(status.dimensions[0].limitingRecordIds).toEqual(['task-3']);
    });
  });

  test.each([['ok'], ['pressure'], ['admission-blocked'], ['draining']])(
    'converts the %s state',
    (state: string) => {
      expect(
        converters.capacity.status.convert({ profileVersion: 1, state, dimensions: everyRow() })
      ).toSucceed();
    }
  );

  test('capacity state is not an index-health state', () => {
    expect(
      converters.capacity.status.convert({
        profileVersion: 1,
        state: 'degraded',
        dimensions: everyRow()
      })
    ).toFail();
    expect(
      converters.capacity.status.convert({
        profileVersion: 1,
        state: 'unavailable',
        dimensions: everyRow()
      })
    ).toFail();
  });

  test('a duplicated dimension row is ambiguous, and is rejected', () => {
    const rows: JsonValue[] = everyRow();
    rows[1] = row('updates');
    expect(
      converters.capacity.status.convert({ profileVersion: 1, state: 'ok', dimensions: rows })
    ).toFailWith(/duplicate row for dimension 'updates'/i);
  });

  test('a missing dimension is rejected — silence is not "no pressure"', () => {
    expect(
      converters.capacity.status.convert({
        profileVersion: 1,
        state: 'ok',
        dimensions: everyRow().slice(1)
      })
    ).toFailWith(/no row for 'retained-tasks'/i);
  });

  test('an empty dimension list names every dimension it is missing', () => {
    expect(converters.capacity.status.convert({ profileVersion: 1, state: 'ok', dimensions: [] })).toFailWith(
      /no row for .*'retained-tasks'.*'resident-payload-bytes'/i
    );
  });

  test('rejects more dimension rows than there are dimensions', () => {
    expect(
      converters.capacity.status.convert({
        profileVersion: 1,
        state: 'ok',
        dimensions: [...everyRow(), row('updates')]
      })
    ).toFail();
  });
});
