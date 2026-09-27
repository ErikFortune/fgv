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
import { defaultTaskFieldBounds } from './bounds';
import { allUpdateCategories, maxUpdateIdSuffixLength } from './updates';

const KiB: number = 1024;
const MiB: number = 1024 * 1024;

/**
 * The default repository-wide limits.
 *
 * @remarks
 * Engineering defaults chosen in T8 (2026-09-26): a best guess, documented, with room to tune —
 * **not measured safe maxima for any particular host**. M1 (T8, 2026-09-26) qualified the
 * *structure* they rest on — minimal archived residency, release of terminal presentation on
 * archive, and cold-open and rebuild peaks bounded independently of archived history — but no
 * measurement holds a repository at these ceilings. In particular the heap cost of a full
 * `resident-payload-bytes` budget is unmeasured; M1's terminal cohort retained about 1.4 heap bytes
 * per encoded presentation byte, which a host should expect to apply before relying on it.
 *
 * **What the defaults admit.** Limits are checked together and the first to fill governs. Every
 * registration reserves its terminal closeout (`maximumClosureCharges`), about 976 KiB of
 * `logical-bytes`, so under these defaults **`logical-bytes` binds first**: 536 plain tracked
 * registrations, fewer with commands in flight or subscriptions holding baselines. The
 * `non-archived-tasks` limit of 1,000 is therefore not reachable under the default profile; it is
 * a ceiling for a host that raises `logical-bytes`, `audience-links` and `acknowledgement-ids`
 * (each 224 per registration), not a promise this profile keeps.
 *
 * **Tuning.** Every default here may be raised: an existing repository through the writer's
 * `raiseCapacityLimits` (the profile is stored at initialization and a stored limit can be
 * raised, never lowered, in v1); a new repository by passing an explicit profile to
 * `initialize`. The default binds only repositories created without one, so changing it later
 * never reinterprets an existing repository.
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
  // Per record, not aggregate: each record kind is also held to its own encoded bound (task and
  // inventory 8 MiB, source 1 MiB), so this ceiling only matters to the consumer record, whose bound
  // is 32 MiB. Raised from 8 MiB with it; below 32 MiB it would silently cap that bound.
  'record-bytes': 32 * MiB,
  'logical-bytes': 512 * MiB,
  // Owed and pinned update payloads are held in memory at their encoded size, plus reservations for
  // payloads not yet written. Each registration reserves 7 x 37,417 B (see `maximumUpdateBytes`), so
  // this admits 1,537 plain registrations, 1,345 with one command in flight each, 1,195 with a
  // command and one `current` subscription's baseline each. Raised from 64 MiB (T8), where it
  // bound first; `logical-bytes` now binds before it.
  'resident-payload-bytes': 384 * MiB
};

/**
 * The default per-owner limits.
 *
 * @remarks
 * `maxAcknowledgementIdsPerSubscription` (50,000) is a lifetime charge: closing a subscription
 * keeps its exact history. A consumer record holding it reserves up to
 * 50,000 x `maxAcknowledgementEvidenceBytes` (512 B) = 24.41 MiB, which the default
 * `maxConsumerRecordBytes` of 32 MiB covers with its 64 KiB receipt-preparation claim.
 * @public
 */
export const defaultTaskPerOwnerLimits: ITaskPerOwnerLimits = {
  maxAcknowledgementIdsPerSubscription: 50000,
  maxOperationsPerTask: 128,
  maxAudiencePerUpdate: 32,
  maxOutstandingReceiptsPerSubscription: 32
};

/**
 * The default encoded-size maxima.
 *
 * @remarks
 * `maxUpdateBytes` (64 KiB) is a bound on what storage accepts, not the size an update can reach.
 * An update carries one envelope, bounded by `maxEnvelopeBytes`, plus fixed framing, so under
 * these defaults no update can exceed **37,417 bytes** — see `maximumUpdateBytes`, which every
 * forward reservation uses instead. Lowering `maxUpdateBytes` to that figure is left undone on
 * purpose: a stored limit cannot be raised back once lowered, and the reservations no longer
 * depend on it.
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
  maxAcknowledgementEvidenceBytes: 512,
  maxQueryDescriptorBytes: 32 * KiB,
  maxSourceCursorBytes: 4 * KiB,
  maxTaskRecordBytes: 8 * MiB,
  // 50,000 lifetime acknowledgement ids x 512 B of evidence = 24.41 MiB, plus the 64 KiB
  // receipt-preparation claim and any baselines. Raised from 8 MiB (T8), which covered 16,384.
  maxConsumerRecordBytes: 32 * MiB,
  maxInventoryRecordBytes: 8 * MiB,
  maxSourceRecordBytes: 1 * MiB
};

/**
 * The default capacity profile: {@link defaultTaskCapacityLimits},
 * {@link defaultTaskPerOwnerLimits} and {@link defaultTaskEncodedBounds}. Their remarks say what
 * each admits and how to raise it.
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

/**
 * A bundle's logical bytes: its own record growth plus the acknowledgement evidence of every link
 * it reserves, which the subscriptions those links name will hold until each is acknowledged.
 */
function _evidenceLogical(
  recordBytes: number,
  links: number,
  profile: ITaskCapacityProfile,
  what: string
): Result<number> {
  return _product(links, profile.encoded.maxAcknowledgementEvidenceBytes, `${what} evidence bytes`).onSuccess(
    (evidence) => _sum([recordBytes, evidence], `${what} logical bytes`)
  );
}

function _charges(
  entries: ReadonlyArray<readonly [CapacityDimension, number]>
): ReadonlyArray<ITaskCapacityCharge> {
  return entries.map(([dimension, amount]) => ({ dimension, amount }));
}

