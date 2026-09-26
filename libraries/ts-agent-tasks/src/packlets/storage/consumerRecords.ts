/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  CapacityClaimId,
  CheckpointWriteVisibility,
  IIssuedTaskReceipt,
  IInclusionEntry,
  IPendingConsumerEntry,
  ITaskAcknowledgementCommit,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskConsumerRecord,
  ITaskEnvironment,
  ITaskReceiptAbandonment,
  ITaskReceiptAcknowledgement,
  ITaskReceiptIssue,
  ITaskRepositoryManifest,
  ITaskSubscriptionRegistration,
  ITaskSubscriptionSpecification,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskResult,
  UpdateId,
  allCapacityDimensions,
  allUpdateCategories,
  baselineUpdateId,
  taskUpdateId
} from '../types';
import { CheckpointPort, IConsumerRead } from './checkpoints';
import { DeliveryBook } from './deliveryBook';
import { classify, mintId, ok, propagate, taskFailure } from './failures';
import { canonicallyEqual, recordName } from './layout';
import { CapacityLedger, DimensionAmounts, ILedgerEntry, zeroAmounts } from './ledger';
import { ITaskProjection, ledgerEntry, recordLimitFor } from './projection';
import { normalizeSelection } from './queries';
import {
  ISubscriptionState,
  historyCommitment,
  preparationClaim,
  selectionMatches,
  subscriptionEntry,
  subscriptionKey,
  subscriptionState,
  valueBytes
} from './subscriptions';
import { TaskIndex } from './taskIndex';

/**
 * What the subscription-record operations need from the repository that owns them.
 * @internal
 */
export interface ISubscriptionHost {
  readonly converters: TaskConverters;
  readonly environment: ITaskEnvironment;
  readonly checkpoints: CheckpointPort;
  /** The repository's own durability: what a stored delivery policy may not exceed. */
  readonly durability: 'session' | 'process-crash';
  profile(): ITaskCapacityProfile;
  ledger(): CapacityLedger;
  index(): TaskIndex;
  tasks(): ReadonlyMap<TaskId, ITaskProjection>;
  book(): DeliveryBook;
  manifest(): ITaskRepositoryManifest;
  /** The manifest's ledger entry at an encoded size, or the encoding failure. */
  manifestEntry(manifest: ITaskRepositoryManifest): TaskResult<ILedgerEntry>;
  /** Writes a manifest, fenced like every manifest rewrite, and makes it current. */
  writeManifest(manifest: ITaskRepositoryManifest, operationId: OperationId | undefined): TaskResult<true>;
  fence(reason: string): void;
  committed(): void;
}

/**
 * Slack added to an activation claim's byte charges: the live record holds the claim itself, so its
 * size depends on the digits of the charges it is computed from.
 */
const activationSlack: number = 256;

/**
 * Subscription records (T7): the ordered registration protocol, issued-receipt manifests and exact
 * acknowledgement, over the injected checkpoint store.
 *
 * @remarks
 * Every operation runs under the repository's single writer, reads the record through the store,
 * checks that it is the record the repository last committed, and refuses — fencing — when it is
 * not. Nothing is resident that the next read cannot re-derive.
 * @internal
 */
export class SubscriptionRecords {
  private readonly _host: ISubscriptionHost;

  public constructor(host: ISubscriptionHost) {
    this._host = host;
  }

  // ------------------------------------------------------------------------------------------
  // Registration — the ordered inventory protocol, applied to a consumer record
  // ------------------------------------------------------------------------------------------

