/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { planUpdates } from '../implementations';
import {
  ICreateTaskList,
  ICreateTrackedTask,
  IRegisterExternalTask,
  ISourceReplayEnvelope,
  IStoredCatalogOperation,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskMutationResult,
  ITaskRecordDraft,
  ITaskScope,
  ITaskSource,
  ITaskUpdate,
  Instant,
  TaskCatalogOperationType,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  isTerminalTaskStatus,
  taskListDetailVersion,
  taskListKind,
  trackedTaskDetailVersion,
  taskRecordScopes,
  trackedTaskKind
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, subjectOf } from './access';
import { IRelatedTask, confirmUnchanged, isSameCatalog, readExisting } from './catalogMutation';
import { checkParentOpen, convertRequest, readParent, refuseUnderLatch } from './catalogOperations';
import { BrokerCore, receiptJson, revisionOf } from './core';
import { changedSinceAuthorized, denied, notFound, ok, propagate, taskFailure } from './failures';

const firstRevision: TaskRevision = 1 as TaskRevision;

/** The receipt a creation stores and returns. */
function _receipt(
  taskId: TaskId,
  operationId: ITaskMutationResult['operationId'],
  updates: ReadonlyArray<ITaskUpdate>
): ITaskMutationResult {
  return {
    taskId,
    revision: firstRevision,
    operationId,
    disposition: 'changed',
    updateIds: updates.map((update) => update.id)
  };
}

/** The creation evidence a committed record holds, as a receipt. */
function _committedReceipt(core: BrokerCore, record: ITaskCommitRecord): TaskResult<ITaskMutationResult> {
  const receipt = core.converters.broker.mutationResult.convert(record.operations[0].receipt);
  return receipt.isSuccess()
    ? ok(receipt.value)
    : taskFailure(
        `creation receipt does not convert: ${receipt.message}`,
        'storage-corrupt',
        'after-host-action',
        { operationId: record.operations[0].operationId }
      );
}

/**
 * Re-checks, inside the writer, that a parent read before it is unchanged and still open.
 * @internal
 */
export async function recheckParent(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  parent: IRelatedTask | undefined,
  childId: TaskId,
  operationId: ITaskMutationResult['operationId']
): Promise<TaskResult<true>> {
  if (parent === undefined) {
    return ok(true);
  }
  const again = await writer.readCommit(parent.id);
  if (again.isFailure()) {
    return propagate(again);
  }
  if (again.value === undefined || revisionOf(again.value) !== revisionOf(parent.record)) {
    return changedSinceAuthorized(`the parent of ${childId}`, operationId);
  }
  // A stop does not move its root's revision, so the latch is checked here, under the writer, where it
  // is current: an edge arriving after a stop captured the tree is refused (T9).
  return checkParentOpen(again.value, parent.role).onSuccess(() =>
    refuseUnderLatch(core, parent.id, `it takes no new child`, operationId)
  );
}

/**
 * Creates a tracked task or a task list through a bound writer.
 *
 * @remarks
 * A task that already exists answers the retry: the same creation (operation, principal and
 * canonical request) replays its stored receipt after the creation is re-authorized; anything
 * else under that id conflicts. Otherwise the parent, if any, must be visible, authorized for
 * `create` in the `parent` role, resolved and open — checked again inside the writer — and the
 * task is registered with the view's creation scopes.
 * @internal
 */
export async function createNative(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown,
  list: boolean,
  committedScopes?: ReadonlyArray<ITaskScope>
): Promise<TaskResult<ITaskMutationResult>> {
  // A creation that finds, inside the writer, that the task went live after it was authorized —
  // a concurrent identical creation or resume won — commits nothing and runs again, which takes the
  // existing-record path and its checks against the record as committed.
  const first = await _createOnce(core, ctx, input, list, committedScopes);
  return first.isSuccess() && first.value === undefined
    ? (await _createOnce(core, ctx, input, list, committedScopes)).onSuccess((again) =>
        again !== undefined
          ? ok(again)
          : taskFailure<ITaskMutationResult>(
              `create: the task kept changing while it was authorized; retry`,
              'conflict',
              'safe'
            )
      )
    : first.onSuccess((created) => ok(created!));
}

