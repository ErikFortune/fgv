/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IPendingInventoryEntry,
  IResolvedTaskRecordDraft,
  IStoredCatalogOperation,
  IStoredCommandOperation,
  IStoredTaskOperation,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRecordDraft,
  ITaskUpdate,
  OperationId,
  TaskCatalogOperationType,
  TaskId,
  TaskRevision,
  isTerminalTaskStatus
} from '../types';
import { canonicallyEqual, encodeRecord } from './layout';

/**
 * The storage invariants a record replacement must keep, independent of any broker policy.
 *
 * @remarks
 * These are integrity rules, not transition rules: which lifecycle moves are allowed is the
 * broker's decision (T5). What storage refuses is anything that would make the record lose
 * evidence, change identity, or stop describing one task consistently — because once written,
 * a restart has only the record to go on.
 * @internal
 */

/** The semantic revision of a record. */
export function revisionOf(record: ITaskCommitRecord | ITaskRecordDraft): TaskRevision {
  return record.recordType === 'resolved' ? record.task.envelope.revision : record.reference.revision;
}

/** The updates a record or draft owes. An unresolved record owes none. */
export function updatesOf(record: ITaskCommitRecord | ITaskRecordDraft): ReadonlyArray<ITaskUpdate> {
  return record.recordType === 'resolved' ? record.updates : [];
}

/** The task a record or draft describes. */
export function idOf(record: ITaskCommitRecord | ITaskRecordDraft): TaskId {
  return record.recordType === 'resolved' ? record.task.envelope.id : record.reference.id;
}

/**
 * What makes two records of one operation the same operation: its kind, its catalog
 * operation name, the principal it was accepted for, and its canonical request. Receipts are
 * outcomes, not identity.
 */
export function sameOperation(a: IStoredTaskOperation, b: IStoredTaskOperation): boolean {
  const identity = (op: IStoredTaskOperation): unknown => ({
    operationId: op.operationId,
    type: op.type,
    operation: op.type === 'catalog' ? op.operation : undefined,
    principalKey: op.principalKey,
    request: op.request
  });
  return canonicallyEqual(identity(a), identity(b));
}

/** The catalog operations that may create a task. */
const creations: ReadonlySet<TaskCatalogOperationType> = new Set<TaskCatalogOperationType>([
  'create-tracked',
  'create-list',
  'register-external'
]);

/**
 * Checks a record's first operation is its creation evidence: a creation catalog operation,
 * and `register-external` for an unresolved record. Registration replay answers from that slot
 * for the task's whole lifetime.
 */
export function checkCreationEvidence(
  record: ITaskCommitRecord | ITaskRecordDraft
): Result<IStoredCatalogOperation> {
  const op: IStoredTaskOperation = record.operations[0];
  if (op.type !== 'catalog' || !creations.has(op.operation)) {
    return fail(`operation '${op.operationId}' is not a creation operation`);
  }
  if (record.recordType === 'unresolved' && op.operation !== 'register-external') {
    return fail(`an unresolved record is created only by 'register-external'`);
  }
  return succeed(op);
}

/**
 * Checks a registration draft: it carries exactly its creation operation, whose stored
 * request is the registration's canonical request, and a first record is not archived.
 * Returns the creation operation.
 */
export function checkRegistrationDraft(
  draft: ITaskRecordDraft | ITaskCommitRecord,
  operationId: OperationId,
  request: JsonValue
): Result<IStoredCatalogOperation> {
  if (draft.operations.length !== 1 || draft.operations[0].operationId !== operationId) {
    return fail(`a first record carries exactly its creation operation '${operationId}'`);
  }
  if (draft.recordType === 'resolved' && draft.archived) {
    return fail(`a first record cannot be archived`);
  }
  return checkCreationEvidence(draft).onSuccess((creation) =>
    canonicallyEqual(creation.request, request)
      ? succeed(creation)
      : fail<IStoredCatalogOperation>(
          `the creation operation's request differs from the registration request`
        )
  );
}

/**
 * Everything that makes a registration the same registration: the creation operation's
 * identity and the type of first record it writes. A pending entry holds exactly this, so a
 * resumed registration — or the record open finds for it — is matched on all of it.
 */
export interface IRegistrationIdentity {
  readonly operationId: OperationId;
  readonly operation: TaskCatalogOperationType;
  readonly principalKey: string;
  readonly recordType: ITaskCommitRecord['recordType'];
  readonly request: JsonValue;
}

