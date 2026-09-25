/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import {
  DeliveryId,
  IAcknowledgementResult,
  IBoundTaskDelivery,
  IInclusionEntry,
  IPreparedTaskContext,
  ISubscribeRequest,
  ITaskConsumerRecord,
  ITaskContext,
  ITaskContextBudget,
  ITaskDeliveryPage,
  ITaskDeliveryPolicy,
  ITaskEnvelope,
  ITaskInclusionReceipt,
  ITaskPage,
  ITaskSubscription,
  ITaskSummary,
  ITaskUpdate,
  IUnresolvedTaskReference,
  Instant,
  PageCursor,
  SubscriptionId,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  baselineUpdateId,
  defaultDeliveryCategories,
  isTerminalTaskStatus,
  maxTaskPageLimit,
  taskContextLimits
} from '../types';
import { AccessContext, AccessSubject, subjectOf } from './access';
import { ITaskRepositoryWriter } from '../storage';
import { BrokerCore, canonicallySame } from './core';
import { ok, propagate, taskFailure } from './failures';
import { projectEnvelope } from './projection';

/**
 * How many times a preparation or a subscription is recaptured when something it read changed
 * before it held the writer. Past it the caller is told to retry.
 * @internal
 */
export const maxDeliveryAttempts: number = 3;

/**
 * The broker's delivery defaults: what a new subscription gets for anything its request leaves out,
 * and how long an issued receipt lives. Persisted policies are never reread from these.
 * @public
 */
export interface ITaskDeliveryDefaults {
  readonly policy?: Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>;
  /** Issued-receipt lifetime in milliseconds. Default 24 hours. */
  readonly receiptLifetimeMs?: number;
  /**
   * The most tasks a `current` subscription's baseline may hold. A selection matching more is
   * refused with `backpressure`, never given a partial baseline that claims to be complete.
   * Default 200.
   */
  readonly maxBaselineTasks?: number;
}

/** The resolved defaults. @internal */
export interface IResolvedDeliveryDefaults {
  readonly policy: Partial<Omit<ITaskDeliveryPolicy, 'schemaVersion'>>;
  readonly receiptLifetimeMs: number;
  readonly maxBaselineTasks: number;
}

/** The default issued-receipt lifetime: 24 hours (design § 9). @public */
export const defaultReceiptLifetimeMs: number = 24 * 60 * 60 * 1000;

/** The default baseline bound. @public */
export const defaultMaxBaselineTasks: number = 200;

/** The most owed updates one preparation reads. @internal */
const maxPreparedUpdates: number = 1000;

// ------------------------------------------------------------------------------------------
// Subscribing
// ------------------------------------------------------------------------------------------

/** The category a baseline obligation is presented under: what is most urgent about the task now. */
function _baselineCategory(envelope: ITaskEnvelope): UpdateCategory {
  if (envelope.attention.length > 0) {
    return 'attention';
  }
  return isTerminalTaskStatus(envelope.lifecycle.status) ? 'result' : 'lifecycle';
}

/** A selection's matched tasks, keyed by id with their revision, and the page they came from. */
interface ICapture {
  readonly revisions: ReadonlyMap<TaskId, TaskRevision>;
  readonly summaries: ReadonlyArray<ITaskSummary>;
}

/**
 * Reads every non-archived task a selection matches, up to the baseline bound. Unresolved
 * references have no revision to deliver and are not part of a baseline.
 */
