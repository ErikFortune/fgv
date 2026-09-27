/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import {
  IStoredTaskOperation,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRecordDraft,
  OperationId,
  TaskId,
  TaskResult,
  defaultMaxStopTargets,
  isTerminalTaskStatus
} from '../types';
import { classify, ok, propagate, taskFailure } from './failures';
import { operationCountFits } from './graphRules';
import { CapacityLedger, DimensionAmounts, ILedgerEntry, zeroAmounts } from './ledger';
import { ITaskProjection, taskKey } from './projection';
import { IStopFacts, StopBook, stopContentOf } from './stopBook';
import { stopAttemptBundle, stopReserve, withStopReserve } from './stopLedger';
import { checkStopAdmission, checkStopEvolution } from './stopRules';
import { TaskIndex } from './taskIndex';

/**
 * What a task replacement does to the stop reservations: the committed task's own reservation and
 * held operation slots after it, the entries of every other task whose reservation moves with it, and
 * the delivery units that move.
 * @internal
 */
export interface IStopCommitPlan {
  /** Operation slots held beyond closeout after the commit: each unlanded attempt, each release. */
  readonly held: number;
  /** The committed task's stop reservation before and after. */
  readonly before: DimensionAmounts;
  readonly after: DimensionAmounts;
  /** Other tasks' ledger entries, with their stop reservation replaced. */
  readonly entries: ReadonlyMap<string, ILedgerEntry>;
  /** Tasks whose unlanded attempts change, before and after. */
  readonly units: ReadonlyMap<TaskId, { readonly before: number; readonly after: number }>;
}

/** Operation slots a task holds for its closeout: the terminal transition and the archive. */
function _closeoutHeld(projection: ITaskProjection): number {
  if (projection.archived) {
    return 0;
  }
  return projection.status !== undefined && isTerminalTaskStatus(projection.status) ? 1 : 2;
}

/** The profile's stop attempt bundle, classified. */
function _bundle(profile: ITaskCapacityProfile): TaskResult<DimensionAmounts> {
  return classify(stopAttemptBundle(profile), 'storage-unavailable', 'after-host-action');
}

/**
 * Checks a replacement against the stop rules and plans what it does to the stop reservations.
 *
 * @remarks
 * Every target of a newly accepted attempt must still have an operation slot for it — its current
 * operations, its closeout, every attempt already bound for it, and this one — so **no attempt is
 * accepted that its target could not record**, which is what lets a stop reserve for every target
 * before dispatching to any.
 * @internal
 */
export function planStopCommit(params: {
  readonly index: TaskIndex;
  readonly ledger: CapacityLedger;
  readonly tasks: ReadonlyMap<TaskId, ITaskProjection>;
  readonly profile: ITaskCapacityProfile;
  readonly taskId: TaskId;
  readonly current: ITaskCommitRecord;
  readonly draft: ITaskRecordDraft;
  readonly purpose: 'operation' | 'observation' | 'maintenance';
  readonly operationId: OperationId | undefined;
  readonly external: boolean;
}): TaskResult<IStopCommitPlan> {
  const { index, ledger, tasks, profile, taskId, current, draft, purpose, operationId } = params;
  const book: StopBook = index.stops;
  const added: IStoredTaskOperation | undefined =
    operationId !== undefined ? draft.operations.find((op) => op.operationId === operationId) : undefined;
  const checked: Result<true> = checkStopAdmission({
    book,
    taskId,
    current,
    draft,
    purpose,
    external: params.external
  }).onSuccess(() =>
    checkStopEvolution({
      book,
      current,
      draft,
      purpose,
      added,
      subtree: () => index.subtree(taskId, defaultMaxStopTargets)
    })
  );
  if (checked.isFailure()) {
    return taskFailure(
      `commit ${taskId}: ${checked.message}`,
      'conflict',
      'after-host-action',
      operationId !== undefined ? { operationId } : undefined
    );
  }

  const bundle: TaskResult<DimensionAmounts> = _bundle(profile);
  if (bundle.isFailure()) {
    return propagate(bundle);
  }
  const reserve = (facts: IStopFacts): DimensionAmounts => stopReserve(facts, bundle.value, profile);
  const preview: ReadonlyMap<TaskId, IStopFacts> = book.preview(taskId, stopContentOf(draft));
  const own: IStopFacts = preview.get(taskId)!;
  const entries: Map<string, ILedgerEntry> = new Map();
  const units: Map<TaskId, { before: number; after: number }> = new Map();
  for (const [id, facts] of preview) {
    const was: IStopFacts = book.facts(id);
    if (facts.unlandedOn !== was.unlandedOn) {
      units.set(id, { before: was.unlandedOn, after: facts.unlandedOn });
    }
    if (id === taskId) {
      continue;
    }
    // Every task a stop names is one the repository holds live: storage refuses an intent whose
    // targets are not the current subtree, and a latched task is never archived.
    const entry: ILedgerEntry = ledger.entry(taskKey(id))!;
    const projection: ITaskProjection = tasks.get(id)!;
    if (facts.unlandedOn + facts.latching > was.unlandedOn + was.latching) {
      const fits: TaskResult<true> = operationCountFits(
        profile,
        id,
        // A target is live and not archived: a latched task is never archived.
        projection.operations!,
        _closeoutHeld(projection) + facts.unlandedOn + facts.latching
      );
      if (fits.isFailure()) {
        return propagate(fits);
      }
    }
    entries.set(taskKey(id), withStopReserve(entry, reserve(was), reserve(facts)));
  }
  return ok({
    held: own.unlandedOn + own.latching,
    before: reserve(book.facts(taskId)),
    after: reserve(own),
    entries,
    units
  });
}

/**
 * A task's ledger entry with its current stop reservation added: for a replacement the stop facts of
 * which do not move.
 * @internal
 */
export function withCurrentStopReserve(
  index: TaskIndex,
  profile: ITaskCapacityProfile,
  taskId: TaskId,
  entry: ILedgerEntry
): TaskResult<ILedgerEntry> {
  return _bundle(profile).onSuccess((bundle) =>
    ok(withStopReserve(entry, zeroAmounts(), stopReserve(index.stops.facts(taskId), bundle, profile)))
  );
}