/** The identity of a registration, from its (checked) creation operation. */
export function registrationIdentity(
  record: ITaskRecordDraft | ITaskCommitRecord,
  creation: IStoredCatalogOperation
): IRegistrationIdentity {
  return {
    operationId: creation.operationId,
    operation: creation.operation,
    principalKey: creation.principalKey,
    recordType: record.recordType,
    request: creation.request
  };
}

/**
 * The type of a record's first record: unresolved if it still is, or if it holds the
 * first-resolution claim only an unresolved registration is given. A registration replay
 * compares against this, not the record's current type, which first resolution changes.
 */
export function firstRecordType(record: ITaskCommitRecord): ITaskCommitRecord['recordType'] {
  return record.recordType === 'unresolved' ||
    record.capacityClaims.some((c) => c.purpose === 'first-resolution')
    ? 'unresolved'
    : 'resolved';
}

/**
 * Checks a stored record's operation count against the per-task limit less the closeout slots
 * it still owes — the same bound every write applies — so a record edited out of band past it
 * cannot open writable.
 */
export function checkOperationCount(record: ITaskCommitRecord, profile: ITaskCapacityProfile): Result<true> {
  const archived: boolean = record.recordType === 'resolved' && record.archived;
  const terminal: boolean =
    record.recordType === 'resolved' && isTerminalTaskStatus(record.task.envelope.lifecycle.status);
  const held: number = archived ? 0 : terminal ? 1 : 2;
  const limit: number = profile.perOwner.maxOperationsPerTask - held;
  return record.operations.length <= limit
    ? succeed(true)
    : fail(
        `${record.operations.length} operations, over the per-task limit of ${limit} ` +
          `(${profile.perOwner.maxOperationsPerTask} less ${held} held for closeout)`
      );
}

/**
 * Checks a pending entry with no record by the rules registration applies: its creation
 * identity is one a registration could have written, and its request is within bounds. An
 * entry no registration can ever resume would hold its reservations forever.
 */
export function checkPendingIdentity(
  entry: IPendingInventoryEntry,
  profile: ITaskCapacityProfile
): Result<true> {
  if (!creations.has(entry.operation)) {
    return fail(`operation '${entry.operationId}' is not a creation operation`);
  }
  if (entry.recordType === 'unresolved' && entry.operation !== 'register-external') {
    return fail(`an unresolved record is created only by 'register-external'`);
  }
  return encodeRecord(entry.request).onSuccess((encoded) =>
    encoded.bytes > profile.encoded.maxOperationRequestBytes
      ? fail<true>(
          `the pending request is ${encoded.bytes} bytes, over the bound of ${profile.encoded.maxOperationRequestBytes}`
        )
      : succeed<true>(true)
  );
}

/** The identity a pending entry holds. */
export function pendingIdentity(entry: IPendingInventoryEntry): IRegistrationIdentity {
  return {
    operationId: entry.operationId,
    operation: entry.operation,
    principalKey: entry.principalKey,
    recordType: entry.recordType,
    request: entry.request
  };
}

/**
 * Checks identity and catalog metadata a replacement must preserve.
 */
export function checkIdentity(
  current: ITaskCommitRecord,
  draft: ITaskRecordDraft
): Result<IResolvedTaskRecordDraft> {
  if (draft.recordType === 'unresolved') {
    // V1 disallows metadata changes to an unresolved record until it is resolved (§8.3), and
    // nothing else about it can change: it has no lifecycle.
    return fail<IResolvedTaskRecordDraft>(
      `an unresolved record can only be replaced by its first resolution`
    );
  }
  const next = draft.task.envelope;
  if (current.recordType === 'unresolved') {
    const reference = current.reference;
    // First resolution preserves identity and every piece of catalog metadata (§8.3).
    if (!canonicallyEqual(_catalog(reference), _catalog(next))) {
      return fail(`first resolution must preserve the registration's identity and catalog metadata`);
    }
    if (next.revision <= reference.revision) {
      return fail(`first resolution must advance the revision past ${reference.revision}`);
    }
    return succeed(draft);
  }
  const previous = current.task.envelope;
  if (
    next.id !== previous.id ||
    next.kind !== previous.kind ||
    next.detailVersion !== previous.detailVersion
  ) {
    return fail(`a replacement cannot change the task's id, kind or detail version`);
  }
  if (next.createdAt !== previous.createdAt) {
    return fail(`a replacement cannot change createdAt`);
  }
  if (!canonicallyEqual(previous.binding, next.binding)) {
    return fail(`a source binding is not a metadata patch; it cannot change in a replacement`);
  }
  // Terminal execution state is absorbing in v1, and closeout accounting relies on there being
  // exactly one terminal outcome.
  if (
    isTerminalTaskStatus(previous.lifecycle.status) &&
    !canonicallyEqual(previous.lifecycle, next.lifecycle)
  ) {
    return fail(`terminal state is absorbing; it cannot change`);
  }
  return succeed(draft);
}

