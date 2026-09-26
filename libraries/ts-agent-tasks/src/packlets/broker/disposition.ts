/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import {
  CommandAbandonmentOrigin,
  IAbandonCommandRequest,
  ICloseSubscriptionRequest,
  ICommandReceipt,
  IDisposeObligationsRequest,
  IResolvedTaskCommitRecord,
  IStoredCommandOperation,
  ITaskCleanupReport,
  ITaskCommitRecord,
  ITaskConsumerRecord,
  ITaskDispositionResult,
  ITaskSubscription,
  Instant,
  PageCursor,
  SubscriptionId,
  TaskId,
  TaskResult,
  UpdateId,
  maxTaskPageLimit
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, subjectOf } from './access';
import { BrokerCore } from './core';
import { fenceHolds, maxDeliveryAttempts } from './delivery';
import { ok, propagate, taskFailure } from './failures';

// The ways an obligation, a subscription or a command's tracking ends without the normal path —
// each a trusted host operation that also asks the binding's policy for `dispose-obligation`, and
// re-proves in its committing writer section that nothing it authorized has moved.

/**
 * The task an update id names. Both encodings end in two `:`-separated fields — the revision, then
 * the category ordinal or `initial` — and are read from the right, so a task id holding `:` is safe.
 */
function _taskOf(updateId: UpdateId): TaskId {
  const last: number = updateId.lastIndexOf(':');
  return updateId.slice(0, updateId.lastIndexOf(':', last - 1)) as TaskId;
}

/** The one answer for a subscription or task this principal may not act on, or that does not exist. */
function _denied<T>(what: string): TaskResult<T> {
  return taskFailure<T>(`${what}: not found or not permitted`, 'not-found-or-denied', 'after-host-action');
}

/** A retained subscription whose selection lies within the binding's selectors. */
function _subscription(
  core: BrokerCore,
  access: AccessContext,
  subscriptionId: SubscriptionId,
  what: string
): TaskResult<ITaskSubscription> {
  const found: TaskResult<ITaskSubscription | undefined> = core.repository.subscription(subscriptionId);
  if (found.isFailure()) {
    return propagate(found);
  }
  // A binding acts only on what it could have subscribed to: a subscription over a scope it cannot
  // select is not one it may end obligations of.
  if (found.value === undefined || !found.value.selection.scopes.every((scope) => access.selects(scope))) {
    return _denied(what);
  }
  return ok(found.value);
}

/**
 * Authorizes `dispose-obligation` on every task named, each from its committed record; returns the
 * record revision that decided each, or `undefined` when any is refused.
 */
async function _authorizeTasks(
  core: BrokerCore,
  access: AccessContext,
  tasks: Iterable<TaskId>
): Promise<TaskResult<Map<TaskId, number> | undefined>> {
  const fence: Map<TaskId, number> = new Map();
  for (const taskId of tasks) {
    const record: TaskResult<ITaskCommitRecord | undefined> = await core.repository.readCommit(taskId);
    if (record.isFailure()) {
      return propagate(record);
    }
    if (record.value === undefined) {
      return ok(undefined);
    }
    const subject = subjectOf(record.value);
    if (!(await access.sees(subject)) || !(await access.may('dispose-obligation', subject))) {
      return ok(undefined);
    }
    fence.set(taskId, record.value.recordRevision);
  }
  return ok(fence);
}

/**
 * Ends obligations of one subscription without acknowledgement (design § 9, *Retention*).
 * @internal
 */
