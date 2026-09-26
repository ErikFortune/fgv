/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { CapacityDimension } from './failure';
import { CapacityClaimId, OperationId, SubscriptionId, TaskId } from './ids';
import { ISourceReplayEnvelope } from './source';

/**
 * The encoded-size maxima the capacity ledger reserves against.
 *
 * @remarks
 * Bytes are canonical UTF-8 serialized lengths, never estimated heap sizes. Every
 * reservation uses a *schema maximum* from this table rather than an optimistic guess
 * at a final outcome's size — which is what makes the maximum completion and settlement
 * charges computable before acceptance (see {@link maximumClosureCharges} and
 * {@link maximumSettlementCharges}).
 * @public
 */
export interface ITaskEncodedBounds {
  /** Maximum encoded bytes of a task summary/envelope. */
  readonly maxEnvelopeBytes: number;
  /** Maximum encoded bytes of a task's kind-specific details. */
  readonly maxDetailBytes: number;
  /** Maximum encoded bytes of one immutable update payload. */
  readonly maxUpdateBytes: number;
  /** Maximum encoded bytes of one command or catalog operation request. */
  readonly maxOperationRequestBytes: number;
  /** Maximum encoded bytes of one stored operation, request and receipt together. */
  readonly maxStoredOperationBytes: number;
  /** Maximum encoded bytes of one issued receipt manifest. */
  readonly maxIssuedReceiptBytes: number;
  /** Maximum encoded bytes of one canonical source identity. */
  readonly maxSourceIdentityBytes: number;
  /** Maximum encoded bytes of one disposition reason. */
  readonly maxDispositionReasonBytes: number;
  /**
   * Maximum encoded bytes one exact acknowledgement or disposition adds to a subscription's record.
   *
   * @remarks
   * The unit of *acknowledgement evidence* (design § 8.6, protected allocation 2): every audience
   * link a commit adds reserves one acknowledgement id and this many bytes before it is accepted, so
   * the acknowledgement that later discharges it never needs new capacity. (T7: added.)
   */
  readonly maxAcknowledgementEvidenceBytes: number;
  /** Maximum encoded bytes of one normalized selection or query descriptor. */
  readonly maxQueryDescriptorBytes: number;
  /** Maximum encoded bytes of one source cursor or revision token. */
  readonly maxSourceCursorBytes: number;
  /** Maximum encoded bytes of one whole task record. */
  readonly maxTaskRecordBytes: number;
  /** Maximum encoded bytes of one whole consumer record. */
  readonly maxConsumerRecordBytes: number;
  /** Maximum encoded bytes of the repository inventory record. */
  readonly maxInventoryRecordBytes: number;
  /** Maximum encoded bytes of one broker source-checkpoint record. */
  readonly maxSourceRecordBytes: number;
}

/**
 * Per-owner count limits that sit below the repository-wide dimensions.
 * @public
 */
export interface ITaskPerOwnerLimits {
  /** Maximum exact acknowledgement/disposition IDs retained for one subscription. */
  readonly maxAcknowledgementIdsPerSubscription: number;
  /** Maximum stored command and catalog operations for one task. */
  readonly maxOperationsPerTask: number;
  /** Maximum audience subscriptions attached to one update. */
  readonly maxAudiencePerUpdate: number;
  /** Maximum concurrently outstanding issued-receipt manifests for one subscription. */
  readonly maxOutstandingReceiptsPerSubscription: number;
}

/**
 * The repository-wide limit for each {@link CapacityDimension}.
 * @public
 */
export type TaskCapacityLimits = {
  readonly [dimension in CapacityDimension]: number;
};

/**
 * The versioned whole-repository capacity policy.
 *
 * @remarks
 * Stored with the repository so that a host's changed defaults cannot silently
 * reinterpret an existing repository on reopen. Limits may be raised explicitly under
 * exclusive ownership; lowering them in place is unsupported in v1.
 *
 * These are proposed engineering defaults, **not measured safe maxima** — see
 * {@link defaultTaskCapacityProfile}.
 * @public
 */
export interface ITaskCapacityProfile {
  readonly profileVersion: 1;
  readonly limits: TaskCapacityLimits;
  readonly perOwner: ITaskPerOwnerLimits;
  readonly encoded: ITaskEncodedBounds;
}

/**
 * One dimension's charge against the capacity ledger.
 * @public
 */
export interface ITaskCapacityCharge {
  readonly dimension: CapacityDimension;
  readonly amount: number;
}

/**
 * What a capacity claim reserves room for.
 *
 * @remarks
 * These six purposes are exactly the protected allocations: a task's terminal closeout,
 * an unresolved registration's first resolution, an accepted operation's settlement, a
 * subscription's activation, a subscription's reusable receipt preparation, and an admitted
 * source replay envelope.
 *
 * `first-resolution` was added by T3. Design §8.6 requires that "any unresolved
 * registration also reserves first resolution and the path through terminal closeout" —
 * two bundles, not one — and T1's five purposes had nowhere to put the first.
 *
 * `subscription-activation` replaced T1's `subscription-acknowledgement` in T7. A stored claim per
 * (subscription, update) would be committed in the task record and consumed in the consumer record —
 * two records, the cross-record ambiguity §8.6 warns against. Instead the audience link *is* the
 * reservation: a commit that adds links spends their acknowledgement evidence from the task's own
 * claims, and the subscription's ledger entry holds it, derived from its owed links, until the exact
 * ID lands in its history. What a subscription does need a stored claim for is the window between
 * its pending inventory entry and its live record, which is what `subscription-activation` holds.
 * @public
 */
export type CapacityClaimPurpose =
  | 'terminal-closeout'
  | 'first-resolution'
  | 'accepted-operation-settlement'
  | 'subscription-activation'
  | 'receipt-preparation'
  | 'admitted-source-replay';