/** One authorize-then-commit attempt; `undefined` when the task went live under it and it should run again. */
async function _createOnce(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown,
  list: boolean,
  committedScopes: ReadonlyArray<ITaskScope> | undefined
): Promise<TaskResult<ITaskMutationResult | undefined>> {
  const converted = list
    ? convertRequest<ICreateTrackedTask | ICreateTaskList>(
        core,
        core.converters.broker.createList,
        input,
        'createTaskList'
      )
    : convertRequest<ICreateTrackedTask | ICreateTaskList>(
        core,
        core.converters.broker.createTracked,
        input,
        'createTracked'
      );
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: ICreateTrackedTask | ICreateTaskList = converted.value.value;
  const json: JsonValue = converted.value.json;
  const { taskId, operationId } = request;
  const operation: TaskCatalogOperationType = list ? 'create-list' : 'create-tracked';
  // The scopes authorized are the scopes committed: a resume of a record that already landed commits
  // that record's scopes, so it is those the policy is asked about (and the view must select them).
  if (committedScopes !== undefined && !committedScopes.every((scope) => ctx.selects(scope))) {
    return _noPending(taskId);
  }
  const scopes = committedScopes ?? ctx.creationScopes;
  const access = {
    scopes,
    ...(request.responsibility !== undefined ? { targetResponsibility: request.responsibility } : {})
  };

  // Captured before the first question is put to the policy, so the recheck inside the writer
  // covers every answer this creation relies on — the parent's included.
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  const existing = await core.repository.readCommit(taskId);
  if (existing.isFailure()) {
    return propagate(existing);
  }
  if (existing.value !== undefined) {
    const record: ITaskCommitRecord = existing.value;
    if (!(await ctx.sees(subjectOf(record)))) {
      return notFound(taskId, operationId);
    }
    if (!isSameCatalog(record.operations[0], operation, ctx.principal, json)) {
      return taskFailure(
        `task ${taskId}: already registered by a different operation or request`,
        'conflict',
        'after-host-action',
        { operationId }
      );
    }
    // A replay is authorized for the scopes the task was committed with, whichever view asks.
    if (!(await ctx.mayCreate({ ...access, scopes: committedScopes ?? taskRecordScopes(record) }))) {
      return denied(taskId, 'create', operationId);
    }
    // The parent the request names is authorized again in its role, as the creation was.
    const named =
      request.parentId !== undefined
        ? (await readParent(core, ctx, taskId, request.parentId, 'parent', 'create')).onSuccess((parent) =>
            ok([parent])
          )
        : ok<ReadonlyArray<IRelatedTask>>([]);
    if (named.isFailure()) {
      return propagate(named);
    }
    const receipt = _committedReceipt(core, record);
    return receipt.isFailure()
      ? receipt
      : confirmUnchanged(core, ctx, epoch.value, taskId, record, receipt.value, operationId, named.value);
  }
  if (!(await ctx.mayCreate(access))) {
    return denied(taskId, 'create', operationId);
  }
  if (scopes.length === 0) {
    return taskFailure(`${operation}: this view has no creation scopes`, 'invalid', 'after-host-action', {
      operationId
    });
  }

  let parent: IRelatedTask | undefined = undefined;
  if (request.parentId !== undefined) {
    const read = await readParent(core, ctx, taskId, request.parentId, 'parent', 'create');
    if (read.isFailure()) {
      return propagate(read);
    }
    const open = checkParentOpen(read.value.record, 'parent');
    if (open.isFailure()) {
      return propagate(open);
    }
    parent = read.value;
  }

  return core.gated(async (writer): Promise<TaskResult<ITaskMutationResult | undefined>> => {
    // Went live since it was read: storage would replay it without this view's replay checks.
    const now = await writer.readCommit(taskId);
    if (now.isFailure()) {
      return propagate(now);
    }
    if (now.value !== undefined) {
      return ok(undefined);
    }
    const parentNow = await recheckParent(core, writer, parent, taskId, operationId);
    if (parentNow.isFailure()) {
      return propagate(parentNow);
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate(clock);
    }
    const envelope: ITaskEnvelope = _nativeEnvelope(request, list, scopes, clock.value);
    const updates: ReadonlyArray<ITaskUpdate> = planUpdates(
      undefined,
      envelope,
      ['lifecycle'],
      core.audience
    );
    const details: JsonValue = 'completion' in request ? { completion: request.completion } : {};
    // After the last await and immediately before the registration, which awaits nothing before
    // it writes: the policy must still be the one the creation was authorized under.
    if (!ctx.epochIs(epoch.value)) {
      return changedSinceAuthorized<ITaskMutationResult>('the authorization policy', operationId);
    }
    return _register(core, writer, {
      taskId,
      operationId,
      operation,
      request: json,
      principal: ctx.principal,
      receipt: _receipt(taskId, operationId, updates),
      draft: (op) => ({
        recordType: 'resolved',
        task: { envelope, details },
        operations: [op],
        updates,
        archived: false
      })
    });
  });
}

