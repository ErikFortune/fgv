/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import {
  ICapacityFailure,
  IProjectedStopTarget,
  IReleaseStop,
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  IStopInspectRequest,
  IStopIntent,
  IStopRequest,
  IStopResult,
  IStopTarget,
  IStoredCatalogOperation,
  IStoredTaskOperation,
  ITaskCommitRecord,
  OperationId,
  StopIntentState,
  StopMode,
  TaskId,
  TaskResult,
  defaultMaxStopTargets,
  isLatchingStopState,
  isStoppedFor,
  isTerminalTaskStatus,
  taskListKind
} from '../types';
import { AccessContext, subjectOf } from './access';
import { confirmUnchanged, isSameCatalog, readExisting } from './catalogMutation';
import { convertRequest, isNativeKind } from './catalogOperations';
import { BrokerCore, revisionOf, storedOperation } from './core';
import { changedSinceAuthorized, codeOf, denied, notFound, ok, propagate, taskFailure } from './failures';

/**
 * The key a broker instance tracks one intent's revalidation under.
 * @internal
 */
export function stopKey(rootId: TaskId, intentId: OperationId): string {
  return JSON.stringify([rootId, intentId]);
}

/**
 * The intent a root record holds under an id, if any.
 * @internal
 */
export function intentOf(record: ITaskCommitRecord, intentId: OperationId): IStopIntent | undefined {
  return record.recordType === 'resolved'
    ? record.stops?.find((intent) => intent.id === intentId)
    : undefined;
}

/**
 * Whether a target's authoritative state satisfies a mode. A task list has no own work: as a pause
 * target it is satisfied by its children, which are targets of their own.
 * @internal
 */
export function targetStopped(mode: StopMode, record: ITaskCommitRecord): boolean {
  if (record.recordType !== 'resolved') {
    return false;
  }
  const envelope = record.task.envelope;
  return (
    (mode === 'pause' && envelope.kind === taskListKind) || isStoppedFor(mode, envelope.lifecycle.status)
  );
}

/** A target as a view presents it: never its source evidence. */
function _projected(target: IStopTarget): IProjectedStopTarget {
  return {
    taskId: target.taskId,
    attempt: target.attempt,
    operationId: target.operationId,
    state: target.state,
    ...(target.confirmedRevision !== undefined ? { confirmedRevision: target.confirmedRevision } : {}),
    ...(target.violation !== undefined ? { violation: target.violation } : {})
  };
}

/** Reads a target for presentation: a quarantined record reads as absent — it is not stopped. */
async function _readTarget(
  core: BrokerCore,
  taskId: TaskId
): Promise<TaskResult<ITaskCommitRecord | undefined>> {
  const read = await core.repository.readCommit(taskId);
  if (read.isFailure() && codeOf(read) === 'unknown-kind-version') {
    return ok(undefined);
  }
  return read;
}

/**
 * An intent's result, as one principal may see it — degraded live where the records now contradict
 * it.
 *
 * @remarks
 * The persisted summary is allowed to lag the target records (design § 10 step 4), but a
 * **presentation never overstates**: a target persisted `confirmed` whose record has since left the
 * stopped set is shown `indeterminate`, with the violation, and the intent `blocked` — before any pump
 * runs. A `satisfied` intent that rests on external stable-stop evidence is shown `pending` until this
 * broker instance has revalidated that evidence (a contract that held before a restart is not
 * evidence it holds now). Only visible targets are listed; a hidden one that is not confirmed sets
 * `restrictedWorkRemains` and nothing else.
 * @internal
 */
