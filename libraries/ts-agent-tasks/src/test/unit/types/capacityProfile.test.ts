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
  defaultTaskFieldBounds,
  defaultTaskPerOwnerLimits,
  maximumClosureCharges,
  maximumResolutionCharges,
  maximumSettlementCharges,
  maximumUpdateBytes,
  ITaskUpdate,
  SubscriptionId,
  TaskId,
  TaskRevision,
  taskUpdateId
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { encodeRecord } from '../../../packlets/storage/layout';
import { converters } from '../../helpers/fixtures';
import { envelope } from '../../helpers/storageFixtures';

const MiB: number = 1024 * 1024;
/** The derived schema maximum of one update under the default profile (T8). */
const unit: number = maximumUpdateBytes(defaultTaskCapacityProfile).orThrow();

function charged(charges: ReadonlyArray<ITaskCapacityCharge>, dimension: CapacityDimension): number {
  const entry: ITaskCapacityCharge | undefined = charges.find((c) => c.dimension === dimension);
  expect(entry).toBeDefined();
  return entry?.amount ?? -1;
}

describe('default profile', () => {
  test('publishes the default limits', () => {
    expect(defaultTaskCapacityProfile.profileVersion).toBe(1);
    expect(defaultTaskCapacityProfile.limits['retained-tasks']).toBe(10000);
    expect(defaultTaskCapacityProfile.limits['non-archived-tasks']).toBe(1000);
    expect(defaultTaskCapacityProfile.limits.subscriptions).toBe(256);
    expect(defaultTaskCapacityProfile.limits.sources).toBe(128);
    expect(defaultTaskCapacityProfile.limits.updates).toBe(20000);
    expect(defaultTaskCapacityProfile.limits['audience-links']).toBe(200000);
    expect(defaultTaskCapacityProfile.limits['logical-bytes']).toBe(512 * MiB);
  });

  test('carries the T8 decisions: raised payload and consumer bounds, update bound unchanged', () => {
    expect(defaultTaskCapacityProfile.limits['resident-payload-bytes']).toBe(384 * MiB);
    expect(defaultTaskCapacityProfile.limits['record-bytes']).toBe(32 * MiB);
    expect(defaultTaskEncodedBounds.maxConsumerRecordBytes).toBe(32 * MiB);
    expect(defaultTaskEncodedBounds.maxTaskRecordBytes).toBe(8 * MiB);
    expect(defaultTaskEncodedBounds.maxUpdateBytes).toBe(64 * 1024);
    expect(defaultTaskPerOwnerLimits.maxAcknowledgementIdsPerSubscription).toBe(50000);
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
    // The derived schema maximum of an update, not maxUpdateBytes (T8).
    const updates: number = 7 * unit;
    const operations: number = 2 * defaultTaskEncodedBounds.maxStoredOperationBytes;
    // Every reserved link's acknowledgement evidence, which its subscription holds once the link is
    // committed (T7): logical bytes, never this record's bytes.
    const evidence: number =
      7 *
      defaultTaskPerOwnerLimits.maxAudiencePerUpdate *
      defaultTaskEncodedBounds.maxAcknowledgementEvidenceBytes;
    expect(charged(charges, 'record-bytes')).toBe(snapshot + updates + operations);
    expect(charged(charges, 'logical-bytes')).toBe(snapshot + updates + operations + evidence);
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
      unit;
    const evidence: number =
      defaultTaskPerOwnerLimits.maxAudiencePerUpdate *
      defaultTaskEncodedBounds.maxAcknowledgementEvidenceBytes;
    expect(charged(charges, 'record-bytes')).toBe(bytes);
    expect(charged(charges, 'logical-bytes')).toBe(bytes + evidence);
    expect(charged(charges, 'resident-payload-bytes')).toBe(unit);
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
    // The unit is at most the envelope bound plus framing, so a vast maxUpdateBytes no longer
    // reaches the product; a vast envelope bound reaches the unit itself.
    expect(maximumClosureCharges(withEncoded({ maxEnvelopeBytes: Number.MAX_SAFE_INTEGER }))).toFailWith(
      /maximumUpdateBytes: derived update bytes: .*not exactly representable/i
    );
    const huge: number = Math.floor(Number.MAX_SAFE_INTEGER / 2);
    expect(maximumClosureCharges(withEncoded({ maxEnvelopeBytes: huge, maxUpdateBytes: huge }))).toFailWith(
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
    ).toFailWith(/not exactly representable/i);
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

  test('the first-resolution charge fails the same way, on each of its terms', () => {
    const huge: number = Math.floor(Number.MAX_SAFE_INTEGER / 2);
    expect(
      maximumResolutionCharges(withEncoded({ maxEnvelopeBytes: huge, maxUpdateBytes: huge }))
    ).toFailWith(/maximumResolutionCharges: resolution update bytes: .*not exactly representable/i);
    expect(
      maximumResolutionCharges(
        withEncoded({ maxEnvelopeBytes: Number.MAX_SAFE_INTEGER, maxDetailBytes: Number.MAX_SAFE_INTEGER })
      )
    ).toFailWith(/resolution snapshot bytes/i);
    expect(
      maximumResolutionCharges(
        withEncoded({ maxEnvelopeBytes: 1, maxDetailBytes: Number.MAX_SAFE_INTEGER - 100 })
      )
    ).toFailWith(/resolution record bytes/i);
    expect(
      maximumResolutionCharges({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskPerOwnerLimits, maxAudiencePerUpdate: Number.MAX_SAFE_INTEGER }
      })
    ).toFailWith(/not exactly representable/i);
  });
});

describe('maximumResolutionCharges (T3)', () => {
  test('reserves a whole snapshot and one required payload of every category, with audience evidence', () => {
    expect(maximumResolutionCharges(defaultTaskCapacityProfile)).toSucceedAndSatisfy((charges) => {
      const categories: number = allUpdateCategories.length;
      const audience: number = defaultTaskPerOwnerLimits.maxAudiencePerUpdate;
      const bytes: number =
        defaultTaskEncodedBounds.maxEnvelopeBytes +
        defaultTaskEncodedBounds.maxDetailBytes +
        categories * unit;
      expect(charges).toEqual([
        { dimension: 'updates', amount: categories },
        { dimension: 'audience-links', amount: categories * audience },
        { dimension: 'acknowledgement-ids', amount: categories * audience },
        { dimension: 'record-bytes', amount: bytes },
        {
          dimension: 'logical-bytes',
          amount: bytes + categories * audience * defaultTaskEncodedBounds.maxAcknowledgementEvidenceBytes
        },
        { dimension: 'resident-payload-bytes', amount: categories * unit }
      ]);
    });
  });

  test('claims no identity and no operation slot: resolution is an observation, not an operation', () => {
    expect(maximumResolutionCharges(defaultTaskCapacityProfile)).toSucceedAndSatisfy((charges) => {
      expect(charges.map((c) => c.dimension)).not.toContain('operations');
      expect(charges.map((c) => c.dimension)).not.toContain('retained-tasks');
    });
  });
});

describe('maximumUpdateBytes (T8)', () => {
  const widest = 'x'.repeat(defaultTaskFieldBounds.maxIdLength);
  /** The widest update the converters accept: every id at its bound, a full audience, a coalescing marker. */
  function widestUpdate(): { update: ITaskUpdate; envelopeBytes: number } {
    const env = envelope(widest, Number.MAX_SAFE_INTEGER);
    const update: ITaskUpdate = {
      id: taskUpdateId(widest as TaskId, Number.MAX_SAFE_INTEGER as TaskRevision, 'progress'),
      taskId: widest as TaskId,
      revision: Number.MAX_SAFE_INTEGER as TaskRevision,
      category: 'progress',
      required: false,
      snapshot: { envelope: env },
      audience: Array.from(
        { length: 32 },
        (unused: unknown, i: number) =>
          `${String(i).padStart(2, '0')}${'s'.repeat(
            defaultTaskFieldBounds.maxIdLength - 2
          )}` as SubscriptionId
      ),
      coalesced: { fromRevision: (Number.MAX_SAFE_INTEGER - 1) as TaskRevision }
    };
    return { update, envelopeBytes: encodeRecord(env).orThrow().bytes };
  }

  test('is 37,417 bytes under the default profile — below the 64 KiB maxUpdateBytes', () => {
    expect(unit).toBe(37417);
    expect(unit).toBeLessThan(defaultTaskEncodedBounds.maxUpdateBytes);
  });

  test('bounds the widest update the converters accept, with the envelope at its own bound', () => {
    const { update, envelopeBytes } = widestUpdate();
    expect(converters.context.update.convert(update)).toSucceed();
    const encoded: number = encodeRecord(update).orThrow().bytes;
    // Grown to a maximum-size envelope, this update is exactly as large as a real one can be.
    const atEnvelopeBound: number = encoded - envelopeBytes + defaultTaskEncodedBounds.maxEnvelopeBytes;
    expect(atEnvelopeBound).toBeLessThanOrEqual(unit);
    // Tight: the only slack is what cannot coexist — a longer category name than one that coalesces
    // ('relationship' vs 'progress'), and the widest update-id suffix ('initial' vs one ordinal digit).
    expect(unit - atEnvelopeBound).toBe('relationship'.length - 'progress'.length + ('initial'.length - 1));
  });

  test('follows the envelope and audience bounds of the profile', () => {
    const lean: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskPerOwnerLimits, maxAudiencePerUpdate: 2 },
      encoded: { ...defaultTaskEncodedBounds, maxEnvelopeBytes: 1024 }
    };
    // 30 fewer audience members of 131 bytes each, and 31,744 fewer envelope bytes.
    expect(maximumUpdateBytes(lean)).toSucceedWith(unit - 30 * 131 - (32 * 1024 - 1024));
  });

  test('is never more than maxUpdateBytes: a profile that sets it lower keeps its own figure', () => {
    expect(
      maximumUpdateBytes({
        ...defaultTaskCapacityProfile,
        encoded: { ...defaultTaskEncodedBounds, maxUpdateBytes: 20000 }
      })
    ).toSucceedWith(20000);
  });

  test('fails rather than returning an inexact figure', () => {
    expect(
      maximumUpdateBytes({
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskPerOwnerLimits, maxAudiencePerUpdate: Number.MAX_SAFE_INTEGER }
      })
    ).toFailWith(/maximumUpdateBytes: derived audience bytes: .*not exactly representable/i);
  });
});