/** A new native task's first envelope. */
function _nativeEnvelope(
  request: ICreateTrackedTask | ICreateTaskList,
  list: boolean,
  scopes: ITaskEnvelope['scopes'],
  now: Instant
): ITaskEnvelope {
  return {
    schemaVersion: 1,
    id: request.taskId,
    kind: list ? taskListKind : trackedTaskKind,
    detailVersion: list ? taskListDetailVersion : trackedTaskDetailVersion,
    revision: firstRevision,
    title: request.title,
    ...(request.description !== undefined ? { description: request.description } : {}),
    ...(request.parentId !== undefined ? { parentId: request.parentId } : {}),
    stopPolicy: request.stopPolicy ?? 'none',
    ...(request.responsibility !== undefined ? { responsibility: request.responsibility } : {}),
    scopes,
    lifecycle: { status: 'pending' },
    attention: [],
    // A native task has no source to reattach: after a restart its actor resumes it.
    recovery: 'host-resume',
    observation: { state: 'current', observedAt: now },
    createdAt: now,
    changedAt: now
  };
}

/** Registers a first record and answers with the committed creation receipt. */
async function _register(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  params: {
    readonly taskId: TaskId;
    readonly operationId: ITaskMutationResult['operationId'];
    readonly operation: TaskCatalogOperationType;
    readonly request: JsonValue;
    readonly principal: string;
    readonly receipt: ITaskMutationResult;
    readonly draft: (operation: IStoredCatalogOperation) => ITaskRecordDraft;
    readonly sourceReplay?: { readonly sourceId: string; readonly envelope: ISourceReplayEnvelope };
  }
): Promise<TaskResult<ITaskMutationResult>> {
  const operation: IStoredCatalogOperation = {
    type: 'catalog',
    operationId: params.operationId,
    operation: params.operation,
    request: params.request,
    principalKey: params.principal,
    receipt: receiptJson(params.receipt)
  };
  const registered = await writer.register({
    taskId: params.taskId,
    operationId: params.operationId,
    request: params.request,
    record: params.draft(operation),
    ...(params.sourceReplay !== undefined ? { sourceReplay: params.sourceReplay } : {})
  });
  // A registration that replays answers with the receipt it committed the first time.
  return registered.isSuccess() ? _committedReceipt(core, registered.value) : propagate(registered);
}

/**
 * A registration to resume: one still pending, or — when an earlier resume committed it and its
 * response was lost — the live task it became. `scopes` are the scopes a resume will commit, when
 * those are already fixed: the landed record's, or the live task's.
 */
interface IResumable {
  readonly taskId: TaskId;
  readonly operationId: ITaskMutationResult['operationId'];
  readonly operation: TaskCatalogOperationType;
  readonly principalKey: string;
  readonly request: JsonValue;
  readonly scopes?: ReadonlyArray<ITaskScope>;
}

/**
 * Resumes a pending native registration through a bound writer, from the request the repository
 * stored with it. `create` is authorized again here, now, by {@link createNative}, which asks the
 * policy and re-checks the epoch inside the writer — against the scopes that will be committed: the
 * landed record's when one exists, otherwise this view's creation scopes. A registration an earlier
 * resume already committed replays its receipt, re-authorized the same way.
 * @internal
 */
export async function resumeNative(
  core: BrokerCore,
  ctx: AccessContext,
  taskId: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  return (await _resumable(core, taskId))
    .onSuccess((resumable) =>
      // Another principal's registration is answered as an id with none: it is not this view's.
      resumable.principalKey !== ctx.principal ||
      (resumable.operation === 'register-external' && !_selectsExternal(core, ctx, resumable))
        ? _noPending<IResumable>(resumable.taskId)
        : resumable.operation === 'register-external'
        ? taskFailure<IResumable>(
            `resumePendingRegistration: ${resumable.taskId} is an external registration; resume it ` +
              `through TaskBroker.resumePendingRegistration`,
            'invalid',
            'after-host-action',
            { operationId: resumable.operationId }
          )
        : ok(resumable)
    )
    .thenOnSuccess((resumable) =>
      createNative(core, ctx, resumable.request, resumable.operation === 'create-list', resumable.scopes)
    );
}

