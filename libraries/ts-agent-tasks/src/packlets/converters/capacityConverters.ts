/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  CapacityClaimDisposition,
  CapacityClaimId,
  CapacityDimension,
  SubscriptionId,
  CapacityClaimOwner,
  CapacityClaimOwnership,
  ITaskCapacityCharge,
  ITaskCapacityClaim,
  ITaskCapacityDimensionStatus,
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskEncodedBounds,
  ITaskFieldBounds,
  ITaskPerOwnerLimits,
  TaskCapacityLimits,
  TaskCapacityState,
  allCapacityDimensions,
  capacityPressureThreshold,
  maximumClosureCharges,
  maximumResolutionCharges,
  maximumSettlementCharges
} from '../types';
import { IFailureConverters } from './failureConverters';
import { IIdentityConverters } from './identityConverters';
import { boundedArrayOf, boundedSingleLine, nonNegativeSafeInteger, positiveSafeInteger } from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * The A3 capacity converters — profile, claims and status.
 * @public
 */
export interface ICapacityConverters {
  readonly charge: Converter<ITaskCapacityCharge>;
  readonly limits: Converter<TaskCapacityLimits>;
  readonly perOwner: Converter<ITaskPerOwnerLimits>;
  readonly encoded: Converter<ITaskEncodedBounds>;
  readonly profile: Converter<ITaskCapacityProfile>;
  readonly claimOwner: Converter<CapacityClaimOwner>;
  readonly claim: Converter<ITaskCapacityClaim>;
  readonly claims: Converter<ReadonlyArray<ITaskCapacityClaim>>;
  readonly dimensionStatus: Converter<ITaskCapacityDimensionStatus>;
  readonly status: Converter<ITaskCapacityStatus>;
}

/**
 * Checks that a profile's limits can hold one protected bundle of charges.
 */
/**
 * Adds two bundles dimension by dimension.
 */
function _combine(
  a: ReadonlyArray<ITaskCapacityCharge>,
  b: ReadonlyArray<ITaskCapacityCharge>
): ReadonlyArray<ITaskCapacityCharge> {
  const totals: Map<CapacityDimension, number> = new Map<CapacityDimension, number>();
  for (const charge of [...a, ...b]) {
    totals.set(charge.dimension, (totals.get(charge.dimension) ?? 0) + charge.amount);
  }
  return Array.from(totals.entries()).map(([dimension, amount]) => ({ dimension, amount }));
}

function _fits(
  charges: ReadonlyArray<ITaskCapacityCharge>,
  profile: ITaskCapacityProfile,
  what: string
): Result<ReadonlyArray<ITaskCapacityCharge>> {
  for (const charge of charges) {
    const limit: number = profile.limits[charge.dimension];
    if (charge.amount > limit) {
      return fail(
        `capacity profile: ${what} needs ${charge.amount} of '${charge.dimension}' but the ` +
          `limit is ${limit}; a profile must be able to finish the work it can accept`
      );
    }
  }
  return succeed(charges);
}

/**
 * Builds the {@link ICapacityConverters}.
 *
 * @remarks
 * These converters validate repository-generated data on its way to and from storage.
 * They are deliberately **not** reachable from any request, command or tool-argument
 * shape: a claim is something the repository computes, never authority a caller issues.
 * @public
 */
