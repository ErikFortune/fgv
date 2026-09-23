/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Converter } from '@fgv/ts-utils';
import { applyTrackedPatch, checkListCompletion, withEnvelopeFields } from '../implementations';
import {
  IArchiveTask,
  IChangeTaskScopes,
  ICompleteTaskList,
  IReassignTask,
  IReassignmentResult,
  IReparentTask,
  IResolvedTaskCommitRecord,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskMutationResult,
  ITaskScope,
  IUpdateTrackedTask,
  TaskAccessRole,
  TaskId,
  TaskResult,
  isTerminalTaskStatus,
  taskListKind,
  trackedTaskKind
} from '../types';
import { AccessContext, scopeKey, subjectOf } from './access';
import { CatalogChange, IRelatedTask, readExisting, runCatalogMutation } from './catalogMutation';
import { BrokerCore } from './core';
import { notFound, ok, propagate, taskFailure } from './failures';

/**
 * Converts a request strictly, as the wire boundary requires, and pairs it with its stored JSON.
 * @internal
 */
export function convertRequest<T>(
  core: BrokerCore,
  converter: Converter<T>,
  request: unknown,
  what: string
): TaskResult<{ readonly value: T; readonly json: JsonValue }> {
  const converted = converter.convert(request);
  if (converted.isFailure()) {
    return taskFailure(`${what}: ${converted.message}`, 'invalid', 'after-host-action');
  }
  return core.toJson(converted.value).onSuccess((json) => ok({ value: converted.value, json }));
}

/** Whether a task is a native kind the broker owns the presentation of: tracked or list. */
export function isNativeKind(envelope: ITaskEnvelope): boolean {
  return envelope.kind === trackedTaskKind || envelope.kind === taskListKind;
}

function _base(base: ITaskMutationResult): ITaskMutationResult {
  return base;
}

/** Refuses a task whose presentation a source owns rather than the broker. */
function _native(record: IResolvedTaskCommitRecord): TaskResult<true> {
  return isNativeKind(record.task.envelope)
    ? ok(true)
    : taskFailure(
        `task ${record.task.envelope.id}: '${record.task.envelope.kind}' is externally executed; its source owns ` +
          `its presentation`,
        'unsupported',
        'after-host-action'
      );
}

/**
 * Refuses a terminal task: its execution presentation and its edges are immutable.
 * @internal
 */
export function requireOpen(record: IResolvedTaskCommitRecord, what: string): TaskResult<true> {
  return isTerminalTaskStatus(record.task.envelope.lifecycle.status)
    ? taskFailure(`task ${record.task.envelope.id}: is terminal; ${what}`, 'conflict', 'after-host-action')
    : ok(true);
}

/**
 * `updateTracked`: patches a native task's presentable fields, in open states only.
 * @internal
 */
export async function updateTracked(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  const converted = convertRequest(core, core.converters.broker.updateTracked, input, 'updateTracked');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IUpdateTrackedTask = converted.value.value;
  return runCatalogMutation(core, ctx, {
    action: 'update-tracked',
    operation: 'update-tracked',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.mutationResult,
    admit: (record) =>
      _native(record).onSuccess(() => requireOpen(record, 'its execution presentation is immutable')),
    evaluate: async (current): Promise<TaskResult<CatalogChange>> => {
      const outcome = applyTrackedPatch(current.task.envelope, request.patch);
      // Admission refused terminal tasks and the subject is re-read at the same revision, so the
      // patch is evaluated against an open task: it changes or it does not.
      return ok(
        outcome.disposition === 'changed'
          ? { disposition: 'changed', envelope: outcome.envelope, categories: outcome.categories }
          : { disposition: 'unchanged' }
      );
    },
    receipt: _base
  });
}

/**
 * `reassign`: changes responsibility, and nothing else. Parent, children, scopes, outcome,
 * details and source binding are carried over byte for byte; no child is reassigned and no
 * access is granted.
 * @internal
 */
