/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureAsyncResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  ISourceBinding,
  ISourceObservation,
  ISourceObservationReport,
  ISourceReconcilePage,
  ISourceReconcileReport,
  ISourceReconcileRequest,
  ISourceRevision,
  ITaskCommitRecord,
  ITaskRecoveryOutcome,
  ITaskSource,
  ITaskSourceRecord,
  RecoveryResult,
  SourceRead,
  SourceReconcileStop,
  SourceRevisionOrder,
  TaskId,
  TaskResult,
  isTerminalTaskStatus
} from '../types';
import { BrokerCore, canonicalKey } from './core';
import { notFound, ok, propagate, taskFailure } from './failures';
import { ObservationMode, applyHealth, applyProjection, compareRevisions } from './observations';

/** Pages a pass reads before stopping, unless the request says otherwise. */
const defaultMaxPages: number = 16;

/**
 * Calls host source code. A throw, like a failure the source reports, is an unavailable source —
 * never an escaped exception.
 * @internal
 */
export async function callSource<T>(
  what: string,
  call: () => Promise<TaskResult<T>>
): Promise<TaskResult<T>> {
  const outcome: Result<TaskResult<T>> = await captureAsyncResult(call);
  if (outcome.isFailure()) {
    return taskFailure(`${what}: the source threw: ${outcome.message}`, 'source-unavailable', 'safe');
  }
  return outcome.value.isSuccess()
    ? outcome.value
    : taskFailure(`${what}: ${outcome.value.message}`, 'source-unavailable', 'safe');
}

/**
 * The binding of a task and the attached source that executes it.
 * @internal
 */
export function sourceOf(
  core: BrokerCore,
  record: ITaskCommitRecord
): TaskResult<{ readonly binding: ISourceBinding; readonly source: ITaskSource }> {
  const binding: ISourceBinding | undefined =
    record.recordType === 'resolved' ? record.task.envelope.binding : record.reference.binding;
  if (binding === undefined) {
    return taskFailure(
      `task has no source binding; the broker owns its lifecycle`,
      'unsupported',
      'after-host-action'
    );
  }
  const source: ITaskSource | undefined = core.sources.get(binding.sourceId);
  return source === undefined
    ? taskFailure(
        `source '${binding.sourceId}' is not attached to this broker; the task is left exactly as it is`,
        'source-unavailable',
        'after-host-action'
      )
    : ok({ binding, source });
}

/** Applies one read of a binding: a projection, or a change of observation health. */
async function _applyRead(
  core: BrokerCore,
  source: ITaskSource,
  binding: ISourceBinding,
  read: SourceRead,
  mode: ObservationMode
): Promise<TaskResult<ISourceObservationReport>> {
  if (read.state === 'observed') {
    return applyProjection(core, source, binding, read.value, mode);
  }
  return read.state === 'unavailable'
    ? applyHealth(core, binding, 'unavailable', read.reason, 'source-unavailable')
    : applyHealth(
        core,
        binding,
        'stale',
        `the source reports the binding missing: ${read.reason}`,
        'missing'
      );
}

/**
 * Reads one binding and applies what it says (host operation).
 *
 * @remarks
 * For an `observed-state` source the read is committed when newer, as a freshness refresh when it is
 * the same revision observed later, or as a health change when the source is unreachable. For a
 * `source-replay` source a read is only a hint: nothing is read or committed, the outcome is
 * `deferred`, and the host runs {@link reconcileSource} — the feed alone moves such a task.
 * @internal
 */