export async function disposeObligations(
  core: BrokerCore,
  access: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskDispositionResult>> {
  const converted: Result<IDisposeObligationsRequest> =
    core.converters.delivery.disposeRequest.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`dispose: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: IDisposeObligationsRequest = converted.value;
  for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
    const outcome: TaskResult<ITaskDispositionResult | undefined> = await _disposeOnce(core, access, request);
    if (outcome.isFailure() || outcome.value !== undefined) {
      return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
    }
  }
  return taskFailure(
    `dispose ${request.subscriptionId}: the tasks kept changing while they were authorized; retry`,
    'conflict',
    'safe'
  );
}

async function _disposeOnce(
  core: BrokerCore,
  access: AccessContext,
  request: IDisposeObligationsRequest
): Promise<TaskResult<ITaskDispositionResult | undefined>> {
  const what: string = `dispose ${request.subscriptionId}`;
  const epoch: TaskResult<string> = access.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  const subscription = _subscription(core, access, request.subscriptionId, what);
  if (subscription.isFailure()) {
    return propagate(subscription);
  }
  const fence = await _authorizeTasks(core, access, new Set(request.updateIds.map(_taskOf)));
  if (fence.isFailure()) {
    return propagate(fence);
  }
  if (fence.value === undefined) {
    return _denied(what);
  }
  const authorized: Map<TaskId, number> = fence.value;
  return core.gated(async (writer) => {
    const record = await _recordIn(writer, request.subscriptionId);
    if (record.isFailure()) {
      return propagate<ITaskDispositionResult | undefined>(record);
    }
    const held: TaskResult<boolean> = await fenceHolds(writer, authorized);
    if (held.isFailure() || !held.value) {
      return held.isFailure()
        ? propagate<ITaskDispositionResult | undefined>(held)
        : ok<ITaskDispositionResult | undefined>(undefined);
    }
    // After the section's last await, immediately before the durable write.
    if (!access.epochIs(epoch.value)) {
      return _policyMoved<ITaskDispositionResult | undefined>(what);
    }
    const clock: TaskResult<Instant> = core.now();
    if (clock.isFailure()) {
      return propagate<ITaskDispositionResult | undefined>(clock);
    }
    const disposed = await writer.disposeObligations({
      subscriptionId: request.subscriptionId,
      expectedRecordRevision: record.value.recordRevision,
      updateIds: request.updateIds,
      reason: request.reason,
      at: clock.value
    });
    return disposed.isSuccess()
      ? ok<ITaskDispositionResult | undefined>(disposed.value)
      : propagate<ITaskDispositionResult | undefined>(disposed);
  });
}

/**
 * Closes one subscription, retaining or disposing what it is owed (design § 9).
 * @internal
 */
export async function closeSubscription(
  core: BrokerCore,
  access: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskSubscription>> {
  const converted: Result<ICloseSubscriptionRequest> = core.converters.delivery.closeRequest.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`closeSubscription: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: ICloseSubscriptionRequest = converted.value;
  for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
    const outcome: TaskResult<ITaskSubscription | undefined> = await _closeOnce(core, access, request);
    if (outcome.isFailure() || outcome.value !== undefined) {
      return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
    }
  }
  return taskFailure(
    `closeSubscription ${request.subscriptionId}: what it is owed kept changing while it was authorized; retry`,
    'conflict',
    'safe'
  );
}

async function _closeOnce(
  core: BrokerCore,
  access: AccessContext,
  request: ICloseSubscriptionRequest
): Promise<TaskResult<ITaskSubscription | undefined>> {
  const what: string = `closeSubscription ${request.subscriptionId}`;
  const epoch: TaskResult<string> = access.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  const subscription = _subscription(core, access, request.subscriptionId, what);
  if (subscription.isFailure()) {
    return propagate(subscription);
  }
  if (
    !(await access.allows({
      action: 'dispose-obligation',
      role: 'subject',
      scopes: subscription.value.selection.scopes
    }))
  ) {
    return _denied(what);
  }
  // Disposing ends every owed obligation, so each task they name is authorized as a disposal is.
  const owed: TaskResult<ReadonlySet<TaskId>> =
    request.obligations === 'dispose' ? await _owedTasks(core, request.subscriptionId) : ok(new Set());
  if (owed.isFailure()) {
    return propagate(owed);
  }
  const fence = await _authorizeTasks(core, access, owed.value);
  if (fence.isFailure()) {
    return propagate(fence);
  }
  if (fence.value === undefined) {
    return _denied(what);
  }
  const authorized: Map<TaskId, number> = fence.value;
  return core.gated(async (writer) => {
    const record = await _recordIn(writer, request.subscriptionId);
    if (record.isFailure()) {
      return propagate<ITaskSubscription | undefined>(record);
    }
    if (request.obligations === 'dispose') {
      // An obligation committed since the capture names a task nobody authorized: capture again.
      const now: TaskResult<ReadonlySet<TaskId>> = await _owedTasks(core, request.subscriptionId);
      if (now.isFailure()) {
        return propagate<ITaskSubscription | undefined>(now);
      }
      if (Array.from(now.value).some((taskId) => !authorized.has(taskId))) {
        return ok<ITaskSubscription | undefined>(undefined);
      }
    }
    const held: TaskResult<boolean> = await fenceHolds(writer, authorized);
    if (held.isFailure() || !held.value) {
      return held.isFailure()
        ? propagate<ITaskSubscription | undefined>(held)
        : ok<ITaskSubscription | undefined>(undefined);
    }
    if (!access.epochIs(epoch.value)) {
      return _policyMoved<ITaskSubscription | undefined>(what);
    }
    const closed = await writer.closeSubscription({
      subscriptionId: request.subscriptionId,
      expectedRecordRevision: record.value.recordRevision,
      obligations: request.obligations,
      ...(request.reason !== undefined ? { reason: request.reason } : {})
    });
    if (closed.isFailure()) {
      return propagate<ITaskSubscription | undefined>(closed);
    }
    return core.repository
      .subscription(request.subscriptionId)
      .onSuccess((descriptor) => ok<ITaskSubscription | undefined>(descriptor));
  });
}