export async function reassign(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IReassignmentResult>> {
  const converted = convertRequest(core, core.converters.broker.reassign, input, 'reassign');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IReassignTask = converted.value.value;
  return runCatalogMutation(core, ctx, {
    action: 'reassign',
    operation: 'reassign',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.reassignmentResult,
    access: { targetResponsibility: request.responsibility },
    evaluate: async (current): Promise<TaskResult<CatalogChange>> => {
      const envelope: ITaskEnvelope = current.task.envelope;
      const previous = envelope.responsibility;
      const target = request.responsibility === 'unassigned' ? undefined : request.responsibility;
      const same: boolean =
        target === undefined
          ? previous === undefined
          : previous !== undefined && previous.namespace === target.namespace && previous.key === target.key;
      if (same) {
        return ok({ disposition: 'unchanged' });
      }
      const next: ITaskEnvelope = withEnvelopeFields(envelope, { responsibility: target });
      return ok({ disposition: 'changed', envelope: next, categories: ['assignment'] });
    },
    receipt: (base, before, after): IReassignmentResult => ({
      ...base,
      ...(before.responsibility !== undefined ? { previous: before.responsibility } : {}),
      ...(after.responsibility !== undefined ? { current: after.responsibility } : {})
    })
  });
}

/** Scopes with the removals taken out and the additions appended, each once, in order. */
function _nextScopes(
  current: ReadonlyArray<ITaskScope>,
  add: ReadonlyArray<ITaskScope>,
  remove: ReadonlyArray<ITaskScope>
): ReadonlyArray<ITaskScope> {
  const removed: Set<string> = new Set(remove.map(scopeKey));
  const out: ITaskScope[] = [];
  const seen: Set<string> = new Set<string>();
  for (const scope of [...current, ...add]) {
    const key: string = scopeKey(scope);
    if (!removed.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(scope);
    }
  }
  return out;
}

/**
 * `changeScopes`: adds and removes scope labels within the view's own selectors. Scopes the view
 * cannot see are never touched.
 * @internal
 */
export async function changeScopes(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  const converted = convertRequest(core, core.converters.broker.changeScopes, input, 'changeScopes');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IChangeTaskScopes = converted.value.value;
  const add: ReadonlyArray<ITaskScope> = request.add ?? [];
  const remove: ReadonlyArray<ITaskScope> = request.remove ?? [];
  const outside: ITaskScope | undefined = [...add, ...remove].find((scope) => !ctx.selects(scope));
  if (outside !== undefined) {
    return taskFailure(
      `changeScopes: scope ${outside.namespace}/${outside.key} is outside this view's selectors`,
      'invalid',
      'after-host-action',
      { operationId: request.operationId }
    );
  }
  return runCatalogMutation(core, ctx, {
    action: 'change-scopes',
    operation: 'change-scopes',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.mutationResult,
    evaluate: async (current): Promise<TaskResult<CatalogChange>> => {
      const envelope: ITaskEnvelope = current.task.envelope;
      const scopes: ReadonlyArray<ITaskScope> = _nextScopes(envelope.scopes, add, remove);
      const same: boolean =
        scopes.length === envelope.scopes.length &&
        scopes.every((scope, i) => scopeKey(scope) === scopeKey(envelope.scopes[i]));
      return ok(
        same
          ? { disposition: 'unchanged' }
          : { disposition: 'changed', envelope: { ...envelope, scopes }, categories: ['relationship'] }
      );
    },
    receipt: _base
  });
}

/**
 * Reads a parent a relationship operation affects and requires the principal to see it. A
 * parent named by the caller that cannot be seen fails exactly as a foreign id; the subject's
 * current parent, which the caller did not name, is never identified on refusal.
 * @internal
 */
export async function readParent(
  core: BrokerCore,
  ctx: AccessContext,
  childId: TaskId,
  parentId: TaskId,
  role: 'parent' | 'previous-parent' | 'new-parent',
  action: 'create' | 'reparent'
): Promise<TaskResult<IRelatedTask>> {
  const read = await readExisting(core, parentId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const record: ITaskCommitRecord = read.value;
  const subject = subjectOf(record);
  if (!(await ctx.sees(subject, role)) || !(await ctx.may(action, subject, role))) {
    return role === 'previous-parent'
      ? taskFailure(
          `task ${childId}: '${action}' is not permitted on its current parent`,
          'not-found-or-denied',
          'after-host-action'
        )
      : notFound(parentId);
  }
  return ok({ id: parentId, role, record });
}

/**
 * The graph rules a parent must meet to gain or lose a child: resolved, not archived, not
 * terminal — terminal parent membership is immutable in v1.
 * @internal
 */
export function checkParentOpen(record: ITaskCommitRecord, role: TaskAccessRole): TaskResult<true> {
  const which: string =
    role === 'previous-parent' ? 'current parent' : role === 'new-parent' ? 'new parent' : 'parent';
  if (record.recordType === 'unresolved') {
    return taskFailure(
      `the ${which} is an unresolved registration and takes no children until its first observation`,
      'unsupported',
      'after-host-action'
    );
  }
  if (record.archived || isTerminalTaskStatus(record.task.envelope.lifecycle.status)) {
    return taskFailure(
      `the ${which} is terminal; terminal parent membership is immutable`,
      'conflict',
      'after-host-action'
    );
  }
  return ok(true);
}

/**
 * `reparent`: moves a task under another parent or to the root. The child, its current parent
 * and its new parent are each authorized in their role; cycle, terminal and existence rules are
 * evaluated inside the writer against the graph as it is then.
 * @internal
 */
export async function reparent(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  const converted = convertRequest(core, core.converters.broker.reparent, input, 'reparent');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IReparentTask = converted.value.value;
  const target: TaskId | undefined = request.parent === 'root' ? undefined : request.parent.taskId;
  if (target === request.taskId) {
    return taskFailure(`task ${request.taskId}: cannot be its own parent`, 'invalid', 'after-host-action', {
      operationId: request.operationId
    });
  }
  return runCatalogMutation(core, ctx, {
    action: 'reparent',
    operation: 'reparent',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.mutationResult,
    admit: (record) => requireOpen(record, 'terminal task edges are immutable'),
    related: async (record): Promise<TaskResult<ReadonlyArray<IRelatedTask>>> => {
      const related: IRelatedTask[] = [];
      const previous: TaskId | undefined = record.task.envelope.parentId;
      if (previous !== undefined && previous !== target) {
        const read = await readParent(core, ctx, request.taskId, previous, 'previous-parent', 'reparent');
        if (read.isFailure()) {
          return propagate(read);
        }
        related.push(read.value);
      }
      if (target !== undefined && target !== previous) {
        const read = await readParent(core, ctx, request.taskId, target, 'new-parent', 'reparent');
        if (read.isFailure()) {
          return propagate(read);
        }
        related.push(read.value);
      }
      return ok(related);
    },
    evaluate: async (current, related): Promise<TaskResult<CatalogChange>> => {
      const envelope: ITaskEnvelope = current.task.envelope;
      if (envelope.parentId === target) {
        return ok({ disposition: 'unchanged' });
      }
      // Both parents, as they are now inside the writer: neither may be terminal.
      for (const parent of related) {
        const open = checkParentOpen(parent.record, parent.role);
        if (open.isFailure()) {
          return propagate(open);
        }
      }
      const next: ITaskEnvelope = withEnvelopeFields(envelope, { parentId: target });
      // The cycle check runs in the same writer section, in the commit, against the current graph.
      return ok({ disposition: 'changed', envelope: next, categories: ['relationship'] });
    },
    receipt: _base
  });
}

/**
 * `completeList`: explicitly completes a task list whose every current child has succeeded — the
 * only way an empty list completes.
 * @internal
 */
export async function completeList(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  const converted = convertRequest(core, core.converters.broker.completeList, input, 'completeList');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: ICompleteTaskList = converted.value.value;
  return runCatalogMutation(core, ctx, {
    action: 'complete-list',
    operation: 'complete-list',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.mutationResult,
    admit: (record) => _list(record).onSuccess(() => requireOpen(record, 'it is already complete')),
    evaluate: (current) => completion(core, current, () => request.outcome, false),
    receipt: _base
  });
}

/** Refuses anything but a task list. */
function _list(record: IResolvedTaskCommitRecord): TaskResult<true> {
  return record.task.envelope.kind === taskListKind
    ? ok(true)
    : taskFailure(`task ${record.task.envelope.id}: is not a task list`, 'unsupported', 'after-host-action');
}

/**
 * Decides a list's completion inside the writer, from the repository's complete authoritative
 * child set — never a filtered tree.
 * @internal
 */
export async function completion(
  core: BrokerCore,
  current: IResolvedTaskCommitRecord,
  outcome: (count: number) => ICompleteTaskList['outcome'],
  requireChild: boolean
): Promise<TaskResult<CatalogChange>> {
  const envelope: ITaskEnvelope = current.task.envelope;
  const children = await core.repository.childStates(envelope.id);
  if (children.isFailure()) {
    return propagate(children);
  }
  const checked = checkListCompletion(envelope.id, children.value, requireChild);
  if (checked.isFailure()) {
    return taskFailure(checked.message, 'conflict', 'after-host-action');
  }
  return ok({
    disposition: 'changed',
    envelope: { ...envelope, lifecycle: { status: 'succeeded', outcome: outcome(checked.value) } },
    categories: ['lifecycle', 'result']
  });
}

/** A task may be archived once it is terminal and owes nothing to anyone. */
function _archivable(record: IResolvedTaskCommitRecord): TaskResult<true> {
  const id: TaskId = record.task.envelope.id;
  if (!isTerminalTaskStatus(record.task.envelope.lifecycle.status)) {
    return taskFailure(`task ${id}: only a terminal task can be archived`, 'conflict', 'after-host-action');
  }
  if (record.updates.some((update) => update.audience.length > 0)) {
    return taskFailure(
      `task ${id}: updates are still owed; they must be acknowledged or disposed of first`,
      'retention-blocked',
      'after-host-action'
    );
  }
  return ok(true);
}

/**
 * `archive`: turns a terminal task into its tombstone. Refused while any retained update is still
 * owed to someone — its audience must acknowledge or dispose of it first (T7/T8).
 * @internal
 */
export async function archive(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ITaskMutationResult>> {
  const converted = convertRequest(core, core.converters.broker.archive, input, 'archive');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IArchiveTask = converted.value.value;
  return runCatalogMutation(core, ctx, {
    action: 'archive',
    operation: 'archive',
    identity: request,
    request: converted.value.json,
    receiptConverter: core.converters.broker.mutationResult,
    admit: (record) => _archivable(record),
    evaluate: async (current): Promise<TaskResult<CatalogChange>> =>
      ok({ disposition: 'changed', envelope: current.task.envelope, categories: [], archived: true }),
    receipt: _base
  });
}
