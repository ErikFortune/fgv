/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { Result, captureResult } from '@fgv/ts-utils';
import { isRequiredCategory, planUpdates } from '../implementations';
import {
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  ISourceBinding,
  ISourceObservationReport,
  ISourceProjection,
  ISourceRevision,
  IStoredTaskOperation,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskSource,
  ITaskUpdate,
  IUnresolvedTaskCommitRecord,
  Instant,
  ObservationHealth,
  SourceObservationOutcome,
  SourceRevisionOrder,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateCategory,
  isTerminalTaskStatus
} from '../types';
import { ITaskCommitRequest, ITaskRepositoryWriter } from '../storage';
import { BrokerCore, canonicallySame } from './core';
import { codeOf, ok, propagate, taskFailure } from './failures';

/**
 * How an observation reached the broker, which decides what it may do.
 *
 * - `direct` — an `observed-state` read, listing entry or command result: committed when newer.
 * - `feed` — an entry of a `source-replay` source's ordered feed: committed when newer, spending
 *   the task's replay envelope, and the only way such a source's projection moves.
 * - `recovery` — an explicit recovery result: like `direct`, and additionally the one path that
 *   accepts an incomparable (new-epoch) revision, establishing it as the baseline.
 * @internal
 */
export type ObservationMode = 'direct' | 'feed' | 'recovery';

/** An observation's outcome, with the committed task revision when there is a task. */
function _report(
  binding: ISourceBinding,
  outcome: SourceObservationOutcome,
  record?: ITaskCommitRecord,
  message?: string
): ISourceObservationReport {
  const revision: TaskRevision | undefined =
    record === undefined
      ? undefined
      : record.recordType === 'resolved'
      ? record.task.envelope.revision
      : record.reference.revision;
  return {
    binding,
    ...(record !== undefined ? { taskId: _idOf(record) } : {}),
    outcome,
    ...(revision !== undefined ? { revision } : {}),
    ...(message !== undefined ? { message } : {})
  };
}

function _idOf(record: ITaskCommitRecord): TaskId {
  return record.recordType === 'resolved' ? record.task.envelope.id : record.reference.id;
}

/**
 * The execution projection a source owns: everything an observation may change. An absent
 * `progress` is left out rather than carried as `undefined`, which canonical comparison refuses.
 */
function _execution(from: {
  readonly lifecycle: unknown;
  readonly progress?: unknown;
  readonly attention: unknown;
  readonly details: JsonValue;
}): unknown {
  return {
    lifecycle: from.lifecycle,
    ...(from.progress !== undefined ? { progress: from.progress } : {}),
    attention: from.attention,
    details: from.details
  };
}

/** Equality of two optional values: both absent, or both present and canonically equal. */
function _same(a: unknown, b: unknown): boolean {
  return a === undefined || b === undefined ? a === b : canonicallySame(a, b);
}

/** Orders `a` relative to `b` by the source's own comparator; a throw or failure is a contract issue. */
export function compareRevisions(
  source: ITaskSource,
  a: ISourceRevision,
  b: ISourceRevision
): Result<SourceRevisionOrder> {
  return captureResult(() => source.compare(a, b)).onSuccess((order) => order);
}

/**
 * The update categories an applied projection owes: what changed, plus `result` for a terminal
 * transition and `observation` when health returns to current.
 */
function _categories(
  before: ITaskEnvelope | undefined,
  after: ITaskEnvelope,
  detailsChanged: boolean
): ReadonlyArray<UpdateCategory> {
  const categories: UpdateCategory[] = [];
  if (before === undefined || !canonicallySame(before.lifecycle, after.lifecycle)) {
    categories.push('lifecycle');
    if (isTerminalTaskStatus(after.lifecycle.status)) {
      categories.push('result');
    }
  }
  if (before !== undefined && !canonicallySame(before.attention, after.attention)) {
    categories.push('attention');
  }
  if (before !== undefined && (!_same(before.progress, after.progress) || detailsChanged)) {
    categories.push('progress');
  }
  if (before !== undefined && before.observation.state !== after.observation.state) {
    categories.push('observation');
  }
  return categories;
}

/** Commands a feed commit reaches: `accepted` receipts awaiting a revision at or before `revision`. */
function _confirmAwaiting(
  source: ITaskSource,
  operations: ReadonlyArray<IStoredTaskOperation>,
  revision: ISourceRevision,
  taskRevision: TaskRevision
): ReadonlyArray<IStoredTaskOperation> {
  return operations.map((op) => {
    if (op.type !== 'command' || op.awaiting === undefined || op.receipt.result.state !== 'accepted') {
      return op;
    }
    const order: Result<SourceRevisionOrder> = compareRevisions(source, revision, op.awaiting);
    if (order.isFailure() || (order.value !== 'same' && order.value !== 'newer')) {
      return op;
    }
    // The feed has reached the revision the command's effect was reported at: applied, here.
    return {
      type: 'command',
      operationId: op.operationId,
      request: op.request,
      principalKey: op.principalKey,
      dispatch: op.dispatch,
      receipt: { ...op.receipt, result: { state: 'applied', appliedRevision: taskRevision } }
    };
  });
}

