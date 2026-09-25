/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import {
  CapacityDimension,
  TaskConverters,
  allCapacityDimensions,
  capacityPressureThreshold,
  defaultTaskCapacityProfile,
  maxSourceCursorLength
} from '../../../index';
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

  test('a subscription-activation claim names only its subscription', () => {
    expect(
      converters.capacity.claim.convert(claim('subscription-activation', { subscriptionId: 'sub-1' }))
    ).toSucceedAndSatisfy((converted) => {
      expect(converted.purpose === 'subscription-activation' && converted.subscriptionId).toBe('sub-1');
    });
    expect(
      converters.capacity.claim.convert(
        claim('subscription-activation', { subscriptionId: 'sub-1', updateId: 'upd-4' })
      )
    ).toFail();
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

describe('a claim collection', () => {
  test('accepts distinct claims', () => {
    expect(
      converters.capacity.claims.convert([
        claim('receipt-preparation', { subscriptionId: 'sub-1' }),
        { ...claim('receipt-preparation', { subscriptionId: 'sub-2' }), claimId: 'claim-2' }
      ])
    ).toSucceedAndSatisfy((claims) => {
      expect(claims).toHaveLength(2);
    });
  });

  test('accepts an empty collection', () => {
    expect(converters.capacity.claims.convert([])).toSucceedWith([]);
  });

  test('rejects two claims sharing a claim id — the ledger joins on that id', () => {
    expect(
      converters.capacity.claims.convert([
        claim('receipt-preparation', { subscriptionId: 'sub-1' }),
        claim('terminal-closeout', { taskId: 'task-1', audience: [] })
      ])
    ).toFailWith(/duplicate claim id 'claim-1'/i);
  });

  test('rejects a duplicate even when the two claims are otherwise identical', () => {
    const one: Record<string, JsonValue> = claim('receipt-preparation', { subscriptionId: 'sub-1' });
    expect(converters.capacity.claims.convert([one, one])).toFailWith(/duplicate claim id/i);
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
    const reserved: Record<string, JsonValue> = claim('subscription-activation', { subscriptionId: 'sub-1' });
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
  // 16000 + 2000 committed of 20000 is 90% — over the 80% threshold, so `pressure` is
  // true, and 2000 available closes the accounting identity.
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

describe('a dimension status cannot contradict itself', () => {
  function status(overrides: Record<string, JsonValue>): JsonValue {
    return {
      dimension: 'updates',
      used: 10,
      reserved: 0,
      available: 90,
      limit: 100,
      pressure: false,
      limitingRecordIds: [],
      ...overrides
    };
  }

  test('accepts a row whose figures add up and whose pressure matches the threshold', () => {
    expect(converters.capacity.dimensionStatus.convert(status({}))).toSucceed();
  });

  test('rejects a row where used, reserved and available do not reach the limit', () => {
    expect(converters.capacity.dimensionStatus.convert(status({ available: 0 }))).toFailWith(
      /does not equal the limit of 100/i
    );
  });

  test('rejects a row that over-reports, claiming more than the limit holds', () => {
    expect(converters.capacity.dimensionStatus.convert(status({ used: 50 }))).toFailWith(
      /does not equal the limit/i
    );
  });

  test('reserved counts toward pressure, not just used', () => {
    expect(
      converters.capacity.dimensionStatus.convert(
        status({ used: 10, reserved: 70, available: 20, pressure: true })
      )
    ).toSucceed();
    expect(
      converters.capacity.dimensionStatus.convert(
        status({ used: 10, reserved: 70, available: 20, pressure: false })
      )
    ).toFailWith(/pressure is derived at 80% of the limit, so it must be true/i);
  });

  test('a row may not under-report pressure to an admission caller', () => {
    expect(
      converters.capacity.dimensionStatus.convert(
        status({ used: 80, reserved: 0, available: 20, pressure: false })
      )
    ).toFailWith(/must be true here/i);
  });

  test('a row may not over-report it either', () => {
    expect(
      converters.capacity.dimensionStatus.convert(
        status({ used: 79, reserved: 0, available: 21, pressure: true })
      )
    ).toFailWith(/must be false here/i);
  });

  test('the threshold is exactly 80%, and 80 of 100 is at it', () => {
    expect(capacityPressureThreshold).toBe(0.8);
    expect(
      converters.capacity.dimensionStatus.convert(
        status({ used: 80, reserved: 0, available: 20, pressure: true })
      )
    ).toSucceed();
  });
});

describe('a terminal-closeout claim audience', () => {
  test('accepts distinct subscriptions', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: ['sub-1', 'sub-2'] })
      )
    ).toSucceed();
  });

  test('rejects a repeated subscription — it would double-count one obligation', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: ['sub-1', 'sub-1'] })
      )
    ).toFailWith(/duplicate subscription id 'sub-1'/i);
  });
});