/**
 * The most bytes one owed update can encode to under a profile: the smaller of
 * `maxUpdateBytes` and the update's derived schema maximum.
 *
 * @remarks
 * An update carries an audience, a category, an optional coalescing marker, its id, `required`, a
 * revision, a snapshot of one envelope, and its task id; storage admits a new update only when that
 * envelope is exactly the
 * committed envelope — itself bounded by `maxEnvelopeBytes` — and its audience holds at most
 * `maxAudiencePerUpdate` subscription ids. Everything else is fixed framing: identifiers bounded
 * by the field bound `maxIdLength` (which construction may lower and never raise, so its default
 * is a ceiling for every repository), revisions that are safe integers, and the closed category
 * set. So an update can never be larger than `maxEnvelopeBytes` plus that framing, whatever
 * `maxUpdateBytes` says: under the default profile, **37,417 bytes** against a `maxUpdateBytes`
 * of 64 KiB.
 *
 * This is the unit every forward reservation of an update's payload uses — the terminal closeout,
 * a first resolution and an accepted operation's settlement. A reservation guarantees a step not
 * yet taken, so it must be the most that step could need; this is the most, and `maxUpdateBytes`
 * is not. It is computed rather than stored, so a profile never has to be rewritten to tighten it.
 *
 * Fails rather than returning an inexact figure when the bounds push the sum past the safe-integer
 * range.
 * @public
 */
export function maximumUpdateBytes(profile: ITaskCapacityProfile): Result<number> {
  const idLength: number = defaultTaskFieldBounds.maxIdLength;
  const id: string = 'x'.repeat(idLength);
  const longest: string = allUpdateCategories.reduce((a, b) => (b.length > a.length ? b : a));
  const audience: number = profile.perOwner.maxAudiencePerUpdate;
  // Every field at its widest at once, keys in canonical (sorted) order, with an empty audience and a
  // one-character stand-in for the envelope. The fields are ASCII and escape-free by their
  // converters, so the stringified length is the canonical UTF-8 length. Fields that cannot coexist
  // — a coalescing marker on a required category — are all counted, which keeps this an upper bound.
  const framing: string = JSON.stringify({
    audience: [],
    category: longest,
    coalesced: { fromRevision: Number.MAX_SAFE_INTEGER },
    id: `${id}${'x'.repeat(maxUpdateIdSuffixLength)}`,
    required: false,
    revision: Number.MAX_SAFE_INTEGER,
    snapshot: { envelope: 0 },
    taskId: id
  });
  // Each audience member is a quoted id, and all but the first are preceded by a comma.
  return _product(audience, idLength + 3, 'derived audience bytes')
    .onSuccess((members) =>
      _sum([framing.length - 1, members - 1, profile.encoded.maxEnvelopeBytes], 'derived update bytes')
    )
    .onSuccess((derived) => succeed(Math.min(derived, profile.encoded.maxUpdateBytes)))
    .withErrorFormat((message: string) => `maximumUpdateBytes: ${message}`);
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
 * Acknowledgement evidence is `acknowledgement-ids` plus `maxAcknowledgementEvidenceBytes` of
 * `logical-bytes` per link (T7). When a commit adds those links, their evidence is *spent* from
 * this claim and held by the subscriptions they name until each exact acknowledgement lands — a
 * transfer, never a second charge.
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
    updateBytes: () =>
      maximumUpdateBytes(profile).onSuccess((unit) => _product(categories, unit, 'closeout update bytes')),
    // Terminal operation evidence plus one archive operation receipt.
    operationBytes: () => _product(2, encoded.maxStoredOperationBytes, 'closeout operation bytes')
  })
    .onSuccess((parts) =>
      _sum([parts.snapshotBytes, parts.updateBytes, parts.operationBytes], 'closeout record bytes').onSuccess(
        (recordBytes) =>
          _evidenceLogical(recordBytes, parts.links, profile, 'closeout').onSuccess((logicalBytes) =>
            succeed(
              _charges([
                ['updates', categories],
                ['audience-links', parts.links],
                ['acknowledgement-ids', parts.links],
                ['operations', 2],
                ['record-bytes', recordBytes],
                ['logical-bytes', logicalBytes],
                ['resident-payload-bytes', parts.updateBytes]
              ])
            )
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

  return maximumUpdateBytes(profile)
    .onSuccess((unit) =>
      _sum(
        [encoded.maxStoredOperationBytes, encoded.maxIssuedReceiptBytes, unit],
        'settlement record bytes'
      ).onSuccess((bytes) =>
        _evidenceLogical(bytes, audience, profile, 'settlement').onSuccess((logicalBytes) =>
          succeed(
            _charges([
              ['updates', 1],
              ['audience-links', audience],
              ['acknowledgement-ids', audience],
              ['record-bytes', bytes],
              ['logical-bytes', logicalBytes],
              ['resident-payload-bytes', unit]
            ])
          )
        )
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
    updateBytes: () =>
      maximumUpdateBytes(profile).onSuccess((unit) => _product(categories, unit, 'resolution update bytes'))
  })
    .onSuccess((parts) =>
      _sum([parts.snapshotBytes, parts.updateBytes], 'resolution record bytes').onSuccess((recordBytes) =>
        _evidenceLogical(recordBytes, parts.links, profile, 'resolution').onSuccess((logicalBytes) =>
          succeed(
            _charges([
              ['updates', categories],
              ['audience-links', parts.links],
              ['acknowledgement-ids', parts.links],
              ['record-bytes', recordBytes],
              ['logical-bytes', logicalBytes],
              ['resident-payload-bytes', parts.updateBytes]
            ])
          )
        )
      )
    )
    .withErrorFormat((message: string) => `maximumResolutionCharges: ${message}`);
}