/** A resolved record replaced by an observation: execution fields from the source, catalog kept. */
function _resolvedDraft(
  current: IResolvedTaskCommitRecord,
  envelope: ITaskEnvelope,
  details: JsonValue,
  sourceRevision: ISourceRevision | undefined,
  operations: ReadonlyArray<IStoredTaskOperation>,
  updates: ReadonlyArray<ITaskUpdate>
): IResolvedTaskRecordDraft {
  return {
    recordType: 'resolved',
    task: { envelope, details },
    ...(sourceRevision !== undefined ? { sourceRevision } : {}),
    operations,
    updates: [...current.updates, ...updates],
    archived: current.archived
  };
}

/**
 * The first resolved envelope of an unresolved registration, from its first projection. Identity
 * and catalog metadata come from the reference; the description and recovery declaration from the
 * registration request the record holds as its creation evidence.
 */
function _firstEnvelope(
  core: BrokerCore,
  current: IUnresolvedTaskCommitRecord,
  projection: ISourceProjection,
  now: Instant
): TaskResult<ITaskEnvelope> {
  const reference = current.reference;
  const registration = core.converters.broker.registerExternal.convert(current.operations[0].request);
  if (registration.isFailure()) {
    return taskFailure(
      `task ${reference.id}: its registration evidence does not convert: ${registration.message}`,
      'storage-corrupt',
      'after-host-action'
    );
  }
  const request = registration.value;
  return ok({
    schemaVersion: 1,
    id: reference.id,
    kind: reference.kind,
    detailVersion: reference.detailVersion,
    revision: (reference.revision + 1) as TaskRevision,
    title: reference.title,
    ...(request.description !== undefined ? { description: request.description } : {}),
    ...(reference.parentId !== undefined ? { parentId: reference.parentId } : {}),
    stopPolicy: 'none',
    ...(reference.responsibility !== undefined ? { responsibility: reference.responsibility } : {}),
    scopes: reference.scopes,
    lifecycle: projection.lifecycle,
    ...(projection.progress !== undefined ? { progress: projection.progress } : {}),
    attention: projection.attention,
    binding: reference.binding,
    recovery: request.recovery,
    observation: { state: 'current', observedAt: projection.observedAt },
    // An unresolved reference records no creation instant; the task comes into being, as a
    // presentable envelope, when it first resolves.
    createdAt: now,
    changedAt: now
  });
}

/**
 * Applies one projection to the task bound to `binding`, inside one gated section.
 *
 * @remarks
 * The source's comparator orders the observed revision against the committed one:
 *
 * - **newer** — execution fields are replaced from the projection; parent, responsibility, scopes,
 *   binding and identity are taken from the latest committed record, so a concurrent catalog change
 *   (a reassignment during an in-flight command) is preserved. A terminal task is absorbing: a newer
 *   projection that changes its lifecycle is a contract violation, never a reopen.
 * - **same** — the same projection is a freshness refresh when observed later (maintenance: no
 *   revision, no update) or a health recovery when health was not current; a *different*
 *   projection at the same revision is a contract violation.
 * - **older** — stale; ignored.
 * - **incomparable** — a new source epoch; ignored except in `recovery` mode, which establishes it.
 *
 * Nothing here decides whether a `source-replay` projection may be applied at all; callers pass
 * `feed` only for feed entries, and route everything else for such a source to a feed pass.
 * @internal
 */
export async function applyProjection(
  core: BrokerCore,
  source: ITaskSource,
  binding: ISourceBinding,
  projection: ISourceProjection,
  mode: ObservationMode
): Promise<TaskResult<ISourceObservationReport>> {
  const owner = await core.repository.lookupSource(binding);
  if (owner.isFailure()) {
    return propagate(owner);
  }
  if (owner.value === undefined) {
    return ok(_report(binding, 'unknown-binding'));
  }
  const taskId: TaskId = owner.value;
  const outcome = await core.gated((writer) =>
    _applyInWriter(core, writer, source, taskId, binding, projection, mode)
  );
  return outcome;
}

