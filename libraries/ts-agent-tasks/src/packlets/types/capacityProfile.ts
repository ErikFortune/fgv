/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  ITaskCapacityCharge,
  ITaskCapacityProfile,
  ITaskEncodedBounds,
  ITaskPerOwnerLimits,
  TaskCapacityLimits
} from './capacity';
import { allUpdateCategories } from './updates';

const KiB: number = 1024;
const MiB: number = 1024 * 1024;

/**
 * The proposed initial repository-wide limits.
 *
 * @remarks
 * Concrete proposed engineering defaults, **not measured safe maxima**. They must pass
 * the planned residency and reopen measurements before the profile is advertised.
 * @public
 */
export const defaultTaskCapacityLimits: TaskCapacityLimits = {
  'retained-tasks': 10000,
  'non-archived-tasks': 1000,
  subscriptions: 256,
  sources: 128,
  updates: 20000,
  'audience-links': 200000,
  'acknowledgement-ids': 200000,
  operations: 100000,
  'record-bytes': 8 * MiB,
  'logical-bytes': 512 * MiB,
  'resident-payload-bytes': 64 * MiB
};

/**
 * The proposed initial per-owner limits.
 * @public
 */
export const defaultTaskPerOwnerLimits: ITaskPerOwnerLimits = {
  maxAcknowledgementIdsPerSubscription: 50000,
  maxOperationsPerTask: 128,
  maxAudiencePerUpdate: 32,
  maxOutstandingReceiptsPerSubscription: 32
};

/**
 * The proposed initial encoded-size maxima.
 * @public
 */
export const defaultTaskEncodedBounds: ITaskEncodedBounds = {
  maxEnvelopeBytes: 32 * KiB,
  maxDetailBytes: 64 * KiB,
  maxUpdateBytes: 64 * KiB,
  maxOperationRequestBytes: 128 * KiB,
  maxStoredOperationBytes: 256 * KiB,
  maxIssuedReceiptBytes: 64 * KiB,
  maxSourceIdentityBytes: 4 * KiB,
  maxDispositionReasonBytes: 256,
  maxQueryDescriptorBytes: 32 * KiB,
  maxSourceCursorBytes: 4 * KiB,
  maxTaskRecordBytes: 8 * MiB,
  maxConsumerRecordBytes: 8 * MiB,
  maxInventoryRecordBytes: 8 * MiB,
  maxSourceRecordBytes: 1 * MiB
};

/**
 * The proposed initial capacity profile.
 *
 * @remarks
 * A finite horizon, not indefinite operation: v1 supplies no deletion, identity reset,
 * repository rotation with continuity, cross-root migration or compaction escape hatch.
 * Archiving and draining release payload and non-archived capacity; they do not release
 * retained identities, exact acknowledgement IDs or dedup evidence.
 * @public
 */
export const defaultTaskCapacityProfile: ITaskCapacityProfile = {
  profileVersion: 1,
  limits: defaultTaskCapacityLimits,
  perOwner: defaultTaskPerOwnerLimits,
  encoded: defaultTaskEncodedBounds
};

function _charges(
  entries: ReadonlyArray<readonly [ITaskCapacityCharge['dimension'], number]>
): ReadonlyArray<ITaskCapacityCharge> {
  return entries.map(([dimension, amount]) => ({ dimension, amount }));
}

/**
 * The maximum capacity a task's terminal closeout can charge, computed from schema
 * maxima alone.
 *
 * @remarks
 * A ceiling without protected completion space is not a ceiling — it could refuse the
 * terminal write or acknowledgement that would free capacity. So this bundle is
 * reserved at *acceptance*, before the task exists: one absorbing terminal snapshot
 * replacement, one required payload of each of the seven update categories with their
 * audience links and per-audience acknowledgement evidence, terminal operation
 * evidence, and one archive operation receipt.
 *
 * Closeout is a bounded path, not an unlimited emergency pool. Ordinary progress,
 * repeated attention changes, reassignment, new subscriptions and new command attempts
 * can all still be refused while this room is held.
 * @public
 */
export function maximumClosureCharges(profile: ITaskCapacityProfile): ReadonlyArray<ITaskCapacityCharge> {
  const categories: number = allUpdateCategories.length;
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  const encoded: ITaskEncodedBounds = profile.encoded;

  const snapshotBytes: number = encoded.maxEnvelopeBytes + encoded.maxDetailBytes;
  const updateBytes: number = categories * encoded.maxUpdateBytes;
  // Terminal operation evidence plus one archive operation receipt.
  const operationBytes: number = 2 * encoded.maxStoredOperationBytes;

  return _charges([
    ['updates', categories],
    ['audience-links', categories * audience],
    ['acknowledgement-ids', categories * audience],
    ['operations', 2],
    ['record-bytes', snapshotBytes + updateBytes + operationBytes],
    ['logical-bytes', snapshotBytes + updateBytes + operationBytes],
    ['resident-payload-bytes', updateBytes]
  ]);
}

/**
 * The maximum capacity settling one already-accepted operation can charge.
 *
 * @remarks
 * Reserved before dispatch and held while the result is uncertain, so an accepted
 * attempt can always settle — even at pressure, and without consuming another ordinary
 * operation slot. A fresh retry under a *new* identity is new admission, not an
 * entitlement created by the first attempt.
 * @public
 */
export function maximumSettlementCharges(profile: ITaskCapacityProfile): ReadonlyArray<ITaskCapacityCharge> {
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  const encoded: ITaskEncodedBounds = profile.encoded;
  const bytes: number =
    encoded.maxStoredOperationBytes + encoded.maxIssuedReceiptBytes + encoded.maxUpdateBytes;

  return _charges([
    ['updates', 1],
    ['audience-links', audience],
    ['acknowledgement-ids', audience],
    ['record-bytes', bytes],
    ['logical-bytes', bytes],
    ['resident-payload-bytes', encoded.maxUpdateBytes]
  ]);
}