/**
 * Whether this view selects a scope of the external registration a resume names — the condition
 * for telling it which entry point resumes it, rather than answering as for an id with none.
 */
function _selectsExternal(core: BrokerCore, ctx: AccessContext, resumable: IResumable): boolean {
  const scopes: ReadonlyArray<ITaskScope> =
    resumable.scopes ??
    core.converters.broker.registerExternal
      .convert(resumable.request)
      .onSuccess((request) => ok<ReadonlyArray<ITaskScope>>(request.scopes))
      .orDefault([]);
  return scopes.some((scope) => ctx.selects(scope));
}

/**
 * Resumes a pending external registration — a trusted host operation, under the principal it was
 * accepted for, from the request the repository stored with it. One an earlier resume already
 * committed replays.
 * @internal
 */
export async function resumeExternal(
  core: BrokerCore,
  taskId: unknown
): Promise<TaskResult<TaskRegistrationResult>> {
  return (await _resumable(core, taskId))
    .onSuccess((resumable) =>
      resumable.operation === 'register-external'
        ? ok(resumable)
        : taskFailure<IResumable>(
            `resumePendingRegistration: ${resumable.taskId} is a native registration; resume it through a ` +
              `bound writer, which authorizes it`,
            'invalid',
            'after-host-action',
            { operationId: resumable.operationId }
          )
    )
    .thenOnSuccess((resumable) => registerExternal(core, resumable.principalKey, resumable.request));
}

/**
 * The registration `taskId` names: pending, or live and created by a catalog registration — a
 * resume whose response was lost. Anything else is the one no-pending failure.
 */
async function _resumable(core: BrokerCore, taskId: unknown): Promise<TaskResult<IResumable>> {
  const id = core.converters.ids.taskId.convert(taskId);
  if (id.isFailure()) {
    return taskFailure(`resumePendingRegistration: ${id.message}`, 'invalid', 'after-host-action');
  }
  return core.repository.pendingRegistration(id.value).thenOnSuccess(
    async (pending): Promise<TaskResult<IResumable>> =>
      pending !== undefined
        ? ok<IResumable>({
            taskId: pending.taskId,
            operationId: pending.operationId,
            operation: pending.operation,
            principalKey: pending.principalKey,
            request: pending.request,
            ...(pending.landedScopes !== undefined ? { scopes: pending.landedScopes } : {})
          })
        : (await core.repository.readCommit(id.value)).onSuccess((record) => _committed(id.value, record))
  );
}

/** A live task as a resumable registration, when its creation was a catalog registration. */
function _committed(taskId: TaskId, record: ITaskCommitRecord | undefined): TaskResult<IResumable> {
  const creation = record?.operations[0];
  return record !== undefined && creation !== undefined && creation.type === 'catalog'
    ? ok<IResumable>({
        taskId,
        operationId: creation.operationId,
        operation: creation.operation,
        principalKey: creation.principalKey,
        request: creation.request,
        scopes: taskRecordScopes(record)
      })
    : _noPending(taskId);
}

function _noPending<T>(taskId: TaskId): TaskResult<T> {
  return taskFailure<T>(
    `resumePendingRegistration: no pending registration ${taskId}`,
    'not-found-or-denied',
    'after-host-action'
  );
}

/**
 * Registers an externally executed task: a trusted host operation, not a bound-view one.
 *
 * @remarks
 * Native kinds are refused — the broker owns their lifecycle. The parent, if any, must exist and
 * be open, checked inside the writer. Without an initial observation the record is unresolved,
 * with no lifecycle invented; with one, the first record is resolved from it and its source
 * revision is the observation's. The binding is stored exactly as given and never changes.
 * @internal
 */