/**
 * Checks what a commit's purpose licenses, beyond identity.
 *
 * @remarks
 * - First resolution is an observation: an unresolved record is replaced only by the source
 *   projection that resolves it (design §8.3), and that projection's source revision is its
 *   dedup evidence.
 * - Outside an observation, a committed `sourceRevision` is dedup evidence and does not move.
 * - Maintenance changes no semantic state: only receipts, update pruning and observation
 *   timestamps. Its semantic revision is unchanged, and so is everything that revision orders.
 */
export function checkPurpose(
  current: ITaskCommitRecord,
  draft: IResolvedTaskRecordDraft,
  purpose: 'operation' | 'observation' | 'maintenance'
): Result<true> {
  if (current.recordType === 'unresolved') {
    if (purpose !== 'observation') {
      return fail(`first resolution is an observation; a '${purpose}' commit cannot resolve a task`);
    }
    return draft.archived
      ? fail(`an observation cannot archive a task; that takes a catalog operation`)
      : succeed(true);
  }
  if (purpose === 'observation') {
    // A source owns execution state, not the catalog: identity, placement, responsibility and
    // scopes change only by catalog operation, with its evidence — and so does archiving.
    if (!canonicallyEqual(_catalog(current.task.envelope), _catalog(draft.task.envelope))) {
      return fail(`an observation cannot change catalog metadata; that takes a catalog operation`);
    }
    if (draft.archived !== current.archived) {
      return fail(`an observation cannot archive a task; that takes a catalog operation`);
    }
  }
  if (purpose !== 'observation' && !canonicallyEqual(current.sourceRevision, draft.sourceRevision)) {
    return fail(`only an observation may change the committed source revision`);
  }
  if (draft.archived && !current.archived && hasPendingCommand(draft)) {
    return fail(
      `a task holding an unsettled command, or one awaiting its feed revision, cannot be archived; ` +
        `its outcome is still owed`
    );
  }
  if (purpose === 'maintenance' && !canonicallyEqual(_semantic(current), _semantic(draft))) {
    return fail(`maintenance cannot change semantic state; it changes receipts, pruning and telemetry only`);
  }
  return succeed(true);
}

/** Identity and catalog metadata: what only registration or a catalog operation sets. */
function _catalog(from: {
  readonly id: TaskId;
  readonly kind: unknown;
  readonly detailVersion: number;
  readonly title: string;
  readonly parentId?: TaskId;
  readonly responsibility?: unknown;
  readonly scopes: unknown;
  readonly binding?: unknown;
}): unknown {
  return {
    id: from.id,
    kind: from.kind,
    detailVersion: from.detailVersion,
    title: from.title,
    parentId: from.parentId,
    responsibility: from.responsibility,
    scopes: from.scopes,
    binding: from.binding
  };
}

/**
 * A resolved record's semantic content: everything but observation timestamps and the
 * revision, which the caller's own revision rule governs.
 */
function _semantic(record: IResolvedTaskRecordDraft): unknown {
  const envelope = record.task.envelope;
  const health = envelope.observation;
  return {
    envelope: {
      ...envelope,
      revision: undefined,
      observation:
        health.state === 'current' ? { state: health.state } : { state: health.state, reason: health.reason }
    },
    details: record.task.details,
    archived: record.archived
  };
}

/**
 * Checks that every existing operation's evidence is retained, with its request unchanged,
 * and that exactly the expected operations are new.
 */