export async function presentStop(
  core: BrokerCore,
  ctx: AccessContext,
  intent: IStopIntent,
  capacity?: ICapacityFailure
): Promise<TaskResult<IStopResult>> {
  const latching: boolean = isLatchingStopState(intent.state);
  let degraded: boolean = false;
  let restricted: boolean = false;
  const visible: IProjectedStopTarget[] = [];
  for (const target of intent.targets) {
    const read = await _readTarget(core, target.taskId);
    if (read.isFailure()) {
      return propagate(read);
    }
    const record: ITaskCommitRecord | undefined = read.value;
    let presented: IProjectedStopTarget = _projected(target);
    if (
      latching &&
      target.state === 'confirmed' &&
      (record === undefined || !targetStopped(intent.mode, record))
    ) {
      degraded = true;
      presented = {
        ...presented,
        state: 'indeterminate',
        ...(record !== undefined && record.recordType === 'resolved'
          ? {
              violation: {
                observedRevision: record.task.envelope.revision,
                observedStatus: record.task.envelope.lifecycle.status
              }
            }
          : {})
      };
    }
    if (record !== undefined && (await ctx.sees(subjectOf(record)))) {
      visible.push(presented);
    } else if (presented.state !== 'confirmed') {
      restricted = true;
    }
  }
  const unrevalidated: boolean =
    intent.targets.some((target) => target.stableSourceEvidence !== undefined) &&
    !core.revalidatedStops.has(stopKey(intent.rootId, intent.id));
  const state: StopIntentState = !latching
    ? intent.state
    : degraded
    ? 'blocked'
    : intent.state === 'satisfied' && unrevalidated
    ? 'pending'
    : intent.state;
  return ok({
    intentId: intent.id,
    rootId: intent.rootId,
    mode: intent.mode,
    state,
    targets: visible,
    restrictedWorkRemains: restricted,
    ...(capacity !== undefined ? { capacity } : {})
  });
}

/**
 * Whether a root may be the root of a stop in this mode: a resolved, live, broker-managed tracked task
 * or list whose declared policy allows it. The preset needs complete tree membership owned by this
 * repository, which only a native parent has (design § 4: external parents use `none`).
 */
function _stoppable(record: ITaskCommitRecord, mode: StopMode, operationId: OperationId): TaskResult<true> {
  const id: TaskId = record.recordType === 'resolved' ? record.task.envelope.id : record.reference.id;
  if (record.recordType !== 'resolved' || !isNativeKind(record.task.envelope)) {
    return taskFailure(
      `task ${id}: only a broker-managed tracked task or list can be the root of a stop`,
      'unsupported',
      'after-host-action',
      { operationId }
    );
  }
  if (record.archived) {
    return taskFailure(`task ${id}: an archived tombstone is immutable`, 'conflict', 'after-host-action', {
      operationId
    });
  }
  const policy = record.task.envelope.stopPolicy;
  if (policy === 'none' || (mode === 'cancel' && policy !== 'cascade-cancel')) {
    return taskFailure(
      `task ${id}: its stop policy '${policy}' does not permit a cascade ${mode}`,
      'unsupported',
      'after-host-action',
      { operationId }
    );
  }
  return ok(true);
}

/** The stored request's replay, or `undefined` when the key is new. */
async function _replay(
  core: BrokerCore,
  ctx: AccessContext,
  epoch: string,
  record: ITaskCommitRecord,
  stored: IStoredTaskOperation | undefined,
  operation: 'stop' | 'release-stop',
  json: JsonValue,
  intentId: OperationId,
  taskId: TaskId
): Promise<TaskResult<IStopResult> | undefined> {
  if (stored === undefined) {
    return undefined;
  }
  if (!isSameCatalog(stored, operation, ctx.principal, json)) {
    return taskFailure(
      `task ${taskId}: operation '${stored.operationId}' is already recorded with a different request`,
      'conflict',
      'after-host-action',
      { operationId: stored.operationId }
    );
  }
  if (!(await ctx.may(operation, subjectOf(record), 'subject'))) {
    return denied(taskId, operation, stored.operationId);
  }
  // The same key is answered with the evolving result, never a second acceptance.
  const intent: IStopIntent | undefined = intentOf(record, intentId);
  if (intent === undefined) {
    return taskFailure(
      `task ${taskId}: operation '${stored.operationId}' is recorded, and the stop it names is not`,
      'storage-corrupt',
      'after-host-action',
      { operationId: stored.operationId }
    );
  }
  const presented = await presentStop(core, ctx, intent);
  if (presented.isFailure()) {
    return presented;
  }
  return confirmUnchanged(core, ctx, epoch, taskId, record, presented.value, stored.operationId);
}

