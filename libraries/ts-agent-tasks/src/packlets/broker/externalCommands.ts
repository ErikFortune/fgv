/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';
import {
  CommandState,
  ICommandReceipt,
  ICommandRequest,
  ICommandResolution,
  ICommandResolutionReport,
  ICommandResolutionRequest,
  IResolvedTaskCommitRecord,
  ISourceBinding,
  IStoredCommandOperation,
  IStoredTaskOperation,
  ITaskCommandHandle,
  ITaskCommitRecord,
  ITaskSource,
  SourceCommandLookup,
  SourceCommandResult,
  SourceRevisionOrder,
  TaskId,
  TaskResult,
  TaskRevision
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, subjectOf } from './access';
import { BrokerCore, canonicallySame, revisionOf, storedOperation } from './core';
import { changedSinceAuthorized, ok, propagate, taskFailure } from './failures';
import { applyProjection, compareRevisions } from './observations';
import { callSource, sourceOf } from './reconciliation';

/**
 * The reason text of a command held because its source no longer retains the key. A resend could
 * not be deduplicated, so the pump never resends it, even for a `source-key` command.
 */
const keyExpiredPrefix: string = 'held: the source no longer retains this command key';

/** The reason text of a non-idempotent uncertain command the pump holds. */
const heldPrefix: string = 'held: the outcome is unknown and the source cannot deduplicate a resend';

/**
 * A diagnostic bounded to the receipt's reason field: a source's failure text is host data, and an
 * oversized one must not make the receipt itself unwritable.
 */
function _bounded(core: BrokerCore, reason: string): string {
  return reason.slice(0, core.converters.bounds.maxSummaryLength);
}

/** A receipt built from a stored command and a state. */
function _receipt(request: ICommandRequest, result: CommandState): ICommandReceipt {
  return { taskId: request.taskId, operationId: request.operationId, command: request.command, result };
}

/** The resolved record's draft with one stored command replaced. */
function _withCommand(
  current: IResolvedTaskCommitRecord,
  replaced: IStoredCommandOperation
): ReadonlyArray<IStoredTaskOperation> {
  return current.operations.map((op) => (op.operationId === replaced.operationId ? replaced : op));
}

function _draft(
  current: IResolvedTaskCommitRecord,
  operations: ReadonlyArray<IStoredTaskOperation>
): {
  readonly recordType: 'resolved';
  readonly task: IResolvedTaskCommitRecord['task'];
  readonly sourceRevision?: IResolvedTaskCommitRecord['sourceRevision'];
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
  readonly updates: IResolvedTaskCommitRecord['updates'];
  readonly archived: boolean;
} {
  return {
    recordType: 'resolved',
    task: current.task,
    ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
    operations,
    updates: current.updates,
    archived: current.archived
  };
}

/** What an authorization decision about a task depends on: its catalog placement, not its execution. */
function _authorizationSubject(record: IResolvedTaskCommitRecord): unknown {
  const envelope = record.task.envelope;
  return {
    id: envelope.id,
    kind: envelope.kind,
    scopes: envelope.scopes,
    responsibility: envelope.responsibility ?? null,
    parentId: envelope.parentId ?? null,
    archived: record.archived
  };
}

/** A resolved record and one of its stored commands. */
interface ICommandInRecord {
  readonly record: IResolvedTaskCommitRecord;
  readonly command: IStoredCommandOperation;
}

/**
 * The stored command under `operationId` in a record read inside the writer.
 *
 * @remarks
 * A task record is never removed and its dedup evidence never dropped, so a command recorded once is
 * always there. A repository that answers otherwise is not keeping its contract, and the broker says
 * so rather than guessing.
 */
