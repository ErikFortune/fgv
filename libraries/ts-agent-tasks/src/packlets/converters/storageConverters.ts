/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IPendingInventoryEntry,
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  IStoredCatalogOperation,
  IStoredCommandOperation,
  IStoredTaskOperation,
  ITaskCommitRecord,
  ITaskFieldBounds,
  ITaskInventoryEntry,
  ITaskRecordDraft,
  ITaskRecordHeader,
  ITaskSourceRecord,
  SourceHistoryContract,
  ITaskRepositoryManifest,
  ITaskUpdate,
  IUnresolvedTaskCommitRecord,
  IUnresolvedTaskRecordDraft,
  StoredCommandDispatch,
  TaskCatalogOperationType,
  TaskId,
  TaskRevision,
  allTaskCatalogOperationTypes,
  isTerminalTaskStatus,
  taskUpdateId
} from '../types';
import { ICapacityConverters } from './capacityConverters';
import { ICommandConverters } from './commandConverters';
import { IContextConverters } from './contextConverters';
import { IEnvelopeConverters } from './envelopeConverters';
import { IIdentityConverters } from './identityConverters';
import {
  boundedSingleLine,
  maxSourceCursorLength,
  nonNegativeSafeInteger,
  positiveSafeInteger
} from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * Converters for the records the storage packlet writes and reads.
 *
 * @remarks
 * **The write path runs these on the exact record it is about to write**, and the read path
 * runs them on what it reads back — one converter, both directions, so nothing can be
 * written that a restart would then refuse to read.
 *
 * Record collections are not individually length-capped here: every record is refused
 * *before* it is parsed if its encoded size exceeds its type's byte ceiling, which bounds
 * the work, and per-owner count limits come from the repository's stored capacity profile,
 * which these converters do not see.
 * @public
 */
export interface IStorageConverters {
  readonly operation: Converter<IStoredTaskOperation>;
  readonly operations: Converter<ReadonlyArray<IStoredTaskOperation>>;
  readonly updates: Converter<ReadonlyArray<ITaskUpdate>>;
  readonly resolvedRecord: Converter<IResolvedTaskCommitRecord>;
  readonly unresolvedRecord: Converter<IUnresolvedTaskCommitRecord>;
  readonly record: Converter<ITaskCommitRecord>;
  readonly draft: Converter<ITaskRecordDraft>;
  readonly inventoryEntry: Converter<ITaskInventoryEntry>;
  readonly manifest: Converter<ITaskRepositoryManifest>;
  readonly header: Converter<ITaskRecordHeader>;
  /** A broker source-checkpoint record, validated in full. */
  readonly sourceRecord: Converter<ITaskSourceRecord>;
  /**
   * Reads only `formatVersion` from an otherwise unvalidated object, so a record written by a
   * newer storage format can be *reported* as such rather than as generic corruption.
   */
  readonly formatVersion: Converter<number>;
}

function _unique<T>(values: ReadonlyArray<T>, key: (value: T) => string, what: string): Result<true> {
  const seen: Set<string> = new Set<string>();
  for (const value of values) {
    const k: string = key(value);
    if (seen.has(k)) {
      return fail(`${what}: duplicate '${k}'`);
    }
    seen.add(k);
  }
  return succeed(true);
}

/**
 * Checks that every operation is task-consistent: a command's request and receipt both name
 * the operation and the task the record is for.
 */
function _operationsBelongTo(taskId: TaskId, operations: ReadonlyArray<IStoredTaskOperation>): Result<true> {
  for (const op of operations) {
    if (op.type === 'command') {
      if (op.request.operationId !== op.operationId || op.receipt.operationId !== op.operationId) {
        return fail(`operation ${op.operationId}: request or receipt names a different operation`);
      }
      if (op.request.taskId !== taskId || op.receipt.taskId !== taskId) {
        return fail(`operation ${op.operationId}: names a task other than ${taskId}`);
      }
    }
  }
  return _unique(operations, (op) => op.operationId, 'operations');
}

/**
 * Checks update identity against the task: every update belongs to this task, carries the
 * canonical `(task, revision, category)` id, and describes a revision the task has reached.
 */
