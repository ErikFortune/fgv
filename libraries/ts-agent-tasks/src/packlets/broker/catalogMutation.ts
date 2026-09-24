/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Converter } from '@fgv/ts-utils';
import { planUpdates } from '../implementations';
import {
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  IStoredCatalogOperation,
  IStoredTaskOperation,
  ITaskAccessRequest,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskMutationIdentity,
  ITaskMutationResult,
  ITaskUpdate,
  Instant,
  TaskAccessRole,
  TaskAction,
  TaskCatalogOperationType,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateCategory
} from '../types';
import { ITaskRepositoryWriter } from '../storage';
import { AccessContext, AccessSubject, subjectOf } from './access';
import { BrokerCore, canonicallySame, receiptJson, revisionOf, storedOperation } from './core';
import { changedSinceAuthorized, denied, notFound, ok, propagate, taskFailure } from './failures';

/**
 * What a gated evaluation decided about the subject.
 * @internal
 */
export type CatalogChange =
  | { readonly disposition: 'unchanged' }
  | {
      readonly disposition: 'changed';
      /** The next envelope; its revision and `changedAt` are advanced by the pipeline. */
      readonly envelope: ITaskEnvelope;
      readonly categories: ReadonlyArray<UpdateCategory>;
      readonly archived?: boolean;
    };

/**
 * A task other than the subject that an operation must authorize — an affected parent.
 * @internal
 */
export interface IRelatedTask {
  readonly id: TaskId;
  readonly role: TaskAccessRole;
  readonly record: ITaskCommitRecord;
}

/**
 * One catalog mutation of an existing task, described for the shared pipeline.
 * @internal
 */
export interface ICatalogMutation<TReceipt extends ITaskMutationResult> {
  readonly action: TaskAction;
  readonly operation: TaskCatalogOperationType;
  readonly identity: ITaskMutationIdentity;
  /** The converted request, stored as the operation's dedup identity. */
  readonly request: JsonValue;
  readonly receiptConverter: Converter<TReceipt>;
  /** What the policy is told beyond the subject. */
  readonly access?: Pick<ITaskAccessRequest, 'targetResponsibility' | 'scopes'>;
  /** Checks on the visible, resolved, non-archived subject before anything is authorized. */
  readonly admit?: (record: IResolvedTaskCommitRecord) => TaskResult<true>;
  /**
   * The other tasks this operation affects, read and checked before authorization. Each is
   * authorized for the same action in its role, and re-verified inside the writer.
   */
  readonly related?: (record: IResolvedTaskCommitRecord) => Promise<TaskResult<ReadonlyArray<IRelatedTask>>>;
  /**
   * The other tasks the request itself names, read and authorized in their roles again when the
   * operation replays — a receipt is returned only while its principal still holds every grant
   * the request relied on. Confirmed unchanged inside the writer with the subject.
   */
  readonly replayRelated?: () => Promise<TaskResult<ReadonlyArray<IRelatedTask>>>;
  /** Decides the change inside the writer, from the current subject and related records. */
  readonly evaluate: (
    current: IResolvedTaskCommitRecord,
    related: ReadonlyArray<IRelatedTask>,
    writer: ITaskRepositoryWriter
  ) => Promise<TaskResult<CatalogChange>>;
  /** Builds the receipt from the common fields and the envelopes before and after. */
  readonly receipt: (base: ITaskMutationResult, before: ITaskEnvelope, after: ITaskEnvelope) => TReceipt;
}

/**
 * Whether a stored operation is this catalog request again: same operation, principal and
 * canonical request.
 * @internal
 */
export function isSameCatalog(
  stored: IStoredTaskOperation,
  operation: TaskCatalogOperationType,
  principal: string,
  request: JsonValue
): stored is IStoredCatalogOperation {
  return (
    stored.type === 'catalog' &&
    stored.operation === operation &&
    stored.principalKey === principal &&
    canonicallySame(stored.request, request)
  );
}