export async function registerExternal(
  core: BrokerCore,
  principal: string,
  input: unknown
): Promise<TaskResult<TaskRegistrationResult>> {
  const key = core.converters.broker.principalKey.convert(principal);
  if (key.isFailure()) {
    return taskFailure(`registerExternal: ${key.message}`, 'invalid', 'after-host-action');
  }
  const converted = convertRequest(core, core.converters.broker.registerExternal, input, 'registerExternal');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IRegisterExternalTask = converted.value.value;
  const { taskId, operationId } = request;
  if (request.kind === trackedTaskKind || request.kind === taskListKind) {
    return taskFailure(
      `registerExternal: '${request.kind}' is a native kind; create it through a bound writer`,
      'invalid',
      'after-host-action',
      { operationId }
    );
  }
  const qualified = _qualifyHistory(core, request);
  if (qualified.isFailure()) {
    return propagate(qualified);
  }
  const first = await _registerExternalOnce(core, key.value, request, converted.value.json);
  // Went live under it: run again, which finds the live registration and replays it.
  const registered =
    first.isSuccess() && first.value === undefined
      ? await _registerExternalOnce(core, key.value, request, converted.value.json)
      : first;
  if (registered.isFailure()) {
    return propagate(registered);
  }
  // A second attempt sees the live task, so it replays or conflicts; it never finds it moving again.
  const read = await core.repository.read(taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  return read.value !== undefined ? ok(read.value) : notFound(taskId, operationId);
}

/**
 * One external registration attempt; `undefined` when the task went live after it was read.
 *
 * @remarks
 * A live registration identical to this one (operation, principal, canonical request) is a replay
 * after a lost response: it is replayed without the parent checks, which decided the original
 * registration and must not refuse its replay because the parent closed since.
 */
async function _registerExternalOnce(
  core: BrokerCore,
  principal: string,
  request: IRegisterExternalTask,
  json: JsonValue
): Promise<TaskResult<ITaskMutationResult | undefined>> {
  const { taskId, operationId } = request;
  const existing = await core.repository.readCommit(taskId);
  if (existing.isFailure()) {
    return propagate(existing);
  }
  const replaying: boolean =
    existing.value !== undefined &&
    isSameCatalog(existing.value.operations[0], 'register-external', principal, json);
  if (existing.value !== undefined && !replaying) {
    return taskFailure(
      `registerExternal: task ${taskId} is already registered by a different operation or request`,
      'conflict',
      'after-host-action',
      { operationId }
    );
  }
  let parent: IRelatedTask | undefined = undefined;
  if (request.parentId !== undefined && !replaying) {
    const read = await readExisting(core, request.parentId);
    if (read.isFailure()) {
      return propagate(read);
    }
    parent = { id: request.parentId, role: 'parent', record: read.value };
  }
  return core.gated(async (writer): Promise<TaskResult<ITaskMutationResult | undefined>> => {
    if (!replaying) {
      const now = await writer.readCommit(taskId);
      if (now.isFailure()) {
        return propagate(now);
      }
      if (now.value !== undefined) {
        return ok(undefined);
      }
    }
    const parentNow = await recheckParent(core, writer, parent, taskId, operationId);
    if (parentNow.isFailure()) {
      return propagate(parentNow);
    }
    const checkpoint = await _checkpointAgrees(core, writer, request);
    if (checkpoint.isFailure()) {
      return propagate(checkpoint);
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate(clock);
    }
    return _registerExternal(core, writer, request, json, principal, clock.value);
  });
}

/**
 * The attached source must be the one the repository has checkpointed under its id: a history that
 * differs from the committed checkpoint's could admit a task no pass over that source may ever move.
 */
async function _checkpointAgrees(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  request: IRegisterExternalTask
): Promise<TaskResult<true>> {
  const source: ITaskSource | undefined = core.sources.get(request.binding.sourceId);
  if (source === undefined) {
    return ok(true);
  }
  const stored = await writer.readSource(source.id);
  if (stored.isFailure()) {
    return propagate(stored);
  }
  return stored.value === undefined || stored.value.history === source.history
    ? ok(true)
    : taskFailure(
        `registerExternal: source '${source.id}' was checkpointed as '${stored.value.history}' and is ` +
          `attached as '${source.history}'; nothing may be admitted against it until that is reconciled`,
        'invalid',
        'after-host-action',
        { operationId: request.operationId }
      );
}

/**
 * Qualifies a registration's history guarantee against the attached source (design § 8.6).
 *
 * @remarks
 * The stronger `source-replay` guarantee is refused, before anything is recorded, unless the source
 * is attached and replays; and a replaying source's registrations must declare the finite envelope
 * they need, since only that makes the guarantee reservable. Such a registration takes no initial
 * observation: its first state comes from the feed's order, never from an independent latest read.
 */
function _qualifyHistory(core: BrokerCore, request: IRegisterExternalTask): TaskResult<true> {
  const source: ITaskSource | undefined = core.sources.get(request.binding.sourceId);
  const { operationId } = request;
  if (request.history?.history === 'source-replay') {
    if (source?.history !== 'source-replay') {
      return taskFailure(
        `registerExternal: source '${request.binding.sourceId}' is not an attached source-replay source; ` +
          `the source-replay guarantee is refused`,
        'unsupported',
        'after-host-action',
        { operationId }
      );
    }
    if (request.initialObservation !== undefined) {
      return taskFailure(
        `registerExternal: a source-replay registration is seeded by its feed, not an initial observation`,
        'invalid',
        'after-host-action',
        { operationId }
      );
    }
    return ok(true);
  }
  return source?.history === 'source-replay'
    ? taskFailure(
        `registerExternal: source '${source.id}' is source-replay; its registrations declare the finite ` +
          `envelope they need`,
        'invalid',
        'after-host-action',
        { operationId }
      )
    : ok(true);
}

/**
 * Extends a `source-replay` task's finite envelope: new admission, charged before the source relies
 * on it. Returns the envelope now held.
 * @internal
 */
export async function extendReplayEnvelope(
  core: BrokerCore,
  taskId: TaskId,
  add: ISourceReplayEnvelope
): Promise<TaskResult<ISourceReplayEnvelope>> {
  const id = core.converters.ids.taskId.convert(taskId);
  if (id.isFailure()) {
    return taskFailure(`extendReplayEnvelope: ${id.message}`, 'invalid', 'after-host-action');
  }
  return core.gated((writer) => writer.extendReplayEnvelope(id.value, add));
}

async function _registerExternal(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  request: IRegisterExternalTask,
  json: JsonValue,
  principal: string,
  now: Instant
): Promise<TaskResult<ITaskMutationResult>> {
  const { taskId, operationId } = request;
  const history = request.history;
  const common = {
    taskId,
    operationId,
    operation: 'register-external' as const,
    request: json,
    principal,
    ...(history?.history === 'source-replay'
      ? { sourceReplay: { sourceId: request.binding.sourceId, envelope: history.envelope } }
      : {})
  };
  const observation = request.initialObservation;
  if (observation === undefined) {
    return _register(core, writer, {
      ...common,
      receipt: _receipt(taskId, operationId, []),
      draft: (op) => ({
        recordType: 'unresolved',
        reference: {
          id: taskId,
          revision: firstRevision,
          kind: request.kind,
          detailVersion: request.detailVersion,
          title: request.title,
          ...(request.parentId !== undefined ? { parentId: request.parentId } : {}),
          ...(request.responsibility !== undefined ? { responsibility: request.responsibility } : {}),
          scopes: request.scopes,
          binding: request.binding,
          reason: 'awaiting the first source observation'
        },
        operations: [op]
      })
    });
  }
  const envelope: ITaskEnvelope = {
    schemaVersion: 1,
    id: taskId,
    kind: request.kind,
    detailVersion: request.detailVersion,
    revision: firstRevision,
    title: request.title,
    ...(request.description !== undefined ? { description: request.description } : {}),
    ...(request.parentId !== undefined ? { parentId: request.parentId } : {}),
    stopPolicy: 'none',
    ...(request.responsibility !== undefined ? { responsibility: request.responsibility } : {}),
    scopes: request.scopes,
    lifecycle: observation.lifecycle,
    ...(observation.progress !== undefined ? { progress: observation.progress } : {}),
    attention: observation.attention,
    binding: request.binding,
    recovery: request.recovery,
    observation: { state: 'current', observedAt: observation.observedAt },
    createdAt: now,
    changedAt: now
  };
  const categories: UpdateCategory[] = isTerminalTaskStatus(observation.lifecycle.status)
    ? ['lifecycle', 'result']
    : ['lifecycle'];
  const updates: ReadonlyArray<ITaskUpdate> = planUpdates(undefined, envelope, categories, core.audience);
  return _register(core, writer, {
    ...common,
    receipt: _receipt(taskId, operationId, updates),
    draft: (op) => ({
      recordType: 'resolved',
      task: { envelope, details: observation.details },
      sourceRevision: observation.revision,
      operations: [op],
      updates,
      archived: false
    })
  });
}