function _updatesBelongTo(
  taskId: TaskId,
  revision: TaskRevision,
  updates: ReadonlyArray<ITaskUpdate>
): Result<true> {
  for (const update of updates) {
    if (update.taskId !== taskId) {
      return fail(`update ${update.id}: belongs to ${update.taskId}, not ${taskId}`);
    }
    if (update.revision > revision) {
      return fail(`update ${update.id}: revision ${update.revision} is newer than the task's ${revision}`);
    }
    const expected: string = taskUpdateId(update.taskId, update.revision, update.category);
    if (update.id !== expected) {
      return fail(`update ${update.id}: identity disagrees with its content (expected '${expected}')`);
    }
  }
  return _unique(updates, (u) => u.id, 'updates');
}

function _resolvedInvariants<
  T extends Pick<IResolvedTaskCommitRecord, 'task' | 'operations' | 'updates' | 'archived'>
>(value: T): Result<T> {
  const envelope = value.task.envelope;
  // A task's creation operation is dedup evidence for its whole retained lifetime, and an
  // operation is never dropped, so every resolved record carries at least that one.
  if (value.operations.length < 1) {
    return fail(`task ${envelope.id}: a record carries at least its creation operation`);
  }
  if (value.archived && !isTerminalTaskStatus(envelope.lifecycle.status)) {
    return fail(`task ${envelope.id}: only a terminal task can be archived`);
  }
  return _operationsBelongTo(envelope.id, value.operations)
    .onSuccess(() => _updatesBelongTo(envelope.id, envelope.revision, value.updates))
    .onSuccess(() => succeed(value))
    .withErrorFormat((message) => `task ${envelope.id}: ${message}`);
}

function _unresolvedInvariants<T extends Pick<IUnresolvedTaskCommitRecord, 'reference' | 'operations'>>(
  value: T
): Result<T> {
  // The registration operation is the record's reason to exist, and nothing else can reach an
  // unresolved record: its only replacement is first resolution. So it carries exactly one.
  if (value.operations.length !== 1) {
    return fail(
      `task ${value.reference.id}: an unresolved record carries exactly its registration operation`
    );
  }
  return _operationsBelongTo(value.reference.id, value.operations)
    .onSuccess(() => succeed(value))
    .withErrorFormat((message) => `task ${value.reference.id}: ${message}`);
}

/**
 * Builds the {@link IStorageConverters}.
 * @public
 */