function _commandIn(
  record: ITaskCommitRecord | undefined,
  taskId: TaskId,
  operationId: IStoredTaskOperation['operationId']
): TaskResult<ICommandInRecord> {
  const op: IStoredTaskOperation | undefined =
    record !== undefined && record.recordType === 'resolved'
      ? storedOperation(record, operationId)
      : undefined;
  return record !== undefined && record.recordType === 'resolved' && op !== undefined && op.type === 'command'
    ? ok({ record, command: op })
    : taskFailure(
        `task ${taskId}: the repository no longer holds command '${operationId}'`,
        'storage-corrupt',
        'after-host-action',
        { operationId }
      );
}

/** Reads a command inside the writer. */
async function _readCommand(
  writer: ITaskRepositoryWriter,
  taskId: TaskId,
  operationId: IStoredTaskOperation['operationId']
): Promise<TaskResult<ICommandInRecord>> {
  const read = await writer.readCommit(taskId);
  return read.isSuccess() ? _commandIn(read.value, taskId, operationId) : propagate(read);
}

/**
 * Validates an external command against its kind's registered schema.
 *
 * @remarks
 * The kind that registered the command is the one authority for its parameters; the canonical
 * validated parameters are what is stored and what a replay is compared against.
 * @internal
 */
export function prepareExternal(
  core: BrokerCore,
  record: IResolvedTaskCommitRecord,
  request: ICommandRequest
): TaskResult<{ readonly handle?: ITaskCommandHandle; readonly stored: ICommandRequest }> {
  const envelope = record.task.envelope;
  const handle: Result<ITaskCommandHandle> = core.repository.registry.getCommand(
    envelope.kind,
    envelope.detailVersion,
    request.command
  );
  if (handle.isFailure()) {
    // Not a command this kind declares: a well-formed request the task does not support.
    return ok({ stored: request });
  }
  const parameters: Result<JsonValue> = handle.value.validate(request.parameters);
  if (parameters.isFailure()) {
    return taskFailure(`execute ${request.command}: ${parameters.message}`, 'invalid', 'after-host-action', {
      operationId: request.operationId
    });
  }
  return ok({ handle: handle.value, stored: { ...request, parameters: parameters.value } });
}

/**
 * Runs an external command: the design § 5 protocol, with the broker's writer held only around the
 * commits and never across source I/O.
 *
 * 1. **Intent.** Under the writer, re-read the task and the policy epoch; record the command
 *    `not-sent`, receipt `accepted`. Storage reserves its maximum settlement before this commits,
 *    so admission refuses it (`backpressure`, nothing recorded) rather than dispatching unreserved.
 * 2. **Dispatch boundary** (see {@link dispatchIntent}).
 *
 * A refusal decided before intent — an undeclared command, a stale expected revision — is recorded
 * settled with no reservation. A task whose source is not attached records nothing and fails
 * `source-unavailable`: nothing about its execution changes.
 * @internal
 */
