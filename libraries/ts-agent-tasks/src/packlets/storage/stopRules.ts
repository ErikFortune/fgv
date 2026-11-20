/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IStopIntent,
  IStopLatch,
  IStopTarget,
  IStoredTaskOperation,
  ITaskCommitRecord,
  ITaskRecordDraft,
  OperationId,
  StopMode,
  TaskId,
  TaskLifecycleStatus,
  isLatchingStopState,
  latchRefusesMove
} from '../types';
import { canonicallyEqual } from './layout';
import { StopBook } from './stopBook';

// The admission freeze (design § 10 step 2) and the rules an intent evolves by. Enforced by storage,
// under the writer, on every operation commit and registration — so no broker path, and no path a
// later slice adds, can reach around them — and rebuilt with the index before a reopened repository
// accepts a write.

/**
 * The prefix every freeze refusal carries, so a caller can tell it from other conflicts.
 * @internal
 */
export const stopActivePrefix: string = 'stop-active';

function _refuse(what: string): Result<true> {
  return fail(`${stopActivePrefix}: ${what}`);
}

function _statusOf(record: ITaskCommitRecord | ITaskRecordDraft): TaskLifecycleStatus | undefined {
  return record.recordType === 'resolved' ? record.task.envelope.lifecycle.status : undefined;
}

function _parentOf(record: ITaskCommitRecord | ITaskRecordDraft): TaskId | undefined {
  return record.recordType === 'resolved' ? record.task.envelope.parentId : record.reference.parentId;
}

/**
 * Checks a registration against the stop rules: it carries no stop, and no new task is registered
 * under a latched parent.
 * @internal
 */
export function checkStopRegistration(book: StopBook, draft: ITaskRecordDraft): Result<true> {
  // A stop is accepted only by its own operation on a live root, reserved as it is accepted: a first
  // record carries none.
  if (draft.recordType === 'resolved' && (draft.stops ?? []).length > 0) {
    return fail(`a registration carries no stop; a stop is accepted only by its own operation`);
  }
  const parentId: TaskId | undefined = _parentOf(draft);
  return parentId !== undefined && book.isLatched(parentId)
    ? _refuse(`task ${parentId} is under a stop latch and takes no new child`)
    : succeed(true);
}

/**
 * Checks one commit against the freeze and the command-key rules.
 *
 * @remarks
 * Source observations are exempt from the freeze — a source is authoritative, and a stopped task it
 * reports running degrades the stop instead of being refused — but not from the key rules.
 * @internal
 */
