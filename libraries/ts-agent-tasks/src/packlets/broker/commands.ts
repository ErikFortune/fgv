/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { TrackedTransition, evaluateTrackedCommand, planUpdates } from '../implementations';
import {
  CommandRejectionReason,
  CommandState,
  ICommandReceipt,
  ICommandRequest,
  IResolvedTaskCommitRecord,
  IStoredCommandOperation,
  IStoredTaskOperation,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskUpdate,
  TaskResult,
  TrackedCommand,
  TrackedTaskCommandName,
  taskListKind,
  trackedTaskCommandNames
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, AccessSubject, subjectOf } from './access';
import { advance, nextDraft, readExisting } from './catalogMutation';
import { isNativeKind } from './catalogOperations';
import { BrokerCore, canonicallySame, revisionOf, storedOperation } from './core';
import { changedSinceAuthorized, notFound, ok, propagate, taskFailure } from './failures';

/** A receipt that is returned but never stored. */
function _rejected(request: ICommandRequest, reason: CommandRejectionReason): TaskResult<ICommandReceipt> {
  return ok({
    taskId: request.taskId,
    operationId: request.operationId,
    command: request.command,
    result: { state: 'rejected', reason }
  });
}

/** Whether a stored operation is this command request again, from this principal. */
function _isSameCommand(
  stored: IStoredTaskOperation,
  principal: string,
  request: ICommandRequest
): stored is IStoredCommandOperation {
  return (
    stored.type === 'command' && stored.principalKey === principal && canonicallySame(stored.request, request)
  );
}

/**
 * The replay of a command already recorded under this id: the same request, re-authorized, gets
 * its stored receipt; a different request under the key is `idempotency-conflict`. Neither
 * dispatches anything or stores anything.
 */
async function _replay(
  ctx: AccessContext,
  subject: AccessSubject,
  stored: IStoredTaskOperation,
  request: ICommandRequest
): Promise<TaskResult<ICommandReceipt>> {
  if (!_isSameCommand(stored, ctx.principal, request)) {
    return _rejected(request, 'idempotency-conflict');
  }
  if (!(await ctx.may('command', subject, 'subject', { command: request.command }))) {
    return _rejected(request, 'denied');
  }
  return ok(stored.receipt);
}

/** What evaluation decided before the writer: a refusal to record, or a command to evaluate. */
type Prepared =
  | { readonly kind: 'refuse'; readonly reason: 'unsupported' | 'conflict' }
  | { readonly kind: 'evaluate'; readonly command: TrackedCommand };

/**
 * Converts a native task's command. An unknown command name is a well-formed request the task
 * does not support — a recorded refusal. Known command, malformed parameters: an invalid request,
 * which records nothing.
 */
function _prepare(
  core: BrokerCore,
  record: ITaskCommitRecord,
  request: ICommandRequest
): TaskResult<{ readonly prepared: Prepared; readonly stored: ICommandRequest }> {
  // An unresolved registration, and an external task — whose commands are dispatched to its source,
  // which T6 implements — support none.
  if (record.recordType === 'unresolved' || !isNativeKind(record.task.envelope)) {
    return ok({ prepared: { kind: 'refuse', reason: 'unsupported' }, stored: request });
  }
  if (!trackedTaskCommandNames.includes(request.command as TrackedTaskCommandName)) {
    return ok({ prepared: { kind: 'refuse', reason: 'unsupported' }, stored: request });
  }
  const command = core.converters.broker.trackedCommand.convert({
    command: request.command,
    parameters: request.parameters
  });
  if (command.isFailure()) {
    return taskFailure(`execute ${request.command}: ${command.message}`, 'invalid', 'after-host-action', {
      operationId: request.operationId
    });
  }
  // The canonical converted parameters are what is stored and what a replay is compared with.
  return core.toJson(command.value.parameters).onSuccess((parameters: JsonValue) =>
    ok({
      prepared:
        revisionOf(record) !== request.expectedRevision
          ? { kind: 'refuse', reason: 'conflict' }
          : { kind: 'evaluate', command: command.value },
      stored: { ...request, parameters }
    })
  );
}

/**
 * Runs one command against a task.
 *
 * @remarks
 * A hidden or foreign task fails `not-found-or-denied`. A visible task answers with a receipt:
 * `denied` (not recorded — a principal without command authority cannot consume a task's
 * capacity), `idempotency-conflict` for a reused key (not recorded — the key already holds
 * evidence), `invalid-transition` for an archived tombstone (not recorded — a tombstone takes no
 * write, so the key stays free), or an evaluated outcome that is recorded under the key:
 * `unsupported`, a stale `conflict`, a table `invalid-transition`, or `applied`. A same-state no-op is `applied` at the current
 * revision without advancing it. External tasks' commands belong to their source (T6) and are
 * `unsupported` here.
 * @internal
 */