export async function observeBinding(
  core: BrokerCore,
  binding: ISourceBinding
): Promise<TaskResult<ISourceObservationReport>> {
  const converted = core.converters.values.sourceBinding.convert(binding);
  if (converted.isFailure()) {
    return taskFailure(`observe: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const bound: ISourceBinding = converted.value;
  const source: ITaskSource | undefined = core.sources.get(bound.sourceId);
  if (source === undefined) {
    return taskFailure(
      `observe: source '${bound.sourceId}' is not attached to this broker; the task is left exactly as it is`,
      'source-unavailable',
      'after-host-action'
    );
  }
  const owner = await core.repository.lookupSource(bound);
  if (owner.isFailure()) {
    return propagate(owner);
  }
  if (owner.value === undefined) {
    return ok({ binding: bound, outcome: 'unknown-binding' });
  }
  if (source.history === 'source-replay') {
    return ok({
      binding: bound,
      taskId: owner.value,
      outcome: 'deferred',
      message: `source '${source.id}' is source-replay: only its feed commits projections; reconcile it`
    });
  }
  const read = await callSource(`observe ${owner.value}`, () => source.observe(bound));
  if (read.isFailure()) {
    return applyHealth(core, bound, 'unavailable', read.message, 'source-unavailable');
  }
  const validated = core.converters.sources.read.convert(read.value);
  if (validated.isFailure()) {
    return ok({
      binding: bound,
      taskId: owner.value,
      outcome: 'contract-violation',
      message: `the source's read does not convert: ${validated.message}`
    });
  }
  return _applyRead(core, source, bound, validated.value, 'direct');
}

/**
 * Reads the binding of one task and applies it. See {@link observeBinding}.
 * @internal
 */
