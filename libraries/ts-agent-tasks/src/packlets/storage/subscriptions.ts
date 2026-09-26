/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  CapacityClaimId,
  DeliveryId,
  IIssuedTaskReceipt,
  IResponsibility,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskConsumerRecord,
  ITaskEnvelope,
  ITaskScope,
  ITaskSubscription,
  Instant,
  SubscriptionId,
  TaskId,
  TaskLifecycleStatus,
  UpdateCategory,
  UpdateId
} from '../types';
import { DimensionAmounts, ILedgerEntry, heldCharges, zeroAmounts } from './ledger';
import { utf8Length } from './layout';
import { recordLimitFor } from './projection';
import { INormalizedSelection, normalizeSelection } from './queries';
import { labelKey } from './taskIndex';

// Subscriptions (T7): selection matching, audiences, the delivery units a task holds against each
// subscription that could be in its audience, and a subscription's derived ledger entry.

/**
 * The catalog fields a selection matches before lifecycle: what only registration or a catalog
 * operation changes.
 * @internal
 */
export interface ICatalogFields {
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
}

/**
 * An active subscription as the repository holds it resident: its descriptor, normalized selection
 * and the aggregates its ledger entry is derived from. Never its history or payloads.
 * @internal
 */
export interface ISubscriptionState {
  readonly descriptor: ITaskSubscription;
  readonly selection: INormalizedSelection;
  /** Canonical-encoding fingerprint of the record last written or read. */
  readonly fingerprint: string;
  /** Encoded bytes of that record. */
  readonly bytes: number;
  /** Exact ids in the record's history: acknowledged and disposed. */
  readonly history: number;
  readonly baselineCount: number;
  /** Encoded bytes of every baseline payload not yet acknowledged — the ones the index holds. */
  readonly baselineBytes: number;
  readonly issued: ReadonlyArray<IIssuedDescriptor>;
  readonly claims: ReadonlyArray<ITaskCapacityClaim>;
  /**
   * Update ids an unacknowledged manifest names: its pins (design § 7 keeps pin membership resident).
   * Planning reads them; cleanup still decides from the durable record.
   */
  readonly pinned: ReadonlySet<UpdateId>;
}

/**
 * One issued manifest's resident descriptor: enough to count, expire and size it.
 * @internal
 */
export interface IIssuedDescriptor {
  readonly deliveryId: DeliveryId;
  readonly expiresAt: Instant;
  readonly bytes: number;
  readonly acknowledged: boolean;
}

/** Canonical byte length of a validated value — see `taskUsage` for why this is exact. */
export function valueBytes(value: unknown): number {
  return utf8Length(JSON.stringify(value));
}

/**
 * Builds the resident state of a validated record.
 * @internal
 */
export function subscriptionState(
  record: ITaskConsumerRecord,
  fingerprint: string,
  bytes: number
): ISubscriptionState {
  return {
    descriptor: {
      id: record.id,
      consumerId: record.consumerId,
      selection: record.selection,
      start: record.start,
      policy: record.policy,
      state: record.state,
      recordRevision: record.recordRevision,
      createdAt: record.createdAt
    },
    selection: normalizeSelection(record.selection),
    fingerprint,
    bytes,
    history: record.acknowledged.length + record.disposed.length,
    baselineCount: record.baseline.length,
    // Only an unacknowledged baseline payload is resident: an acknowledged one is released by the
    // index, and stays only in the record, as exact history.
    baselineBytes: _unacknowledgedBytes(record),
    issued: record.issued.map(issuedDescriptor),
    claims: record.capacityClaims,
    pinned: new Set(
      record.issued
        .filter((m) => !m.acknowledged)
        .flatMap((m) => m.receipt.included.flatMap((e) => e.updateIds))
    )
  };
}

/**
 * Encoded bytes of the baseline payloads a record holds. A baseline payload leaves the record in the
 * write that acknowledges or disposes it (T8), so every one still held is owed.
 */
function _unacknowledgedBytes(record: ITaskConsumerRecord): number {
  return record.baseline.reduce((total, update) => total + valueBytes(update), 0);
}

/** The resident descriptor of one manifest. */
export function issuedDescriptor(issued: IIssuedTaskReceipt): IIssuedDescriptor {
  return {
    deliveryId: issued.deliveryId,
    expiresAt: issued.expiresAt,
    bytes: valueBytes(issued),
    acknowledged: issued.acknowledged
  };
}

/**
 * Whether a selection's catalog criteria — scope, responsibility, parent — admit these fields.
 * Lifecycle is ignored: it is what a task can still change without a catalog operation.
 * @internal
 */
export function catalogMatches(selection: INormalizedSelection, fields: ICatalogFields): boolean {
  if (selection.parentId !== undefined && fields.parentId !== selection.parentId) {
    return false;
  }
  if (selection.responsibility !== undefined) {
    if (
      fields.responsibility === undefined ||
      labelKey(fields.responsibility) !== labelKey(selection.responsibility)
    ) {
      return false;
    }
  }
  const scopes: ReadonlySet<string> = new Set(selection.scopes.map(labelKey));
  return fields.scopes.some((scope) => scopes.has(labelKey(scope)));
}

/**
 * Whether a selection matches a task's state exactly as it is: catalog criteria and its lifecycle
 * class and statuses.
 * @internal
 */
export function selectionMatches(selection: INormalizedSelection, envelope: ITaskEnvelope): boolean {
  const status: TaskLifecycleStatus = envelope.lifecycle.status;
  return catalogMatches(selection, envelope) && selection.statuses.includes(status);
}