export async function execute(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ICommandReceipt>> {
  const converted = core.converters.commands.request.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`execute: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: ICommandRequest = converted.value;
  const { taskId, operationId } = request;
  const read = await readExisting(core, taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const record: ITaskCommitRecord = read.value;
  const subject: AccessSubject = subjectOf(record);
  // Captured before the first question is put to the policy, so the recheck inside the writer
  // covers every answer this command relies on.
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await ctx.sees(subject))) {
    return notFound(taskId, operationId);
  }
  // Replay compares the request as it was stored, so a native task's parameters are converted
  // first; a request whose parameters cannot convert can never equal a stored one. An unresolved
  // registration's one operation is its registration, so a reused key there can only conflict.
  const prepared = _prepare(core, record, request);
  const stored: IStoredTaskOperation | undefined = storedOperation(record, operationId);
  if (stored !== undefined) {
    return _replay(ctx, subject, stored, prepared.isSuccess() ? prepared.value.stored : request);
  }
  // Command authority is decided before anything else about the command is disclosed.
  if (!(await ctx.may('command', subject, 'subject', { command: request.command }))) {
    return _rejected(request, 'denied');
  }
  if (record.recordType === 'unresolved') {
    // An unresolved registration never authorizes execution commands, and takes no write.
    return _rejected(request, 'unsupported');
  }
  if (record.archived) {
    // A tombstone takes no write at all, so this refusal cannot be recorded; it holds no key.
    return _rejected(request, 'invalid-transition');
  }
  if (prepared.isFailure()) {
    return propagate(prepared);
  }
  const { prepared: plan, stored: storedRequest } = prepared.value;

  return core.gated(async (writer) => {
    const now = ctx.epoch();
    if (now.isFailure() || now.value !== epoch.value) {
      return changedSinceAuthorized<ICommandReceipt>('the authorization policy', operationId);
    }
    const reread = await writer.readCommit(taskId);
    if (reread.isFailure()) {
      return propagate<ICommandReceipt>(reread);
    }
    const found: ITaskCommitRecord | undefined = reread.value;
    const concurrent = found !== undefined ? storedOperation(found, operationId) : undefined;
    if (concurrent !== undefined) {
      return _replay(ctx, subject, concurrent, storedRequest);
    }
    if (found === undefined || found.recordType !== 'resolved' || revisionOf(found) !== revisionOf(record)) {
      return changedSinceAuthorized<ICommandReceipt>(`task ${taskId}`, operationId);
    }
    const outcome: Outcome =
      plan.kind === 'refuse'
        ? { disposition: 'refused', reason: plan.reason }
        : evaluateTrackedCommand(found.task.envelope, plan.command, {
            list: found.task.envelope.kind === taskListKind
          });
    return _commit(core, writer, ctx.principal, found, storedRequest, outcome);
  });
}

/** A transition, or a refusal decided before evaluation. */
type Outcome =
  | TrackedTransition
  | { readonly disposition: 'refused'; readonly reason: 'unsupported' | 'conflict' };

/** Records the outcome under the operation id, advancing the task only when it changed. */
async function _commit(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  principal: string,
  current: IResolvedTaskCommitRecord,
  request: ICommandRequest,
  outcome: Outcome
): Promise<TaskResult<ICommandReceipt>> {
  const before: ITaskEnvelope = current.task.envelope;
  let after: ITaskEnvelope = before;
  let updates: ReadonlyArray<ITaskUpdate> = [];
  let result: CommandState;
  if (outcome.disposition === 'refused' || outcome.disposition === 'rejected') {
    result = { state: 'rejected', reason: outcome.reason };
  } else if (outcome.disposition === 'unchanged') {
    result = { state: 'applied', appliedRevision: before.revision };
  } else {
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate(clock);
    }
    after = advance(outcome.envelope, before, clock.value);
    updates = planUpdates(before, after, outcome.categories, core.audience);
    result = { state: 'applied', appliedRevision: after.revision };
  }
  const receipt: ICommandReceipt = {
    taskId: request.taskId,
    operationId: request.operationId,
    command: request.command,
    result
  };
  const operation: IStoredCommandOperation = {
    type: 'command',
    operationId: request.operationId,
    request,
    principalKey: principal,
    dispatch: 'settled',
    receipt
  };
  const committed = await writer.commit({
    purpose: 'operation',
    operationId: request.operationId,
    taskId: request.taskId,
    expectedRevision: before.revision,
    expectedRecordRevision: current.recordRevision,
    record: nextDraft(current, after, operation, updates, false)
  });
  return committed.isSuccess() ? ok(receipt) : propagate(committed);
}