export async function executeExternal(
  core: BrokerCore,
  ctx: AccessContext,
  epoch: string,
  record: IResolvedTaskCommitRecord,
  request: ICommandRequest,
  prepared: { readonly handle?: ITaskCommandHandle; readonly stored: ICommandRequest }
): Promise<TaskResult<ICommandReceipt | undefined>> {
  const { taskId, operationId } = request;
  const bound = sourceOf(core, record);
  if (bound.isFailure()) {
    return propagate(bound);
  }
  const refusal: CommandState | undefined =
    prepared.handle === undefined
      ? { state: 'rejected', reason: 'unsupported' }
      : revisionOf(record) !== request.expectedRevision
      ? { state: 'rejected', reason: 'conflict' }
      : undefined;

  type Intent = ICommandInRecord | 'replay';
  const intent = await core.gated(async (writer): Promise<TaskResult<Intent>> => {
    const reread = await writer.readCommit(taskId);
    if (reread.isFailure()) {
      return propagate<Intent>(reread);
    }
    const found: ITaskCommitRecord | undefined = reread.value;
    if (found !== undefined && storedOperation(found, operationId) !== undefined) {
      // The same key committed while this one waited: answered through the ordinary replay path.
      return ok<Intent>('replay');
    }
    if (found === undefined || found.recordType !== 'resolved' || revisionOf(found) !== revisionOf(record)) {
      return changedSinceAuthorized<Intent>(`task ${taskId}`, operationId);
    }
    if (!ctx.epochIs(epoch)) {
      return changedSinceAuthorized<Intent>('the authorization policy', operationId);
    }
    const receipt: ICommandReceipt = _receipt(prepared.stored, refusal ?? { state: 'accepted' });
    const operation: IStoredCommandOperation = {
      type: 'command',
      operationId,
      request: prepared.stored,
      principalKey: ctx.principal,
      dispatch: refusal !== undefined ? 'settled' : 'not-sent',
      receipt
    };
    const committed = await writer.commit({
      purpose: 'operation',
      operationId,
      taskId,
      expectedRevision: revisionOf(found),
      expectedRecordRevision: found.recordRevision,
      record: _draft(found, [...found.operations, operation])
    });
    return committed.isSuccess() ? _commandIn(committed.value, taskId, operationId) : propagate(committed);
  });
  if (intent.isFailure()) {
    return propagate(intent);
  }
  if (intent.value === 'replay') {
    return ok(undefined);
  }
  if (refusal !== undefined) {
    return ok(intent.value.command.receipt);
  }
  return dispatchIntent(core, ctx, intent.value.record, intent.value.command, bound.value);
}

/**
 * The dispatch boundary for a recorded intent (and the pump's path for one never sent).
 *
 * 1. Re-check authority **now** — outside the writer, with a fresh epoch. A principal no longer
 *    permitted settles the intent `rejected: denied`; nothing was sent, so nothing is uncertain.
 * 2. Under the writer: the intent must still be `not-sent` and the epoch unchanged; write the
 *    `possibly-sent` marker. From here the outcome is uncertain until the source answers, even if
 *    the process dies before the send.
 * 3. Dispatch outside the writer.
 * 4. Persist the answer (see {@link settleCommand}).
 * @internal
 */
export async function dispatchIntent(
  core: BrokerCore,
  ctx: AccessContext,
  record: IResolvedTaskCommitRecord,
  command: IStoredCommandOperation,
  bound: { readonly source: ITaskSource; readonly binding: ISourceBinding }
): Promise<TaskResult<ICommandReceipt>> {
  const taskId: TaskId = record.task.envelope.id;
  const operationId = command.operationId;
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  const permitted: boolean = await ctx.may('command', subjectOf(record), 'subject', {
    command: command.request.command
  });

  const marked = await core.gated(async (writer): Promise<TaskResult<IMarked>> => {
    const read = await _readCommand(writer, taskId, operationId);
    if (read.isFailure()) {
      return propagate<IMarked>(read);
    }
    const { record: current, command: now } = read.value;
    if (now.dispatch !== 'not-sent') {
      // Another caller reached the dispatch boundary first and wrote the marker: that caller sends,
      // and this one must not — a second send of a non-deduplicated command is a second effect.
      return ok<IMarked>({ send: false, command: now, record: current });
    }
    // Authority was decided against the subject as read before the writer; a catalog change since
    // (scopes, responsibility, placement) could change that answer. Execution fields may move
    // freely — a source observation is not an authorization input.
    if (!canonicallySame(_authorizationSubject(record), _authorizationSubject(current))) {
      return _unsent<IMarked>(`task ${taskId}`, operationId);
    }
    if (!ctx.epochIs(epoch.value)) {
      return _unsent<IMarked>('the authorization policy', operationId);
    }
    const next: IStoredCommandOperation = permitted
      ? { ...now, dispatch: 'possibly-sent' }
      : {
          ...now,
          dispatch: 'settled',
          receipt: _receipt(now.request, { state: 'rejected', reason: 'denied' })
        };
    const committed = await writer.commit({
      purpose: 'maintenance',
      taskId,
      expectedRevision: revisionOf(current),
      expectedRecordRevision: current.recordRevision,
      record: _draft(current, _withCommand(current, next))
    });
    return committed.isSuccess()
      ? ok<IMarked>({ send: permitted, command: next, record: current })
      : propagate<IMarked>(committed);
  });
  if (marked.isFailure()) {
    return propagate(marked);
  }
  // Not ours to send: someone else holds the marker, or authority was withdrawn and it is settled.
  if (!marked.value.send) {
    return ok(marked.value.command.receipt);
  }
  // The record as the marker gate read it: a conditional command's precondition is the source
  // revision committed *now*, not one read before an observation that landed meanwhile.
  return _send(core, bound.source, bound.binding, marked.value.record, marked.value.command);
}

