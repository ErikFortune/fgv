/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  CapacityDimension,
  ITaskCapacityCharge,
  ITaskCapacityProfile,
  ITaskEncodedBounds,
  allUpdateCategories,
  defaultTaskCapacityProfile,
  defaultTaskEncodedBounds,
  defaultTaskPerOwnerLimits,
  maximumClosureCharges,
  maximumSettlementCharges
} from '../../../index';

function charged(charges: ReadonlyArray<ITaskCapacityCharge>, dimension: CapacityDimension): number {
  const entry: ITaskCapacityCharge | undefined = charges.find((c) => c.dimension === dimension);
  expect(entry).toBeDefined();
  return entry?.amount ?? -1;
}

describe('default profile', () => {
  test('publishes the proposed initial limits', () => {
    expect(defaultTaskCapacityProfile.profileVersion).toBe(1);
    expect(defaultTaskCapacityProfile.limits['retained-tasks']).toBe(10000);
    expect(defaultTaskCapacityProfile.limits['non-archived-tasks']).toBe(1000);
    expect(defaultTaskCapacityProfile.limits.subscriptions).toBe(256);
    expect(defaultTaskCapacityProfile.limits.sources).toBe(128);
    expect(defaultTaskCapacityProfile.limits.updates).toBe(20000);
    expect(defaultTaskCapacityProfile.limits['audience-links']).toBe(200000);
    expect(defaultTaskCapacityProfile.limits['logical-bytes']).toBe(512 * 1024 * 1024);
  });

  test('non-archived is a strict subset of retained, so archiving can never free an identity', () => {
    expect(defaultTaskCapacityProfile.limits['non-archived-tasks']).toBeLessThan(
      defaultTaskCapacityProfile.limits['retained-tasks']
    );
  });

  test('a source-checkpoint record is bounded well below a task record', () => {
    expect(defaultTaskEncodedBounds.maxSourceRecordBytes).toBeLessThan(
      defaultTaskEncodedBounds.maxTaskRecordBytes
    );
  });

  test('every count limit is positive', () => {
    for (const value of Object.values(defaultTaskCapacityProfile.limits)) {
      expect(Number.isSafeInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('maximumClosureCharges', () => {
  const charges: ReadonlyArray<ITaskCapacityCharge> =
    maximumClosureCharges(defaultTaskCapacityProfile).orThrow();

  test('reserves one required payload of every update category', () => {
    expect(allUpdateCategories).toHaveLength(7);
    expect(charged(charges, 'updates')).toBe(7);
  });

  test('reserves audience links and acknowledgement evidence for every audience of every payload', () => {
    const expected: number = 7 * defaultTaskPerOwnerLimits.maxAudiencePerUpdate;
    expect(charged(charges, 'audience-links')).toBe(expected);
    expect(charged(charges, 'acknowledgement-ids')).toBe(expected);
  });

  test('reserves the terminal operation evidence and the archive receipt', () => {
    expect(charged(charges, 'operations')).toBe(2);
  });

  test('reserves schema maxima, not an optimistic final size', () => {
    const snapshot: number =
      defaultTaskEncodedBounds.maxEnvelopeBytes + defaultTaskEncodedBounds.maxDetailBytes;
    const updates: number = 7 * defaultTaskEncodedBounds.maxUpdateBytes;
    const operations: number = 2 * defaultTaskEncodedBounds.maxStoredOperationBytes;
    expect(charged(charges, 'record-bytes')).toBe(snapshot + updates + operations);
    expect(charged(charges, 'logical-bytes')).toBe(snapshot + updates + operations);
    expect(charged(charges, 'resident-payload-bytes')).toBe(updates);
  });

  test('charges no dimension twice', () => {
    expect(new Set(charges.map((c) => c.dimension)).size).toBe(charges.length);
  });

  test('is a bounded path, not an emergency pool — it claims no new task identities', () => {
    expect(charges.find((c) => c.dimension === 'retained-tasks')).toBeUndefined();
    expect(charges.find((c) => c.dimension === 'non-archived-tasks')).toBeUndefined();
    expect(charges.find((c) => c.dimension === 'subscriptions')).toBeUndefined();
  });

  test('scales with a host profile that lowers the audience bound', () => {
    const lean: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskPerOwnerLimits, maxAudiencePerUpdate: 2 }
    };
    expect(charged(maximumClosureCharges(lean).orThrow(), 'audience-links')).toBe(14);
  });

  test('every charge is computable before acceptance — it depends on nothing but the profile', () => {
    expect(maximumClosureCharges(defaultTaskCapacityProfile)).toSucceedWith(charges);
  });
});

describe('maximumSettlementCharges', () => {
  const charges: ReadonlyArray<ITaskCapacityCharge> =
    maximumSettlementCharges(defaultTaskCapacityProfile).orThrow();

  test('reserves one result payload with its audience evidence', () => {
    expect(charged(charges, 'updates')).toBe(1);
    expect(charged(charges, 'audience-links')).toBe(defaultTaskPerOwnerLimits.maxAudiencePerUpdate);
    expect(charged(charges, 'acknowledgement-ids')).toBe(defaultTaskPerOwnerLimits.maxAudiencePerUpdate);
  });

  test('settling consumes no new ordinary operation slot', () => {
    expect(charges.find((c) => c.dimension === 'operations')).toBeUndefined();
  });

  test('reserves the settled receipt and the owed result at their schema maxima', () => {
    const bytes: number =
      defaultTaskEncodedBounds.maxStoredOperationBytes +
      defaultTaskEncodedBounds.maxIssuedReceiptBytes +
      defaultTaskEncodedBounds.maxUpdateBytes;
    expect(charged(charges, 'record-bytes')).toBe(bytes);
    expect(charged(charges, 'logical-bytes')).toBe(bytes);
    expect(charged(charges, 'resident-payload-bytes')).toBe(defaultTaskEncodedBounds.maxUpdateBytes);
  });

  test('settlement is strictly cheaper than closeout', () => {
    const closure: ReadonlyArray<ITaskCapacityCharge> =
      maximumClosureCharges(defaultTaskCapacityProfile).orThrow();
    expect(charged(charges, 'record-bytes')).toBeLessThan(charged(closure, 'record-bytes'));
    expect(charged(charges, 'updates')).toBeLessThan(charged(closure, 'updates'));
  });

  test('charges no dimension twice', () => {
    expect(new Set(charges.map((c) => c.dimension)).size).toBe(charges.length);
  });
});

describe('inexact charges fail rather than reserving the wrong amount', () => {
  function withEncoded(overrides: Partial<ITaskEncodedBounds>): ITaskCapacityProfile {
    return {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskEncodedBounds, ...overrides }
    };
  }

  test('a profile whose update bytes overflow the safe range fails the closeout charge', () => {
    expect(maximumClosureCharges(withEncoded({ maxUpdateBytes: Number.MAX_SAFE_INTEGER }))).toFailWith(
      /maximumClosureCharges: closeout update bytes: .*not exactly representable/i
    );
  });

  test('a profile whose snapshot bytes overflow fails the closeout charge', () => {
    expect(
      maximumClosureCharges(
        withEncoded({
          maxEnvelopeBytes: Number.MAX_SAFE_INTEGER,
          maxDetailBytes: Number.MAX_SAFE_INTEGER
        })
      )
    ).toFailWith(/closeout snapshot bytes: the sum is not exactly representable/i);
  });

  test('a profile whose operation bytes overflow fails the closeout charge', () => {
    expect(
      maximumClosureCharges(withEncoded({ maxStoredOperationBytes: Number.MAX_SAFE_INTEGER }))
    ).toFailWith(/closeout operation bytes: .*not exactly representable/i);
  });

  test('an audience bound that overflows the link count fails', () => {
    expect(
      maximumClosureCharges({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskPerOwnerLimits, maxAudiencePerUpdate: Number.MAX_SAFE_INTEGER }
      })
    ).toFailWith(/closeout audience links: .*not exactly representable/i);
  });

  test('a record-bytes total that overflows only when summed fails', () => {
    const third: number = Math.floor(Number.MAX_SAFE_INTEGER / 3);
    expect(
      maximumClosureCharges(
        withEncoded({ maxEnvelopeBytes: third, maxDetailBytes: third, maxUpdateBytes: third })
      )
    ).toFailWith(/closeout (update bytes|record bytes)/i);
  });

  test('the settlement charge fails the same way', () => {
    expect(
      maximumSettlementCharges(withEncoded({ maxStoredOperationBytes: Number.MAX_SAFE_INTEGER }))
    ).toFailWith(/maximumSettlementCharges: settlement record bytes: the sum is not exactly representable/i);
  });
});