describe('a claim audience uses the shared reference bound', () => {
  function audienceOf(n: number): JsonValue[] {
    return Array.from({ length: n }, (__v, i) => `sub-${i}`);
  }

  test('accepts an audience at the shared bound', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: audienceOf(32) })
      )
    ).toSucceed();
  });

  test('rejects one over it — a claim may not record more obligation than it reserved', () => {
    expect(
      converters.capacity.claim.convert(
        claim('terminal-closeout', { taskId: 'task-1', audience: audienceOf(33) })
      )
    ).toFailWith(/claim audience: 33 entries exceeds the maximum of 32/i);
  });

  test('a lowered reference bound lowers the audience bound with it', () => {
    const tight: TaskConverters = TaskConverters.create({ bounds: { maxReferences: 2 } }).orThrow();
    expect(
      tight.capacity.claim.convert(claim('terminal-closeout', { taskId: 'task-1', audience: audienceOf(3) }))
    ).toFailWith(/exceeds the maximum of 2/i);
  });

  test('the shared bound matches the per-update audience the closeout charge reserves', () => {
    // If these two ever diverge, a claim can record links its own charge did not cover.
    expect(converters.bounds.maxReferences).toBe(defaultTaskCapacityProfile.perOwner.maxAudiencePerUpdate);
  });

  test('a profile may not reserve more audience than a claim could ever encode', () => {
    // The converse of the bound above, and the one that bites: the profile figure is
    // what the closeout charge reserves from, the reference bound is what a claim may
    // actually hold. A profile above the bound reserves room for a claim that cannot
    // be written.
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxAudiencePerUpdate: 33 }
      })
    ).toFailWith(/maxAudiencePerUpdate 33 exceeds the reference bound of 32/i);
  });

  test('a profile at the bound is accepted', () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxAudiencePerUpdate: 32 }
      })
    ).toSucceed();
  });

  test('a lowered reference bound lowers what a profile may reserve, too', () => {
    const tight: TaskConverters = TaskConverters.create({ bounds: { maxReferences: 8 } }).orThrow();
    expect(tight.capacity.profile.convert(defaultTaskCapacityProfile)).toFailWith(
      /maxAudiencePerUpdate 32 exceeds the reference bound of 8/i
    );
    expect(
      tight.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxAudiencePerUpdate: 8 }
      })
    ).toSucceed();
  });
});

describe('a profile must be able to finish the work it can accept', () => {
  test('the default profile can hold its own protected closeout', () => {
    expect(converters.capacity.profile.convert(defaultTaskCapacityProfile)).toSucceed();
  });

  test('rejects a profile whose update limit cannot hold one closeout bundle', () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        limits: { ...defaultTaskCapacityProfile.limits, updates: 1 }
      })
    ).toFailWith(/terminal closeout needs 7 of 'updates' but the limit is 1/i);
  });

  test("rejects a profile whose record-bytes limit cannot hold the closeout's own writes", () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        limits: { ...defaultTaskCapacityProfile.limits, 'record-bytes': 1024 }
      })
    ).toFailWith(/terminal closeout needs \d+ of 'record-bytes' but the limit is 1024/i);
  });

  test('rejects a profile that can close out but cannot settle an accepted operation', () => {
    // Seven update payloads fit; the settlement bundle's stored operation plus receipt
    // does not. The two bundles are checked independently for exactly this reason.
    const encoded = defaultTaskCapacityProfile.encoded;
    const closeoutBytes: number =
      encoded.maxEnvelopeBytes +
      encoded.maxDetailBytes +
      7 * encoded.maxUpdateBytes +
      2 * encoded.maxStoredOperationBytes;
    const settlementBytes: number =
      encoded.maxStoredOperationBytes + encoded.maxIssuedReceiptBytes + encoded.maxUpdateBytes;
    expect(settlementBytes).toBeLessThan(closeoutBytes);
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        limits: {
          ...defaultTaskCapacityProfile.limits,
          'record-bytes': closeoutBytes,
          'logical-bytes': settlementBytes - 1
        }
      })
    ).toFailWith(/settlement needs \d+ of 'logical-bytes'/i);
  });

  test('a profile whose bounds make the charge inexact fails rather than being admitted', () => {
    expect(
      converters.capacity.profile.convert({
        ...defaultTaskCapacityProfile,
        encoded: { ...defaultTaskCapacityProfile.encoded, maxUpdateBytes: Number.MAX_SAFE_INTEGER }
      })
    ).toFailWith(/not exactly representable/i);
  });

  test('a source cursor bound above the representable cursor ceiling is refused', () => {
    const withCursor = (bytes: number): unknown => ({
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxSourceCursorBytes: bytes }
    });
    expect(converters.capacity.profile.convert(withCursor(maxSourceCursorLength))).toSucceed();
    expect(converters.capacity.profile.convert(withCursor(1024))).toSucceed();
    expect(converters.capacity.profile.convert(withCursor(maxSourceCursorLength + 1))).toFailWith(
      /over the representable ceiling of 4096/
    );
  });
});