export function checkOperations(
  current: ReadonlyArray<IStoredTaskOperation>,
  next: ReadonlyArray<IStoredTaskOperation>,
  added: OperationId | undefined
): Result<true> {
  const byId: Map<string, IStoredTaskOperation> = new Map(next.map((op) => [op.operationId, op]));
  for (const op of current) {
    const kept: IStoredTaskOperation | undefined = byId.get(op.operationId);
    if (kept === undefined) {
      return fail(`operation '${op.operationId}' is dedup evidence and cannot be dropped`);
    }
    if (!sameOperation(op, kept)) {
      return fail(`operation '${op.operationId}': a stored request cannot change`);
    }
    byId.delete(op.operationId);
  }
  // The creation operation stays first: registration replay and open both read it there.
  if (next[0].operationId !== current[0].operationId) {
    return fail(`the creation operation '${current[0].operationId}' must remain the first operation`);
  }
  const fresh: ReadonlyArray<string> = Array.from(byId.keys());
  if (added === undefined) {
    return fresh.length === 0 ? succeed(true) : fail(`this replacement may not add operations`);
  }
  if (fresh.length !== 1 || fresh[0] !== added) {
    return fail(`an operation replacement adds exactly its own operation '${added}'`);
  }
  return succeed(true);
}

/**
 * Checks update retention: a retained update is immutable, a new one is for the new revision,
 * and a required one is removed only by maintenance (pruning).
 */
export function checkUpdates(
  current: ReadonlyArray<ITaskUpdate>,
  next: ReadonlyArray<ITaskUpdate>,
  nextRevision: TaskRevision,
  maintenance: boolean
): Result<true> {
  const byId: Map<string, ITaskUpdate> = new Map(next.map((update) => [update.id, update]));
  for (const update of current) {
    const kept: ITaskUpdate | undefined = byId.get(update.id);
    if (kept === undefined) {
      // Whether it may leave is the retention rule's to decide, from durable evidence (T8).
      continue;
    }
    if (!canonicallyEqual(update, kept)) {
      return fail(`update '${update.id}' is immutable once committed`);
    }
    byId.delete(update.id);
  }
  for (const update of byId.values()) {
    if (maintenance) {
      return fail(`maintenance cannot add update '${update.id}'`);
    }
    if (update.revision !== nextRevision) {
      return fail(`new update '${update.id}' must be for the committed revision ${nextRevision}`);
    }
  }
  return succeed(true);
}

/**
 * Checks a source binding against the profile's canonical source-identity bound — the bound every
 * stored binding meets, so a lookup key is never larger than a stored one could be.
 */
export function checkSourceIdentity(binding: unknown, profile: ITaskCapacityProfile): Result<true> {
  return encodeRecord(binding).onSuccess((e) =>
    e.bytes > profile.encoded.maxSourceIdentityBytes
      ? fail<true>(
          `the source binding is ${e.bytes} bytes, over the bound of ${profile.encoded.maxSourceIdentityBytes}`
        )
      : succeed<true>(true)
  );
}

/**
 * Checks the per-value encoded bounds and per-owner counts of a draft against the stored
 * profile.
 *
 * @remarks
 * These are schema maxima the closeout arithmetic reserved against. A value over one of them
 * would be growth no reservation covered, so it is refused as invalid rather than admitted.
 */
export function checkBounds(draft: ITaskRecordDraft, profile: ITaskCapacityProfile): Result<true> {
  const encoded = profile.encoded;
  const within = (value: unknown, max: number, what: string): Result<true> =>
    encodeRecord(value).onSuccess((e) =>
      e.bytes > max
        ? fail<true>(`${what} is ${e.bytes} bytes, over the bound of ${max}`)
        : succeed<true>(true)
    );
  const checks: Array<() => Result<true>> = [];
  if (draft.recordType === 'resolved') {
    const resolved: IResolvedTaskRecordDraft = draft;
    checks.push(() => within(resolved.task.envelope, encoded.maxEnvelopeBytes, 'the envelope'));
    checks.push(() => within(resolved.task.details, encoded.maxDetailBytes, 'the details'));
    if (resolved.task.envelope.binding !== undefined) {
      const binding = resolved.task.envelope.binding;
      checks.push(() => within(binding, encoded.maxSourceIdentityBytes, 'the source binding'));
    }
    for (const update of resolved.updates) {
      checks.push(() => within(update, encoded.maxUpdateBytes, `update '${update.id}'`));
    }
  } else {
    checks.push(() => within(draft.reference, encoded.maxEnvelopeBytes, 'the unresolved reference'));
    checks.push(() => within(draft.reference.binding, encoded.maxSourceIdentityBytes, 'the source binding'));
  }
  for (const op of draft.operations) {
    checks.push(() => within(op, encoded.maxStoredOperationBytes, `operation '${op.operationId}'`));
    checks.push(() =>
      within(op.request, encoded.maxOperationRequestBytes, `operation '${op.operationId}' request`)
    );
  }
  for (const check of checks) {
    const result: Result<true> = check();
    if (result.isFailure()) {
      return result;
    }
  }
  return succeed(true);
}

