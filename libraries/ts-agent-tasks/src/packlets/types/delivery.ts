/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, Result } from '@fgv/ts-utils';
import { IBoundTaskViewParams } from './broker';
import { ITaskCapacityClaim } from './capacity';
import { ITaskContext, ITaskContextBudget, ITaskInclusionReceipt } from './context';
import { TaskResult } from './failure';
import { ConsumerId, DeliveryId, Instant, OperationId, PageCursor, SubscriptionId, UpdateId } from './ids';
import { ITaskSelection } from './query';
import { SourceHistoryContract } from './source';
import { ITaskUpdate, UpdateCategory } from './updates';

/**
 * Where a subscription's obligations start (design § 9).
 *
 * @remarks
 * - `current` — the subscription is owed a baseline: every selected task it may see, as it is at
 *   activation, including current attention and selected terminal tasks.
 * - `from-now` — no baseline; only commits after activation. The host chooses this explicitly.
 *
 * There is no implicit historical replay in either.
 * @public
 */
export type SubscriptionStart = 'current' | 'from-now';

/**
 * The update categories every subscription is owed, whatever else it asks for: a terminal outcome
 * arrives as `lifecycle` and `result`, and attention is always required delivery (design § 9).
 * @public
 */
export const mandatoryDeliveryCategories: ReadonlyArray<UpdateCategory> = [
  'attention',
  'lifecycle',
  'result'
];

/**
 * The categories a subscription is owed when its host names none: the required categories.
 * Routine `progress` and `observation` freshness are opt-in.
 * @public
 */
export const defaultDeliveryCategories: ReadonlyArray<UpdateCategory> = [
  'assignment',
  'attention',
  'lifecycle',
  'relationship',
  'result'
];

/**
 * A subscription's delivery policy, persisted with it (design § 9).
 *
 * @remarks
 * **The stored policy is authoritative.** It is never reconstructed from a host's current defaults
 * on reopen: changing the defaults changes what *new* subscriptions get, not what an existing one is
 * owed.
 *
 * - `durability` — the checkpoint guarantee the subscription was admitted with. Delivery refuses to
 *   run against a repository or checkpoint store weaker than it.
 * - `history` — `source-replay` promises every required external revision; admitting an external
 *   task that cannot keep that promise into the subscription's selection is refused, never
 *   downgraded.
 * - `categories` — the update categories the subscription is owed, ascending and unique; always a
 *   superset of {@link mandatoryDeliveryCategories}.
 *
 * (T7: the design sketch's `requiredCategories` is named `categories` here, because membership in
 * it is what makes a subscription part of an update's audience; whether an update is *required* —
 * cannot be coalesced or expire — remains a property of its category. The sketch's
 * `coalesceProgress` is T8's: this release never coalesces.)
 * @public
 */
export interface ITaskDeliveryPolicy {
  readonly schemaVersion: 1;
  readonly durability: 'session' | 'process-crash';
  readonly history: SourceHistoryContract;
  readonly categories: ReadonlyArray<UpdateCategory>;
}

/**
 * One exact issued-receipt manifest: the complete inclusion the renderer produced for one
 * delivery, bound into its subscription's record (design § 9, *Receipt provenance*).
 *
 * @remarks
 * `receipt` is compared with a presented receipt in full canonical form, never by hash or by
 * maximum revision. `acknowledged` becomes `true` exactly once, in the commit that adds the
 * receipt's update IDs to the subscription's history; a replay of it afterwards is recognized, not
 * applied again. Expiry and abandonment remove the manifest — its pin — and never the obligations
 * it named or the history it produced.
 * @public
 */
export interface IIssuedTaskReceipt {
  readonly deliveryId: DeliveryId;
  readonly receipt: ITaskInclusionReceipt;
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
  readonly acknowledged: boolean;
}

/**
 * A subscription's single atomic record (`consumer-<subscriptionId>.json`): its specification,
 * baseline obligations, exact acknowledgement history and issued-receipt manifests.
 *
 * @remarks
 * `acknowledged` is the **exact** set of update IDs this subscription has acknowledged, strictly
 * ascending. There is no high-water revision: an update is discharged only by its own ID being here.
 * The set is retained for the record's whole life — task archival does not shrink it — and is read
 * on demand, never kept resident.
 *
 * `baseline` holds the start obligations of a `current` subscription, each an immutable payload
 * whose audience is this subscription alone. `capacityClaims` holds the activation claim (consumed
 * once the record is live) and the receipt-preparation claim.
 *
 * (T7: named `ITaskConsumerRecord` to sit beside `ITaskSourceRecord`. The design sketch's `disposed`
 * set and a `closed` state belong to T8's disposition and closure, and are not part of this release's
 * record.)
 * @public
 */
