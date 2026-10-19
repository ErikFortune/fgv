/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IAbandonCommandRequest,
  ICloseSubscriptionRequest,
  IDisposeObligationsRequest,
  IIssuedTaskReceipt,
  ITaskObligationDisposal,
  ITaskObligationDisposition,
  ITaskSubscriptionClosure,
  TaskSubscriptionClosureMode,
  TaskSubscriptionState,
  ILiveInventoryEntry,
  IPendingConsumerEntry,
  ISubscribeRequest,
  ITaskConsumerInventoryEntry,
  ITaskConsumerRecord,
  ITaskDeliveryPolicy,
  ITaskFieldBounds,
  ITaskReceiptAbandonment,
  ITaskReceiptAcknowledgement,
  ITaskReceiptIssue,
  ITaskSubscriptionRegistration,
  ITaskSubscriptionSpecification,
  ITaskUpdate,
  SourceHistoryContract,
  SubscriptionStart,
  UpdateCategory,
  allUpdateCategories,
  baselineUpdateId,
  mandatoryDeliveryCategories
} from '../types';
import { ICapacityConverters } from './capacityConverters';
import { IContextConverters } from './contextConverters';
import { IIdentityConverters } from './identityConverters';
import {
  boundedArrayOf,
  boundedSingleLine,
  instant,
  nonNegativeSafeInteger,
  positiveSafeInteger
} from './primitives';
import { IQueryConverters } from './queryConverters';

/**
 * Converters for subscriptions, their records and delivery requests (T7).
 * @public
 */
export interface IDeliveryConverters {
  readonly start: Converter<SubscriptionStart>;
  /** Categories strictly ascending, each once, including every mandatory one. */
  readonly categories: Converter<ReadonlyArray<UpdateCategory>>;
  readonly policy: Converter<ITaskDeliveryPolicy>;
  /** A partial policy — a subscribe request's overrides, or a broker's delivery defaults. */
  readonly policyOverrides: Converter<Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>>;
  readonly specification: Converter<ITaskSubscriptionSpecification>;
  readonly issued: Converter<IIssuedTaskReceipt>;
  /** A consumer record, with every invariant a record this release writes must keep. */
  readonly consumerRecord: Converter<ITaskConsumerRecord>;
  readonly consumerInventoryEntry: Converter<ITaskConsumerInventoryEntry>;
  readonly consumerInventory: Converter<ReadonlyArray<ITaskConsumerInventoryEntry>>;
  readonly subscribeRequest: Converter<ISubscribeRequest>;
  readonly registration: Converter<ITaskSubscriptionRegistration>;
  readonly receiptIssue: Converter<ITaskReceiptIssue>;
  readonly receiptAcknowledgement: Converter<ITaskReceiptAcknowledgement>;
  readonly receiptAbandonment: Converter<ITaskReceiptAbandonment>;
  /** One disposition entry of a consumer record. */
  readonly disposition: Converter<ITaskObligationDisposition>;
  /** A disposition reason: one non-empty line. Its byte bound is the stored profile's, checked by storage. */
  readonly dispositionReason: Converter<string>;
  readonly obligationDisposal: Converter<ITaskObligationDisposal>;
  readonly subscriptionClosure: Converter<ITaskSubscriptionClosure>;
  readonly disposeRequest: Converter<IDisposeObligationsRequest>;
  readonly closeRequest: Converter<ICloseSubscriptionRequest>;
  readonly abandonCommandRequest: Converter<IAbandonCommandRequest>;
}

/** Whether values are strictly ascending — unique and in canonical order. */
function _ascending(values: ReadonlyArray<string>): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] < value);
}

/**
 * A baseline obligation's own invariants: its identity is the baseline encoding of the revision it
 * carries, it is owed to its subscription alone, and it is required.
 */