/**
 * Checks a stored record's audiences against the per-update limit. A commit never writes one over it
 * — its delivery plan refuses the growth with `backpressure` first — so at open one over it is a
 * record this release did not write.
 */
export function checkAudiences(record: ITaskCommitRecord, profile: ITaskCapacityProfile): Result<true> {
  const max: number = profile.perOwner.maxAudiencePerUpdate;
  const over: ITaskUpdate | undefined = (record.recordType === 'resolved' ? record.updates : []).find(
    (update) => update.audience.length > max
  );
  return over === undefined
    ? succeed(true)
    : fail(`update '${over.id}' names ${over.audience.length} audience subscriptions, over ${max}`);
}

/**
 * Every stored command of a record, by operation id: `true` once its dispatch is settled.
 */
export function commandSettlement(
  record: ITaskCommitRecord | ITaskRecordDraft
): ReadonlyMap<OperationId, boolean> {
  const commands: Map<OperationId, boolean> = new Map<OperationId, boolean>();
  for (const op of record.operations) {
    if (op.type === 'command') {
      commands.set(op.operationId, op.dispatch === 'settled');
    }
  }
  return commands;
}

/** Whether a record or draft holds a command whose dispatch is not settled. */
export function hasUnsettledCommand(record: ITaskCommitRecord | ITaskRecordDraft): boolean {
  return record.operations.some((op) => op.type === 'command' && op.dispatch !== 'settled');
}

/**
 * Whether a record or draft holds a command whose outcome is not final: unsettled, or settled
 * `accepted` while it awaits the feed revision that confirms it. Such a task cannot be archived —
 * a tombstone takes no further observation, so the command could never finish.
 */
export function hasPendingCommand(record: ITaskCommitRecord | ITaskRecordDraft): boolean {
  return record.operations.some(
    (op) => op.type === 'command' && (op.dispatch !== 'settled' || op.awaiting !== undefined)
  );
}

/** The source id of a record's binding, if it has one. */
export function sourceIdOf(record: ITaskCommitRecord | ITaskRecordDraft): string | undefined {
  return record.recordType === 'resolved'
    ? record.task.envelope.binding?.sourceId
    : record.reference.binding.sourceId;
}

const dispatchOrder: Readonly<Record<IStoredCommandOperation['dispatch'], number>> = {
  'not-sent': 0,
  'possibly-sent': 1,
  settled: 2
};

/**
 * Checks how a retained command may evolve: dispatch only moves forward (`not-sent` →
 * `possibly-sent` → `settled`, never back — a marker on disk is the one thing that makes an
 * uncertain send visible), and once settled the receipt is final, except that an `accepted` receipt
 * awaiting a feed revision is resolved when the feed reaches it: `applied`, or left `accepted`.
 */
export function checkCommandEvolution(
  current: ReadonlyArray<IStoredTaskOperation>,
  next: ReadonlyArray<IStoredTaskOperation>
): Result<true> {
  const byId: Map<string, IStoredTaskOperation> = new Map(next.map((op) => [op.operationId, op]));
  for (const before of current) {
    const after: IStoredTaskOperation | undefined = byId.get(before.operationId);
    if (before.type !== 'command' || after === undefined || after.type !== 'command') {
      continue;
    }
    if (dispatchOrder[after.dispatch] < dispatchOrder[before.dispatch]) {
      return fail(
        `command '${before.operationId}': dispatch cannot move back from '${before.dispatch}' to '${after.dispatch}'`
      );
    }
    if (before.dispatch === 'settled' && !canonicallyEqual(before, after)) {
      // The one change a settled command admits: its awaited feed revision resolves it — `applied`
      // when the feed confirms the answer there, still `accepted` when it contradicts it.
      const resolved: boolean =
        before.awaiting !== undefined &&
        after.awaiting === undefined &&
        before.receipt.result.state === 'accepted' &&
        (after.receipt.result.state === 'applied' ||
          canonicallyEqual(before.receipt.result, after.receipt.result)) &&
        canonicallyEqual({ ...before.receipt, result: undefined }, { ...after.receipt, result: undefined });
      if (!resolved) {
        return fail(`command '${before.operationId}': a settled receipt is final`);
      }
    }
  }
  return succeed(true);
}