  public register(request: ITaskSubscriptionRegistration): TaskResult<ITaskConsumerRecord> {
    const host: ISubscriptionHost = this._host;
    const converted: Result<ITaskSubscriptionRegistration> =
      host.converters.delivery.registration.convert(request);
    if (converted.isFailure()) {
      return taskFailure(`registerSubscription: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const registration: ITaskSubscriptionRegistration = converted.value;
    const id: SubscriptionId = registration.subscriptionId;
    const operationId: OperationId = registration.operationId;
    const durable: TaskResult<true> = this._durabilityFits(id, registration.specification);
    if (durable.isFailure()) {
      return propagate(durable);
    }
    const live: ISubscriptionState | undefined = host.book().subscriptions.get(id);
    if (live !== undefined) {
      return this._replay(live, registration);
    }
    const pending: IPendingConsumerEntry | undefined = host.book().pending.get(id);
    if (pending !== undefined && !this._sameIdentity(pending, registration)) {
      return taskFailure(
        `registerSubscription ${id}: a different registration of this subscription is pending`,
        'conflict',
        'after-host-action',
        { operationId }
      );
    }
    const admitted = host.book().admission({
      subscriptionId: id,
      specification: registration.specification,
      index: host.index(),
      tasks: host.tasks(),
      profile: host.profile()
    });
    if (admitted.isFailure()) {
      return propagate(admitted);
    }
    const baseline: TaskResult<true> = this._checkBaseline(registration);
    if (baseline.isFailure()) {
      return propagate(baseline);
    }
    if (pending !== undefined) {
      return this._resume(registration, pending, admitted.value.matched, admitted.value.units);
    }
    const existing: TaskResult<IConsumerRead | undefined> = this._read(id);
    if (existing.isFailure()) {
      return propagate(existing);
    }
    if (existing.value !== undefined) {
      return taskFailure(
        `registerSubscription ${id}: the checkpoint store already holds a record this repository never ` +
          `committed; it is left untouched`,
        'conflict',
        'after-host-action',
        { operationId }
      );
    }
    return this._mint().onSuccess((activationId) =>
      this._firstRecord(registration, activationId, undefined, admitted.value.units).onSuccess((first) =>
        this._pend(registration, first).onSuccess((entry) =>
          this._write(id, 0, first.read, operationId).onSuccess(() =>
            this._finish(entry, first, admitted.value.matched, admitted.value.units)
          )
        )
      )
    );
  }

  /** A policy may promise no more durability than the repository and its checkpoint store give. */
  private _durabilityFits(
    id: SubscriptionId,
    specification: ITaskSubscriptionSpecification
  ): TaskResult<true> {
    if (specification.policy.durability !== 'process-crash') {
      return ok(true);
    }
    if (
      this._host.durability !== 'process-crash' ||
      this._host.checkpoints.store.durability !== 'process-crash'
    ) {
      return taskFailure(
        `subscription ${id} requires process-crash delivery, and this repository or its checkpoint store is ` +
          `session-only`,
        'unsupported',
        'after-host-action'
      );
    }
    return ok(true);
  }

  private _sameIdentity(
    pending: IPendingConsumerEntry,
    registration: ITaskSubscriptionRegistration
  ): boolean {
    return canonicallyEqual(
      {
        operationId: pending.operationId,
        principalKey: pending.principalKey,
        specification: pending.specification
      },
      {
        operationId: registration.operationId,
        principalKey: registration.principalKey,
        specification: registration.specification
      }
    );
  }

  /** A registration whose subscription is live: the same one again replays; anything else conflicts. */
  private _replay(
    live: ISubscriptionState,
    registration: ITaskSubscriptionRegistration
  ): TaskResult<ITaskConsumerRecord> {
    const id: SubscriptionId = live.descriptor.id;
    return this._verified(live).onSuccess((read) => {
      const record: ITaskConsumerRecord = read.record;
      const same: boolean = canonicallyEqual(
        {
          registration: record.registration,
          specification: {
            consumerId: record.consumerId,
            selection: record.selection,
            start: record.start,
            policy: record.policy
          }
        },
        {
          registration: { operationId: registration.operationId, principalKey: registration.principalKey },
          specification: registration.specification
        }
      );
      if (!same) {
        return taskFailure<ITaskConsumerRecord>(
          `registerSubscription ${id}: this subscription is already registered by a different operation or ` +
            `specification`,
          'conflict',
          'after-host-action',
          { operationId: registration.operationId }
        );
      }
      // Re-establish the flush boundary a lost response may have skipped, byte for byte.
      return this._write(id, record.recordRevision, read, registration.operationId)
        .onSuccess(() => this._host.writeManifest(this._host.manifest(), registration.operationId))
        .onSuccess(() => ok(record));
    });
  }

  /**
   * A baseline is truthful: each obligation is a live task's current state, the task matches the
   * subscription's whole selection, and no task appears twice. Authorization may leave tasks out;
   * nothing may be put in that the repository did not commit.
   */
  private _checkBaseline(registration: ITaskSubscriptionRegistration): TaskResult<true> {
    const id: SubscriptionId = registration.subscriptionId;
    const index: TaskIndex = this._host.index();
    const selection = normalizeSelection(registration.specification.selection);
    if (registration.specification.start === 'from-now' && registration.baseline.length > 0) {
      return taskFailure(
        `registerSubscription ${id}: a from-now subscription has no baseline`,
        'invalid',
        'after-host-action'
      );
    }
    const seen: Set<TaskId> = new Set<TaskId>();
    for (const update of registration.baseline) {
      const current = index.summaries.get(update.taskId);
      const problem: string | undefined =
        current === undefined
          ? `task ${update.taskId} is not a live, non-archived task`
          : seen.has(update.taskId)
          ? `task ${update.taskId} appears twice`
          : !canonicallyEqual(current, update.snapshot)
          ? `the obligation for ${update.taskId} is not its current committed state`
          : !selectionMatches(selection, current.envelope)
          ? `task ${update.taskId} is not in the subscription's selection`
          : update.id !== baselineUpdateId(update.taskId, update.revision) ||
            update.audience.length !== 1 ||
            update.audience[0] !== id ||
            !update.required
          ? `the obligation for ${update.taskId} is not a baseline obligation of this subscription`
          : undefined;
      if (problem !== undefined) {
        return taskFailure(
          `registerSubscription ${id}: baseline: ${problem}`,
          'invalid',
          'after-host-action'
        );
      }
      seen.add(update.taskId);
    }
    return ok(true);
  }

  private _mint(): TaskResult<CapacityClaimId> {
    return classify(
      mintId(this._host.environment).onSuccess((raw) =>
        this._host.converters.ids.capacityClaimId.convert(raw)
      ),
      'storage-unavailable',
      'safe'
    );
  }

  /**
   * The first record of a registration and its live ledger entry. Its activation claim carries the
   * pending reservation's id; when there is no reservation yet, its charges are the record's whole
   * footprint, which the pending entry then reserves.
   */
  private _firstRecord(
    registration: ITaskSubscriptionRegistration,
    activationId: CapacityClaimId,
    reserved: ITaskCapacityClaim | undefined,
    units: number
  ): TaskResult<{
    readonly record: ITaskConsumerRecord;
    readonly read: IConsumerRead;
    readonly entry: ILedgerEntry;
  }> {
    const host: ISubscriptionHost = this._host;
    const profile: ITaskCapacityProfile = host.profile();
    const id: SubscriptionId = registration.subscriptionId;
    return this._mint().onSuccess((preparationId) => {
      const build = (charges: ITaskCapacityClaim['charges']): TaskResult<IConsumerRead> =>
        this._validated({
          formatVersion: 1,
          id,
          recordRevision: 1,
          registration: { operationId: registration.operationId, principalKey: registration.principalKey },
          ...registration.specification,
          state: 'active',
          createdAt: registration.createdAt,
          baseline: [...registration.baseline].sort((a, b) => (a.id < b.id ? -1 : 1)),
          acknowledged: [],
          issued: [],
          capacityClaims: [
            {
              claimVersion: 1,
              claimId: activationId,
              owner: { owner: 'subscription', subscriptionId: id },
              ownership: 'live',
              disposition: 'consumed',
              charges,
              purpose: 'subscription-activation',
              subscriptionId: id
            },
            preparationClaim(preparationId, id, profile, [])
          ]
        });
      const estimate: TaskResult<IConsumerRead> =
        reserved !== undefined ? build(reserved.charges) : build([]);
      return estimate.onSuccess((first) => {
        const owed: number = first.record.baseline.length;
        const state: ISubscriptionState = subscriptionState(first.record, first.fingerprint, first.bytes);
        if (historyCommitment(state, owed, units) > profile.perOwner.maxAcknowledgementIdsPerSubscription) {
          return taskFailure<{ record: ITaskConsumerRecord; read: IConsumerRead; entry: ILedgerEntry }>(
            `capacity: subscription ${id} would commit ${historyCommitment(
              state,
              owed,
              units
            )} acknowledgement ` +
              `ids at activation, over its limit of ${profile.perOwner.maxAcknowledgementIdsPerSubscription}`,
            'backpressure',
            'after-host-action',
            {
              capacity: {
                reason: 'capacity-exhausted',
                dimension: 'acknowledgement-ids',
                recordId: id,
                used: 0,
                reserved: 0,
                requested: historyCommitment(state, owed, units),
                limit: profile.perOwner.maxAcknowledgementIdsPerSubscription,
                reclaimableByCleanup: false
              }
            }
          );
        }
        const charges: ITaskCapacityClaim['charges'] =
          reserved !== undefined
            ? reserved.charges
            : _footprint(subscriptionEntry(state, owed, units, profile));
        return (reserved !== undefined ? ok(first) : build(charges)).onSuccess((final) => {
          const finalState: ISubscriptionState = subscriptionState(
            final.record,
            final.fingerprint,
            final.bytes
          );
          return ok({
            record: final.record,
            read: final,
            entry: subscriptionEntry(finalState, owed, units, profile)
          });
        });
      });
    });
  }

  /** Step 1: the pending inventory entry, holding the activation reservation. */
  private _pend(
    registration: ITaskSubscriptionRegistration,
    first: { readonly record: ITaskConsumerRecord; readonly read: IConsumerRead }
  ): TaskResult<IPendingConsumerEntry> {
    const host: ISubscriptionHost = this._host;
    const id: SubscriptionId = registration.subscriptionId;
    const activation: ITaskCapacityClaim = first.record.capacityClaims.find(
      (c) => c.purpose === 'subscription-activation'
    )!;
    const entry: IPendingConsumerEntry = {
      id,
      state: 'pending',
      operationId: registration.operationId,
      principalKey: registration.principalKey,
      specification: registration.specification,
      recordFingerprint: first.read.fingerprint,
      capacityClaims: [{ ...activation, ownership: 'pending', disposition: 'reserved' }]
    };
    const manifest: ITaskRepositoryManifest = _withConsumer(host.manifest(), entry);
    return host.manifestEntry(manifest).onSuccess((manifestEntry) => {
      const pendingLedger: ILedgerEntry = pendingEntryOf(entry, host.profile());
      return host
        .ledger()
        .admit(
          new Map([
            [subscriptionKey(id), pendingLedger],
            ['repository', manifestEntry]
          ])
        )
        .onSuccess(() => host.writeManifest(manifest, registration.operationId))
        .onSuccess(() => {
          host.book().pending.set(id, entry);
          host.ledger().apply(
            new Map([
              [subscriptionKey(id), pendingLedger],
              ['repository', manifestEntry]
            ])
          );
          host.committed();
          return ok(entry);
        });
    });
  }

  /** A resumed registration: adopt a first record that already landed, or write this one. */
  private _resume(
    registration: ITaskSubscriptionRegistration,
    entry: IPendingConsumerEntry,
    matched: ReadonlyArray<TaskId>,
    units: number
  ): TaskResult<ITaskConsumerRecord> {
    const id: SubscriptionId = registration.subscriptionId;
    const activation: ITaskCapacityClaim = entry.capacityClaims[0];
    return this._read(id).onSuccess((landed) => {
      if (landed !== undefined) {
        const problem: string | undefined = firstRecordProblem(landed, entry);
        if (problem !== undefined) {
          return taskFailure<ITaskConsumerRecord>(
            `registerSubscription ${id}: the checkpoint store holds a record that is not this registration's ` +
              `first record (${problem}); it is left untouched`,
            'conflict',
            'after-host-action',
            { operationId: registration.operationId }
          );
        }
        const state: ISubscriptionState = subscriptionState(landed.record, landed.fingerprint, landed.bytes);
        return this._finish(
          entry,
          {
            record: landed.record,
            read: landed,
            entry: subscriptionEntry(state, landed.record.baseline.length, units, this._host.profile())
          },
          matched,
          units
        );
      }
      // Nothing landed: this attempt's first record (a fresh baseline, a fresh preparation claim) is
      // committed to first, by re-pending under its fingerprint, and only then written.
      // The reservation is recomputed from this attempt's first record rather than trusted from the
      // entry, and re-admitted when the entry is re-pended below.
      return this._firstRecord(registration, activation.claimId, undefined, units).onSuccess((first) =>
        this._pend(registration, first).onSuccess((repended) =>
          this._write(id, 0, first.read, registration.operationId).onSuccess(() =>
            this._finish(repended, first, matched, units)
          )
        )
      );
    });
  }

  /** Steps 2–3: the record has landed; admit its live entry, mark the inventory live, activate. */
  private _finish(
    entry: IPendingConsumerEntry,
    first: {
      readonly record: ITaskConsumerRecord;
      readonly read: IConsumerRead;
      readonly entry: ILedgerEntry;
    },
    matched: ReadonlyArray<TaskId>,
    units: number
  ): TaskResult<ITaskConsumerRecord> {
    const host: ISubscriptionHost = this._host;
    const id: SubscriptionId = entry.id;
    const manifest: ITaskRepositoryManifest = _withConsumer(host.manifest(), { id, state: 'live' });
    return host.manifestEntry(manifest).onSuccess((manifestEntry) =>
      host
        .ledger()
        .admit(
          new Map([
            [subscriptionKey(id), first.entry],
            ['repository', manifestEntry]
          ])
        )
        .onSuccess(() => host.writeManifest(manifest, entry.operationId))
        .onSuccess(() => {
          const state: ISubscriptionState = subscriptionState(
            first.record,
            first.read.fingerprint,
            first.read.bytes
          );
          host.book().pending.delete(id);
          host.book().activate(state, matched, units);
          host.index().putBaseline(id, first.record.baseline);
          host.ledger().apply(
            new Map([
              [subscriptionKey(id), host.book().entry(id, host.index(), host.profile())],
              ['repository', manifestEntry]
            ])
          );
          host.committed();
          return ok(first.record);
        })
    );
  }

  // ------------------------------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------------------------------

  /** Reads a live subscription's record, checked against what the repository last committed. */
  public read(subscriptionId: SubscriptionId): TaskResult<ITaskConsumerRecord | undefined> {
    const converted = this._host.converters.ids.subscriptionId.convert(subscriptionId);
    if (converted.isFailure()) {
      return taskFailure(`readSubscription: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const state: ISubscriptionState | undefined = this._host.book().subscriptions.get(converted.value);
    return state === undefined ? ok(undefined) : this._verified(state).onSuccess((read) => ok(read.record));
  }

  // ------------------------------------------------------------------------------------------
  // Receipt manifests and exact acknowledgement
  // ------------------------------------------------------------------------------------------

  /**
   * Issues one receipt manifest: every update id it names is one the subscription is owed or has
   * already acknowledged, and belongs to the entry that names it. Expired manifests are evicted in
   * the same write, never the history they produced.
   */
  public issue(request: ITaskReceiptIssue): TaskResult<ITaskConsumerRecord> {
    const host: ISubscriptionHost = this._host;
    const converted = host.converters.delivery.receiptIssue.convert(request);
    if (converted.isFailure()) {
      return taskFailure(`issueReceipt: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const issue: ITaskReceiptIssue = converted.value;
    const deliveryId = issue.receipt.deliveryId;
    if (deliveryId === undefined) {
      return taskFailure(
        `issueReceipt: a receipt without a delivery id is a snapshot receipt; it cannot be issued`,
        'invalid',
        'after-host-action'
      );
    }
    if (issue.expiresAt <= issue.issuedAt) {
      return taskFailure(
        `issueReceipt: it would expire no later than it is issued`,
        'invalid',
        'after-host-action'
      );
    }
    return this._current(issue.subscriptionId, issue.expectedRecordRevision).onSuccess(
      ({ state, record }) => {
        const profile: ITaskCapacityProfile = host.profile();
        if (record.issued.some((m) => m.deliveryId === deliveryId)) {
          return taskFailure<ITaskConsumerRecord>(
            `issueReceipt: delivery ${deliveryId} is already issued`,
            'conflict',
            'after-host-action'
          );
        }
        const acknowledged: ReadonlySet<UpdateId> = new Set(record.acknowledged);
        for (const entry of issue.receipt.included) {
          const problem: string | undefined = _entryProblem(
            entry,
            (updateId) => acknowledged.has(updateId) || host.index().isOwed(record.id, updateId)
          );
          if (problem !== undefined) {
            return taskFailure<ITaskConsumerRecord>(`issueReceipt: ${problem}`, 'invalid-receipt', 'safe');
          }
        }
        const kept: IIssuedTaskReceipt[] = record.issued.filter((m) => m.expiresAt > issue.issuedAt);
        if (kept.length >= profile.perOwner.maxOutstandingReceiptsPerSubscription) {
          return taskFailure<ITaskConsumerRecord>(
            `capacity: subscription ${record.id} already has ${kept.length} unexpired receipts, the limit; ` +
              `acknowledge and abandon one, or let one expire`,
            'backpressure',
            'after-host-action',
            {
              capacity: {
                reason: 'capacity-exhausted',
                dimension: 'record-bytes',
                recordId: record.id,
                used: kept.length,
                reserved: 0,
                requested: 1,
                limit: profile.perOwner.maxOutstandingReceiptsPerSubscription,
                reclaimableByCleanup: true
              }
            }
          );
        }
        const manifest: IIssuedTaskReceipt = {
          deliveryId,
          receipt: issue.receipt,
          issuedAt: issue.issuedAt,
          expiresAt: issue.expiresAt,
          acknowledged: false
        };
        const manifestBytes: number = valueBytes(manifest);
        if (manifestBytes > profile.encoded.maxIssuedReceiptBytes) {
          return taskFailure<ITaskConsumerRecord>(
            `issueReceipt: the manifest is ${manifestBytes} bytes, over the bound of ` +
              `${profile.encoded.maxIssuedReceiptBytes}; prepare a smaller context`,
            'invalid',
            'after-host-action'
          );
        }
        const issued: IIssuedTaskReceipt[] = [...kept, manifest].sort((a, b) =>
          a.deliveryId < b.deliveryId ? -1 : 1
        );
        return this._replace(state, record, { issued });
      }
    );
  }

  /**
   * Acknowledges one issued manifest: exactly its update ids, split into those this call adds to the
   * subscription's history and those already there. A manifest already acknowledged is a replay and
   * writes nothing. An expired or unknown one is refused, changing nothing.
   */
  public acknowledge(request: ITaskReceiptAcknowledgement): TaskResult<ITaskAcknowledgementCommit> {
    const host: ISubscriptionHost = this._host;
    const converted = host.converters.delivery.receiptAcknowledgement.convert(request);
    if (converted.isFailure()) {
      return taskFailure(`acknowledgeReceipt: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const ack: ITaskReceiptAcknowledgement = converted.value;
    return this._current(ack.subscriptionId, ack.expectedRecordRevision).onSuccess(({ state, record }) => {
      const manifest: IIssuedTaskReceipt | undefined = record.issued.find(
        (m) => m.deliveryId === ack.deliveryId
      );
      if (manifest === undefined) {
        return taskFailure<ITaskAcknowledgementCommit>(
          `acknowledgeReceipt: no issued receipt ${ack.deliveryId} in subscription ${record.id}`,
          'invalid-receipt',
          'after-host-action'
        );
      }
      if (manifest.expiresAt <= ack.at) {
        return taskFailure<ITaskAcknowledgementCommit>(
          `acknowledgeReceipt: receipt ${ack.deliveryId} expired at ${manifest.expiresAt}`,
          'invalid-receipt',
          'after-host-action'
        );
      }
      const ids: ReadonlyArray<UpdateId> = manifest.receipt.included.flatMap((entry) => entry.updateIds);
      const acknowledged: ReadonlySet<UpdateId> = new Set(record.acknowledged);
      const base = { subscriptionId: record.id, deliveryId: ack.deliveryId };
      if (manifest.acknowledged) {
        return ok<ITaskAcknowledgementCommit>({
          ...base,
          record,
          newlyAcknowledged: [],
          alreadyAcknowledged: ids
        });
      }
      const newly: UpdateId[] = [];
      const already: UpdateId[] = [];
      for (const updateId of ids) {
        if (acknowledged.has(updateId)) {
          already.push(updateId);
        } else if (host.index().isOwed(record.id, updateId)) {
          newly.push(updateId);
        } else {
          return taskFailure<ITaskAcknowledgementCommit>(
            `acknowledgeReceipt: receipt ${ack.deliveryId} names ${updateId}, which subscription ${record.id} is ` +
              `not owed`,
            'invalid-receipt',
            'after-host-action'
          );
        }
      }
      const history: UpdateId[] = [...record.acknowledged, ...newly].sort();
      const issued: IIssuedTaskReceipt[] = record.issued.map((m) =>
        m.deliveryId === ack.deliveryId ? { ...m, acknowledged: true } : m
      );
      return this._replace(state, record, { acknowledged: history, issued }, newly).onSuccess((next) =>
        ok<ITaskAcknowledgementCommit>({
          ...base,
          record: next,
          newlyAcknowledged: newly,
          alreadyAcknowledged: already
        })
      );
    });
  }

  /** Removes one issued manifest. Its obligations stay owed, and its history, if any, stays. */
  public abandon(request: ITaskReceiptAbandonment): TaskResult<ITaskConsumerRecord> {
    const converted = this._host.converters.delivery.receiptAbandonment.convert(request);
    if (converted.isFailure()) {
      return taskFailure(`abandonReceipt: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const abandonment: ITaskReceiptAbandonment = converted.value;
    return this._current(abandonment.subscriptionId, abandonment.expectedRecordRevision).onSuccess(
      ({ state, record }) =>
        record.issued.some((m) => m.deliveryId === abandonment.deliveryId)
          ? this._replace(state, record, {
              issued: record.issued.filter((m) => m.deliveryId !== abandonment.deliveryId)
            })
          : taskFailure<ITaskConsumerRecord>(
              `abandonReceipt: no issued receipt ${abandonment.deliveryId} in subscription ${record.id}`,
              'invalid-receipt',
              'after-host-action'
            )
    );
  }

  // ------------------------------------------------------------------------------------------
  // Shared machinery
  // ------------------------------------------------------------------------------------------

  /** A live subscription's record at the expected revision, checked against what was committed. */
  private _current(
    subscriptionId: SubscriptionId,
    expectedRecordRevision: number
  ): TaskResult<{ readonly state: ISubscriptionState; readonly record: ITaskConsumerRecord }> {
    const state: ISubscriptionState | undefined = this._host.book().subscriptions.get(subscriptionId);
    if (state === undefined) {
      return taskFailure(
        `subscription ${subscriptionId}: no live subscription`,
        'not-found-or-denied',
        'after-host-action'
      );
    }
    const durable: TaskResult<true> = this._durabilityFits(subscriptionId, state.descriptor);
    if (durable.isFailure()) {
      return propagate(durable);
    }
    if (state.descriptor.recordRevision !== expectedRecordRevision) {
      return taskFailure(
        `subscription ${subscriptionId}: expected record ${expectedRecordRevision}, found ${state.descriptor.recordRevision}`,
        'conflict',
        'reconcile-first'
      );
    }
    return this._verified(state).onSuccess((read) => ok({ state, record: read.record }));
  }

  /**
   * Reads a subscription's record and checks it is exactly the one the repository last committed. A
   * store that returns anything else — an older record, another subscription's, nothing — has lost
   * or changed committed state: the repository fences.
   */
  private _verified(state: ISubscriptionState): TaskResult<IConsumerRead> {
    const id: SubscriptionId = state.descriptor.id;
    return this._read(id).onSuccess((read) => {
      if (read === undefined || read.fingerprint !== state.fingerprint) {
        const message: string =
          read === undefined
            ? `subscription ${id}: its checkpoint is missing from the store`
            : `subscription ${id}: the checkpoint store returned record ${read.record.recordRevision}, not the ` +
              `record ${state.descriptor.recordRevision} this repository committed`;
        this._host.fence(message);
        return taskFailure<IConsumerRead>(message, 'storage-corrupt', 'after-host-action');
      }
      return ok(read);
    });
  }

  /** Reads through the store; a store that fails or returns something invalid fences. */
  private _read(id: SubscriptionId): TaskResult<IConsumerRead | undefined> {
    const read: Result<IConsumerRead | undefined> = this._host.checkpoints.read(id);
    if (read.isFailure()) {
      this._host.fence(read.message);
      return taskFailure(read.message, 'storage-corrupt', 'after-host-action');
    }
    return ok(read.value);
  }

  /** A record validated through the same converter the read path runs, with its fingerprint. */
  private _validated(record: ITaskConsumerRecord): TaskResult<IConsumerRead> {
    const converter = this._host.converters.delivery.consumerRecord;
    return classify(
      converter.convert(record).onSuccess((converted) => this._host.checkpoints.describe(converted)),
      'invalid',
      'after-host-action'
    );
  }

  /**
   * Replaces a record: the next revision with `changes`, its preparation claim recomputed, admitted
   * against the ledger, then written. `satisfied` are the ids this write acknowledges.
   */
  private _replace(
    state: ISubscriptionState,
    record: ITaskConsumerRecord,
    changes: Pick<ITaskConsumerRecord, 'issued'> & Partial<Pick<ITaskConsumerRecord, 'acknowledged'>>,
    satisfied: ReadonlyArray<UpdateId> = []
  ): TaskResult<ITaskConsumerRecord> {
    const host: ISubscriptionHost = this._host;
    const profile: ITaskCapacityProfile = host.profile();
    const id: SubscriptionId = record.id;
    const issued: ReadonlyArray<IIssuedTaskReceipt> = changes.issued;
    const preparation: ITaskCapacityClaim = record.capacityClaims.find(
      (c) => c.purpose === 'receipt-preparation'
    )!;
    const next: ITaskConsumerRecord = {
      ...record,
      ...changes,
      recordRevision: record.recordRevision + 1,
      capacityClaims: record.capacityClaims.map((c) =>
        c.claimId === preparation.claimId
          ? preparationClaim(
              c.claimId,
              id,
              profile,
              issued.map((m) => ({ bytes: valueBytes(m) }))
            )
          : c
      )
    };
    return this._validated(next).onSuccess((read) => {
      const nextState: ISubscriptionState = subscriptionState(read.record, read.fingerprint, read.bytes);
      const owed: number = host.index().owedCount(id) - satisfied.length;
      const entry: ILedgerEntry = subscriptionEntry(nextState, owed, host.book().unitsOf(id), profile);
      return host
        .ledger()
        .admit(new Map([[subscriptionKey(id), entry]]))
        .onSuccess(() => this._write(id, record.recordRevision, read, undefined))
        .onSuccess(() => {
          host.book().subscriptions.set(id, nextState);
          host.index().satisfy(id, satisfied);
          host.ledger().apply(new Map([[subscriptionKey(id), host.book().entry(id, host.index(), profile)]]));
          host.committed();
          return ok(read.record);
        });
    });
  }

  /**
   * Writes through the store. `unchanged` is positive evidence nothing happened; anything else may
   * have landed, and the repository fences until a rebuild re-reads what is actually stored.
   */
  private _write(
    id: SubscriptionId,
    expectedRecordRevision: number,
    expected: IConsumerRead,
    operationId: OperationId | undefined
  ): TaskResult<true> {
    const written: DetailedResult<true, CheckpointWriteVisibility> = this._host.checkpoints.write(
      id,
      expectedRecordRevision,
      expected.record
    );
    const detail = operationId !== undefined ? { operationId } : undefined;
    if (written.isSuccess()) {
      // A store is host code: its success is checked, not believed. Reading the record back and
      // finding anything but what was written means the checkpoint is not where the repository is
      // about to say it is, so nothing that depends on it — an issued receipt, an acknowledgement —
      // may be returned.
      const back = this._host.checkpoints.read(id);
      if (back.isSuccess() && back.value?.fingerprint === expected.fingerprint) {
        return ok(true);
      }
      const message: string =
        `${recordName('consumer', id)}: the checkpoint store reported a write it does not hold ` +
        `(${back.isFailure() ? back.message : 'it reads back something else'})`;
      this._host.fence(message);
      return taskFailure(message, 'storage-corrupt', 'after-host-action', detail);
    }
    if (written.detail === 'unchanged') {
      return taskFailure(
        `${recordName('consumer', id)}: the write failed before anything became visible: ${written.message}`,
        'storage-unavailable',
        'safe',
        detail
      );
    }
    this._host.fence(`${recordName('consumer', id)}: write outcome is unknown: ${written.message}`);
    return operationId !== undefined
      ? taskFailure(
          `${recordName('consumer', id)}: the write may have landed: ${written.message}`,
          'commit-indeterminate',
          'reconcile-first',
          { operationId }
        )
      : taskFailure(
          `${recordName('consumer', id)}: the write may have landed: ${written.message}`,
          'storage-unavailable',
          'reconcile-first'
        );
  }
}

/** A manifest with one consumer entry added or replaced. */
function _withConsumer(
  manifest: ITaskRepositoryManifest,
  entry: ITaskRepositoryManifest['consumers'][number]
): ITaskRepositoryManifest {
  return {
    ...manifest,
    manifestRevision: manifest.manifestRevision + 1,
    consumers: [...manifest.consumers.filter((e) => e.id !== entry.id), entry].sort((a, b) =>
      a.id < b.id ? -1 : 1
    )
  };
}

/**
 * A live entry's whole footprint, as the charges an activation claim reserves for it: every
 * dimension it would use or reserve, less the subscription identity the pending entry counts itself,
 * with room for the claim's own digits.
 */
function _footprint(entry: ILedgerEntry): ITaskCapacityClaim['charges'] {
  return allCapacityDimensions
    .filter((dimension) => dimension !== 'subscriptions')
    .map((dimension) => {
      const slack: number =
        dimension === 'record-bytes' || dimension === 'logical-bytes' ? activationSlack : 0;
      return { dimension, amount: entry.used[dimension] + entry.reserved[dimension] + slack };
    })
    .filter((charge) => charge.amount > 0);
}

/**
 * The ledger entry of a pending subscription registration: one subscription identity, and its
 * activation reservation.
 * @internal
 */
export function pendingEntryOf(entry: IPendingConsumerEntry, profile: ITaskCapacityProfile): ILedgerEntry {
  const used: DimensionAmounts = zeroAmounts();
  used.subscriptions = 1;
  return ledgerEntry(
    entry.id,
    used,
    entry.capacityClaims,
    recordLimitFor(subscriptionKey(entry.id), profile)
  );
}

/**
 * Why a stored record is not a pending registration's first record, if it is not.
 * @internal
 */
export function firstRecordProblem(read: IConsumerRead, entry: IPendingConsumerEntry): string | undefined {
  if (read.record.recordRevision !== 1) {
    return `it is record revision ${read.record.recordRevision}`;
  }
  if (read.fingerprint !== entry.recordFingerprint) {
    return `its contents are not the first record this registration committed to write`;
  }
  // The record is exactly the committed one, so its activation claim carries the reservation the
  // entry was admitted with; an entry holding anything else was changed after it was written.
  const activation: ITaskCapacityClaim = read.record.capacityClaims.find(
    (c) => c.purpose === 'subscription-activation'
  )!;
  return canonicallyEqual(activation.charges, entry.capacityClaims[0].charges)
    ? undefined
    : `the pending entry's activation reservation is not the one its first record carries`;
}

/**
 * Why a receipt entry cannot be issued, if it cannot: an update id must name the entry's own task and
 * revision — one category's update or its baseline — and be available to the subscription.
 */
function _entryProblem(
  entry: IInclusionEntry,
  available: (updateId: UpdateId) => boolean
): string | undefined {
  const own: ReadonlySet<string> = new Set<string>([
    ...allUpdateCategories.map((category) => taskUpdateId(entry.taskId, entry.revision, category)),
    baselineUpdateId(entry.taskId, entry.revision)
  ]);
  for (const updateId of entry.updateIds) {
    if (!own.has(updateId)) {
      return `update ${updateId} does not belong to ${entry.taskId}@${entry.revision}`;
    }
    if (!available(updateId)) {
      return `update ${updateId} is not owed to this subscription`;
    }
  }
  return undefined;
}
