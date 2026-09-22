/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  CapacityClaimDisposition,
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
  allCapacityDimensions
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

  const perOwner: Converter<ITaskPerOwnerLimits> = Converters.strictObject<ITaskPerOwnerLimits>({
    maxAcknowledgementIdsPerSubscription: positiveSafeInteger,
    maxOperationsPerTask: positiveSafeInteger,
    maxAudiencePerUpdate: positiveSafeInteger,
    maxOutstandingReceiptsPerSubscription: positiveSafeInteger
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

  const profile: Converter<ITaskCapacityProfile> = Converters.strictObject<ITaskCapacityProfile>({
    profileVersion: Converters.literal<1>(1),
    limits,
    perOwner,
    encoded
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
      audience: boundedArrayOf(ids.subscriptionId, 256, 'claim audience')
    }),
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
    });

  const status: Converter<ITaskCapacityStatus> = Converters.strictObject<ITaskCapacityStatus>({
    profileVersion: Converters.literal<1>(1),
    state: Converters.enumeratedValue<TaskCapacityState>(['ok', 'pressure', 'admission-blocked', 'draining']),
    dimensions: boundedArrayOf(dimensionStatus, allCapacityDimensions.length, 'capacity dimensions')
  });

  return {
    charge,
    limits,
    perOwner,
    encoded,
    profile,
    claimOwner,
    claim,
    claims: boundedArrayOf(claim, 256, 'capacity claims'),
    dimensionStatus,
    status
  };
}