/** The draft of a root with its intents replaced and one operation added. */
function _draft(
  current: IResolvedTaskCommitRecord,
  operation: IStoredCatalogOperation,
  stops: ReadonlyArray<IStopIntent>
): IResolvedTaskRecordDraft {
  return {
    recordType: 'resolved',
    task: current.task,
    ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
    operations: [...current.operations, operation],
    updates: current.updates,
    archived: current.archived,
    stops
  };
}

/** The refusal for a stale expected revision. */
function _stale<T>(taskId: TaskId, expected: number, found: number, operationId: OperationId): TaskResult<T> {
  return taskFailure<T>(
    `task ${taskId}: expected revision ${expected}, found ${found}`,
    'conflict',
    'reconcile-first',
    { operationId }
  );
}

/**
 * `requestStop`: accepts a cascade stop.
 *
 * @remarks
 * The order is the authorization contract, as for every catalog mutation: read and capture the policy
 * epoch; invisible → the foreign-id failure; a recorded key replays the evolving result; authorize
 * `stop` on the root; check the root, its policy and revision. Then, inside the serialized writer, the
 * root is re-read, the authoritative subtree captured **there** — so a concurrently arriving edge either
 * committed first and is a target, or arrives afterwards and is refused by the latch — every target's
 * command key minted, and the intent committed. Storage refuses an intent whose targets are not exactly
 * the subtree at that moment, and reserves for every target before it accepts it. Nothing is
 * dispatched: the result is `pending`, every target `unexamined`.
 * @internal
 */