function _baselineProblem(update: ITaskUpdate, subscriptionId: string): string | undefined {
  if (update.id !== baselineUpdateId(update.taskId, update.revision)) {
    return `baseline ${update.id}: identity disagrees with its content`;
  }
  if (update.audience.length !== 1 || update.audience[0] !== subscriptionId) {
    return `baseline ${update.id}: owed to its own subscription only`;
  }
  return update.required ? undefined : `baseline ${update.id}: a baseline obligation is required`;
}

/**
 * Builds the {@link IDeliveryConverters}.
 * @public
 */
export function buildDeliveryConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  context: IContextConverters,
  queries: IQueryConverters,
  capacity: ICapacityConverters
): IDeliveryConverters {
  const principalKey: Converter<string> = boundedSingleLine(bounds.maxSummaryLength, 'principal key');
  const start: Converter<SubscriptionStart> = Converters.enumeratedValue<SubscriptionStart>([
    'current',
    'from-now'
  ]);
  const history: Converter<SourceHistoryContract> = Converters.enumeratedValue<SourceHistoryContract>([
    'observed-state',
    'source-replay'
  ]);
  const durability: Converter<ITaskDeliveryPolicy['durability']> = Converters.enumeratedValue<
    ITaskDeliveryPolicy['durability']
  >(['session', 'process-crash']);

  const categories: Converter<ReadonlyArray<UpdateCategory>> = boundedArrayOf(
    context.updateCategory,
    allUpdateCategories.length,
    'delivery categories'
  ).withConstraint((value: ReadonlyArray<UpdateCategory>): Result<ReadonlyArray<UpdateCategory>> => {
    if (!_ascending(value)) {
      return fail(`delivery categories must be unique and ascending`);
    }
    const missing: ReadonlyArray<UpdateCategory> = mandatoryDeliveryCategories.filter(
      (c) => !value.includes(c)
    );
    return missing.length === 0
      ? succeed(value)
      : fail(`delivery categories must include the mandatory [${missing.join(', ')}]`);
  });

  const policy: Converter<ITaskDeliveryPolicy> = Converters.strictObject<ITaskDeliveryPolicy>({
    schemaVersion: Converters.literal<1>(1),
    durability,
    history,
    categories,
    coalesceProgress: Converters.boolean
  });
  const dispositionReason: Converter<string> = boundedSingleLine(
    bounds.maxSummaryLength,
    'disposition reason'
  );
  const disposition: Converter<ITaskObligationDisposition> =
    Converters.strictObject<ITaskObligationDisposition>({
      updateId: ids.updateId,
      reason: dispositionReason
    });
  const subscriptionState: Converter<TaskSubscriptionState> =
    Converters.enumeratedValue<TaskSubscriptionState>(['active', 'closed']);
  const closureMode: Converter<TaskSubscriptionClosureMode> =
    Converters.enumeratedValue<TaskSubscriptionClosureMode>(['retain', 'dispose']);

  const specification: Converter<ITaskSubscriptionSpecification> =
    Converters.strictObject<ITaskSubscriptionSpecification>({
      consumerId: ids.consumerId,
      selection: queries.selection,
      start,
      policy
    });

  const issued: Converter<IIssuedTaskReceipt> = Converters.strictObject<IIssuedTaskReceipt>({
    deliveryId: ids.deliveryId,
    receipt: context.receipt,
    issuedAt: instant,
    expiresAt: instant,
    acknowledged: Converters.boolean
  }).withConstraint((value: IIssuedTaskReceipt): Result<IIssuedTaskReceipt> => {
    if (value.receipt.deliveryId !== value.deliveryId) {
      return fail(`issued receipt ${value.deliveryId}: its receipt names another delivery`);
    }
    // Canonical instants are fixed-width, so code-unit order is time order.
    return value.expiresAt > value.issuedAt
      ? succeed(value)
      : fail(`issued receipt ${value.deliveryId}: it expires no later than it was issued`);
  });

  const consumerRecord: Converter<ITaskConsumerRecord> = Converters.strictObject<ITaskConsumerRecord>({
    formatVersion: Converters.literal<1>(1),
    id: ids.subscriptionId,
    recordRevision: positiveSafeInteger,
    registration: Converters.strictObject<ITaskConsumerRecord['registration']>({
      operationId: ids.operationId,
      principalKey
    }),
    consumerId: ids.consumerId,
    selection: queries.selection,
    start,
    policy,
    state: subscriptionState,
    createdAt: instant,
    baseline: Converters.arrayOf(context.update),
    acknowledged: Converters.arrayOf(ids.updateId),
    disposed: Converters.arrayOf(disposition),
    issued: Converters.arrayOf(issued),
    capacityClaims: capacity.claims
  }).withConstraint((value: ITaskConsumerRecord): Result<ITaskConsumerRecord> => {
    const what: string = `subscription ${value.id}`;
    // An exact history is a set. A repeat would count one acknowledgement twice; order is canonical.
    if (!_ascending(value.acknowledged)) {
      return fail(`${what}: acknowledged ids must be unique and ascending`);
    }
    // Dispositions are history too: one entry per id, canonical order, and never an id that was also
    // acknowledged — an obligation ends once.
    if (!_ascending(value.disposed.map((d) => d.updateId))) {
      return fail(`${what}: disposed ids must be unique and ascending`);
    }
    const acknowledged: ReadonlySet<string> = new Set<string>(value.acknowledged);
    const both = value.disposed.find((d) => acknowledged.has(d.updateId));
    if (both !== undefined) {
      return fail(`${what}: ${both.updateId} is both acknowledged and disposed`);
    }
    if (!_ascending(value.issued.map((m) => m.deliveryId))) {
      return fail(`${what}: issued receipts must be unique and ascending by delivery id`);
    }
    if (value.start === 'from-now' && value.baseline.length > 0) {
      return fail(`${what}: a from-now subscription has no baseline`);
    }
    if (!_ascending(value.baseline.map((b) => b.id))) {
      return fail(`${what}: baseline obligations must be unique and ascending`);
    }
    for (const update of value.baseline) {
      const problem: string | undefined = _baselineProblem(update, value.id);
      if (problem !== undefined) {
        return fail(`${what}: ${problem}`);
      }
    }
    return succeed(value);
  });

  const pending: Converter<IPendingConsumerEntry> = Converters.strictObject<IPendingConsumerEntry>({
    id: ids.subscriptionId,
    state: Converters.literal('pending'),
    operationId: ids.operationId,
    principalKey,
    specification,
    recordFingerprint: Converters.string.withConstraint((f) => /^\d+:[0-9a-f]+$/.test(f), {
      description: 'a record fingerprint'
    }),
    capacityClaims: capacity.claims
  });
  const consumerInventoryEntry: Converter<ITaskConsumerInventoryEntry> =
    Converters.discriminatedObject<ITaskConsumerInventoryEntry>('state', {
      live: Converters.strictObject<ILiveInventoryEntry>({
        id: ids.identifier,
        state: Converters.literal('live')
      }),
      pending
    });
  // One entry per subscription: two entries are two answers to "does this record have to exist".
  const consumerInventory: Converter<ReadonlyArray<ITaskConsumerInventoryEntry>> = Converters.arrayOf(
    consumerInventoryEntry
  ).withConstraint((value: ITaskConsumerInventoryEntry[]): Result<ITaskConsumerInventoryEntry[]> => {
    const seen: Set<string> = new Set<string>();
    for (const entry of value) {
      if (seen.has(entry.id)) {
        return fail(`consumer inventory: duplicate '${entry.id}'`);
      }
      seen.add(entry.id);
    }
    return succeed(value);
  });

  const policyOverrides: Converter<Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>> =
    Converters.strictObject<Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>>({
      durability: durability.optional(),
      history: history.optional(),
      categories: categories.optional(),
      coalesceProgress: Converters.boolean.optional()
    });

  const subscribeRequest: Converter<ISubscribeRequest> = Converters.strictObject<ISubscribeRequest>({
    subscriptionId: ids.subscriptionId,
    operationId: ids.operationId,
    consumerId: ids.consumerId,
    selection: queries.selection,
    start,
    policy: policyOverrides.optional()
  });

  const registration: Converter<ITaskSubscriptionRegistration> =
    Converters.strictObject<ITaskSubscriptionRegistration>({
      subscriptionId: ids.subscriptionId,
      operationId: ids.operationId,
      principalKey,
      specification,
      baseline: Converters.arrayOf(context.update),
      createdAt: instant
    });

  const receiptIssue: Converter<ITaskReceiptIssue> = Converters.strictObject<ITaskReceiptIssue>({
    subscriptionId: ids.subscriptionId,
    expectedRecordRevision: nonNegativeSafeInteger,
    receipt: context.receipt,
    issuedAt: instant,
    expiresAt: instant
  });
  const receiptAcknowledgement: Converter<ITaskReceiptAcknowledgement> =
    Converters.strictObject<ITaskReceiptAcknowledgement>({
      subscriptionId: ids.subscriptionId,
      expectedRecordRevision: nonNegativeSafeInteger,
      deliveryId: ids.deliveryId,
      at: instant
    });
  const receiptAbandonment: Converter<ITaskReceiptAbandonment> =
    Converters.strictObject<ITaskReceiptAbandonment>({
      subscriptionId: ids.subscriptionId,
      expectedRecordRevision: nonNegativeSafeInteger,
      deliveryId: ids.deliveryId
    });

  const updateIds: Converter<ReadonlyArray<ITaskObligationDisposal['updateIds'][number]>> =
    Converters.arrayOf(ids.updateId).withConstraint((value) =>
      value.length > 0 && _ascending(value)
        ? succeed(value)
        : fail(`update ids must be non-empty, unique and ascending`)
    );
  const obligationDisposal: Converter<ITaskObligationDisposal> =
    Converters.strictObject<ITaskObligationDisposal>({
      subscriptionId: ids.subscriptionId,
      expectedRecordRevision: nonNegativeSafeInteger,
      updateIds,
      reason: dispositionReason,
      at: instant
    });
  const closureRule = <T extends { obligations: TaskSubscriptionClosureMode; reason?: string }>(
    value: T
  ): Result<T> =>
    value.obligations === 'dispose' && value.reason === undefined
      ? fail(`closing with 'dispose' requires the disposition reason it records`)
      : succeed(value);
  const subscriptionClosure: Converter<ITaskSubscriptionClosure> =
    Converters.strictObject<ITaskSubscriptionClosure>({
      subscriptionId: ids.subscriptionId,
      expectedRecordRevision: nonNegativeSafeInteger,
      obligations: closureMode,
      reason: dispositionReason.optional()
    }).withConstraint(closureRule);
  const disposeRequest: Converter<IDisposeObligationsRequest> =
    Converters.strictObject<IDisposeObligationsRequest>({
      subscriptionId: ids.subscriptionId,
      updateIds,
      reason: dispositionReason
    });
  const closeRequest: Converter<ICloseSubscriptionRequest> =
    Converters.strictObject<ICloseSubscriptionRequest>({
      subscriptionId: ids.subscriptionId,
      obligations: closureMode,
      reason: dispositionReason.optional()
    }).withConstraint(closureRule);

  const abandonCommandRequest: Converter<IAbandonCommandRequest> =
    Converters.strictObject<IAbandonCommandRequest>({
      taskId: ids.taskId,
      operationId: ids.operationId,
      reason: dispositionReason
    });

  return {
    abandonCommandRequest,
    disposition,
    dispositionReason,
    obligationDisposal,
    subscriptionClosure,
    disposeRequest,
    closeRequest,
    start,
    categories,
    policy,
    policyOverrides,
    specification,
    issued,
    consumerRecord,
    consumerInventoryEntry,
    consumerInventory,
    subscribeRequest,
    registration,
    receiptIssue,
    receiptAcknowledgement,
    receiptAbandonment
  };
}