/**
 * Reads a record this operation needs and requires it to exist.
 * @internal
 */
export async function readExisting(core: BrokerCore, id: TaskId): Promise<TaskResult<ITaskCommitRecord>> {
  const read = await core.repository.readCommit(id);
  if (read.isFailure()) {
    return propagate(read);
  }
  return read.value === undefined ? notFound(id) : ok(read.value);
}

/**
 * The replay of an operation already recorded under this id: the same request returns its stored
 * receipt — after re-authorizing the action, since a receipt is private data — and a different
 * request under the same id is refused.
 * @internal
 */
export async function replayCatalog<TReceipt>(
  ctx: AccessContext,
  subject: AccessSubject,
  stored: IStoredTaskOperation,
  mutation: {
    readonly action: TaskAction;
    readonly operation: TaskCatalogOperationType;
    readonly request: JsonValue;
    readonly identity: { readonly taskId: TaskId; readonly operationId: IStoredTaskOperation['operationId'] };
    readonly receiptConverter: Converter<TReceipt>;
    readonly access?: Pick<ITaskAccessRequest, 'targetResponsibility' | 'scopes'>;
  }
): Promise<TaskResult<TReceipt>> {
  const { taskId, operationId } = mutation.identity;
  if (!isSameCatalog(stored, mutation.operation, ctx.principal, mutation.request)) {
    return taskFailure(
      `task ${taskId}: operation '${operationId}' is already recorded with a different request`,
      'conflict',
      'after-host-action',
      { operationId }
    );
  }
  // The same access context the operation was first authorized with: a policy that decides on
  // the target must decide the replay the same way.
  if (!(await ctx.may(mutation.action, subject, 'subject', mutation.access))) {
    return denied(taskId, mutation.action, operationId);
  }
  return _storedReceipt(stored, mutation.receiptConverter, taskId);
}

/**
 * Returns a replayed receipt only if nothing it was authorized against has moved: inside the
 * writer, the policy epoch, the record's semantic revision, and that of every related task the
 * replay authorized, must be what the replay was authorized under. A replay is private data, so
 * it gets the same revalidation a commit does.
 * @internal
 */
export async function confirmUnchanged<T>(
  core: BrokerCore,
  ctx: AccessContext,
  epoch: string,
  id: TaskId,
  record: ITaskCommitRecord,
  value: T,
  operationId: IStoredTaskOperation['operationId'],
  related: ReadonlyArray<IRelatedTask> = []
): Promise<TaskResult<T>> {
  return core.gated(async (writer) => {
    for (const [taskId, authorized, what] of [
      [id, record, `task ${id}`] as const,
      ...related.map((task) => [task.id, task.record, `a task related to ${id}`] as const)
    ]) {
      const again = await writer.readCommit(taskId);
      if (again.isFailure()) {
        return propagate<T>(again);
      }
      if (again.value === undefined || revisionOf(again.value) !== revisionOf(authorized)) {
        return changedSinceAuthorized<T>(what, operationId);
      }
    }
    // After the last await, immediately before the receipt is released.
    if (!ctx.epochIs(epoch)) {
      return changedSinceAuthorized<T>('the authorization policy', operationId);
    }
    return ok(value);
  });
}

function _storedReceipt<TReceipt>(
  stored: IStoredCatalogOperation,
  converter: Converter<TReceipt>,
  taskId: TaskId
): TaskResult<TReceipt> {
  const receipt = converter.convert(stored.receipt);
  return receipt.isSuccess()
    ? ok(receipt.value)
    : taskFailure(
        `task ${taskId}: stored receipt of '${stored.operationId}' does not convert: ${receipt.message}`,
        'storage-corrupt',
        'after-host-action',
        { operationId: stored.operationId }
      );
}

/**
 * The next record: the subject with its new envelope, the operation's evidence appended, and the
 * updates it owes. Details, source revision, existing operations and existing updates are kept.
 * @internal
 */