export async function observeTask(
  core: BrokerCore,
  taskId: TaskId
): Promise<TaskResult<ISourceObservationReport>> {
  const read = await core.repository.readCommit(taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  if (read.value === undefined) {
    return notFound(taskId);
  }
  const bound = sourceOf(core, read.value);
  return bound.isFailure() ? propagate(bound) : observeBinding(core, bound.value.binding);
}

/** What one page contributed to a pass. */
interface IPageOutcome {
  readonly observations: ReadonlyArray<ISourceObservationReport>;
  /**
   * Absent when everything in the page committed (or was a safe duplicate or an unknown binding);
   * otherwise why the cursor may not move past it.
   */
  readonly stop?: SourceReconcileStop;
  readonly issue?: string;
}

/**
 * For a `source-replay` feed, each binding's revisions must not go backwards within a pass — across
 * its pages as well as within one — checked before anything in a page is applied, so a broken page
 * commits nothing. A repeated revision is an at-least-once duplicate, not a break: applying it is
 * `unchanged`, or a contract violation if it carries a different state. Returns the revisions seen,
 * for the next page, or why the page breaks the order.
 */
function _checkOrder(
  source: ITaskSource,
  observations: ReadonlyArray<ISourceObservation>,
  seen: ReadonlyMap<string, ISourceRevision>
): Result<ReadonlyMap<string, ISourceRevision>> {
  // Keyed canonically, as the repository keys bindings: property order must not split one binding.
  return mapResults(
    observations.map((entry) =>
      canonicalKey([entry.binding.sourceId, entry.binding.referenceVersion, entry.binding.reference])
    )
  ).onSuccess((keys) => _followsOrder(source, observations, keys, seen));
}

function _followsOrder(
  source: ITaskSource,
  observations: ReadonlyArray<ISourceObservation>,
  keys: ReadonlyArray<string>,
  seen: ReadonlyMap<string, ISourceRevision>
): Result<ReadonlyMap<string, ISourceRevision>> {
  const last: Map<string, ISourceRevision> = new Map<string, ISourceRevision>(seen);
  for (const [index, entry] of observations.entries()) {
    if (entry.observation.state !== 'observed') {
      continue;
    }
    const key: string = keys[index];
    const revision: ISourceRevision = entry.observation.value.revision;
    const previous: ISourceRevision | undefined = last.get(key);
    if (previous !== undefined) {
      const order: Result<SourceRevisionOrder> = compareRevisions(source, revision, previous);
      if (order.isFailure() || (order.value !== 'newer' && order.value !== 'same')) {
        return fail(
          `revision ${revision.epoch}/${revision.token} of one binding does not follow ` +
            `${previous.epoch}/${previous.token} in the feed`
        );
      }
    }
    last.set(key, revision);
  }
  return succeed(last);
}

/** Applies one page, in order. For a feed, the first entry that cannot commit stops the page. */
async function _applyPage(
  core: BrokerCore,
  source: ITaskSource,
  page: ISourceReconcilePage
): Promise<IPageOutcome> {
  const replay: boolean = source.history === 'source-replay';
  const mode: ObservationMode = replay ? 'feed' : 'direct';
  const reports: ISourceObservationReport[] = [];
  let blocked: IPageOutcome | undefined = undefined;
  for (const entry of page.observations) {
    const applied = await _applyRead(core, source, entry.binding, entry.observation, mode);
    if (applied.isFailure()) {
      return { observations: reports, stop: 'storage', issue: applied.message };
    }
    const report: ISourceObservationReport = applied.value;
    reports.push(report);
    const outcome = report.outcome;
    if (outcome === 'capacity-blocked' || outcome === 'contract-violation') {
      // Nothing past an uncommitted entry may be taken as committed, so the cursor stays put. An
      // observed-state listing carries no owed history, so the rest of it is still applied — a
      // terminal observation spends its own reservation and must not wait behind ordinary sampling
      // or another binding's fault. A feed stops here.
      const stop: IPageOutcome = {
        observations: reports,
        stop: outcome,
        issue: `${report.message}`
      };
      if (replay) {
        return stop;
      }
      blocked = blocked ?? stop;
    } else if (replay && outcome === 'incomparable') {
      return { observations: reports, stop: 'order', issue: `${report.message}` };
    }
  }
  return blocked !== undefined ? { ...blocked, observations: reports } : { observations: reports };
}

/**
 * One reconciliation pass over a source (host operation).
 *
 * @remarks
 * Reads pages from the committed cursor. Each page's observations are committed first, in order;
 * **only then** is the cursor committed, and only when every observation in the page committed, so
 * the cursor may lag the task records but never leads them. A page the source marks `gap`, a feed
 * page whose per-binding order is broken, an entry that breaks the source's contract, and an entry
 * admission refuses all stop the pass with the cursor where it was: replay resumes from the last
 * committed checkpoint and revisions already committed are safe duplicates.
 *
 * Passes over one source are serialized. The pass is `complete` only when it reached the end of an
 * `all-bindings` listing whose every page was `complete` — an `active-only` listing cannot discover
 * terminal outcomes it has stopped listing, and never makes a pass complete.
 * @internal
 */
export async function reconcileSource(
  core: BrokerCore,
  request: ISourceReconcileRequest
): Promise<TaskResult<ISourceReconcileReport>> {
  const source: ITaskSource | undefined = core.sources.get(request.sourceId);
  if (source === undefined) {
    return taskFailure(
      `reconcile: source '${request.sourceId}' is not attached to this broker`,
      'source-unavailable',
      'after-host-action'
    );
  }
  // `maxPages` arrives converted: a positive safe integer, or absent.
  const maxPages: number = request.maxPages ?? defaultMaxPages;
  return core.serializedPass(source.id, () => _pass(core, source, maxPages));
}

async function _pass(
  core: BrokerCore,
  source: ITaskSource,
  maxPages: number
): Promise<TaskResult<ISourceReconcileReport>> {
  const stored = await core.repository.readSource(source.id);
  if (stored.isFailure()) {
    return propagate(stored);
  }
  const record: ITaskSourceRecord | undefined = stored.value;
  if (record !== undefined && record.history !== source.history) {
    return taskFailure(
      `reconcile: source '${source.id}' was checkpointed as '${record.history}' and is now attached as ` +
        `'${source.history}'; a source's history contract cannot change under committed progress`,
      'invalid',
      'after-host-action'
    );
  }
  return _pages(core, source, maxPages, {
    record,
    cursor: record?.cursor,
    pages: 0,
    complete: true,
    observations: [],
    issues: [],
    order: new Map<string, ISourceRevision>()
  });
}

/** Where a pass is: what it has committed, and what it has seen. */
interface IPassState {
  /** The committed source record — its cursor is the pass's committed position. */
  readonly record: ITaskSourceRecord | undefined;
  /** The cursor to read the next page from. */
  readonly cursor: string | undefined;
  readonly pages: number;
  readonly complete: boolean;
  readonly observations: ReadonlyArray<ISourceObservationReport>;
  readonly issues: ReadonlyArray<string>;
  /** For a feed: the last revision this pass has read of each binding, across its pages. */
  readonly order: ReadonlyMap<string, ISourceRevision>;
}

function _finish(
  source: ITaskSource,
  state: IPassState,
  stopped?: SourceReconcileStop,
  issues: ReadonlyArray<string> = []
): TaskResult<ISourceReconcileReport> {
  return ok({
    sourceId: source.id,
    pages: state.pages,
    ...(state.record?.cursor !== undefined ? { cursor: state.record.cursor } : {}),
    complete: stopped === undefined && state.complete,
    ...(stopped !== undefined ? { stopped } : {}),
    observations: state.observations,
    issues: [...state.issues, ...issues]
  });
}

/** Reads, applies and checkpoints one page, then continues with the next. */
async function _pages(
  core: BrokerCore,
  source: ITaskSource,
  maxPages: number,
  state: IPassState
): Promise<TaskResult<ISourceReconcileReport>> {
  if (state.pages >= maxPages) {
    return _finish(source, state, 'page-limit');
  }
  const fetched = await callSource(`reconcile ${source.id}`, () => source.reconcile(state.cursor));
  if (fetched.isFailure()) {
    return _finish(source, state, 'source-unavailable', [fetched.message]);
  }
  const page = core.converters.sources.page.convert(fetched.value);
  if (page.isFailure()) {
    return _finish(source, state, 'contract-violation', [
      `the source's page does not convert: ${page.message}`
    ]);
  }
  const read: IPassState = {
    ...state,
    pages: state.pages + 1,
    complete:
      state.complete && page.value.completeness === 'complete' && page.value.coverage === 'all-bindings',
    issues: [...state.issues, ...page.value.issues]
  };
  if (page.value.completeness === 'gap') {
    return _finish(source, read, 'gap');
  }
  // A source speaks only for its own bindings: one naming another source's binding is refused before
  // anything in the page is applied, so a faulty source can never write another source's tasks.
  const foreign = page.value.observations.find((entry) => entry.binding.sourceId !== source.id);
  if (foreign !== undefined) {
    return _finish(source, read, 'contract-violation', [
      `source '${source.id}' listed a binding of source '${foreign.binding.sourceId}'`
    ]);
  }
  let order: ReadonlyMap<string, ISourceRevision> = state.order;
  if (source.history === 'source-replay') {
    const checked = _checkOrder(source, page.value.observations, state.order);
    if (checked.isFailure()) {
      return _finish(source, read, 'order', [checked.message]);
    }
    order = checked.value;
  }
  const applied: IPageOutcome = await _applyPage(core, source, page.value);
  const seen: IPassState = {
    ...read,
    order,
    observations: [...read.observations, ...applied.observations]
  };
  const issue: ReadonlyArray<string> = applied.issue !== undefined ? [applied.issue] : [];
  if (applied.stop !== undefined) {
    return _finish(source, seen, applied.stop, issue);
  }
  // Every observation of the page is committed: now, and only now, the cursor.
  const next: string | undefined = page.value.checkpoint ?? page.value.nextCursor ?? state.cursor;
  const saved = await _saveCursor(core, source, state.record, next);
  if (saved.isFailure()) {
    return _finish(source, seen, 'storage', [...issue, saved.message]);
  }
  const committed: IPassState = { ...seen, record: saved.value, issues: [...seen.issues, ...issue] };
  return page.value.nextCursor === undefined
    ? _finish(source, committed)
    : _pages(core, source, maxPages, { ...committed, cursor: page.value.nextCursor });
}

async function _saveCursor(
  core: BrokerCore,
  source: ITaskSource,
  record: ITaskSourceRecord | undefined,
  cursor: string | undefined
): Promise<TaskResult<ITaskSourceRecord>> {
  return core.gated((writer) =>
    writer.commitSource({
      sourceId: source.id,
      history: source.history,
      expectedRecordRevision: record?.recordRevision ?? 0,
      ...(cursor !== undefined ? { cursor } : {}),
      pages: (record?.pages ?? 0) + 1
    })
  );
}

/**
 * Explicit recovery of one task after a restart (host operation). Repository open never does this.
 *
 * @remarks
 * - `reattached` / `completed` / `unrecoverable` apply the source's own projection — the one path
 *   that may establish a new source epoch as the baseline. `unrecoverable` must carry a `failed` or
 *   `cancelled` projection: the source confirms the failure, the broker never invents it.
 * - `resumable` returns the source's reference for host approval and changes nothing.
 * - `unavailable` records an outage in observation health; `unresolved` changes nothing.
 *
 * For a `source-replay` source a projection is a hint like any other: the outcome carries
 * `deferred`, and the host reconciles the feed.
 * @internal
 */
export async function recoverTask(
  core: BrokerCore,
  taskId: TaskId
): Promise<TaskResult<ITaskRecoveryOutcome>> {
  const read = await core.repository.readCommit(taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  if (read.value === undefined) {
    return notFound(taskId);
  }
  const bound = sourceOf(core, read.value);
  if (bound.isFailure()) {
    return propagate(bound);
  }
  const { binding, source } = bound.value;
  const recovered = await callSource(`recover ${taskId}`, () => source.recover(binding));
  if (recovered.isFailure()) {
    const health = await applyHealth(core, binding, 'unavailable', recovered.message, 'source-unavailable');
    return health.isFailure()
      ? propagate(health)
      : ok({ taskId, result: 'unavailable', observation: health.value, reason: recovered.message });
  }
  const converted = core.converters.values.recoveryResult.convert(recovered.value);
  if (converted.isFailure()) {
    return ok({
      taskId,
      result: 'unresolved',
      observation: {
        binding,
        taskId,
        outcome: 'contract-violation',
        message: `the source's recovery result does not convert: ${converted.message}`
      }
    });
  }
  const result: RecoveryResult = converted.value;
  switch (result.state) {
    case 'resumable':
      return ok({ taskId, result: 'resumable', resumable: result });
    case 'unresolved':
      return ok({ taskId, result: 'unresolved', reason: result.reason });
    case 'unavailable': {
      const health = await applyHealth(core, binding, 'unavailable', result.reason, 'source-unavailable');
      return health.isFailure()
        ? propagate(health)
        : ok({ taskId, result: 'unavailable', observation: health.value, reason: result.reason });
    }
    default: {
      const status = result.value.lifecycle.status;
      if (result.state === 'unrecoverable' && status !== 'failed' && status !== 'cancelled') {
        return ok({
          taskId,
          result: result.state,
          observation: {
            binding,
            taskId,
            outcome: 'contract-violation',
            message: `an unrecoverable result must carry a failed or cancelled projection, not ${status}`
          },
          reason: result.reason
        });
      }
      if (result.state === 'completed' && !isTerminalTaskStatus(status)) {
        return ok({
          taskId,
          result: result.state,
          observation: {
            binding,
            taskId,
            outcome: 'contract-violation',
            message: `a completed result must carry a terminal projection, not ${status}`
          }
        });
      }
      if (source.history === 'source-replay') {
        return ok({
          taskId,
          result: result.state,
          observation: {
            binding,
            taskId,
            outcome: 'deferred',
            message: `source '${source.id}' is source-replay: only its feed commits projections; reconcile it`
          }
        });
      }
      const applied = await applyProjection(core, source, binding, result.value, 'recovery');
      return applied.isFailure()
        ? propagate(applied)
        : ok({
            taskId,
            result: result.state,
            observation: applied.value,
            ...(result.state === 'unrecoverable' ? { reason: result.reason } : {})
          });
    }
  }
}