export function buildStorageConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters,
  envelopes: IEnvelopeConverters,
  commands: ICommandConverters,
  capacity: ICapacityConverters,
  context: IContextConverters
): IStorageConverters {
  const principalKey: Converter<string> = boundedSingleLine(bounds.maxSummaryLength, 'principal key');
  const recordRevision: Converter<number> = positiveSafeInteger;

  const command: Converter<IStoredCommandOperation> = Converters.strictObject<IStoredCommandOperation>({
    type: Converters.literal('command'),
    operationId: ids.operationId,
    request: commands.request,
    principalKey,
    dispatch: Converters.enumeratedValue<StoredCommandDispatch>(['not-sent', 'possibly-sent', 'settled']),
    receipt: commands.receipt,
    awaiting: values.sourceRevision.optional()
  });

  const catalog: Converter<IStoredCatalogOperation> = Converters.strictObject<IStoredCatalogOperation>({
    type: Converters.literal('catalog'),
    operationId: ids.operationId,
    operation: Converters.enumeratedValue<TaskCatalogOperationType>(allTaskCatalogOperationTypes),
    request: JsonConverters.jsonValue,
    principalKey,
    receipt: JsonConverters.jsonValue
  });

  const operation: Converter<IStoredTaskOperation> = Converters.discriminatedObject<IStoredTaskOperation>(
    'type',
    { command, catalog }
  );
  const operations: Converter<ReadonlyArray<IStoredTaskOperation>> = Converters.arrayOf(operation);
  const updates: Converter<ReadonlyArray<ITaskUpdate>> = Converters.arrayOf(context.update);

  const resolvedRecord: Converter<IResolvedTaskCommitRecord> =
    Converters.strictObject<IResolvedTaskCommitRecord>({
      formatVersion: Converters.literal<1>(1),
      recordType: Converters.literal('resolved'),
      recordRevision,
      task: envelopes.snapshot,
      sourceRevision: values.sourceRevision.optional(),
      operations,
      updates,
      capacityClaims: capacity.claims,
      archived: Converters.boolean
    }).withConstraint(_resolvedInvariants);

  const unresolvedRecord: Converter<IUnresolvedTaskCommitRecord> =
    Converters.strictObject<IUnresolvedTaskCommitRecord>({
      formatVersion: Converters.literal<1>(1),
      recordType: Converters.literal('unresolved'),
      recordRevision,
      reference: context.unresolvedReference,
      operations,
      capacityClaims: capacity.claims
    }).withConstraint(_unresolvedInvariants);

  const record: Converter<ITaskCommitRecord> = Converters.discriminatedObject<ITaskCommitRecord>(
    'recordType',
    { resolved: resolvedRecord, unresolved: unresolvedRecord }
  );

  const draft: Converter<ITaskRecordDraft> = Converters.discriminatedObject<ITaskRecordDraft>('recordType', {
    resolved: Converters.strictObject<IResolvedTaskRecordDraft>({
      recordType: Converters.literal('resolved'),
      task: envelopes.snapshot,
      sourceRevision: values.sourceRevision.optional(),
      operations,
      updates,
      archived: Converters.boolean
    }).withConstraint(_resolvedInvariants),
    unresolved: Converters.strictObject<IUnresolvedTaskRecordDraft>({
      recordType: Converters.literal('unresolved'),
      reference: context.unresolvedReference,
      operations
    }).withConstraint(_unresolvedInvariants)
  });

  const inventoryEntry: Converter<ITaskInventoryEntry> = Converters.discriminatedObject<ITaskInventoryEntry>(
    'state',
    {
      live: Converters.strictObject<Extract<ITaskInventoryEntry, { state: 'live' }>>({
        id: ids.identifier,
        state: Converters.literal('live')
      }),
      pending: Converters.strictObject<IPendingInventoryEntry>({
        id: ids.identifier,
        state: Converters.literal('pending'),
        operationId: ids.operationId,
        operation: Converters.enumeratedValue<TaskCatalogOperationType>(allTaskCatalogOperationTypes),
        principalKey,
        recordType: Converters.enumeratedValue<ITaskCommitRecord['recordType']>(['resolved', 'unresolved']),
        request: JsonConverters.jsonValue,
        capacityClaims: capacity.claims
      })
    }
  );

  // A record kind's entries must name each identity once: two entries for one task are two
  // answers to "does this record have to exist", and a manifest that gives both is corrupt.
  const entries = (what: string): Converter<ReadonlyArray<ITaskInventoryEntry>> =>
    Converters.arrayOf(inventoryEntry).withConstraint(
      (value: ITaskInventoryEntry[]): Result<ITaskInventoryEntry[]> =>
        _unique(value, (e) => e.id, `${what} inventory`).onSuccess(() => succeed(value))
    );

  const manifest: Converter<ITaskRepositoryManifest> = Converters.strictObject<ITaskRepositoryManifest>({
    formatVersion: Converters.literal<1>(1),
    repositoryId: ids.identifier,
    manifestRevision: positiveSafeInteger,
    profile: capacity.profile,
    tasks: entries('task'),
    consumers: entries('consumer'),
    sources: entries('source')
  });

  // Deliberately *not* strict: this validates only the part of a consumer or source record
  // that this release owns, and leaves the rest for the slice that writes it.
  const header: Converter<ITaskRecordHeader> = Converters.object<ITaskRecordHeader>({
    formatVersion: Converters.literal<1>(1),
    id: ids.identifier
  });

  // A cursor is opaque source text; the stored profile's `maxSourceCursorBytes` is checked by the
  // repository, which holds the profile. This is only the representable ceiling.
  const sourceRecord: Converter<ITaskSourceRecord> = Converters.strictObject<ITaskSourceRecord>({
    formatVersion: Converters.literal<1>(1),
    id: ids.sourceId,
    recordRevision,
    history: Converters.enumeratedValue<SourceHistoryContract>(['observed-state', 'source-replay']),
    cursor: boundedSingleLine(maxSourceCursorLength, 'source cursor').optional(),
    pages: nonNegativeSafeInteger
  });

  const formatVersion: Converter<number> = Converters.object<{ formatVersion: number }>({
    formatVersion: Converters.number
  }).map((value) => succeed(value.formatVersion));

  return {
    operation,
    operations,
    updates,
    resolvedRecord,
    unresolvedRecord,
    record,
    draft,
    inventoryEntry,
    manifest,
    header,
    sourceRecord,
    formatVersion
  };
}