export function nextDraft(
  current: IResolvedTaskCommitRecord,
  envelope: ITaskEnvelope,
  operation: IStoredTaskOperation,
  updates: ReadonlyArray<ITaskUpdate>,
  archived: boolean
): IResolvedTaskRecordDraft {
  return {
    recordType: 'resolved',
    task: { envelope, details: current.task.details },
    ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
    operations: [...current.operations, operation],
    updates: [...current.updates, ...updates],
    archived
  };
}

/**
 * The next envelope for a changed evaluation: revision advanced by one, `changedAt` now.
 * @internal
 */
export function advance(envelope: ITaskEnvelope, current: ITaskEnvelope, now: Instant): ITaskEnvelope {
  return { ...envelope, revision: (current.revision + 1) as TaskRevision, changedAt: now };
}

/** The refusal for a stale expected revision. */
function _stale<T>(identity: ITaskMutationIdentity, found: ITaskCommitRecord | undefined): TaskResult<T> {
  return taskFailure<T>(
    `task ${identity.taskId}: expected revision ${identity.expectedRevision}, found ${
      found !== undefined ? `${found.recordType} revision ${revisionOf(found)}` : 'no record'
    }`,
    'conflict',
    'reconcile-first',
    { operationId: identity.operationId }
  );
}

/**
 * Runs one catalog mutation of an existing task.
 *
 * @remarks
 * The order is the authorization contract:
 *
 * 1. read the subject and capture the policy epoch, before any question is put to the policy;
 * 2. not visible → the same failure as a foreign id;
 * 3. an operation already recorded under this id replays — re-authorized, with every task its
 *    request names, and confirmed inside the writer — or conflicts;
 * 4. authorize the action on the subject — before anything action-specific is disclosed;
 * 5. unresolved and archived subjects take no catalog change; operation-specific admission; a
 *    stale expected revision is refused;
 * 6. authorize every related task in its role;
 * 7. inside the serialized writer: refuse if the epoch moved or any authorized record changed,
 *    evaluate against the records as they are now, and commit.
 *
 * Nothing before 7 is trusted: step 7 re-reads everything the earlier steps authorized.
 * @internal
 */