/**
 * Which record currently owns a claim.
 *
 * @remarks
 * Ownership moves by stable claim ID during the ordered registration protocol — a
 * pending inventory entry owns a claim until its record goes live. Transfer never
 * double-charges and never releases early.
 * @public
 */
export type CapacityClaimOwner =
  | { readonly owner: 'task'; readonly taskId: TaskId }
  | { readonly owner: 'subscription'; readonly subscriptionId: SubscriptionId }
  | { readonly owner: 'operation'; readonly taskId: TaskId; readonly operationId: OperationId };

/**
 * Whether a claim is still held by its pending registration or by its live record.
 * @public
 */
export type CapacityClaimOwnership = 'pending' | 'live';

/**
 * Whether a claim's charge is still reserved or has been converted to committed use.
 *
 * @remarks
 * A `reserved` claim's `charges` are what it *still* holds. A protected step spends from its
 * own claim and the claim's charges shrink by what was spent, so the ledger's
 * `used + reserved` is unchanged by a step that stays within its reservation — the committed
 * data replaces the reservation it was made from. A `consumed` claim reserves nothing; its
 * remaining charges are retained as evidence of what was released. (T3 revision: T1 described
 * conversion as a disposition change only, which cannot express a closeout path that spends
 * its reservation across two steps — the terminal transition and the archive.)
 *
 * `indeterminate` is not an error state to clear on sight: ambiguity about whether a
 * claim was consumed fences admission and cleanup until recovery resolves it, because
 * the one thing a finite ledger must never do is assume the capacity is free.
 * @public
 */
export type CapacityClaimDisposition = 'reserved' | 'consumed' | 'indeterminate';

/**
 * The fields every {@link ITaskCapacityClaim} carries, whatever its purpose.
 * @public
 */
export interface ITaskCapacityClaimCommon {
  readonly claimVersion: 1;
  readonly claimId: CapacityClaimId;
  readonly owner: CapacityClaimOwner;
  readonly ownership: CapacityClaimOwnership;
  readonly disposition: CapacityClaimDisposition;
  readonly charges: ReadonlyArray<ITaskCapacityCharge>;
}

/**
 * A repository-generated reservation of capacity, discriminated on `purpose`.
 *
 * @remarks
 * **Claims are data the repository computes, never authority a caller issues.** No
 * request, command or tool argument type in this library accepts one, and every
 * request converter is strict, so a caller-supplied `capacityClaims` property is a
 * conversion failure rather than an overspend.
 *
 * Each variant carries the identities needed to reconstruct its consumption after a
 * crash. Acknowledgement evidence is not a claim at all: it is joined by exact update ID and
 * subscription at open, so a committed acknowledgement is counted as history rather than also
 * as an unused reservation.
 * @public
 */
export type ITaskCapacityClaim =
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'terminal-closeout';
      readonly taskId: TaskId;
      readonly audience: ReadonlyArray<SubscriptionId>;
    })
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'first-resolution';
      readonly taskId: TaskId;
    })
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'accepted-operation-settlement';
      readonly taskId: TaskId;
      readonly operationId: OperationId;
    })
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'subscription-activation';
      readonly subscriptionId: SubscriptionId;
    })
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'receipt-preparation';
      readonly subscriptionId: SubscriptionId;
    })
  | (ITaskCapacityClaimCommon & {
      readonly purpose: 'admitted-source-replay';
      readonly sourceId: string;
      readonly envelope: ISourceReplayEnvelope;
    });

/**
 * Used, reserved and available for one dimension, with the records that limit it.
 * @public
 */
export interface ITaskCapacityDimensionStatus {
  readonly dimension: CapacityDimension;
  readonly used: number;
  readonly reserved: number;
  readonly available: number;
  readonly limit: number;
  /** True once `used + reserved` reaches 80% of `limit`. */
  readonly pressure: boolean;
  readonly limitingRecordIds: ReadonlyArray<string>;
}

/**
 * Overall admission state of a repository.
 *
 * @remarks
 * Capacity pressure is deliberately distinct from corruption and index health: a full
 * valid repository opens in `draining`, not as something broken. Reads, acknowledgement,
 * disposition, settlement of already-accepted work, pruning and archive all remain callable
 * in every state.
 *
 * T3 settled what separates the two blocked states:
 * - `draining` — at least one dimension has no headroom left (`available === 0`). Ordinary
 *   growth that needs that dimension is refused; growth that does not is still admitted.
 * - `admission-blocked` — admission is fenced *regardless of headroom*, because a claim's
 *   consumption is `indeterminate`. The ledger cannot know what is free, so it admits nothing.
 * - `pressure` — some dimension is at or past {@link capacityPressureThreshold}.
 * @public
 */
export type TaskCapacityState = 'ok' | 'pressure' | 'admission-blocked' | 'draining';

/**
 * Every {@link CapacityClaimPurpose}.
 * @public
 */
export const allCapacityClaimPurposes: ReadonlyArray<CapacityClaimPurpose> = [
  'terminal-closeout',
  'first-resolution',
  'accepted-operation-settlement',
  'subscription-activation',
  'receipt-preparation',
  'admitted-source-replay'
];

/**
 * Trusted host-facing capacity status. Never exposed unredacted through a model tool.
 * @public
 */
export interface ITaskCapacityStatus {
  readonly profileVersion: 1;
  readonly state: TaskCapacityState;
  readonly dimensions: ReadonlyArray<ITaskCapacityDimensionStatus>;
}

/**
 * The fraction of a dimension's limit at which {@link ITaskCapacityDimensionStatus.pressure}
 * is reported.
 * @public
 */
export const capacityPressureThreshold: number = 0.8;