async function _applyInWriter(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  source: ITaskSource,
  taskId: TaskId,
  binding: ISourceBinding,
  projection: ISourceProjection,
  mode: ObservationMode
): Promise<TaskResult<ISourceObservationReport>> {
  const read = await writer.readCommit(taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const current: ITaskCommitRecord | undefined = read.value;
  if (current === undefined) {
    return ok(_report(binding, 'unknown-binding'));
  }
  const clock = core.now();
  if (clock.isFailure()) {
    return propagate(clock);
  }
  const now: Instant = clock.value;

  if (current.recordType === 'unresolved') {
    const envelope = _firstEnvelope(core, current, projection, now);
    if (envelope.isFailure()) {
      return propagate(envelope);
    }
    const categories: ReadonlyArray<UpdateCategory> = _categories(undefined, envelope.value, true);
    const updates = planUpdates(undefined, envelope.value, categories, core.audience);
    return _commit(core, writer, binding, current, {
      purpose: 'observation',
      taskId,
      expectedRevision: current.reference.revision,
      expectedRecordRevision: current.recordRevision,
      ...(mode === 'feed' ? { requiredUpdates: _required(categories) } : {}),
      record: {
        recordType: 'resolved',
        task: { envelope: envelope.value, details: projection.details },
        sourceRevision: projection.revision,
        operations: current.operations,
        updates,
        archived: false
      }
    });
  }

  if (current.archived) {
    return ok(_report(binding, 'unchanged', current, 'the task is archived; its tombstone is immutable'));
  }
  const before: ITaskEnvelope = current.task.envelope;
  let order: SourceRevisionOrder = 'newer';
  if (current.sourceRevision !== undefined) {
    const compared: Result<SourceRevisionOrder> = compareRevisions(
      source,
      projection.revision,
      current.sourceRevision
    );
    if (compared.isFailure()) {
      return ok(_report(binding, 'contract-violation', current, `compare: ${compared.message}`));
    }
    order = compared.value;
  }
  if (order === 'older') {
    return ok(_report(binding, 'stale', current));
  }
  if (order === 'incomparable' && mode !== 'recovery') {
    return ok(
      _report(binding, 'incomparable', current, 'a different source epoch; explicit recovery establishes it')
    );
  }

  if (order === 'same') {
    if (!canonicallySame(_execution({ ...before, details: current.task.details }), _execution(projection))) {
      return ok(
        _report(
          binding,
          'contract-violation',
          current,
          `source revision ${projection.revision.epoch}/${projection.revision.token} is already committed ` +
            `with a different projection`
        )
      );
    }
    if (before.observation.state !== 'current') {
      // Health recovers at the same revision: semantic, so it advances the task revision.
      const after: ITaskEnvelope = {
        ...before,
        revision: (before.revision + 1) as TaskRevision,
        observation: { state: 'current', observedAt: projection.observedAt },
        changedAt: now
      };
      const updates = planUpdates(before, after, ['observation'], core.audience);
      return _commit(
        core,
        writer,
        binding,
        current,
        {
          purpose: 'observation',
          taskId,
          expectedRevision: before.revision,
          expectedRecordRevision: current.recordRevision,
          record: _resolvedDraft(
            current,
            after,
            current.task.details,
            current.sourceRevision,
            current.operations,
            updates
          )
        },
        'health-changed'
      );
    }
    if (projection.observedAt > before.observation.observedAt) {
      // A later read of the same revision: freshness only. Maintenance advances no revision and
      // owes no update, which is what makes it provably not a semantic change.
      const after: ITaskEnvelope = {
        ...before,
        observation: { state: 'current', observedAt: projection.observedAt }
      };
      return _commit(
        core,
        writer,
        binding,
        current,
        {
          purpose: 'maintenance',
          taskId,
          expectedRevision: before.revision,
          expectedRecordRevision: current.recordRevision,
          record: _resolvedDraft(
            current,
            after,
            current.task.details,
            current.sourceRevision,
            current.operations,
            []
          )
        },
        'refreshed'
      );
    }
    return ok(_report(binding, 'unchanged', current));
  }

  // Newer (or, in recovery, a new epoch's baseline).
  if (
    isTerminalTaskStatus(before.lifecycle.status) &&
    !canonicallySame(before.lifecycle, projection.lifecycle)
  ) {
    return ok(
      _report(
        binding,
        'contract-violation',
        current,
        `task is ${before.lifecycle.status}, which is absorbing; the source reports ${projection.lifecycle.status}`
      )
    );
  }
  const revision: TaskRevision = (before.revision + 1) as TaskRevision;
  // Execution fields from the source (an absent progress is cleared); catalog fields from the
  // latest committed record.
  const next: ITaskEnvelope = {
    schemaVersion: before.schemaVersion,
    id: before.id,
    kind: before.kind,
    detailVersion: before.detailVersion,
    revision,
    title: before.title,
    ...(before.description !== undefined ? { description: before.description } : {}),
    ...(before.parentId !== undefined ? { parentId: before.parentId } : {}),
    stopPolicy: before.stopPolicy,
    ...(before.responsibility !== undefined ? { responsibility: before.responsibility } : {}),
    scopes: before.scopes,
    lifecycle: projection.lifecycle,
    ...(projection.progress !== undefined ? { progress: projection.progress } : {}),
    attention: projection.attention,
    ...(before.binding !== undefined ? { binding: before.binding } : {}),
    recovery: before.recovery,
    observation: { state: 'current', observedAt: projection.observedAt },
    createdAt: before.createdAt,
    changedAt: now
  };
  const categories = _categories(before, next, !canonicallySame(current.task.details, projection.details));
  const updates = planUpdates(before, next, categories, core.audience);
  const operations = _confirmAwaiting(source, current.operations, projection.revision, revision);
  return _commit(core, writer, binding, current, {
    purpose: 'observation',
    taskId,
    expectedRevision: before.revision,
    expectedRecordRevision: current.recordRevision,
    ...(mode === 'feed' ? { requiredUpdates: _required(categories) } : {}),
    record: _resolvedDraft(current, next, projection.details, projection.revision, operations, updates)
  });
}

/** How many required updates an observation delivers: one per revision that owes any. */
function _required(categories: ReadonlyArray<UpdateCategory>): number {
  return categories.some(isRequiredCategory) ? 1 : 0;
}

/**
 * Commits an observation and classifies the outcome. Admission refusal and a broken source
 * contract are reported outcomes, not failures: nothing was committed, and a pass stops there.
 */
async function _commit(
  core: BrokerCore,
  writer: ITaskRepositoryWriter,
  binding: ISourceBinding,
  current: ITaskCommitRecord,
  request: ITaskCommitRequest,
  success: SourceObservationOutcome = 'applied'
): Promise<TaskResult<ISourceObservationReport>> {
  const committed = await writer.commit(request);
  if (committed.isSuccess()) {
    return ok(_report(binding, success, committed.value));
  }
  const code = codeOf(committed);
  if (code === 'backpressure') {
    return ok(_report(binding, 'capacity-blocked', current, committed.message));
  }
  if (code === 'source-gap' || code === 'invalid') {
    // `invalid` here is a projection the kind's converter or the stored bounds refuse — the
    // source's output, not the broker's request.
    return ok(_report(binding, 'contract-violation', current, committed.message));
  }
  return propagate(committed);
}

/**
 * Records an observation-health change — an outage or a missing binding — without touching the
 * lifecycle. Health is semantic (it can owe an `observation` update), so it commits at the same
 * source revision as an observation that changes health only. A repeat of the same health is a
 * no-op: liveness timestamps alone never create revisions.
 * @internal
 */
export async function applyHealth(
  core: BrokerCore,
  binding: ISourceBinding,
  state: 'stale' | 'unavailable',
  reason: string,
  outcome: 'source-unavailable' | 'missing'
): Promise<TaskResult<ISourceObservationReport>> {
  const owner = await core.repository.lookupSource(binding);
  if (owner.isFailure()) {
    return propagate(owner);
  }
  if (owner.value === undefined) {
    return ok(_report(binding, 'unknown-binding'));
  }
  const taskId: TaskId = owner.value;
  return core.gated(async (writer) => {
    const read = await writer.readCommit(taskId);
    if (read.isFailure()) {
      return propagate<ISourceObservationReport>(read);
    }
    const current: ITaskCommitRecord | undefined = read.value;
    if (current === undefined || current.recordType !== 'resolved' || current.archived) {
      // An unresolved reference has no health to change; its reason already says it is waiting.
      return ok(_report(binding, outcome, current, reason));
    }
    const before: ITaskEnvelope = current.task.envelope;
    const health: ObservationHealth = before.observation;
    if (health.state === state && health.reason === reason) {
      return ok(_report(binding, outcome, current, reason));
    }
    const clock = core.now();
    if (clock.isFailure()) {
      return propagate<ISourceObservationReport>(clock);
    }
    const lastObservedAt: Instant | undefined =
      health.state === 'current' ? health.observedAt : health.lastObservedAt;
    const after: ITaskEnvelope = {
      ...before,
      revision: (before.revision + 1) as TaskRevision,
      observation: {
        state,
        checkedAt: clock.value,
        ...(lastObservedAt !== undefined ? { lastObservedAt } : {}),
        reason
      },
      changedAt: clock.value
    };
    const updates = planUpdates(before, after, ['observation'], core.audience);
    const committed = await _commit(
      core,
      writer,
      binding,
      current,
      {
        purpose: 'observation',
        taskId,
        expectedRevision: before.revision,
        expectedRecordRevision: current.recordRevision,
        record: _resolvedDraft(
          current,
          after,
          current.task.details,
          current.sourceRevision,
          current.operations,
          updates
        )
      },
      outcome
    );
    return committed;
  });
}
