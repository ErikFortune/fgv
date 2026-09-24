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
  IStoredCatalogOperation,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskMutationResult,
  ITaskRecordDraft,
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
  trackedTaskKind
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, subjectOf } from './access';
import { IRelatedTask, confirmUnchanged, isSameCatalog, readExisting } from './catalogMutation';
import { checkParentOpen, convertRequest, readParent } from './catalogOperations';
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
  return checkParentOpen(again.value, parent.role);
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
  list: boolean
): Promise<TaskResult<ITaskMutationResult>> {
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
  const scopes = ctx.creationScopes;
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
    if (!(await ctx.mayCreate(access))) {
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

  return core.gated(async (writer) => {
    const parentNow = await recheckParent(writer, parent, taskId, operationId);
    if (parentNow.isFailure()) {
      return propagate<ITaskMutationResult>(parentNow);
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate<ITaskMutationResult>(clock);
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
    record: params.draft(operation)
  });
  // A registration that replays answers with the receipt it committed the first time.
  return registered.isSuccess() ? _committedReceipt(core, registered.value) : propagate(registered);
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
  let parent: IRelatedTask | undefined = undefined;
  if (request.parentId !== undefined) {
    const read = await readExisting(core, request.parentId);
    if (read.isFailure()) {
      return propagate(read);
    }
    parent = { id: request.parentId, role: 'parent', record: read.value };
  }
  const registered = await core.gated(async (writer) => {
    const parentNow = await recheckParent(writer, parent, taskId, operationId);
    if (parentNow.isFailure()) {
      return propagate<ITaskMutationResult>(parentNow);
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate<ITaskMutationResult>(clock);
    }
    return _registerExternal(core, writer, request, converted.value.json, key.value, clock.value);
  });
  if (registered.isFailure()) {
    return propagate(registered);
  }
  const read = await core.repository.read(taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  return read.value !== undefined ? ok(read.value) : notFound(taskId, operationId);
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
  const common = {
    taskId,
    operationId,
    operation: 'register-external' as const,
    request: json,
    principal
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