/** Every task a subscription is owed an update of, from the resident owed index. */
async function _owedTasks(
  core: BrokerCore,
  subscriptionId: SubscriptionId
): Promise<TaskResult<ReadonlySet<TaskId>>> {
  const tasks: Set<TaskId> = new Set();
  let cursor: PageCursor | undefined = undefined;
  do {
    const page = await core.repository.listOwed({
      subscription: subscriptionId,
      limit: maxTaskPageLimit,
      ...(cursor !== undefined ? { cursor } : {})
    });
    if (page.isFailure()) {
      return propagate(page);
    }
    for (const update of page.value.updates) {
      tasks.add(update.taskId);
    }
    cursor = page.value.nextCursor;
  } while (cursor !== undefined);
  return ok(tasks);
}

/** A retained subscription's record, read through the writer. */
async function _recordIn(
  writer: ITaskRepositoryWriter,
  subscriptionId: SubscriptionId
): Promise<TaskResult<ITaskConsumerRecord>> {
  const record = await writer.readSubscription(subscriptionId);
  if (record.isFailure()) {
    return propagate(record);
  }
  // A subscription's record is retained for the repository's life: one found before is still here.
  return ok(record.value!);
}

function _policyMoved<T>(what: string): TaskResult<T> {
  return taskFailure<T>(`${what}: the authorization policy changed; retry`, 'conflict', 'safe');
}

/**
 * Abandons one external command whose outcome is not known — held after an uncertain send, never
 * sent, or awaiting a feed revision — ending its tracking and releasing its settlement reservation
 * without claiming any outcome.
 * @internal
 */