export async function requestStop(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IStopResult>> {
  const converted = convertRequest(core, core.converters.stops.request, input, 'requestStop');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IStopRequest = converted.value.value;
  const { taskId, operationId, mode } = request;
  const read = await readExisting(core, taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const record: ITaskCommitRecord = read.value;
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await ctx.sees(subjectOf(record)))) {
    return notFound(taskId, operationId);
  }
  const replayed = await _replay(
    core,
    ctx,
    epoch.value,
    record,
    storedOperation(record, operationId),
    'stop',
    converted.value.json,
    operationId,
    taskId
  );
  if (replayed !== undefined) {
    return replayed;
  }
  if (!(await ctx.may('stop', subjectOf(record), 'subject'))) {
    return denied(taskId, 'stop', operationId);
  }
  const stoppable = _stoppable(record, mode, operationId);
  if (stoppable.isFailure()) {
    return propagate(stoppable);
  }
  if (revisionOf(record) !== request.expectedRevision) {
    return _stale(taskId, request.expectedRevision, revisionOf(record), operationId);
  }

  // `undefined` from the writer section: the same key committed while this one waited.
  const accepted = await core.gated(async (writer): Promise<TaskResult<IStopIntent | undefined>> => {
    const reread = await writer.readCommit(taskId);
    if (reread.isFailure()) {
      return propagate<IStopIntent | undefined>(reread);
    }
    const found: ITaskCommitRecord | undefined = reread.value;
    if (found !== undefined && storedOperation(found, operationId) !== undefined) {
      return ok<IStopIntent | undefined>(undefined);
    }
    if (
      found === undefined ||
      found.recordType !== 'resolved' ||
      revisionOf(found) !== request.expectedRevision
    ) {
      return changedSinceAuthorized<IStopIntent | undefined>(`task ${taskId}`, operationId);
    }
    const current: IResolvedTaskCommitRecord = found;
    const again = _stoppable(current, mode, operationId);
    if (again.isFailure()) {
      return propagate<IStopIntent | undefined>(again);
    }
    const existing: IStopIntent | undefined = (current.stops ?? []).find(
      (intent) => intent.mode === mode && isLatchingStopState(intent.state)
    );
    if (existing !== undefined) {
      return taskFailure<IStopIntent | undefined>(
        `task ${taskId}: stop ${existing.id} already holds a ${mode} latch on it`,
        'conflict',
        'after-host-action',
        { operationId }
      );
    }
    // Captured here, under the writer: the complete authoritative subtree now, never a display tree,
    // never truncated. A larger tree is refused before anything is written.
    const subtree = core.repository.subtree(taskId, defaultMaxStopTargets);
    if (subtree.isFailure()) {
      return taskFailure<IStopIntent | undefined>(
        `requestStop ${taskId}: ${subtree.message}; the stop is refused rather than truncated`,
        'invalid',
        'after-host-action',
        { operationId }
      );
    }
    const targets: IStopTarget[] = [];
    for (const target of subtree.value) {
      const key = core.mintOperationId();
      if (key.isFailure()) {
        return propagate<IStopIntent | undefined>(key);
      }
      targets.push({ taskId: target, attempt: 1, operationId: key.value, state: 'unexamined' });
    }
    const intent: IStopIntent = {
      id: operationId,
      rootId: taskId,
      mode,
      requestedBy: ctx.principal,
      targets,
      state: 'pending',
      topologyGeneration: core.repository.health().generation
    };
    const operation: IStoredCatalogOperation = {
      type: 'catalog',
      operationId,
      operation: 'stop',
      request: converted.value.json,
      principalKey: ctx.principal,
      receipt: { intentId: operationId, mode, targets: targets.length }
    };
    // After the last await and immediately before the write.
    if (!ctx.epochIs(epoch.value)) {
      return changedSinceAuthorized<IStopIntent | undefined>('the authorization policy', operationId);
    }
    const committed = await writer.commit({
      purpose: 'operation',
      operationId,
      taskId,
      expectedRevision: current.task.envelope.revision,
      expectedRecordRevision: current.recordRevision,
      record: _draft(current, operation, [...(current.stops ?? []), intent])
    });
    return committed.isSuccess()
      ? ok<IStopIntent | undefined>(intent)
      : propagate<IStopIntent | undefined>(committed);
  });
  if (accepted.isFailure()) {
    return propagate(accepted);
  }
  return accepted.value !== undefined
    ? presentStop(core, ctx, accepted.value)
    : requestStop(core, ctx, input);
}

/**
 * `releaseStop`: releases a latching intent. Host-authorized (`release-stop` on the root) and
 * revision-checked. A pause may be released with blockers standing: the host accepts the visible
 * partial state. A cancel whose root is terminal cannot be released — that would reopen the tree —
 * and nothing resumes: children and root resume only by their own authorized commands once every
 * applicable latch is gone.
 * @internal
 */