/**
 * The refusal at the dispatch boundary when what authority was decided on moved: the intent stays
 * recorded and unsent, and only the pump — re-authorizing against the task as it is — sends it.
 */
function _unsent<T>(what: string, operationId: IStoredTaskOperation['operationId']): TaskResult<T> {
  return taskFailure<T>(
    `${what} changed after the command was authorized; its intent is recorded and was not sent — ` +
      `resolveCommands dispatches it after re-authorizing`,
    'conflict',
    'safe',
    { operationId }
  );
}

/** What the marker gate decided: whether this caller owns the send, and the record it decided on. */
interface IMarked {
  readonly send: boolean;
  readonly command: IStoredCommandOperation;
  readonly record: IResolvedTaskCommitRecord;
}

/** Sends a marked command and persists what the source said. */
async function _send(
  core: BrokerCore,
  source: ITaskSource,
  binding: ISourceBinding,
  record: IResolvedTaskCommitRecord,
  command: IStoredCommandOperation
): Promise<TaskResult<ICommandReceipt>> {
  const handle = core.repository.registry.getCommand(
    record.task.envelope.kind,
    record.task.envelope.detailVersion,
    command.request.command
  );
  const conditional: boolean = handle.isSuccess() && handle.value.conditional;
  const sent = await callSource(`dispatch ${command.request.command}`, () =>
    source.dispatch(binding, command.request, conditional ? record.sourceRevision : undefined)
  );
  const answer: SourceCommandResult = sent.isSuccess()
    ? _validated(core, sent.value)
    : { state: 'indeterminate', reason: _bounded(core, `the send failed; outcome unknown: ${sent.message}`) };
  return settleCommand(core, source, binding, record.task.envelope.id, command, answer);
}

/** A source's answer, converted; one that does not convert is an uncertain outcome, never a receipt. */
function _validated(core: BrokerCore, answer: unknown): SourceCommandResult {
  const converted = core.converters.sources.commandResult.convert(answer);
  return converted.isSuccess()
    ? converted.value
    : {
        state: 'indeterminate',
        reason: _bounded(core, `the source's answer breaks its contract: ${converted.message}`)
      };
}

/**
 * Persists a source's answer to a dispatched command, merged onto the **latest** record — a
 * reassignment or scope change committed while the command was in flight is kept, since only the
 * command's receipt and (for an applied answer) the execution fields change.
 *
 * - `rejected` / `accepted` settle the dispatch. Rejection is refusal, never an optimistic status.
 * - `applied` from an `observed-state` source commits the reported projection when it is newer and
 *   settles `applied` at the resulting revision, in one commit. From a `source-replay` source it
 *   settles the dispatch with the receipt still `accepted`, awaiting the feed to reach that
 *   revision — the command's observation never moves the task ahead of the feed.
 * - `indeterminate` and `key-expired` keep the `possibly-sent` marker: the outcome stays uncertain
 *   and the settlement reservation stays held.
 *
 * A failure to persist the answer is `commit-indeterminate` with the operation id.
 * @internal
 */
