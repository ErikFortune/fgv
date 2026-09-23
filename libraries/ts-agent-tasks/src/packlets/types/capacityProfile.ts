/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, populateObject, succeed } from '@fgv/ts-utils';
import { CapacityDimension } from './failure';
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

/**
 * Multiplies two safe integers, failing rather than returning an inexact product.
 *
 * @remarks
 * A charge is an admission input, so "approximately the maximum" is not a usable answer.
 * Past 2^53 a product of integers stops being exactly representable, and
 * `Number.isSafeInteger` is exactly the predicate for that — so a profile whose bounds
 * push a charge out of range fails here, before any reservation is computed from it,
 * rather than quietly reserving the wrong amount.
 */
function _product(a: number, b: number, what: string): Result<number> {
  const value: number = a * b;
  if (!Number.isSafeInteger(value)) {
    return fail(`${what}: ${a} x ${b} is not exactly representable; the profile's bounds are too large`);
  }
  return succeed(value);
}

/** Adds safe integers, failing rather than returning an inexact sum. */
function _sum(terms: ReadonlyArray<number>, what: string): Result<number> {
  const value: number = terms.reduce((total: number, term: number) => total + term, 0);
  if (!Number.isSafeInteger(value)) {
    return fail(`${what}: the sum is not exactly representable; the profile's bounds are too large`);
  }
  return succeed(value);
}

function _charges(
  entries: ReadonlyArray<readonly [CapacityDimension, number]>
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
 *
 * Fails rather than returning an inexact figure when the profile's bounds push a product or
 * sum past the safe-integer range: a charge is an admission input, so "approximately the
 * maximum" is not a usable answer.
 * @public
 */
export function maximumClosureCharges(
  profile: ITaskCapacityProfile
): Result<ReadonlyArray<ITaskCapacityCharge>> {
  const categories: number = allUpdateCategories.length;
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  const encoded: ITaskEncodedBounds = profile.encoded;

  return populateObject<{
    links: number;
    snapshotBytes: number;
    updateBytes: number;
    operationBytes: number;
  }>({
    links: () => _product(categories, audience, 'closeout audience links'),
    snapshotBytes: () => _sum([encoded.maxEnvelopeBytes, encoded.maxDetailBytes], 'closeout snapshot bytes'),
    updateBytes: () => _product(categories, encoded.maxUpdateBytes, 'closeout update bytes'),
    // Terminal operation evidence plus one archive operation receipt.
    operationBytes: () => _product(2, encoded.maxStoredOperationBytes, 'closeout operation bytes')
  })
    .onSuccess((parts) =>
      _sum([parts.snapshotBytes, parts.updateBytes, parts.operationBytes], 'closeout record bytes').onSuccess(
        (recordBytes) =>
          succeed(
            _charges([
              ['updates', categories],
              ['audience-links', parts.links],
              ['acknowledgement-ids', parts.links],
              ['operations', 2],
              ['record-bytes', recordBytes],
              ['logical-bytes', recordBytes],
              ['resident-payload-bytes', parts.updateBytes]
            ])
          )
      )
    )
    .withErrorFormat((message: string) => `maximumClosureCharges: ${message}`);
}

/**
 * The maximum capacity settling one already-accepted operation can charge.
 *
 * @remarks
 * Reserved before dispatch and held while the result is uncertain, so an accepted
 * attempt can always settle — even at pressure, and without consuming another ordinary
 * operation slot. A fresh retry under a *new* identity is new admission, not an
 * entitlement created by the first attempt.
 *
 * Fails rather than returning an inexact figure when the profile's bounds push a product or
 * sum past the safe-integer range: a charge is an admission input, so "approximately the
 * maximum" is not a usable answer.
 * @public
 */
export function maximumSettlementCharges(
  profile: ITaskCapacityProfile
): Result<ReadonlyArray<ITaskCapacityCharge>> {
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  const encoded: ITaskEncodedBounds = profile.encoded;

  return _sum(
    [encoded.maxStoredOperationBytes, encoded.maxIssuedReceiptBytes, encoded.maxUpdateBytes],
    'settlement record bytes'
  )
    .onSuccess((bytes) =>
      succeed(
        _charges([
          ['updates', 1],
          ['audience-links', audience],
          ['acknowledgement-ids', audience],
          ['record-bytes', bytes],
          ['logical-bytes', bytes],
          ['resident-payload-bytes', encoded.maxUpdateBytes]
        ])
      )
    )
    .withErrorFormat((message: string) => `maximumSettlementCharges: ${message}`);
}

/**
 * The maximum capacity an unresolved registration's first resolution can charge.
 *
 * @remarks
 * Design §8.6: "any unresolved registration also reserves first resolution and the path
 * through terminal closeout". First resolution replaces the unresolved reference with a
 * whole snapshot and may owe one required payload of every update category, so this is the
 * snapshot plus the per-category payloads, their audience links and acknowledgement
 * evidence. It is reserved *in addition to* {@link maximumClosureCharges}, because the task
 * that resolves must still be able to finish.
 *
 * Fails rather than returning an inexact figure, for the same reason as the closeout bundle.
 * @public
 */
export function maximumResolutionCharges(
  profile: ITaskCapacityProfile
): Result<ReadonlyArray<ITaskCapacityCharge>> {
  const categories: number = allUpdateCategories.length;
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  const encoded: ITaskEncodedBounds = profile.encoded;

  return populateObject<{ links: number; snapshotBytes: number; updateBytes: number }>({
    links: () => _product(categories, audience, 'resolution audience links'),
    snapshotBytes: () =>
      _sum([encoded.maxEnvelopeBytes, encoded.maxDetailBytes], 'resolution snapshot bytes'),
    updateBytes: () => _product(categories, encoded.maxUpdateBytes, 'resolution update bytes')
  })
    .onSuccess((parts) =>
      _sum([parts.snapshotBytes, parts.updateBytes], 'resolution record bytes').onSuccess((recordBytes) =>
        succeed(
          _charges([
            ['updates', categories],
            ['audience-links', parts.links],
            ['acknowledgement-ids', parts.links],
            ['record-bytes', recordBytes],
            ['logical-bytes', recordBytes],
            ['resident-payload-bytes', parts.updateBytes]
          ])
        )
      )
    )
    .withErrorFormat((message: string) => `maximumResolutionCharges: ${message}`);
}