export async function runCatalogMutation<TReceipt extends ITaskMutationResult>(
  core: BrokerCore,
  ctx: AccessContext,
  mutation: ICatalogMutation<TReceipt>
): Promise<TaskResult<TReceipt>> {
  const { taskId, operationId, expectedRevision } = mutation.identity;
  const read = await readExisting(core, taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const record: ITaskCommitRecord = read.value;
  const subject: AccessSubject = subjectOf(record);
  // The epoch is captured before the first question is put to the policy, so every answer this
  // operation relies on — visibility, the action, each related task — is covered by the recheck
  // inside the writer.
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await ctx.sees(subject))) {
    return notFound(taskId, operationId);
  }
  const replayed: IStoredTaskOperation | undefined = storedOperation(record, operationId);
  if (replayed !== undefined) {
    const receipt = await replayCatalog(ctx, subject, replayed, mutation);
    if (receipt.isFailure()) {
      return receipt;
    }
    const named = mutation.replayRelated !== undefined ? await mutation.replayRelated() : ok([]);
    return named.isFailure()
      ? propagate(named)
      : confirmUnchanged(core, ctx, epoch.value, taskId, record, receipt.value, operationId, named.value);
  }
  // Authority is decided before any mutation-specific fact about the task is disclosed: a
  // principal that may read but not perform this action learns nothing from the refusal.
  if (!(await ctx.may(mutation.action, subject, 'subject', mutation.access))) {
    return denied(taskId, mutation.action, operationId);
  }
  if (record.recordType === 'unresolved') {
    return taskFailure(
      `task ${taskId}: an unresolved registration takes no catalog change until its first observation`,
      'unsupported',
      'after-host-action',
      { operationId }
    );
  }
  if (record.archived) {
    return taskFailure(
      `task ${taskId}: an archived tombstone is immutable`,
      'conflict',
      'after-host-action',
      {
        operationId
      }
    );
  }
  const admitted: TaskResult<true> = mutation.admit !== undefined ? mutation.admit(record) : ok(true);
  if (admitted.isFailure()) {
    return propagate(admitted);
  }
  if (revisionOf(record) !== expectedRevision) {
    return _stale(mutation.identity, record);
  }
  const related = mutation.related !== undefined ? await mutation.related(record) : ok([]);
  if (related.isFailure()) {
    return propagate(related);
  }

  // `undefined` from the writer section means: the same operation committed while this one waited.
  const outcome = await core.gated(async (writer): Promise<TaskResult<TReceipt | undefined>> => {
    const reread = await writer.readCommit(taskId);
    if (reread.isFailure()) {
      return propagate<TReceipt | undefined>(reread);
    }
    const found: ITaskCommitRecord | undefined = reread.value;
    const concurrent: IStoredTaskOperation | undefined =
      found !== undefined ? storedOperation(found, operationId) : undefined;
    if (concurrent !== undefined) {
      // Its receipt is authorized against the record as it is now, through the ordinary replay
      // path, once this writer section has returned.
      return ok<TReceipt | undefined>(undefined);
    }
    // The repository is an injected interface, so what it returns inside the writer is checked,
    // not assumed: the subject must still be the resolved task at the authorized revision.
    if (found === undefined || found.recordType !== 'resolved' || revisionOf(found) !== expectedRevision) {
      return _stale<TReceipt | undefined>(mutation.identity, found);
    }
    const current: IResolvedTaskCommitRecord = found;
    const relatedNow: IRelatedTask[] = [];
    for (const task of related.value) {
      const again = await writer.readCommit(task.id);
      if (again.isFailure()) {
        return propagate<TReceipt | undefined>(again);
      }
      if (again.value === undefined || revisionOf(again.value) !== revisionOf(task.record)) {
        return changedSinceAuthorized<TReceipt | undefined>(`a task related to ${taskId}`, operationId);
      }
      relatedNow.push({ ...task, record: again.value });
    }
    const change = await mutation.evaluate(current, relatedNow, writer);
    if (change.isFailure()) {
      return propagate<TReceipt | undefined>(change);
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate<TReceipt | undefined>(clock);
    }
    const before: ITaskEnvelope = current.task.envelope;
    const after: ITaskEnvelope =
      change.value.disposition === 'changed' ? advance(change.value.envelope, before, clock.value) : before;
    const updates: ReadonlyArray<ITaskUpdate> =
      change.value.disposition === 'changed'
        ? planUpdates(before, after, change.value.categories, core.audience)
        : [];
    const receipt: TReceipt = mutation.receipt(
      {
        taskId,
        revision: after.revision,
        operationId,
        disposition: change.value.disposition,
        updateIds: updates.map((update) => update.id)
      },
      before,
      after
    );
    const archived: boolean = change.value.disposition === 'changed' && change.value.archived === true;
    const operation: IStoredCatalogOperation = {
      type: 'catalog',
      operationId,
      operation: mutation.operation,
      request: mutation.request,
      principalKey: ctx.principal,
      receipt: receiptJson(receipt)
    };
    // After the last await — every re-read and the evaluation — and immediately before the
    // durable write: the policy must still be the one every answer was given under.
    if (!ctx.epochIs(epoch.value)) {
      return changedSinceAuthorized<TReceipt | undefined>('the authorization policy', operationId);
    }
    const committed = await writer.commit({
      purpose: 'operation',
      operationId,
      taskId,
      expectedRevision: before.revision,
      expectedRecordRevision: current.recordRevision,
      record: nextDraft(current, after, operation, updates, archived)
    });
    return committed.isSuccess()
      ? ok<TReceipt | undefined>(receipt)
      : propagate<TReceipt | undefined>(committed);
  });
  if (outcome.isFailure()) {
    return propagate(outcome);
  }
  return outcome.value !== undefined ? ok(outcome.value) : runCatalogMutation(core, ctx, mutation);
}