export async function abandonCommand(
  core: BrokerCore,
  access: AccessContext,
  input: unknown
): Promise<TaskResult<ICommandReceipt>> {
  const converted: Result<IAbandonCommandRequest> =
    core.converters.delivery.abandonCommandRequest.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`abandonCommand: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: IAbandonCommandRequest = converted.value;
  for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
    const outcome: TaskResult<ICommandReceipt | undefined> = await _abandonOnce(core, access, request);
    if (outcome.isFailure() || outcome.value !== undefined) {
      return outcome.isFailure() ? propagate(outcome) : ok(outcome.value!);
    }
  }
  return taskFailure(
    `abandonCommand ${request.taskId}: the task kept changing while it was authorized; retry`,
    'conflict',
    'safe',
    { operationId: request.operationId }
  );
}

/** One authorize-then-commit attempt; `undefined` when the task moved after authorization. */
async function _abandonOnce(
  core: BrokerCore,
  access: AccessContext,
  request: IAbandonCommandRequest
): Promise<TaskResult<ICommandReceipt | undefined>> {
  const what: string = `abandonCommand ${request.taskId}`;
  const epoch: TaskResult<string> = access.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  const fence = await _authorizeTasks(core, access, [request.taskId]);
  if (fence.isFailure()) {
    return propagate(fence);
  }
  if (fence.value === undefined) {
    return _denied(what);
  }
  const authorized: Map<TaskId, number> = fence.value;
  return core.gated(async (writer) => {
    const read = await writer.readCommit(request.taskId);
    if (read.isFailure()) {
      return propagate<ICommandReceipt | undefined>(read);
    }
    // Authorized from a record revision; anything committed since is re-presented, not guessed at.
    const current: ITaskCommitRecord = read.value!;
    if (current.recordRevision !== authorized.get(request.taskId)) {
      return ok<ICommandReceipt | undefined>(undefined);
    }
    const command = current.operations.find(
      (op): op is IStoredCommandOperation => op.type === 'command' && op.operationId === request.operationId
    );
    if (current.recordType !== 'resolved' || command === undefined) {
      return taskFailure<ICommandReceipt | undefined>(
        `${what}: no command '${request.operationId}'`,
        'not-found-or-denied',
        'after-host-action',
        { operationId: request.operationId }
      );
    }
    const from: CommandAbandonmentOrigin | undefined =
      command.dispatch !== 'settled'
        ? command.dispatch
        : command.awaiting !== undefined
        ? 'awaiting-feed'
        : undefined;
    if (from === undefined) {
      // A settled receipt is final — including an abandonment already recorded, which this repeats.
      return command.receipt.result.state === 'abandoned'
        ? ok<ICommandReceipt | undefined>(command.receipt)
        : taskFailure<ICommandReceipt | undefined>(
            `${what}: command '${request.operationId}' is settled (${command.receipt.result.state}); there is ` +
              `nothing to abandon`,
            'conflict',
            'after-host-action',
            { operationId: request.operationId }
          );
    }
    const next: IStoredCommandOperation = {
      type: 'command',
      operationId: command.operationId,
      request: command.request,
      principalKey: command.principalKey,
      dispatch: 'settled',
      receipt: { ...command.receipt, result: { state: 'abandoned', reason: request.reason, from } }
    };
    if (!access.epochIs(epoch.value)) {
      return _policyMoved<ICommandReceipt | undefined>(what);
    }
    const resolved: IResolvedTaskCommitRecord = current;
    const committed = await writer.commit({
      purpose: 'maintenance',
      taskId: request.taskId,
      expectedRevision: resolved.task.envelope.revision,
      expectedRecordRevision: resolved.recordRevision,
      record: {
        recordType: 'resolved',
        task: resolved.task,
        ...(resolved.sourceRevision !== undefined ? { sourceRevision: resolved.sourceRevision } : {}),
        operations: resolved.operations.map((op) => (op.operationId === command.operationId ? next : op)),
        updates: resolved.updates,
        archived: resolved.archived
      }
    });
    if (committed.isFailure()) {
      return propagate<ICommandReceipt | undefined>(committed);
    }
    core.environment.logger.info(
      `ts-agent-tasks: command '${request.operationId}' of ${request.taskId} abandoned by ${access.principal} ` +
        `(was ${from}): ${request.reason}`
    );
    return ok<ICommandReceipt | undefined>(next.receipt);
  });
}

/**
 * One cleanup pass: prunes the update payloads of up to `limit` candidate tasks whose audiences have
 * all discharged them, each decided from durable evidence in its own writer section.
 * @internal
 */
export async function cleanup(core: BrokerCore, input: unknown): Promise<TaskResult<ITaskCleanupReport>> {
  const converted = core.converters.broker.commandResolution.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`cleanup: ${converted.message}`, 'invalid', 'after-host-action');
  }
  // A candidate list read outside the writer; each prune re-reads and re-verifies.
  const candidates = await core.repository.prunableTasks({ limit: converted.value.limit });
  if (candidates.isFailure()) {
    return propagate(candidates);
  }
  const pruned: TaskId[] = [];
  const unchanged: TaskId[] = [];
  for (const taskId of candidates.value) {
    const outcome: TaskResult<boolean> = await core.gated(async (writer) => {
      const before = await writer.readCommit(taskId);
      if (before.isFailure()) {
        return propagate<boolean>(before);
      }
      const after = await writer.pruneTask(taskId);
      // A candidate is a live task: it has a record.
      return after.isSuccess()
        ? ok(after.value.recordRevision !== before.value!.recordRevision)
        : propagate<boolean>(after);
    });
    if (outcome.isFailure()) {
      return propagate(outcome);
    }
    (outcome.value ? pruned : unchanged).push(taskId);
  }
  return ok({ pruned, unchanged });
}