export function checkStopAdmission(params: {
  readonly book: StopBook;
  readonly taskId: TaskId;
  readonly current: ITaskCommitRecord;
  readonly draft: ITaskRecordDraft;
  readonly purpose: 'operation' | 'observation' | 'maintenance';
  /** Whether the task is externally executed. */
  readonly external: boolean;
}): Result<true> {
  const { book, taskId, current, draft, purpose, external } = params;
  const latches: ReadonlyArray<IStopLatch> = book.latches(taskId);
  const before: Map<OperationId, IStoredTaskOperation> = new Map(
    current.operations.map((op) => [op.operationId, op])
  );

  for (const op of draft.operations) {
    const prior: IStoredTaskOperation | undefined = before.get(op.operationId);
    if (op.type !== 'command') {
      if (prior === undefined && op.operation === 'complete-list' && latches.length > 0) {
        return _refuse(`list ${taskId} is under a stop latch and cannot complete`);
      }
      continue;
    }
    const attempt = book.attempt(op.operationId);
    if (prior === undefined) {
      if (op.stop !== undefined) {
        // A marked command is a live, funded attempt of this task, and of exactly the intent it
        // names: its command lands out of that attempt's reservation. Nothing is dispatched for an
        // intent that was released, a superseded attempt, or a target already confirmed.
        if (
          attempt === undefined ||
          !attempt.funded ||
          attempt.taskId !== taskId ||
          attempt.rootId !== op.stop.rootId ||
          attempt.intentId !== op.stop.intentId
        ) {
          return fail(`command '${op.operationId}' is not a live attempt of stop ${op.stop.intentId}`);
        }
      } else if (attempt !== undefined) {
        return fail(`command key '${op.operationId}' belongs to a stop attempt and cannot be reused`);
      } else if (purpose !== 'observation' && external && latches.length > 0 && op.dispatch !== 'settled') {
        return _refuse(`task ${taskId} is under a stop latch; no new command is dispatched to its source`);
      }
    } else if (
      prior.type === 'command' &&
      op.stop === undefined &&
      prior.dispatch === 'not-sent' &&
      op.dispatch === 'possibly-sent' &&
      latches.length > 0
    ) {
      return _refuse(`task ${taskId} is under a stop latch; a command recorded before it is not sent`);
    }
  }

  // A source is authoritative over the work it executes: its observation of a stopped task running
  // degrades the stop rather than being refused. That exemption is for external tasks only — a native
  // task has no source, and an observation-purpose commit of one is still held to the freeze.
  if (purpose === 'observation' && external) {
    return succeed(true);
  }
  const parentBefore: TaskId | undefined = _parentOf(current);
  const parentAfter: TaskId | undefined = _parentOf(draft);
  if (parentBefore !== parentAfter) {
    if (latches.length > 0) {
      return _refuse(`task ${taskId} is under a stop latch and cannot be moved`);
    }
    if (parentAfter !== undefined && book.isLatched(parentAfter)) {
      return _refuse(`task ${parentAfter} is under a stop latch and takes no new child`);
    }
  }
  const from: TaskLifecycleStatus | undefined = _statusOf(current);
  const to: TaskLifecycleStatus | undefined = _statusOf(draft);
  if (from !== undefined && to !== undefined && latchRefusesMove(latches, from, to)) {
    return _refuse(`task ${taskId} is under a stop latch and cannot move from '${from}' to '${to}'`);
  }
  return succeed(true);
}

/**
 * What an intent's identity is: everything but its state and its targets' progress.
 */
function _identity(intent: IStopIntent): unknown {
  return {
    id: intent.id,
    rootId: intent.rootId,
    mode: intent.mode,
    requestedBy: intent.requestedBy,
    topologyGeneration: intent.topologyGeneration,
    targets: intent.targets.map((target) => target.taskId)
  };
}

/**
 * Checks how a commit changes a root's intents.
 *
 * @remarks
 * - An intent is never dropped or re-identified, and a released or settled one never changes.
 * - A new intent appears only in the operation that requested it: accepted `pending`, every target
 *   `unexamined` at attempt 1, `requestedBy` the operation's principal, and its targets **exactly**
 *   the authoritative subtree now — root first, breadth-first with id tie breaks. Anything smaller is
 *   a skipped child, and is refused here whatever the broker computed.
 * - `released` only by the operation releasing it; `settled` only by archiving a satisfied cancel
 *   whose every target is confirmed.
 * - A target's attempt moves forward by at most one, always with a fresh key that no live attempt
 *   holds; a target is recorded `confirmed` only while it is in the mode's stopped set, and an external
 *   one that is not terminal only with its source's stable-stop evidence.
 * - A source observation changes no intent.
 * @internal
 */