/**
 * The audience of one update (design § 8.3): every active subscription that takes the category and
 * whose selection matched the task before **or** after the commit — so a task leaving a selection
 * still tells it why. Ascending, each once.
 * @internal
 */
export function audienceOf(
  subscriptions: Iterable<ISubscriptionState>,
  before: ITaskEnvelope | undefined,
  after: ITaskEnvelope,
  category: UpdateCategory
): ReadonlyArray<SubscriptionId> {
  const owed: SubscriptionId[] = [];
  for (const state of subscriptions) {
    if (!state.descriptor.policy.categories.includes(category)) {
      continue;
    }
    if (
      selectionMatches(state.selection, after) ||
      (before !== undefined && selectionMatches(state.selection, before))
    ) {
      owed.push(state.descriptor.id);
    }
  }
  return owed.sort();
}

/**
 * The catalog fields of a record, or `undefined` for one that can no longer be owed anything new:
 * an archived tombstone.
 * @internal
 */
export function catalogOf(record: ITaskCommitRecord): ICatalogFields | undefined {
  if (record.recordType === 'unresolved') {
    return record.reference;
  }
  return record.archived ? undefined : record.task.envelope;
}

/**
 * The encoded bytes of the receipt-preparation reservation: room for one maximum manifest, less
 * what the manifests already in the record occupy. Issuing converts it; evicting restores it; so
 * `used + reserved` for a subscription never grows from its first outstanding manifest.
 *
 * A subscription that can never prepare again — closed, owed nothing, holding no unacknowledged
 * manifest — holds none: that is the transient capacity closing it releases (T8).
 * @internal
 */
export function preparationBytes(
  profile: ITaskCapacityProfile,
  issued: ReadonlyArray<{ bytes: number }>,
  drainable: boolean = true
): number {
  if (!drainable) {
    return 0;
  }
  const held: number = issued.reduce((total, manifest) => total + manifest.bytes, 0);
  return Math.max(0, profile.encoded.maxIssuedReceiptBytes - held);
}

/**
 * Whether a subscription may still prepare a context: it is active, or — closed — it still owes
 * something or holds a manifest that is not acknowledged.
 * @internal
 */
export function isDrainable(
  state: ITaskConsumerRecord['state'],
  owed: number,
  issued: ReadonlyArray<{ acknowledged: boolean }>
): boolean {
  return state === 'active' || owed > 0 || issued.some((m) => !m.acknowledged);
}

/**
 * The receipt-preparation claim a record holds with these manifests.
 * @internal
 */
export function preparationClaim(
  claimId: CapacityClaimId,
  subscriptionId: SubscriptionId,
  profile: ITaskCapacityProfile,
  issued: ReadonlyArray<{ bytes: number }>,
  drainable: boolean = true
): ITaskCapacityClaim {
  const bytes: number = preparationBytes(profile, issued, drainable);
  return {
    claimVersion: 1,
    claimId,
    owner: { owner: 'subscription', subscriptionId },
    ownership: 'live',
    disposition: 'reserved',
    charges: [
      { dimension: 'record-bytes', amount: bytes },
      { dimension: 'logical-bytes', amount: bytes }
    ],
    purpose: 'receipt-preparation',
    subscriptionId
  };
}

/**
 * How many categories one delivery unit can owe a subscription: the categories it takes.
 * @internal
 */
export function unitWidth(state: ISubscriptionState): number {
  return state.descriptor.policy.categories.length;
}

/**
 * The per-subscription history a subscription has used or reserved: acknowledged ids, owed links,
 * and every future link its delivery units could add. Checked against
 * `maxAcknowledgementIdsPerSubscription`.
 * @internal
 */
export function historyCommitment(state: ISubscriptionState, owed: number, units: number): number {
  return state.history + owed + units * unitWidth(state);
}

/**
 * A subscription's ledger entry, derived from its record, its owed links and its delivery units.
 *
 * @remarks
 * used — one subscription identity; its baseline payloads, as updates, links and resident bytes; its
 * exact history, as acknowledgement ids; its record bytes. reserved — the acknowledgement evidence
 * of every owed link (transferred there, never minted, when the link was committed), the per-record
 * room its delivery units need, and the receipt-preparation claim.
 * @internal
 */
export function subscriptionEntry(
  state: ISubscriptionState,
  owed: number,
  units: number,
  profile: ITaskCapacityProfile
): ILedgerEntry {
  const evidence: number = profile.encoded.maxAcknowledgementEvidenceBytes;
  const used: DimensionAmounts = zeroAmounts();
  used.subscriptions = 1;
  used.updates = state.baselineCount;
  used['audience-links'] = state.baselineCount;
  used['acknowledgement-ids'] = state.history;
  used['record-bytes'] = state.bytes;
  used['logical-bytes'] = state.bytes;
  used['resident-payload-bytes'] = state.baselineBytes;
  const reserved: DimensionAmounts = heldCharges(state.claims);
  reserved['acknowledgement-ids'] += owed;
  reserved['logical-bytes'] += owed * evidence;
  reserved['record-bytes'] += (owed + units * unitWidth(state)) * evidence;
  return {
    recordId: state.descriptor.id,
    used,
    reserved,
    recordLimit: recordLimitFor(subscriptionKey(state.descriptor.id), profile),
    indeterminate: state.claims.some((claim) => claim.disposition === 'indeterminate'),
    perOwner: {
      amount: historyCommitment(state, owed, units),
      limit: profile.perOwner.maxAcknowledgementIdsPerSubscription
    }
  };
}

/**
 * The ledger key of a subscription's record.
 * @internal
 */
export function subscriptionKey(id: string): string {
  return `consumer:${id}`;
}