export interface ITaskConsumerRecord {
  readonly formatVersion: 1;
  readonly id: SubscriptionId;
  readonly recordRevision: number;
  /** The registration that created the record: what a replay of it must repeat. */
  readonly registration: { readonly operationId: OperationId; readonly principalKey: string };
  readonly consumerId: ConsumerId;
  readonly selection: ITaskSelection;
  readonly start: SubscriptionStart;
  readonly policy: ITaskDeliveryPolicy;
  readonly state: 'active';
  readonly createdAt: Instant;
  readonly baseline: ReadonlyArray<ITaskUpdate>;
  readonly acknowledged: ReadonlyArray<UpdateId>;
  readonly issued: ReadonlyArray<IIssuedTaskReceipt>;
  readonly capacityClaims: ReadonlyArray<ITaskCapacityClaim>;
}

/**
 * What identifies a subscription registration: the specification a retry must repeat exactly.
 * @public
 */
export interface ITaskSubscriptionSpecification {
  readonly consumerId: ConsumerId;
  readonly selection: ITaskSelection;
  readonly start: SubscriptionStart;
  readonly policy: ITaskDeliveryPolicy;
}

/**
 * A subscription's resident descriptor: everything but its history and payloads.
 * @public
 */
export interface ITaskSubscription extends ITaskSubscriptionSpecification {
  readonly id: SubscriptionId;
  readonly state: 'active';
  readonly recordRevision: number;
  readonly createdAt: Instant;
}

/**
 * The persistence port under a repository's subscription records (design § 9,
 * `IConsumerCheckpointStore`).
 *
 * @remarks
 * Injected into the repository, which stays the one coordinator: every call happens under its
 * single writer, and everything the store returns is validated rather than trusted. A store that
 * throws, returns a record for another subscription, returns something other than the record last
 * written, or claims a write it did not make is detected — at the call, or at the next read — and
 * fails closed: nothing acknowledgeable is produced from it, and the repository fences.
 *
 * `durability` is the guarantee the store gives a successful `write`. A repository opened
 * `process-crash` refuses a `session` store: a weak checkpoint cannot be paired with durable task
 * state.
 *
 * Synchronous, like the rest of the storage layer. (T7: the design sketch's store is asynchronous;
 * the repository's open scan and commit path are synchronous throughout, and making them async to
 * accommodate a store no consumer has asked for would widen every caller.)
 * @public
 */
export interface ITaskCheckpointStore {
  readonly durability: 'session' | 'process-crash';
  /** The stored record, or `undefined` when there is none. Validated by the repository. */
  read(subscriptionId: SubscriptionId): Result<unknown>;
  /**
   * Replaces the record, which must currently be at `expectedRecordRevision` (`0`: absent). A
   * failure's detail says whether the store is sure nothing changed (`unchanged`) or cannot say
   * (`unknown`); only `unchanged` leaves the repository usable.
   */
  write(
    subscriptionId: SubscriptionId,
    expectedRecordRevision: number,
    record: ITaskConsumerRecord
  ): DetailedResult<true, CheckpointWriteVisibility>;
}

/**
 * What a reader can see after a failed checkpoint write.
 * @public
 */
export type CheckpointWriteVisibility = 'unchanged' | 'unknown';

/**
 * A storage-level subscription registration — the ordered inventory protocol applied to a consumer
 * record.
 *
 * @remarks
 * `operationId`, `principalKey` and `specification` are the registration's identity: a retry with
 * all three equal resumes a pending registration or replays a live one; anything else under the
 * subscription id is refused. `baseline` is what the caller captured under the same writer; a
 * resumed registration writes the retry's baseline, or adopts the first record that already landed.
 * @public
 */
export interface ITaskSubscriptionRegistration {
  readonly subscriptionId: SubscriptionId;
  readonly operationId: OperationId;
  readonly principalKey: string;
  readonly specification: ITaskSubscriptionSpecification;
  readonly baseline: ReadonlyArray<ITaskUpdate>;
  readonly createdAt: Instant;
}

/**
 * Issues one receipt manifest into a subscription's record.
 * @public
 */