export function checkStopEvolution(params: {
  readonly book: StopBook;
  readonly current: ITaskCommitRecord;
  readonly draft: ITaskRecordDraft;
  readonly purpose: 'operation' | 'observation' | 'maintenance';
  /** The operation this commit adds, if it is an operation commit. */
  readonly added?: IStoredTaskOperation;
  /** The authoritative subtree of this task, root first, breadth-first with id tie breaks. */
  readonly subtree: () => Result<ReadonlyArray<TaskId>>;
  /**
   * Whether a target may be recorded confirmed: its task, as the repository holds it now, is in the
   * mode's stopped set — and an external one is held there by its source's declared stable stop.
   */
  readonly confirmable: (mode: StopMode, target: IStopTarget) => boolean;
}): Result<true> {
  const { book, current, draft, purpose, added } = params;
  const before: ReadonlyArray<IStopIntent> = current.recordType === 'resolved' ? current.stops ?? [] : [];
  const after: ReadonlyArray<IStopIntent> = draft.recordType === 'resolved' ? draft.stops ?? [] : [];
  if (canonicallyEqual(before, after)) {
    return _afterArchive(current, draft, book);
  }
  if (purpose === 'observation') {
    return fail(`an observation cannot change a stop`);
  }
  if (after.length < before.length) {
    return fail(`a stop is evidence and cannot be dropped`);
  }
  for (let i = 0; i < before.length; i++) {
    const checked: Result<true> = _evolved(before[i], after[i], draft, added, book, params.confirmable);
    if (checked.isFailure()) {
      return checked;
    }
  }
  const fresh: ReadonlyArray<IStopIntent> = after.slice(before.length);
  if (fresh.length > 1) {
    return fail(`one operation accepts at most one stop`);
  }
  if (fresh.length === 1) {
    const accepted: Result<true> = _accepted(fresh[0], added, purpose, params.subtree, book);
    if (accepted.isFailure()) {
      return accepted;
    }
  }
  return _afterArchive(current, draft, book);
}

/** A task being archived must leave no latch on itself standing. */
function _afterArchive(current: ITaskCommitRecord, draft: ITaskRecordDraft, book: StopBook): Result<true> {
  if (
    draft.recordType !== 'resolved' ||
    !draft.archived ||
    (current.recordType === 'resolved' && current.archived)
  ) {
    return succeed(true);
  }
  const own: ReadonlySet<OperationId> = new Set(
    (draft.stops ?? []).filter((intent) => isLatchingStopState(intent.state)).map((intent) => intent.id)
  );
  const taskId: TaskId = draft.task.envelope.id;
  const standing: IStopLatch | undefined = book
    .latches(taskId)
    .find((latch) => latch.rootId !== taskId || own.has(latch.intentId));
  return standing === undefined
    ? succeed(true)
    : _refuse(
        `task ${taskId} is under a stop latch and cannot be archived until the stop settles or is released`
      );
}

function _evolved(
  was: IStopIntent,
  now: IStopIntent,
  draft: ITaskRecordDraft,
  added: IStoredTaskOperation | undefined,
  book: StopBook,
  confirmable: (mode: StopMode, target: IStopTarget) => boolean
): Result<true> {
  if (!canonicallyEqual(_identity(was), _identity(now))) {
    return fail(`stop ${was.id}: its identity and target set are immutable`);
  }
  if (!isLatchingStopState(was.state)) {
    return canonicallyEqual(was, now) ? succeed(true) : fail(`stop ${was.id}: a ${was.state} stop is final`);
  }
  if (now.state === 'released') {
    const releasing: boolean =
      added !== undefined &&
      added.type === 'catalog' &&
      added.operation === 'release-stop' &&
      _names(added.request, was.id);
    if (!releasing) {
      return fail(`stop ${was.id}: released only by the operation that releases it`);
    }
    // A released intent is kept as its report: releasing changes its state and nothing it found.
    if (!canonicallyEqual({ ...was, state: now.state }, now)) {
      return fail(`stop ${was.id}: a release keeps the report as it stood`);
    }
    // A cancel's stopped set is the terminal set, so its root (the first target) is confirmable exactly
    // when it is terminal now — and a cancel of a terminal root holds that tree terminal: releasing it
    // would reopen the tree.
    if (was.mode === 'cancel' && confirmable(was.mode, was.targets[0])) {
      return fail(`stop ${was.id}: a cancel of a terminal root is not released; that would reopen the tree`);
    }
  }
  if (now.state === 'settled') {
    const settles: boolean =
      was.mode === 'cancel' &&
      was.state === 'satisfied' &&
      draft.recordType === 'resolved' &&
      draft.archived &&
      // A settled intent is kept as its report: settling changes its state and nothing it found.
      canonicallyEqual({ ...was, state: now.state }, now) &&
      // Judged on the targets as they stand at the archive, not on the summary: a target confirmed
      // earlier may have been observed running since.
      was.targets.every((target) => target.state === 'confirmed' && confirmable(was.mode, target));
    if (!settles) {
      return fail(`stop ${was.id}: only an archive of its root settles a satisfied cancel`);
    }
  }
  for (let i = 0; i < was.targets.length; i++) {
    const a = was.targets[i];
    const b = now.targets[i];
    if (b.attempt === a.attempt ? b.operationId !== a.operationId : b.attempt !== a.attempt + 1) {
      return fail(`stop ${was.id}: target ${a.taskId}'s attempt moves forward by one, with a new key`);
    }
    if (
      b.attempt !== a.attempt &&
      (b.operationId === a.operationId || book.attempt(b.operationId) !== undefined)
    ) {
      return fail(`stop ${was.id}: target ${a.taskId}'s new attempt needs a key no attempt holds`);
    }
    // A confirmed attempt leaves confirmation under the same key only for a finding — a violation, a
    // withdrawn contract, a source no longer attached — never back to a state that records none: that
    // would roll the report back with nothing to show for it.
    if (
      a.state === 'confirmed' &&
      b.attempt === a.attempt &&
      (b.state === 'pending' || b.state === 'unexamined')
    ) {
      return fail(`stop ${was.id}: target ${a.taskId} was confirmed, and is not returned to ${b.state}`);
    }
    // A confirmation — and its evidence — is recorded only while the target is actually stopped: it
    // releases the attempt's reservation, so it is not the summary's to assert.
    if (b.state === 'confirmed' && !canonicallyEqual(a, b) && !confirmable(was.mode, b)) {
      return fail(`stop ${was.id}: target ${b.taskId} is recorded confirmed, and nothing holds it stopped`);
    }
  }
  return succeed(true);
}