export async function settleCommand(
  core: BrokerCore,
  source: ITaskSource,
  binding: ISourceBinding,
  taskId: TaskId,
  command: IStoredCommandOperation,
  answer: SourceCommandResult
): Promise<TaskResult<ICommandReceipt>> {
  const operationId = command.operationId;
  if (answer.state === 'applied' && source.history === 'observed-state') {
    return _settleApplied(core, source, binding, taskId, command, answer.observation);
  }
  const settled = await core.gated(async (writer): Promise<TaskResult<ICommandReceipt>> => {
    const read = await _readCommand(writer, taskId, operationId);
    if (read.isFailure()) {
      return propagate<ICommandReceipt>(read);
    }
    const { record: current, command: now } = read.value;
    if (now.dispatch === 'settled') {
      return ok(now.receipt);
    }
    const next: IStoredCommandOperation = _answered(
      source,
      current,
      now,
      answer,
      core.converters.bounds.maxSummaryLength
    );
    if (canonicallySame(now, next)) {
      return ok(now.receipt);
    }
    return _persist(writer, current, next);
  });
  return _indeterminateOnWriteFailure(settled, operationId);
}

/** The stored command after a (non-observed-state-applied) answer. */
function _answered(
  source: ITaskSource,
  current: IResolvedTaskCommitRecord,
  now: IStoredCommandOperation,
  answer: SourceCommandResult,
  maxReason: number
): IStoredCommandOperation {
  switch (answer.state) {
    case 'rejected':
      return {
        ...now,
        dispatch: 'settled',
        receipt: _receipt(now.request, { state: 'rejected', reason: answer.reason })
      };
    case 'accepted':
      return {
        ...now,
        dispatch: 'settled',
        receipt: _receipt(now.request, { state: 'accepted', sourceReceipt: answer.sourceReceipt })
      };
    case 'applied': {
      // A source-replay source: the feed decides. If it has already committed that revision, the
      // effect is confirmed now; otherwise the receipt waits for it.
      const reached: Result<SourceRevisionOrder> | undefined =
        current.sourceRevision !== undefined
          ? compareRevisions(source, current.sourceRevision, answer.observation.revision)
          : undefined;
      if (
        reached !== undefined &&
        reached.isSuccess() &&
        (reached.value === 'same' || reached.value === 'newer')
      ) {
        return {
          ...now,
          dispatch: 'settled',
          receipt: _receipt(now.request, {
            state: 'applied',
            appliedRevision: current.task.envelope.revision
          })
        };
      }
      return {
        ...now,
        dispatch: 'settled',
        receipt: _receipt(now.request, { state: 'accepted' }),
        awaiting: answer.observation.revision
      };
    }
    case 'key-expired':
      return {
        ...now,
        receipt: _receipt(now.request, {
          state: 'indeterminate',
          reason: `${keyExpiredPrefix}: ${answer.reason}`.slice(0, maxReason)
        })
      };
    default:
      return {
        ...now,
        receipt: _receipt(now.request, { state: 'indeterminate', reason: answer.reason.slice(0, maxReason) })
      };
  }
}

async function _persist(
  writer: ITaskRepositoryWriter,
  current: IResolvedTaskCommitRecord,
  next: IStoredCommandOperation
): Promise<TaskResult<ICommandReceipt>> {
  const committed = await writer.commit({
    purpose: 'maintenance',
    taskId: current.task.envelope.id,
    expectedRevision: revisionOf(current),
    expectedRecordRevision: current.recordRevision,
    record: _draft(current, _withCommand(current, next))
  });
  return committed.isSuccess() ? ok(next.receipt) : propagate(committed);
}

/**
 * An `applied` answer from an `observed-state` source: the projection is committed through the
 * ordinary ordering rules and the command settles `applied` in that same commit. When the
 * projection commits nothing — the task already reflects it (stale, unchanged), or the broker
 * refused it — a second commit settles the command: `applied` at the current revision if the
 * effect is already reflected, `accepted` if the projection was refused.
 */