export function buildCapacityConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters,
  failures: IFailureConverters
): ICapacityConverters {
  const charge: Converter<ITaskCapacityCharge> = Converters.strictObject<ITaskCapacityCharge>({
    dimension: failures.capacityDimension,
    amount: nonNegativeSafeInteger
  });

  const charges: Converter<ReadonlyArray<ITaskCapacityCharge>> = boundedArrayOf(
    charge,
    allCapacityDimensions.length,
    'capacity charges'
  ).withConstraint(
    (value: ReadonlyArray<ITaskCapacityCharge>): Result<ReadonlyArray<ITaskCapacityCharge>> => {
      const seen: Set<string> = new Set<string>();
      for (const entry of value) {
        if (seen.has(entry.dimension)) {
          return fail(`capacity charges: duplicate charge for dimension '${entry.dimension}'`);
        }
        seen.add(entry.dimension);
      }
      return succeed(value);
    }
  );

  const limits: Converter<TaskCapacityLimits> = Converters.strictObject<TaskCapacityLimits>({
    'retained-tasks': positiveSafeInteger,
    'non-archived-tasks': positiveSafeInteger,
    subscriptions: positiveSafeInteger,
    sources: positiveSafeInteger,
    updates: positiveSafeInteger,
    'audience-links': positiveSafeInteger,
    'acknowledgement-ids': positiveSafeInteger,
    operations: positiveSafeInteger,
    'record-bytes': positiveSafeInteger,
    'logical-bytes': positiveSafeInteger,
    'resident-payload-bytes': positiveSafeInteger
  });

  // `maxAudiencePerUpdate` is what `maximumClosureCharges` reserves audience links from,
  // and `bounds.maxReferences` is what a claim's audience is actually allowed to hold.
  // If the profile figure were the larger of the two, a profile would validate and reserve
  // room for an audience its own claim converter then refuses to encode — capacity
  // reserved for a claim that cannot exist. The two are bound together here, in the one
  // place both are in scope.
  const perOwner: Converter<ITaskPerOwnerLimits> = Converters.strictObject<ITaskPerOwnerLimits>({
    maxAcknowledgementIdsPerSubscription: positiveSafeInteger,
    maxOperationsPerTask: positiveSafeInteger,
    maxAudiencePerUpdate: positiveSafeInteger,
    maxOutstandingReceiptsPerSubscription: positiveSafeInteger
  }).withConstraint((value: ITaskPerOwnerLimits): Result<ITaskPerOwnerLimits> => {
    if (value.maxAudiencePerUpdate > bounds.maxReferences) {
      return fail(
        `capacity profile: maxAudiencePerUpdate ${value.maxAudiencePerUpdate} exceeds the ` +
          `reference bound of ${bounds.maxReferences}, so a claim reserving that audience ` +
          `could not be encoded`
      );
    }
    return succeed(value);
  });

  const encoded: Converter<ITaskEncodedBounds> = Converters.strictObject<ITaskEncodedBounds>({
    maxEnvelopeBytes: positiveSafeInteger,
    maxDetailBytes: positiveSafeInteger,
    maxUpdateBytes: positiveSafeInteger,
    maxOperationRequestBytes: positiveSafeInteger,
    maxStoredOperationBytes: positiveSafeInteger,
    maxIssuedReceiptBytes: positiveSafeInteger,
    maxSourceIdentityBytes: positiveSafeInteger,
    maxDispositionReasonBytes: positiveSafeInteger,
    maxQueryDescriptorBytes: positiveSafeInteger,
    maxSourceCursorBytes: positiveSafeInteger,
    maxTaskRecordBytes: positiveSafeInteger,
    maxConsumerRecordBytes: positiveSafeInteger,
    maxInventoryRecordBytes: positiveSafeInteger,
    maxSourceRecordBytes: positiveSafeInteger
  });

  // §8.6 allows a host to choose lower limits, but requires that "lower limits must still
  // accommodate the minimum closeout bundle". Without this check a profile such as
  // `updates: 1` converts happily while `maximumClosureCharges` still asks for seven — a
  // repository that can accept a task and then cannot finish it, which is precisely the
  // logical capacity deadlock the protected-completion design exists to prevent. A profile
  // that cannot hold its own protected path is rejected here, before admission reads it.
  const profile: Converter<ITaskCapacityProfile> = Converters.strictObject<ITaskCapacityProfile>({
    profileVersion: Converters.literal<1>(1),
    limits,
    perOwner,
    encoded
  }).withConstraint(
    (value: ITaskCapacityProfile): Result<ITaskCapacityProfile> =>
      mapResults([
        maximumClosureCharges(value).onSuccess((charges) => _fits(charges, value, 'terminal closeout')),
        maximumSettlementCharges(value).onSuccess((charges) =>
          _fits(charges, value, 'accepted-operation settlement')
        ),
        // An unresolved registration holds both bundles at once (T3), so the pair must fit
        // together, not merely each on its own.
        maximumClosureCharges(value).onSuccess((closeout) =>
          maximumResolutionCharges(value).onSuccess((resolution) =>
            _fits(_combine(closeout, resolution), value, 'unresolved registration (resolution + closeout)')
          )
        )
      ]).onSuccess(() => succeed(value))
  );

  // Each audience entry is one subscription's reserved link and acknowledgement evidence,
  // so a repeated id double-counts the same obligation — the same hazard as a duplicate
  // charge or a duplicate claim, one level further in.
  // Bounded by the shared reference bound rather than a private cap. Two reasons: a host
  // that lowers `maxReferences` expects it to apply everywhere, and — the load-bearing one
  // — `maximumClosureCharges` reserves `maxAudiencePerUpdate` links per payload, so an
  // audience larger than that bound would record more obligation than its own claim
  // reserved capacity for.
  const audience: Converter<ReadonlyArray<SubscriptionId>> = boundedArrayOf(
    ids.subscriptionId,
    bounds.maxReferences,
    'claim audience'
  ).withConstraint((value: ReadonlyArray<SubscriptionId>): Result<ReadonlyArray<SubscriptionId>> => {
    const seen: Set<SubscriptionId> = new Set<SubscriptionId>();
    for (const entry of value) {
      if (seen.has(entry)) {
        return fail(`claim audience: duplicate subscription id '${entry}'`);
      }
      seen.add(entry);
    }
    return succeed(value);
  });

  const claimOwner: Converter<CapacityClaimOwner> = Converters.discriminatedObject<CapacityClaimOwner>(
    'owner',
    {
      task: Converters.strictObject<Extract<CapacityClaimOwner, { owner: 'task' }>>({
        owner: Converters.literal('task'),
        taskId: ids.taskId
      }),
      subscription: Converters.strictObject<Extract<CapacityClaimOwner, { owner: 'subscription' }>>({
        owner: Converters.literal('subscription'),
        subscriptionId: ids.subscriptionId
      }),
      operation: Converters.strictObject<Extract<CapacityClaimOwner, { owner: 'operation' }>>({
        owner: Converters.literal('operation'),
        taskId: ids.taskId,
        operationId: ids.operationId
      })
    }
  );

  const common: {
    claimVersion: Converter<1>;
    claimId: IIdentityConverters['capacityClaimId'];
    owner: Converter<CapacityClaimOwner>;
    ownership: Converter<CapacityClaimOwnership>;
    disposition: Converter<CapacityClaimDisposition>;
    charges: Converter<ReadonlyArray<ITaskCapacityCharge>>;
  } = {
    claimVersion: Converters.literal<1>(1),
    claimId: ids.capacityClaimId,
    owner: claimOwner,
    ownership: Converters.enumeratedValue<CapacityClaimOwnership>(['pending', 'live']),
    disposition: Converters.enumeratedValue<CapacityClaimDisposition>([
      'reserved',
      'consumed',
      'indeterminate'
    ]),
    charges
  };

  const claim: Converter<ITaskCapacityClaim> = Converters.discriminatedObject<ITaskCapacityClaim>('purpose', {
    'terminal-closeout': Converters.strictObject<
      Extract<ITaskCapacityClaim, { purpose: 'terminal-closeout' }>
    >({
      ...common,
      purpose: Converters.literal('terminal-closeout'),
      taskId: ids.taskId,
      audience: audience
    }),
    'first-resolution': Converters.strictObject<Extract<ITaskCapacityClaim, { purpose: 'first-resolution' }>>(
      {
        ...common,
        purpose: Converters.literal('first-resolution'),
        taskId: ids.taskId
      }
    ),
    'accepted-operation-settlement': Converters.strictObject<
      Extract<ITaskCapacityClaim, { purpose: 'accepted-operation-settlement' }>
    >({
      ...common,
      purpose: Converters.literal('accepted-operation-settlement'),
      taskId: ids.taskId,
      operationId: ids.operationId
    }),
    'subscription-acknowledgement': Converters.strictObject<
      Extract<ITaskCapacityClaim, { purpose: 'subscription-acknowledgement' }>
    >({
      ...common,
      purpose: Converters.literal('subscription-acknowledgement'),
      subscriptionId: ids.subscriptionId,
      updateId: ids.updateId
    }),
    'receipt-preparation': Converters.strictObject<
      Extract<ITaskCapacityClaim, { purpose: 'receipt-preparation' }>
    >({
      ...common,
      purpose: Converters.literal('receipt-preparation'),
      subscriptionId: ids.subscriptionId
    }),
    'admitted-source-replay': Converters.strictObject<
      Extract<ITaskCapacityClaim, { purpose: 'admitted-source-replay' }>
    >({
      ...common,
      purpose: Converters.literal('admitted-source-replay'),
      sourceId: ids.sourceId,
      envelope: values.sourceReplayEnvelope
    })
  });

  // `capacityStatus()` is a *trusted* host API, so a row that contradicts itself is worse
  // than no row: admission would read false capacity from it. Two things are therefore
  // checked rather than assumed. The accounting identity is arithmetic, not a policy
  // choice — `available` is what is left. And `pressure` is documented as derived at
  // `capacityPressureThreshold`, so a row is not free to assert a different answer; if a
  // producer wants to report differently it must change the published threshold, not the
  // row.
  const dimensionStatus: Converter<ITaskCapacityDimensionStatus> =
    Converters.strictObject<ITaskCapacityDimensionStatus>({
      dimension: failures.capacityDimension,
      used: nonNegativeSafeInteger,
      reserved: nonNegativeSafeInteger,
      available: nonNegativeSafeInteger,
      limit: nonNegativeSafeInteger,
      pressure: Converters.boolean,
      limitingRecordIds: boundedArrayOf(
        boundedSingleLine(bounds.maxIdLength, 'record id'),
        32,
        'limiting record ids'
      )
    }).withConstraint((value: ITaskCapacityDimensionStatus): Result<ITaskCapacityDimensionStatus> => {
      const committed: number = value.used + value.reserved;
      if (committed + value.available !== value.limit) {
        return fail(
          `capacity status '${value.dimension}': used ${value.used} + reserved ${value.reserved} + ` +
            `available ${value.available} does not equal the limit of ${value.limit}`
        );
      }
      const expected: boolean = committed >= Math.ceil(value.limit * capacityPressureThreshold);
      if (value.pressure !== expected) {
        return fail(
          `capacity status '${value.dimension}': pressure is derived at ` +
            `${capacityPressureThreshold * 100}% of the limit, so it must be ${expected} here`
        );
      }
      return succeed(value);
    });

  // A status reports *every* dimension exactly once. A repeated row is ambiguous — two
  // `updates` rows cannot both be the used figure — and a missing one silently reads as a
  // dimension under no pressure, which is the wrong default for an admission input.
  const dimensions: Converter<ReadonlyArray<ITaskCapacityDimensionStatus>> = boundedArrayOf(
    dimensionStatus,
    allCapacityDimensions.length,
    'capacity dimensions'
  ).withConstraint(
    (
      value: ReadonlyArray<ITaskCapacityDimensionStatus>
    ): Result<ReadonlyArray<ITaskCapacityDimensionStatus>> => {
      const seen: Set<CapacityDimension> = new Set<CapacityDimension>();
      for (const entry of value) {
        if (seen.has(entry.dimension)) {
          return fail(`capacity status: duplicate row for dimension '${entry.dimension}'`);
        }
        seen.add(entry.dimension);
      }
      const missing: ReadonlyArray<CapacityDimension> = allCapacityDimensions.filter((d) => !seen.has(d));
      if (missing.length > 0) {
        return fail(`capacity status: no row for ${missing.map((d) => `'${d}'`).join(', ')}`);
      }
      return succeed(value);
    }
  );

  // Claim IDs are the join key recovery reconstructs reservations by, so a collection
  // holding the same id twice is an ambiguous ledger — and the safe reading of an
  // ambiguous reservation is that it is still held, which means a duplicate silently
  // double-counts. Reject it here rather than let a record carry it.
  const claims: Converter<ReadonlyArray<ITaskCapacityClaim>> = boundedArrayOf(
    claim,
    256,
    'capacity claims'
  ).withConstraint((value: ReadonlyArray<ITaskCapacityClaim>): Result<ReadonlyArray<ITaskCapacityClaim>> => {
    const seen: Set<CapacityClaimId> = new Set<CapacityClaimId>();
    for (const entry of value) {
      if (seen.has(entry.claimId)) {
        return fail(`capacity claims: duplicate claim id '${entry.claimId}'`);
      }
      seen.add(entry.claimId);
    }
    return succeed(value);
  });

  const status: Converter<ITaskCapacityStatus> = Converters.strictObject<ITaskCapacityStatus>({
    profileVersion: Converters.literal<1>(1),
    state: Converters.enumeratedValue<TaskCapacityState>(['ok', 'pressure', 'admission-blocked', 'draining']),
    dimensions
  });

  return {
    charge,
    limits,
    perOwner,
    encoded,
    profile,
    claimOwner,
    claim,
    claims,
    dimensionStatus,
    status
  };
}