export async function releaseStop(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IStopResult>> {
  const converted = convertRequest(core, core.converters.stops.release, input, 'releaseStop');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IReleaseStop = converted.value.value;
  const { taskId, operationId, intentId } = request;
  const read = await readExisting(core, taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const record: ITaskCommitRecord = read.value;
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await ctx.sees(subjectOf(record)))) {
    return notFound(taskId, operationId);
  }
  const replayed = await _replay(
    core,
    ctx,
    epoch.value,
    record,
    storedOperation(record, operationId),
    'release-stop',
    converted.value.json,
    intentId,
    taskId
  );
  if (replayed !== undefined) {
    return replayed;
  }
  if (!(await ctx.may('release-stop', subjectOf(record), 'subject'))) {
    return denied(taskId, 'release-stop', operationId);
  }
  const releasable = _releasable(record, intentId, operationId);
  if (releasable.isFailure()) {
    return propagate(releasable);
  }
  if (revisionOf(record) !== request.expectedRevision) {
    return _stale(taskId, request.expectedRevision, revisionOf(record), operationId);
  }

  const released = await core.gated(async (writer): Promise<TaskResult<IStopIntent | undefined>> => {
    const reread = await writer.readCommit(taskId);
    if (reread.isFailure()) {
      return propagate<IStopIntent | undefined>(reread);
    }
    const found: ITaskCommitRecord | undefined = reread.value;
    if (found !== undefined && storedOperation(found, operationId) !== undefined) {
      return ok<IStopIntent | undefined>(undefined);
    }
    if (
      found === undefined ||
      found.recordType !== 'resolved' ||
      revisionOf(found) !== request.expectedRevision
    ) {
      return changedSinceAuthorized<IStopIntent | undefined>(`task ${taskId}`, operationId);
    }
    const current: IResolvedTaskCommitRecord = found;
    const again = _releasable(current, intentId, operationId);
    if (again.isFailure()) {
      return propagate<IStopIntent | undefined>(again);
    }
    const stops: ReadonlyArray<IStopIntent> = (current.stops ?? []).map((intent) =>
      intent.id === intentId ? { ...intent, state: 'released' } : intent
    );
    const operation: IStoredCatalogOperation = {
      type: 'catalog',
      operationId,
      operation: 'release-stop',
      request: converted.value.json,
      principalKey: ctx.principal,
      receipt: { intentId, state: 'released' }
    };
    if (!ctx.epochIs(epoch.value)) {
      return changedSinceAuthorized<IStopIntent | undefined>('the authorization policy', operationId);
    }
    const committed = await writer.commit({
      purpose: 'operation',
      operationId,
      taskId,
      expectedRevision: current.task.envelope.revision,
      expectedRecordRevision: current.recordRevision,
      record: _draft(current, operation, stops)
    });
    return committed.isSuccess()
      ? ok<IStopIntent | undefined>(intentOf(committed.value, intentId))
      : propagate<IStopIntent | undefined>(committed);
  });
  if (released.isFailure()) {
    return propagate(released);
  }
  return released.value !== undefined
    ? presentStop(core, ctx, released.value)
    : releaseStop(core, ctx, input);
}

/** Whether an intent of a root may be released now. */
function _releasable(
  record: ITaskCommitRecord,
  intentId: OperationId,
  operationId: OperationId
): TaskResult<true> {
  const intent: IStopIntent | undefined = intentOf(record, intentId);
  const id: TaskId = record.recordType === 'resolved' ? record.task.envelope.id : record.reference.id;
  if (intent === undefined) {
    return taskFailure(`task ${id}: holds no stop ${intentId}`, 'not-found-or-denied', 'after-host-action', {
      operationId
    });
  }
  if (!isLatchingStopState(intent.state)) {
    return taskFailure(
      `task ${id}: stop ${intentId} is already ${intent.state}`,
      'conflict',
      'after-host-action',
      {
        operationId
      }
    );
  }
  if (
    intent.mode === 'cancel' &&
    record.recordType === 'resolved' &&
    isTerminalTaskStatus(record.task.envelope.lifecycle.status)
  ) {
    return taskFailure(
      `task ${id}: stop ${intentId} is a cancel of a terminal root; releasing it would reopen the tree, ` +
        `which v1 does not do`,
      'conflict',
      'after-host-action',
      { operationId }
    );
  }
  return ok(true);
}

/**
 * `inspectStop`: one intent's current result. The root must be visible; nothing is dispatched or
 * written.
 * @internal
 */
export async function inspectStop(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IStopResult>> {
  const converted = convertRequest(core, core.converters.stops.inspect, input, 'inspectStop');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IStopInspectRequest = converted.value.value;
  const read = await readExisting(core, request.taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  if (!(await ctx.sees(subjectOf(read.value)))) {
    return notFound(request.taskId);
  }
  const intent: IStopIntent | undefined = intentOf(read.value, request.intentId);
  return intent === undefined
    ? taskFailure(
        `task ${request.taskId}: holds no stop ${request.intentId}`,
        'not-found-or-denied',
        'after-host-action'
      )
    : presentStop(core, ctx, intent);
}