async function _settleApplied(
  core: BrokerCore,
  source: ITaskSource,
  binding: ISourceBinding,
  taskId: TaskId,
  command: IStoredCommandOperation,
  observation: Extract<SourceCommandResult, { state: 'applied' }>['observation']
): Promise<TaskResult<ICommandReceipt>> {
  // The receipt settles `applied` inside the very commit that records the projection reflecting
  // the effect — there is no window in which one is durable without the other.
  const settleInCommit = (
    operations: ReadonlyArray<IStoredTaskOperation>,
    revision: TaskRevision
  ): ReadonlyArray<IStoredTaskOperation> =>
    operations.map((op) =>
      op.operationId === command.operationId && op.type === 'command' && op.dispatch !== 'settled'
        ? {
            ...op,
            dispatch: 'settled',
            receipt: _receipt(op.request, { state: 'applied', appliedRevision: revision })
          }
        : op
    );
  const applied = await applyProjection(core, source, binding, observation, 'direct', settleInCommit);
  if (applied.isFailure()) {
    return _indeterminateOnWriteFailure(propagate<ICommandReceipt>(applied), command.operationId);
  }
  const outcome = applied.value.outcome;
  const effective: boolean =
    outcome === 'applied' ||
    outcome === 'unchanged' ||
    outcome === 'refreshed' ||
    outcome === 'stale' ||
    outcome === 'health-changed';
  const settled = await core.gated(async (writer): Promise<TaskResult<ICommandReceipt>> => {
    const read = await _readCommand(writer, taskId, command.operationId);
    if (read.isFailure()) {
      return propagate<ICommandReceipt>(read);
    }
    const { record: current, command: now } = read.value;
    if (now.dispatch === 'settled') {
      return ok(now.receipt);
    }
    // The effect is reconciled into a committed projection only if the projection committed (or was
    // already reflected). One the broker refused — a contract violation, an epoch it cannot order,
    // a capacity refusal — leaves the command accepted but not applied.
    const result: CommandState = effective
      ? { state: 'applied', appliedRevision: current.task.envelope.revision }
      : { state: 'accepted' };
    return _persist(writer, current, { ...now, dispatch: 'settled', receipt: _receipt(now.request, result) });
  });
  return _indeterminateOnWriteFailure(settled, command.operationId);
}

/**
 * A failure writing a command's outcome is `commit-indeterminate`, carrying the command's operation
 * id: the send happened, or may have, and the record says `possibly-sent` until something settles
 * it. (Settlement writes are maintenance and observation commits, which carry no operation id of
 * their own, so storage's classification of them is always re-stated here with the command's.)
 */
function _indeterminateOnWriteFailure(
  result: TaskResult<ICommandReceipt>,
  operationId: IStoredTaskOperation['operationId']
): TaskResult<ICommandReceipt> {
  return result.isSuccess()
    ? result
    : taskFailure(
        `the command was dispatched, but persisting its outcome failed: ${result.message}`,
        'commit-indeterminate',
        'reconcile-first',
        { operationId }
      );
}

/**
 * The uncertain-command pump (a bound-writer operation). One pass over the tasks the index says
 * hold an unsettled command, each command re-authorized for this principal:
 *
 * - `not-sent` → the dispatch boundary ({@link dispatchIntent}).
 * - `possibly-sent` → the source's lookup, when it has one; then a resend under the **same key**
 *   only when the kind declares `idempotency: 'source-key'` and the key has not expired; otherwise
 *   **held**, its receipt `indeterminate` — never resent.
 *
 * Tasks this principal cannot see are passed over without mention. Repository open never runs it.
 * @internal
 */