/** The part of a stored release request that names its intent. */
const namedIntent: Converter<{ readonly intentId: string }> = Converters.object<{
  readonly intentId: string;
}>({
  intentId: Converters.string
});

/** Whether a stored request names this intent. */
function _names(request: unknown, intentId: OperationId): boolean {
  return namedIntent
    .convert(request)
    .onSuccess((named) => succeed(named.intentId === intentId))
    .orDefault(false);
}

function _accepted(
  intent: IStopIntent,
  added: IStoredTaskOperation | undefined,
  purpose: 'operation' | 'observation' | 'maintenance',
  subtree: () => Result<ReadonlyArray<TaskId>>,
  book: StopBook
): Result<true> {
  if (
    purpose !== 'operation' ||
    added === undefined ||
    added.type !== 'catalog' ||
    added.operation !== 'stop' ||
    added.operationId !== intent.id
  ) {
    return fail(`stop ${intent.id}: accepted only by the stop operation that requests it`);
  }
  if (intent.requestedBy !== added.principalKey) {
    return fail(`stop ${intent.id}: requestedBy must be the principal the stop was accepted for`);
  }
  if (intent.state !== 'pending') {
    return fail(`stop ${intent.id}: an accepted stop is pending; acceptance is not completion`);
  }
  for (const target of intent.targets) {
    if (
      target.state !== 'unexamined' ||
      target.attempt !== 1 ||
      target.confirmedRevision !== undefined ||
      target.stableSourceEvidence !== undefined ||
      target.violation !== undefined
    ) {
      return fail(`stop ${intent.id}: target ${target.taskId} is accepted unexamined at attempt 1`);
    }
    if (book.attempt(target.operationId) !== undefined) {
      return fail(`stop ${intent.id}: command key '${target.operationId}' is already a live attempt`);
    }
  }
  return subtree().onSuccess((ids) => {
    const captured: ReadonlyArray<TaskId> = intent.targets.map((target) => target.taskId);
    return canonicallyEqual(ids, captured)
      ? succeed<true>(true)
      : fail<true>(
          `stop ${intent.id}: its targets are not the authoritative subtree of ${intent.rootId} ` +
            `(${captured.length} captured, ${ids.length} in the tree); no child is skipped`
        );
  });
}