export interface ITaskReceiptIssue {
  readonly subscriptionId: SubscriptionId;
  readonly expectedRecordRevision: number;
  /** The renderer's receipt. Must carry a delivery id not already in the record. */
  readonly receipt: ITaskInclusionReceipt;
  /** Now. Manifests that expire at or before it are evicted in the same write. */
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
}

/**
 * Acknowledges one issued manifest.
 * @public
 */
export interface ITaskReceiptAcknowledgement {
  readonly subscriptionId: SubscriptionId;
  readonly expectedRecordRevision: number;
  readonly deliveryId: DeliveryId;
  /** Now. A manifest that expires at or before it is refused. */
  readonly at: Instant;
}

/**
 * Removes one issued manifest before it expires.
 * @public
 */
export interface ITaskReceiptAbandonment {
  readonly subscriptionId: SubscriptionId;
  readonly expectedRecordRevision: number;
  readonly deliveryId: DeliveryId;
}

/**
 * The result of an acknowledgement (design § 9).
 *
 * @remarks
 * `newlyAcknowledged` were added to the subscription's exact history by this call;
 * `alreadyAcknowledged` were in it before — a replay of the same receipt, or an ID another receipt
 * already delivered. Neither list is ever a range: each is the receipt's own IDs, split.
 * @public
 */
export interface IAcknowledgementResult {
  readonly subscriptionId: SubscriptionId;
  readonly deliveryId: DeliveryId;
  readonly newlyAcknowledged: ReadonlyArray<UpdateId>;
  readonly alreadyAcknowledged: ReadonlyArray<UpdateId>;
}

/**
 * What storage returns from a committed acknowledgement.
 * @public
 */
export interface ITaskAcknowledgementCommit extends IAcknowledgementResult {
  readonly record: ITaskConsumerRecord;
}

/**
 * A request to create a subscription through {@link TaskBroker.subscribe}.
 *
 * @remarks
 * `policy` members omitted take the broker's delivery defaults, which are then persisted: later
 * changes to those defaults never reach this subscription. A selection is fixed for the
 * subscription's life — a different selection is a different subscription.
 * @public
 */
export interface ISubscribeRequest {
  readonly subscriptionId: SubscriptionId;
  readonly operationId: OperationId;
  readonly consumerId: ConsumerId;
  readonly selection: ITaskSelection;
  readonly start: SubscriptionStart;
  readonly policy?: Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>;
}

/**
 * Parameters for {@link TaskBroker.bindDelivery}: a principal binding, plus the subscription it
 * consumes and the consumer identity that owns it.
 * @public
 */
export interface IBoundTaskDeliveryParams extends IBoundTaskViewParams {
  readonly subscriptionId: SubscriptionId;
  readonly consumerId: ConsumerId;
}

/**
 * A page of the updates a bound delivery is owed and may currently see, projected.
 *
 * @remarks
 * `withheld` counts owed updates on this page that the principal may not currently see: they stay
 * owed — revocation blocks delivery, it never acknowledges — and they are not described.
 * @public
 */
export interface ITaskDeliveryPage {
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly withheld: number;
  readonly nextCursor?: PageCursor;
}

/**
 * A prepared context: the pure renderer's output, whose receipt has been issued durably.
 * @public
 */
export interface IPreparedTaskContext {
  readonly context: ITaskContext;
  readonly deliveryId: DeliveryId;
  readonly expiresAt: Instant;
}

/**
 * A subscription's delivery, bound to one principal (design § 9, `IBoundTaskDelivery`).
 *
 * @remarks
 * `prepare` is the only operation that writes before the host has processed anything, and what it
 * writes is the receipt manifest — never an acknowledgement. The host keeps the receipt outside the
 * prompt and calls `acknowledge` after its own successful-processing boundary; an aborted call
 * simply never acknowledges. There is no model-facing acknowledgement.
 * @public
 */
export interface IBoundTaskDelivery {
  readonly subscriptionId: SubscriptionId;
  pending(request?: {
    readonly limit?: number;
    readonly cursor?: PageCursor;
  }): Promise<TaskResult<ITaskDeliveryPage>>;
  prepare(budget?: ITaskContextBudget): Promise<TaskResult<IPreparedTaskContext>>;
  acknowledge(receipt: unknown): Promise<TaskResult<IAcknowledgementResult>>;
  /** Removes an issued manifest early. Its obligations stay owed; its history, if any, stays. */
  abandon(deliveryId: DeliveryId): Promise<TaskResult<DeliveryId>>;
}