export async function resolveCommands(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<ICommandResolutionReport>> {
  const converted = core.converters.broker.commandResolution.convert(input);
  if (converted.isFailure()) {
    return taskFailure(`resolveCommands: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const request: ICommandResolutionRequest = converted.value;
  // A best-effort candidate list, read outside the writer: every action below re-reads and
  // re-validates inside its own writer section, so nothing here is taken as authoritative.
  const ids = await core.repository.unsettledCommands({ limit: request.limit });
  if (ids.isFailure()) {
    return propagate(ids);
  }
  const resolutions: ICommandResolution[] = [];
  for (const taskId of ids.value) {
    const read = await core.repository.readCommit(taskId);
    if (read.isFailure()) {
      return propagate(read);
    }
    const record: ITaskCommitRecord | undefined = read.value;
    if (record === undefined || record.recordType !== 'resolved' || !(await ctx.sees(subjectOf(record)))) {
      continue;
    }
    for (const op of record.operations) {
      if (op.type === 'command' && op.dispatch !== 'settled') {
        const resolution = await _resolveOne(core, ctx, record, op);
        if (resolution.isFailure()) {
          return propagate(resolution);
        }
        resolutions.push(resolution.value);
      }
    }
  }
  return ok({ resolutions });
}

async function _resolveOne(
  core: BrokerCore,
  ctx: AccessContext,
  record: IResolvedTaskCommitRecord,
  command: IStoredCommandOperation
): Promise<TaskResult<ICommandResolution>> {
  const taskId: TaskId = record.task.envelope.id;
  const operationId = command.operationId;
  const done = (
    action: ICommandResolution['action'],
    result?: CommandState
  ): TaskResult<ICommandResolution> =>
    ok({ taskId, operationId, action, ...(result !== undefined ? { result } : {}) });

  if (!(await ctx.may('command', subjectOf(record), 'subject', { command: command.request.command }))) {
    return done('denied');
  }
  const bound = sourceOf(core, record);
  if (bound.isFailure()) {
    return done('unavailable');
  }
  const { source, binding } = bound.value;
  if (command.dispatch === 'not-sent') {
    const sent = await dispatchIntent(core, ctx, record, command, bound.value);
    return sent.isFailure() ? propagate(sent) : done('dispatched', sent.value.result);
  }

  // possibly-sent: ask first, where the source can say.
  if (source.lookupCommand !== undefined) {
    const lookup = source.lookupCommand.bind(source);
    const found = await callSource(`lookup ${operationId}`, () => lookup(binding, command.request));
    if (found.isFailure()) {
      return done('unavailable');
    }
    const converted = core.converters.sources.commandLookup.convert(found.value);
    const answer: SourceCommandLookup = converted.isSuccess()
      ? converted.value
      : {
          state: 'indeterminate',
          reason: _bounded(core, `the source's lookup breaks its contract: ${converted.message}`)
        };
    if (answer.state !== 'not-found' && answer.state !== 'indeterminate') {
      const settled = await settleCommand(core, source, binding, taskId, command, answer);
      if (settled.isFailure()) {
        return propagate(settled);
      }
      return done(answer.state === 'key-expired' ? 'held' : 'resolved', settled.value.result);
    }
  }
  const handle = core.repository.registry.getCommand(
    record.task.envelope.kind,
    record.task.envelope.detailVersion,
    command.request.command
  );
  const expired: boolean =
    command.receipt.result.state === 'indeterminate' &&
    command.receipt.result.reason.startsWith(keyExpiredPrefix);
  if (handle.isSuccess() && handle.value.idempotency === 'source-key' && !expired) {
    // The source deduplicates this key: resending it cannot apply the effect twice.
    const resent = await _send(core, source, binding, record, command);
    if (resent.isFailure()) {
      return propagate(resent);
    }
    // Still uncertain after the resend: the source could not be reached or could not say. It stays
    // eligible — the key still deduplicates.
    return done(
      resent.value.result.state === 'indeterminate' ? 'unavailable' : 'resolved',
      resent.value.result
    );
  }
  if (
    command.receipt.result.state === 'indeterminate' &&
    (command.receipt.result.reason.startsWith(heldPrefix) || expired)
  ) {
    return done('held', command.receipt.result);
  }
  const held = await settleCommand(core, source, binding, taskId, command, {
    state: 'indeterminate',
    reason: heldPrefix
  });
  return held.isFailure() ? propagate(held) : done('held', held.value.result);
}