async function _captureSelection(
  core: BrokerCore,
  selection: ISubscribeRequest['selection'],
  bound: number
): Promise<TaskResult<ICapture>> {
  const summaries: ITaskSummary[] = [];
  let cursor: PageCursor | undefined = undefined;
  do {
    const page: TaskResult<ITaskPage> = await core.repository.query({
      selection,
      limit: maxTaskPageLimit,
      ...(cursor !== undefined ? { cursor } : {})
    });
    if (page.isFailure()) {
      return propagate(page);
    }
    summaries.push(...page.value.items);
    if (summaries.length > bound) {
      return taskFailure(
        `subscribe: the selection matches more than ${bound} tasks, the baseline bound; choose a narrower ` +
          `selection or start from-now`,
        'backpressure',
        'after-host-action'
      );
    }
    cursor = page.value.nextCursor;
  } while (cursor !== undefined);
  return ok({
    revisions: new Map(summaries.map((s) => [s.envelope.id, s.envelope.revision] as const)),
    summaries
  });
}

/**
 * Creates a subscription (design § 9, *Subscription creation*): its baseline captured and
 * authorized, then — in one writer section that re-proves nothing it relied on has moved — its record
 * written and the subscription activated, so no commit can fall between the baseline and the first
 * update it is owed.
 * @internal
 */
export async function subscribe(
  core: BrokerCore,
  access: AccessContext,
  request: unknown
): Promise<TaskResult<ITaskSubscription>> {
  const converted: Result<ISubscribeRequest> = core.converters.delivery.subscribeRequest.convert(request);
  if (converted.isFailure()) {
    return taskFailure(`subscribe: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const req: ISubscribeRequest = converted.value;
  const defaults: IResolvedDeliveryDefaults = core.delivery;
  const policy: Result<ITaskDeliveryPolicy> = core.converters.delivery.policy.convert({
    schemaVersion: 1,
    durability:
      req.policy?.durability ??
      defaults.policy.durability ??
      (core.repository.mode === 'session' ? 'session' : 'process-crash'),
    history: req.policy?.history ?? defaults.policy.history ?? 'observed-state',
    categories: req.policy?.categories ?? defaults.policy.categories ?? defaultDeliveryCategories
  });
  if (policy.isFailure()) {
    return taskFailure(`subscribe: ${policy.message}`, 'invalid', 'after-host-action');
  }
  for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
    const outcome: TaskResult<ITaskSubscription | undefined> = await _subscribeOnce(
      core,
      access,
      req,
      policy.value
    );
    if (outcome.isFailure() || outcome.value !== undefined) {
      return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
    }
  }
  return taskFailure(
    `subscribe ${req.subscriptionId}: the selection kept changing while its baseline was captured; retry`,
    'conflict',
    'safe',
    { operationId: req.operationId }
  );
}

/** One capture-authorize-verify-commit attempt; `undefined` when something moved and it should retry. */
async function _subscribeOnce(
  core: BrokerCore,
  access: AccessContext,
  req: ISubscribeRequest,
  policy: ITaskDeliveryPolicy
): Promise<TaskResult<ITaskSubscription | undefined>> {
  const epoch: TaskResult<string> = access.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await access.allows({ action: 'subscribe', role: 'subject', scopes: req.selection.scopes }))) {
    return taskFailure(`subscribe: not permitted`, 'not-found-or-denied', 'after-host-action', {
      operationId: req.operationId
    });
  }
  const baseline: ITaskUpdate[] = [];
  let captured: ICapture = { revisions: new Map(), summaries: [] };
  if (req.start === 'current') {
    const capture: TaskResult<ICapture> = await _captureSelection(
      core,
      req.selection,
      core.delivery.maxBaselineTasks
    );
    if (capture.isFailure()) {
      return propagate(capture);
    }
    captured = capture.value;
    for (const summary of captured.summaries) {
      if (await access.sees({ task: summary })) {
        const envelope: ITaskEnvelope = summary.envelope;
        baseline.push({
          id: baselineUpdateId(envelope.id, envelope.revision),
          taskId: envelope.id,
          revision: envelope.revision,
          category: _baselineCategory(envelope),
          required: true,
          snapshot: summary,
          audience: [req.subscriptionId]
        });
      }
    }
  }
  const clock: TaskResult<Instant> = core.now();
  if (clock.isFailure()) {
    return propagate(clock);
  }
  return core.gated(async (writer) => {
    if (!access.epochIs(epoch.value)) {
      return ok<ITaskSubscription | undefined>(undefined);
    }
    // Nothing matched may have moved or appeared since the capture: a commit in between would be in
    // neither the baseline nor an audience.
    if (req.start === 'current') {
      const now: TaskResult<ICapture> = await _captureSelection(
        core,
        req.selection,
        core.delivery.maxBaselineTasks
      );
      if (now.isFailure()) {
        return propagate(now);
      }
      if (!canonicallySame(Array.from(now.value.revisions), Array.from(captured.revisions))) {
        return ok<ITaskSubscription | undefined>(undefined);
      }
    }
    const registered: TaskResult<ITaskConsumerRecord> = await writer.registerSubscription({
      subscriptionId: req.subscriptionId,
      operationId: req.operationId,
      principalKey: access.principal,
      specification: { consumerId: req.consumerId, selection: req.selection, start: req.start, policy },
      baseline,
      createdAt: clock.value
    });
    if (registered.isFailure()) {
      return propagate(registered);
    }
    return core.repository
      .subscription(req.subscriptionId)
      .onSuccess((descriptor) => ok<ITaskSubscription | undefined>(descriptor));
  });
}

// ------------------------------------------------------------------------------------------
// The bound delivery
// ------------------------------------------------------------------------------------------

/**
 * One subscription's delivery bound to one principal (design § 9, `IBoundTaskDelivery`).
 *
 * @remarks
 * Disclosure is decided now, by the principal's current authority: an owed update it may not see is
 * withheld and stays owed. What is owed is decided by the stored audiences, never by re-applying the
 * subscription's selection to the task as it is today.
 * @internal
 */
export class BoundTaskDelivery implements IBoundTaskDelivery {
  public readonly subscriptionId: SubscriptionId;
  private readonly _core: BrokerCore;
  private readonly _access: AccessContext;

  public constructor(core: BrokerCore, access: AccessContext, subscriptionId: SubscriptionId) {
    this._core = core;
    this._access = access;
    this.subscriptionId = subscriptionId;
  }

  /** {@inheritDoc IBoundTaskDelivery.pending} */
  public async pending(request?: {
    readonly limit?: number;
    readonly cursor?: PageCursor;
  }): Promise<TaskResult<ITaskDeliveryPage>> {
    const page = await this._core.repository.listOwed({
      subscription: this.subscriptionId,
      ...(request?.limit !== undefined ? { limit: request.limit } : {}),
      ...(request?.cursor !== undefined ? { cursor: request.cursor } : {})
    });
    if (page.isFailure()) {
      return propagate(page);
    }
    const disclosed: TaskResult<{ readonly updates: ITaskUpdate[]; readonly withheld: number }> =
      await this._disclose(page.value.updates);
    return disclosed.onSuccess((d) =>
      ok<ITaskDeliveryPage>({
        updates: d.updates,
        withheld: d.withheld,
        ...(page.value.nextCursor !== undefined ? { nextCursor: page.value.nextCursor } : {})
      })
    );
  }

  /**
   * Prepares a bounded context and issues its receipt.
   *
   * @remarks
   * 1. Capture the owed updates and the selection's current tasks, authorize and project them, mint a
   *    delivery id, and render — purely.
   * 2. In one writer section: if the policy epoch, the subscription's record, or any current task the
   *    capture authorized moved since the capture, discard the render and capture again; otherwise
   *    issue the receipt's exact manifest.
   *    Storage refuses a manifest naming an update the subscription is no longer owed.
   * 3. Return the context only once the manifest is committed. A failure returns nothing
   *    acknowledgeable.
   */
  public async prepare(budget?: ITaskContextBudget): Promise<TaskResult<IPreparedTaskContext>> {
    for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
      const outcome: TaskResult<IPreparedTaskContext | undefined> = await this._prepareOnce(budget);
      if (outcome.isFailure() || outcome.value !== undefined) {
        return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
      }
    }
    return taskFailure(
      `prepare ${this.subscriptionId}: the subscription kept changing while its context was prepared; retry`,
      'conflict',
      'safe'
    );
  }

  /**
   * Acknowledges exactly what an issued receipt included.
   *
   * @remarks
   * The receipt is converted strictly, then compared in full canonical form with the unexpired
   * manifest this subscription issued under its delivery id — a fabricated, modified, shortened,
   * enlarged, foreign or snapshot-only receipt matches none. Every entry's task is re-authorized for
   * this principal before the writer is taken; inside it, the policy epoch and the record revision of
   * every task so authorized are rechecked, and a task that moved sends the whole acknowledgement
   * round again. Only then does storage add exactly the manifest's update ids to the exact history.
   */
  public async acknowledge(receipt: unknown): Promise<TaskResult<IAcknowledgementResult>> {
    const converted: Result<ITaskInclusionReceipt> = this._core.converters.context.receipt.convert(receipt);
    if (converted.isFailure() || converted.value.deliveryId === undefined) {
      return _invalidReceipt(this.subscriptionId);
    }
    for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
      const outcome: TaskResult<IAcknowledgementResult | undefined> = await this._acknowledgeOnce(
        converted.value,
        converted.value.deliveryId
      );
      if (outcome.isFailure() || outcome.value !== undefined) {
        return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
      }
    }
    return taskFailure(
      `acknowledge ${this.subscriptionId}: the receipt's tasks kept changing while it was authorized; retry`,
      'conflict',
      'safe'
    );
  }

  /** One authorize-then-commit attempt; `undefined` when a task it authorized moved and it should retry. */
  private async _acknowledgeOnce(
    presented: ITaskInclusionReceipt,
    deliveryId: DeliveryId
  ): Promise<TaskResult<IAcknowledgementResult | undefined>> {
    // First: is this exactly a receipt this subscription issued and still holds? A fabricated,
    // modified, shortened, enlarged, foreign or snapshot-only receipt is refused here, before any
    // task it names is looked at — it gets one answer, whatever it names.
    const matched: TaskResult<true> = await this._core.gated(async (writer) =>
      (await this._issuedMatch(writer, deliveryId, presented)).onSuccess(() => ok<true>(true))
    );
    if (matched.isFailure()) {
      return propagate(matched);
    }
    const epoch: TaskResult<string> = this._access.epoch();
    if (epoch.isFailure()) {
      return propagate(epoch);
    }
    const clock: TaskResult<Instant> = this._core.now();
    if (clock.isFailure()) {
      return propagate(clock);
    }
    // Each entry's task is authorized from its committed record, and the record revision that
    // decided it is fenced: the section that commits re-reads every one.
    const fence: Map<TaskId, number> = new Map();
    for (const entry of presented.included) {
      const authorized: number | undefined = await this._mayAcknowledge(entry);
      if (authorized === undefined) {
        return taskFailure(
          `acknowledge ${this.subscriptionId}: the receipt includes a task this principal may not acknowledge`,
          'not-found-or-denied',
          'after-host-action'
        );
      }
      fence.set(entry.taskId, authorized);
    }
    return this._core.gated(async (writer) => {
      // Re-proved in the section that commits: the manifest may have been abandoned or expired, the
      // policy may have moved, and a task may have been reassigned, since the checks above.
      const record: TaskResult<ITaskConsumerRecord> = await this._issuedMatch(writer, deliveryId, presented);
      if (record.isFailure()) {
        return propagate<IAcknowledgementResult | undefined>(record);
      }
      if (!this._access.epochIs(epoch.value)) {
        return taskFailure<IAcknowledgementResult | undefined>(
          `acknowledge ${this.subscriptionId}: the authorization policy changed; re-present the receipt`,
          'conflict',
          'safe'
        );
      }
      const held: TaskResult<boolean> = await _fenceHolds(writer, fence);
      if (held.isFailure() || !held.value) {
        return held.isFailure()
          ? propagate<IAcknowledgementResult | undefined>(held)
          : ok<IAcknowledgementResult | undefined>(undefined);
      }
      const committed = await writer.acknowledgeReceipt({
        subscriptionId: this.subscriptionId,
        expectedRecordRevision: record.value.recordRevision,
        deliveryId,
        at: clock.value
      });
      return committed.onSuccess((c) =>
        ok<IAcknowledgementResult | undefined>({
          subscriptionId: c.subscriptionId,
          deliveryId: c.deliveryId,
          newlyAcknowledged: c.newlyAcknowledged,
          alreadyAcknowledged: c.alreadyAcknowledged
        })
      );
    });
  }

  /**
   * The subscription's record, when it holds a manifest under `deliveryId` whose receipt is, in full
   * canonical form, the one presented. Anything else is the one invalid-receipt answer.
   */
  private async _issuedMatch(
    writer: ITaskRepositoryWriter,
    deliveryId: DeliveryId,
    presented: ITaskInclusionReceipt
  ): Promise<TaskResult<ITaskConsumerRecord>> {
    const record: TaskResult<ITaskConsumerRecord | undefined> = await writer.readSubscription(
      this.subscriptionId
    );
    if (record.isFailure()) {
      return propagate(record);
    }
    const manifest = record.value?.issued.find((m) => m.deliveryId === deliveryId);
    return record.value !== undefined &&
      manifest !== undefined &&
      canonicallySame(manifest.receipt, presented)
      ? ok(record.value)
      : _invalidReceipt(this.subscriptionId);
  }

  /** {@inheritDoc IBoundTaskDelivery.abandon} */
  public async abandon(deliveryId: DeliveryId): Promise<TaskResult<DeliveryId>> {
    const id = this._core.converters.ids.deliveryId.convert(deliveryId);
    if (id.isFailure()) {
      return _invalidReceipt(this.subscriptionId);
    }
    return this._core.gated(async (writer) => {
      const record = await writer.readSubscription(this.subscriptionId);
      if (record.isFailure()) {
        return propagate<DeliveryId>(record);
      }
      if (record.value === undefined || !record.value.issued.some((m) => m.deliveryId === id.value)) {
        return _invalidReceipt(this.subscriptionId);
      }
      const abandoned = await writer.abandonReceipt({
        subscriptionId: this.subscriptionId,
        expectedRecordRevision: record.value.recordRevision,
        deliveryId: id.value
      });
      return abandoned.onSuccess(() => ok(id.value));
    });
  }

  /** One capture-render-issue attempt; `undefined` when something moved and it should retry. */
  private async _prepareOnce(
    budget?: ITaskContextBudget
  ): Promise<TaskResult<IPreparedTaskContext | undefined>> {
    const core: BrokerCore = this._core;
    const epoch: TaskResult<string> = this._access.epoch();
    if (epoch.isFailure()) {
      return propagate(epoch);
    }
    const subscription: TaskResult<ITaskSubscription | undefined> = core.repository.subscription(
      this.subscriptionId
    );
    if (subscription.isFailure()) {
      return propagate(subscription);
    }
    // Bound to a live subscription; one only ever leaves by T8's closure.
    const captured: ITaskSubscription = subscription.value!;
    const input = await this._captureInput(captured);
    if (input.isFailure()) {
      return propagate(input);
    }
    const deliveryId: TaskResult<DeliveryId> = core.mintDeliveryId();
    if (deliveryId.isFailure()) {
      return propagate(deliveryId);
    }
    const clock: TaskResult<Instant> = core.now();
    if (clock.isFailure()) {
      return propagate(clock);
    }
    const { fence, ...renderInput } = input.value;
    const rendered: TaskResult<ITaskContext> = core.renderer.render(
      { ...renderInput, deliveryId: deliveryId.value },
      budget
    );
    if (rendered.isFailure()) {
      return propagate(rendered);
    }
    const expiresAt: Result<Instant> = core.later(clock.value, core.delivery.receiptLifetimeMs);
    if (expiresAt.isFailure()) {
      return taskFailure(`prepare: ${expiresAt.message}`, 'storage-unavailable', 'safe');
    }
    return core.gated(async (writer) => {
      const now: TaskResult<ITaskSubscription | undefined> = core.repository.subscription(
        this.subscriptionId
      );
      if (
        !this._access.epochIs(epoch.value) ||
        now.isFailure() ||
        now.value?.recordRevision !== captured.recordRevision
      ) {
        return ok<IPreparedTaskContext | undefined>(undefined);
      }
      // A current task the capture authorized and disclosed may have been reassigned since.
      const held: TaskResult<boolean> = await _fenceHolds(writer, fence, 'task');
      if (held.isFailure() || !held.value) {
        return held.isFailure()
          ? propagate<IPreparedTaskContext | undefined>(held)
          : ok<IPreparedTaskContext | undefined>(undefined);
      }
      const issued = await writer.issueReceipt({
        subscriptionId: this.subscriptionId,
        expectedRecordRevision: captured.recordRevision,
        receipt: rendered.value.receipt,
        issuedAt: clock.value,
        expiresAt: expiresAt.value
      });
      if (issued.isFailure()) {
        // An update the render included was acknowledged by another receipt meanwhile: render again.
        return issued.detail?.code === 'invalid-receipt'
          ? ok<IPreparedTaskContext | undefined>(undefined)
          : propagate<IPreparedTaskContext | undefined>(issued);
      }
      return ok<IPreparedTaskContext | undefined>({
        context: rendered.value,
        deliveryId: deliveryId.value,
        expiresAt: expiresAt.value
      });
    });
  }

  /** The renderer's input: owed updates and the selection's current tasks, authorized and projected. */
  private async _captureInput(subscription: ITaskSubscription): Promise<
    TaskResult<{
      readonly tasks: ReadonlyArray<ITaskSummary>;
      readonly unresolved: ReadonlyArray<IUnresolvedTaskReference>;
      readonly updates: ReadonlyArray<ITaskUpdate>;
      readonly completeness: 'complete' | 'partial';
      readonly fence: ReadonlyMap<TaskId, number>;
    }>
  > {
    const core: BrokerCore = this._core;
    const fence: Map<TaskId, number> = new Map();
    const owed: ITaskUpdate[] = [];
    let cursor: PageCursor | undefined = undefined;
    let partial: boolean = false;
    do {
      const page = await core.repository.listOwed({
        subscription: this.subscriptionId,
        limit: maxTaskPageLimit,
        ...(cursor !== undefined ? { cursor } : {})
      });
      if (page.isFailure()) {
        return propagate(page);
      }
      owed.push(...page.value.updates);
      cursor = page.value.nextCursor;
      if (cursor !== undefined && owed.length >= maxPreparedUpdates) {
        partial = true;
        cursor = undefined;
      }
    } while (cursor !== undefined);
    const disclosed = await this._disclose(owed);
    if (disclosed.isFailure()) {
      return propagate(disclosed);
    }
    const current = await core.repository.query({
      selection: subscription.selection,
      limit: maxTaskPageLimit
    });
    if (current.isFailure()) {
      return propagate(current);
    }
    // An owed update newer than a captured current state means a commit fell between the two reads:
    // the current summary is dropped rather than presented as older than what it follows.
    const newest: Map<TaskId, number> = new Map();
    for (const update of disclosed.value.updates) {
      newest.set(update.taskId, Math.max(newest.get(update.taskId) ?? 0, update.revision));
    }
    const tasks: ITaskSummary[] = [];
    for (const summary of current.value.items) {
      if ((newest.get(summary.envelope.id) ?? 0) > summary.envelope.revision) {
        continue;
      }
      if (await this._access.sees({ task: summary })) {
        const projected = projectEnvelope(this._access.projector, core.converters.broker, summary.envelope);
        if (projected.isFailure()) {
          return propagate(projected);
        }
        tasks.push({ envelope: projected.value });
        fence.set(summary.envelope.id, summary.envelope.revision);
      }
    }
    const unresolved: IUnresolvedTaskReference[] = [];
    for (const reference of current.value.unresolved) {
      if (await this._access.sees({ reference })) {
        unresolved.push(reference);
        fence.set(reference.id, reference.revision);
      }
    }
    const complete: boolean =
      !partial &&
      disclosed.value.withheld === 0 &&
      current.value.nextCursor === undefined &&
      current.value.completeness === 'complete';
    return ok({
      tasks,
      unresolved,
      updates: disclosed.value.updates.slice(0, taskContextLimits.maxInputEntries),
      completeness: complete ? 'complete' : 'partial',
      fence
    });
  }

  /**
   * Authorizes and projects owed updates for this principal. Each payload is the frozen state of its
   * revision; its audience is reduced to this subscription, so no other subscription is disclosed.
   */
  private async _disclose(
    updates: ReadonlyArray<ITaskUpdate>
  ): Promise<TaskResult<{ readonly updates: ITaskUpdate[]; readonly withheld: number }>> {
    const disclosed: ITaskUpdate[] = [];
    let withheld: number = 0;
    for (const update of updates) {
      if (!(await this._access.sees({ task: update.snapshot }))) {
        withheld++;
        continue;
      }
      const projected = projectEnvelope(
        this._access.projector,
        this._core.converters.broker,
        update.snapshot.envelope
      );
      if (projected.isFailure()) {
        return propagate(projected);
      }
      disclosed.push({ ...update, snapshot: { envelope: projected.value }, audience: [this.subscriptionId] });
    }
    return ok({ updates: disclosed, withheld });
  }

  /** Whether this principal may see, and acknowledge, the task an entry names — as it is now. */
  /** The record revision that authorized acknowledging an entry's task, or `undefined` when denied. */
  private async _mayAcknowledge(entry: IInclusionEntry): Promise<number | undefined> {
    const record = await this._core.repository.readCommit(entry.taskId);
    if (record.isFailure() || record.value === undefined) {
      return undefined;
    }
    const subject: AccessSubject = subjectOf(record.value);
    return (await this._access.sees(subject)) && (await this._access.may('acknowledge', subject))
      ? record.value.recordRevision
      : undefined;
  }
}

/**
 * Whether every fenced task's committed record, re-read through the writer, is still at the revision
 * that was authorized — its record revision, or with `'task'`, its task revision.
 */
async function _fenceHolds(
  writer: ITaskRepositoryWriter,
  fence: ReadonlyMap<TaskId, number>,
  revision: 'record' | 'task' = 'record'
): Promise<TaskResult<boolean>> {
  for (const [taskId, expected] of fence) {
    const record = await writer.readCommit(taskId);
    if (record.isFailure()) {
      return propagate(record);
    }
    const actual: number | undefined =
      record.value === undefined
        ? undefined
        : revision === 'record'
        ? record.value.recordRevision
        : record.value.recordType === 'resolved'
        ? record.value.task.envelope.revision
        : record.value.reference.revision;
    if (actual !== expected) {
      return ok(false);
    }
  }
  return ok(true);
}

/** The one answer every unacceptable receipt gets: nothing about why distinguishes one from another. */
function _invalidReceipt<T>(subscriptionId: SubscriptionId): TaskResult<T> {
  return taskFailure<T>(
    `acknowledge ${subscriptionId}: not a receipt this delivery issued and still holds`,
    'invalid-receipt',
    'after-host-action'
  );
}
