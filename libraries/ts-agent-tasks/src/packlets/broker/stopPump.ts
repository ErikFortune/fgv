/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { DetailedFailure, Result } from '@fgv/ts-utils';
import { evaluateTrackedCommand } from '../implementations';
import {
  CommandState,
  ICapacityFailure,
  ICommandReceipt,
  ICommandRequest,
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  ISourceBinding,
  ISourceCapabilities,
  IStopIntent,
  IStopReconcileRequest,
  IStopResult,
  IStopTarget,
  IStoredCommandOperation,
  ITaskCommitRecord,
  ITaskFailure,
  ITaskSource,
  StopIntentState,
  StopTargetState,
  TaskId,
  TaskResult,
  TrackedCommand,
  defaultMaxStopTargets,
  defaultStopPumpLimit,
  isLatchingStopState,
  isStopBlocker,
  isTerminalTaskStatus,
  taskListKind
} from '../types';
import { AccessContext, subjectOf } from './access';
import { readExisting } from './catalogMutation';
import { convertRequest, isNativeKind } from './catalogOperations';
import { commitTrackedCommand } from './commands';
import { BrokerCore, canonicallySame, storedOperation } from './core';
import { CommandPermit, authorizationSubject, dispatchIntent, resolveCommand } from './externalCommands';
import { changedSinceAuthorized, codeOf, denied, notFound, ok, propagate, taskFailure } from './failures';
import { callSource, observeTask, sourceOf } from './reconciliation';
import { intentOf, presentStop, stopKey, targetStopped } from './stopRequests';

/** A stop's command is sent under `stop` authority on its target, never `command` authority. */
const stopPermit: CommandPermit = (ctx, record) => ctx.may('stop', subjectOf(record), 'stop-target');

/** A stop command's intent, as recorded in its target. */
interface IRecordedIntent {
  readonly record: IResolvedTaskCommitRecord;
  readonly command: IStoredCommandOperation;
}

/** What one visit learned, or that it could not finish. */
type Visit = { readonly target: IStopTarget } | { readonly unfinished: true };

/**
 * The intent state its targets imply. Satisfaction needs a pass that revisited every target and found
 * each confirmed, over a tree that is still the one captured; any blocker blocks; anything else is
 * pending. **There is no "success with a skipped child"**: a target that was not visited, or could not
 * be stopped, keeps the intent from being satisfied.
 */
function _derive(
  targets: ReadonlyArray<IStopTarget>,
  complete: boolean,
  topologyHeld: boolean
): StopIntentState {
  if (!topologyHeld || targets.some((target) => isStopBlocker(target.state))) {
    return 'blocked';
  }
  return complete && targets.every((target) => target.state === 'confirmed') ? 'satisfied' : 'pending';
}

/** The reason every stop command carries: what it is an attempt of. */
function _reason(core: BrokerCore, intent: IStopIntent): { readonly code: string; readonly summary: string } {
  return {
    code: 'cascade-stop',
    summary: `cascade ${intent.mode} of ${intent.rootId} (stop ${intent.id})`.slice(
      0,
      core.converters.bounds.maxSummaryLength
    )
  };
}

/**
 * One pump pass over one intent (design § 10 steps 3–7): targets in their captured order — root first,
 * then breadth-first by id — each under current authority, with at most `limit` effects.
 *
 * @remarks
 * A pass visits every target. One whose state it can establish from its record alone costs nothing;
 * every source call and every command costs one unit of the budget, and a visit that would exceed it
 * leaves its target as persisted and makes the pass incomplete. Each target's effects land in its own
 * record through the ordinary command path; the root's summary is rebuilt from those records by the
 * attempts' keys and persisted once, at the end — it may lag them, and a restart recovers it. Applied
 * effects are never rolled back because another target refuses. The pass starts no work: it sends
 * only the mode's own command, and installs no timer.
 */
class StopPass {
  public readonly targets: IStopTarget[];
  public complete: boolean = true;
  public capacity: ICapacityFailure | undefined = undefined;
  private readonly _core: BrokerCore;
  private readonly _ctx: AccessContext;
  private readonly _epoch: string;
  private readonly _intent: IStopIntent;
  private _budget: number;

  public constructor(
    core: BrokerCore,
    ctx: AccessContext,
    epoch: string,
    intent: IStopIntent,
    limit: number
  ) {
    this._core = core;
    this._ctx = ctx;
    this._epoch = epoch;
    this._intent = intent;
    this.targets = [...intent.targets];
    this._budget = limit;
  }

  private _spend(): boolean {
    if (this._budget === 0) {
      this.complete = false;
      return false;
    }
    this._budget--;
    return true;
  }

  private _with(i: number, state: StopTargetState, extra?: Partial<IStopTarget>): Visit {
    const was: IStopTarget = this.targets[i];
    const target: IStopTarget = {
      taskId: was.taskId,
      attempt: was.attempt,
      operationId: was.operationId,
      state,
      ...(was.violation !== undefined ? { violation: was.violation } : {}),
      ...extra
    };
    this.targets[i] = target;
    return { target };
  }

  private _unfinished(): Visit {
    this.complete = false;
    return { unfinished: true };
  }

  /** Visits target `i`. A storage failure ends the pass; everything else is a target state. */
  public async visit(i: number): Promise<TaskResult<Visit>> {
    const taskId: TaskId = this.targets[i].taskId;
    const read = await this._core.repository.readCommit(taskId);
    if (read.isFailure()) {
      // A quarantined target — a kind this host does not register — is not stoppable here.
      return codeOf(read) === 'unknown-kind-version' ? ok(this._with(i, 'unavailable')) : propagate(read);
    }
    const record: ITaskCommitRecord | undefined = read.value;
    if (record === undefined || record.recordType === 'unresolved') {
      // No lifecycle is known: never confirmed by anything but an observation.
      return ok(this._with(i, 'unavailable'));
    }
    // Current authority, resolved separately for this target — a stopped state needs it too: it is
    // coordination authority that establishes the state, not a command.
    if (!(await this._ctx.may('stop', subjectOf(record), 'stop-target'))) {
      return ok(this._with(i, 'denied'));
    }
    return isNativeKind(record.task.envelope) ? this._native(i, record) : this._external(i, record);
  }

  private _confirmed(i: number, record: IResolvedTaskCommitRecord): Visit {
    return this._with(i, 'confirmed', { confirmedRevision: record.task.envelope.revision });
  }

  private async _native(i: number, record: IResolvedTaskCommitRecord): Promise<TaskResult<Visit>> {
    const mode = this._intent.mode;
    if (targetStopped(mode, record)) {
      // Held by the latch from here: a native task cannot leave the stopped set while it stands.
      return ok(this._confirmed(i, record));
    }
    const target: IStopTarget = this.targets[i];
    const landed = storedOperation(record, target.operationId);
    if (landed !== undefined) {
      // The attempt landed and the task is not stopped: the command was refused (or its key was not
      // this stop's to begin with). A retry could not change a native refusal.
      return ok(this._with(i, 'refused'));
    }
    if (!this._spend()) {
      return ok({ unfinished: true });
    }
    const committed = await this._stopNative(i, record);
    if (committed.isFailure()) {
      return this._failed(committed);
    }
    if (committed.value === undefined) {
      return ok(this._unfinished());
    }
    const after: ITaskCommitRecord = committed.value;
    return ok(
      after.recordType === 'resolved' && targetStopped(mode, after)
        ? this._confirmed(i, after)
        : this._with(i, 'refused')
    );
  }

  /** A failure an effect met: capacity is a visible blocker; a moved authorization retries next pass. */
  private _failed(failure: DetailedFailure<unknown, ITaskFailure>): TaskResult<Visit> {
    const code = codeOf(failure);
    if (code === 'backpressure') {
      this.capacity = failure.detail?.capacity;
      return ok(this._unfinished());
    }
    if (code === 'conflict') {
      return ok(this._unfinished());
    }
    return propagate(failure);
  }

  /** Whether the root's intent, as it is now under the writer, still latches this attempt. */
  private async _stillOurs(
    read: (id: TaskId) => Promise<TaskResult<ITaskCommitRecord | undefined>>,
    target: IStopTarget
  ): Promise<TaskResult<boolean>> {
    const root = await read(this._intent.rootId);
    if (root.isFailure()) {
      return propagate(root);
    }
    const now: IStopIntent | undefined =
      root.value !== undefined ? intentOf(root.value, this._intent.id) : undefined;
    const theirs: IStopTarget | undefined = now?.targets.find((t) => t.taskId === target.taskId);
    return ok(
      now !== undefined &&
        isLatchingStopState(now.state) &&
        theirs !== undefined &&
        theirs.attempt === target.attempt &&
        theirs.operationId === target.operationId
    );
  }

  /**
   * Commits a native target's pause or cancel under the writer. `undefined`: the attempt is no longer
   * this pass's to make — released, superseded, or already landed by another caller.
   */
  private async _stopNative(
    i: number,
    record: IResolvedTaskCommitRecord
  ): Promise<TaskResult<ITaskCommitRecord | undefined>> {
    const target: IStopTarget = this.targets[i];
    const core: BrokerCore = this._core;
    const command: TrackedCommand = {
      command: this._intent.mode,
      parameters: { reason: _reason(core, this._intent) }
    };
    return core.gated(async (writer): Promise<TaskResult<ITaskCommitRecord | undefined>> => {
      const ours = await this._stillOurs((id) => writer.readCommit(id), target);
      if (ours.isFailure() || !ours.value) {
        return ours.isFailure() ? propagate(ours) : ok(undefined);
      }
      const reread = await writer.readCommit(target.taskId);
      if (reread.isFailure()) {
        return propagate(reread);
      }
      const current: ITaskCommitRecord | undefined = reread.value;
      if (current === undefined || current.recordType !== 'resolved' || current.archived) {
        return ok(undefined);
      }
      if (storedOperation(current, target.operationId) !== undefined) {
        return ok(current);
      }
      if (!canonicallySame(authorizationSubject(record), authorizationSubject(current))) {
        return changedSinceAuthorized(`task ${target.taskId}`, target.operationId);
      }
      const parameters = core.toJson(command.parameters);
      if (parameters.isFailure()) {
        return propagate(parameters);
      }
      const request: ICommandRequest = {
        taskId: target.taskId,
        operationId: target.operationId,
        expectedRevision: current.task.envelope.revision,
        command: command.command,
        parameters: parameters.value
      };
      const outcome = evaluateTrackedCommand(current.task.envelope, command, {
        list: current.task.envelope.kind === taskListKind
      });
      // After the last await and immediately before the write.
      if (!this._ctx.epochIs(this._epoch)) {
        return changedSinceAuthorized('the authorization policy', target.operationId);
      }
      const receipt = await commitTrackedCommand(
        core,
        writer,
        this._ctx.principal,
        current,
        request,
        outcome,
        {
          rootId: this._intent.rootId,
          intentId: this._intent.id
        }
      );
      return receipt.isFailure() ? propagate(receipt) : writer.readCommit(target.taskId);
    });
  }

  private async _external(i: number, record: IResolvedTaskCommitRecord): Promise<TaskResult<Visit>> {
    if (isTerminalTaskStatus(record.task.envelope.lifecycle.status)) {
      // Terminal is absorbing in the broker's own record, whatever the source declares: a source that
      // later reports otherwise raises a reconciliation issue, never a reopen.
      return ok(this._confirmed(i, record));
    }
    const bound = sourceOf(this._core, record);
    if (bound.isFailure()) {
      return ok(this._with(i, 'unavailable'));
    }
    const { source, binding } = bound.value;
    if (source.capabilities === undefined) {
      // No stable-stop opt-in: the source stops nothing, and the target blocks.
      return ok(this._with(i, 'unsupported'));
    }
    if (!this._spend()) {
      return ok({ unfinished: true });
    }
    const capabilities = await this._capabilities(source, binding);
    if (capabilities === undefined) {
      return ok(this._with(i, 'unavailable'));
    }
    return this._externalWith(i, record, source, binding, capabilities);
  }

  /** The source's declaration now — asked every pass, never carried across a restart. */
  private async _capabilities(
    source: ITaskSource,
    binding: ISourceBinding
  ): Promise<ISourceCapabilities | undefined> {
    const asked = await callSource(`capabilities of ${source.id}`, () => source.capabilities!(binding));
    if (asked.isFailure()) {
      return undefined;
    }
    const declared: Result<ISourceCapabilities> = this._core.converters.stops.capabilities.convert(
      asked.value
    );
    if (declared.isFailure()) {
      this._core.environment.logger.warn(
        `ts-agent-tasks: source '${source.id}' declared capabilities that break the contract: ${declared.message}`
      );
      return undefined;
    }
    return declared.value;
  }

  private async _externalWith(
    i: number,
    record: IResolvedTaskCommitRecord,
    source: ITaskSource,
    binding: ISourceBinding,
    capabilities: ISourceCapabilities
  ): Promise<TaskResult<Visit>> {
    const mode = this._intent.mode;
    const status = record.task.envelope.lifecycle.status;
    const target: IStopTarget = this.targets[i];
    if (targetStopped(mode, record)) {
      // Not terminal (that was settled before any source call): paused, under a pause.
      return ok(this._paused(i, record, source, capabilities));
    }
    const violated: boolean = target.state === 'confirmed';
    if (violated) {
      // The source restarted work after a confirmed stop: its stable-stop contract is broken, and the
      // stop degrades — durably, on the target — instead of staying silently satisfied.
      this._core.environment.logger.warn(
        `ts-agent-tasks: stop ${this._intent.id}: task ${target.taskId} left the stopped set after it was ` +
          `confirmed; its source broke its stable-stop contract`
      );
      this._with(i, 'indeterminate', {
        violation: { observedRevision: record.task.envelope.revision, observedStatus: status }
      });
    }
    const designation = mode === 'pause' ? capabilities.pauseCommand : capabilities.cancelCommand;
    const level = mode === 'pause' ? capabilities.pause : capabilities.cancel;
    if (level === 'unsupported' || designation === undefined) {
      return ok(this._with(i, 'unsupported'));
    }
    if (violated) {
      // Re-stopping it is a new attempt, and new admission: its confirmed attempt held no reservation.
      return this._supersede(i, 'indeterminate');
    }
    const landed = storedOperation(record, target.operationId);
    if (landed === undefined) {
      return this._dispatch(i, record, source, binding, capabilities, designation);
    }
    if (landed.type !== 'command' || landed.stop?.intentId !== this._intent.id) {
      // The key was taken by something that is not this stop's command: a definite non-effect.
      return this._supersede(i, 'refused');
    }
    return this._continue(i, record, source, binding, capabilities, landed);
  }

  /** A paused external target: confirmed only under a declared stable stop, with its evidence. */
  private _paused(
    i: number,
    record: IResolvedTaskCommitRecord,
    source: ITaskSource,
    capabilities: ISourceCapabilities
  ): Visit {
    if (capabilities.pause === 'stable-until-explicit-resume' && record.sourceRevision !== undefined) {
      return this._with(i, 'confirmed', {
        confirmedRevision: record.task.envelope.revision,
        stableSourceEvidence: {
          sourceId: source.id,
          contractVersion: capabilities.contractVersion,
          sourceRevision: record.sourceRevision
        }
      });
    }
    // Sampled, or undeclared: observed paused, but nothing holds it there.
    return this._with(i, 'unsupported', { confirmedRevision: record.task.envelope.revision });
  }

  /** Where a landed attempt stands, and one step to move it on. */
  private async _continue(
    i: number,
    record: IResolvedTaskCommitRecord,
    source: ITaskSource,
    binding: ISourceBinding,
    capabilities: ISourceCapabilities,
    command: IStoredCommandOperation
  ): Promise<TaskResult<Visit>> {
    if (command.dispatch !== 'settled') {
      if (!this._spend()) {
        return ok({ unfinished: true });
      }
      const resolved =
        command.dispatch === 'not-sent'
          ? await dispatchIntent(this._core, this._ctx, record, command, { source, binding }, stopPermit)
          : await resolveCommand(this._core, this._ctx, record, command, stopPermit);
      if (resolved.isFailure()) {
        return this._failed(resolved);
      }
      return this._reread(i, source, capabilities);
    }
    const result: CommandState = command.receipt.result;
    switch (result.state) {
      case 'accepted':
        // A receipt is not a stop. Ask the source for the state, where the budget allows.
        if (!this._spend()) {
          return ok(this._with(i, 'pending'));
        }
        return (await observeTask(this._core, record.task.envelope.id)).isFailure()
          ? ok(this._with(i, 'pending'))
          : this._reread(i, source, capabilities, 'pending');
      case 'rejected':
        // A source revision conflict is definite and without effect: a new attempt, with a new key and
        // a fresh precondition. Any other refusal is one a retry cannot change.
        if (result.reason !== 'conflict') {
          return ok(this._with(i, result.reason === 'denied' ? 'denied' : 'refused'));
        }
        // The precondition was stale. Refresh the task from its source first, so the new attempt is
        // sent against the revision current now — a retry of the old precondition would conflict again.
        if (!this._spend()) {
          return ok(this._with(i, 'refused'));
        }
        await observeTask(this._core, record.task.envelope.id);
        return this._supersede(i, 'refused');
      case 'applied':
        // Applied, and the task is not stopped: it restarted — a new attempt re-stops it.
        return this._supersede(i, 'indeterminate');
      default:
        // Indeterminate or abandoned: the outcome is not known, and the key is kept.
        return ok(this._with(i, 'indeterminate'));
    }
  }

  /** Re-reads a target after an effect and states where it now stands, never beyond the evidence. */
  private async _reread(
    i: number,
    source: ITaskSource,
    capabilities: ISourceCapabilities,
    otherwise: StopTargetState = 'pending'
  ): Promise<TaskResult<Visit>> {
    const target: IStopTarget = this.targets[i];
    const read = await this._core.repository.readCommit(target.taskId);
    if (read.isFailure()) {
      return propagate(read);
    }
    const record: ITaskCommitRecord | undefined = read.value;
    if (record === undefined || record.recordType !== 'resolved') {
      return ok(this._with(i, 'unavailable'));
    }
    if (targetStopped(this._intent.mode, record)) {
      return ok(
        isTerminalTaskStatus(record.task.envelope.lifecycle.status)
          ? this._confirmed(i, record)
          : this._paused(i, record, source, capabilities)
      );
    }
    const command = storedOperation(record, target.operationId);
    if (command === undefined || command.type !== 'command') {
      return ok(this._with(i, otherwise));
    }
    const result: CommandState = command.receipt.result;
    const state: StopTargetState =
      command.dispatch !== 'settled' || result.state === 'indeterminate' || result.state === 'abandoned'
        ? 'indeterminate'
        : result.state === 'rejected'
        ? result.reason === 'denied'
          ? 'denied'
          : 'refused'
        : 'pending';
    return ok(this._with(i, state));
  }

  /** Records a stop's command intent in its target and sends it through the dispatch boundary. */
  private async _dispatch(
    i: number,
    record: IResolvedTaskCommitRecord,
    source: ITaskSource,
    binding: ISourceBinding,
    capabilities: ISourceCapabilities,
    designation: { readonly command: string; readonly parameters: JsonValue }
  ): Promise<TaskResult<Visit>> {
    const envelope = record.task.envelope;
    const handle = this._core.repository.registry.getCommand(
      envelope.kind,
      envelope.detailVersion,
      designation.command
    );
    const parameters: Result<JsonValue> = handle.onSuccess((h) => h.validate(designation.parameters));
    if (parameters.isFailure()) {
      // The source designated a command its kind does not declare, or parameters it does not accept.
      return ok(this._with(i, 'unsupported'));
    }
    if (!this._spend()) {
      return ok({ unfinished: true });
    }
    const recorded = await this._recordIntent(i, record, designation.command, parameters.value);
    if (recorded.isFailure()) {
      return this._failed(recorded);
    }
    if (recorded.value === undefined) {
      return ok(this._unfinished());
    }
    const { record: now, command } = recorded.value;
    if (command.dispatch === 'not-sent') {
      const sent = await dispatchIntent(this._core, this._ctx, now, command, { source, binding }, stopPermit);
      if (sent.isFailure()) {
        return this._failed(sent);
      }
    }
    return this._reread(i, source, capabilities);
  }

  /**
   * Records the command intent — `not-sent`, marked as this attempt — in the target's record, under
   * the writer. Its settlement is reserved from the stop's own reservation, so it is admitted at a
   * full repository. `undefined`: no longer this pass's attempt to make.
   */
  private async _recordIntent(
    i: number,
    record: IResolvedTaskCommitRecord,
    name: string,
    parameters: JsonValue
  ): Promise<TaskResult<IRecordedIntent | undefined>> {
    type Recorded = IRecordedIntent;
    const target: IStopTarget = this.targets[i];
    return this._core.gated(async (writer): Promise<TaskResult<Recorded | undefined>> => {
      const ours = await this._stillOurs((id) => writer.readCommit(id), target);
      if (ours.isFailure() || !ours.value) {
        return ours.isFailure() ? propagate(ours) : ok(undefined);
      }
      const reread = await writer.readCommit(target.taskId);
      if (reread.isFailure()) {
        return propagate(reread);
      }
      const current: ITaskCommitRecord | undefined = reread.value;
      if (current === undefined || current.recordType !== 'resolved' || current.archived) {
        return ok(undefined);
      }
      const existing = storedOperation(current, target.operationId);
      if (existing !== undefined) {
        return existing.type === 'command' ? ok({ record: current, command: existing }) : ok(undefined);
      }
      if (!canonicallySame(authorizationSubject(record), authorizationSubject(current))) {
        return changedSinceAuthorized(`task ${target.taskId}`, target.operationId);
      }
      const request: ICommandRequest = {
        taskId: target.taskId,
        operationId: target.operationId,
        expectedRevision: current.task.envelope.revision,
        command: name,
        parameters
      };
      const receipt: ICommandReceipt = {
        taskId: target.taskId,
        operationId: target.operationId,
        command: name,
        result: { state: 'accepted' }
      };
      const command: IStoredCommandOperation = {
        type: 'command',
        operationId: target.operationId,
        request,
        principalKey: this._ctx.principal,
        dispatch: 'not-sent',
        receipt,
        stop: { rootId: this._intent.rootId, intentId: this._intent.id }
      };
      const draft: IResolvedTaskRecordDraft = {
        recordType: 'resolved',
        task: current.task,
        ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
        operations: [...current.operations, command],
        updates: current.updates,
        archived: current.archived,
        ...(current.stops !== undefined ? { stops: current.stops } : {})
      };
      if (!this._ctx.epochIs(this._epoch)) {
        return changedSinceAuthorized('the authorization policy', target.operationId);
      }
      const committed = await writer.commit({
        purpose: 'operation',
        operationId: target.operationId,
        taskId: target.taskId,
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: draft
      });
      if (committed.isFailure()) {
        return propagate(committed);
      }
      // The draft is resolved, and so is what storage committed from it.
      return committed.value.recordType === 'resolved'
        ? ok({ record: committed.value, command })
        : ok(undefined);
    });
  }

  /**
   * Supersedes a definitely non-effective attempt: a new attempt, with a freshly minted key, persisted
   * in the root **before** anything is dispatched under it. New admission — it reserves one more
   * attempt, and a full repository refuses it with a visible capacity blocker, the old attempt left as
   * it was.
   */
  private async _supersede(i: number, standing: StopTargetState): Promise<TaskResult<Visit>> {
    const target: IStopTarget = this.targets[i];
    if (!this._spend()) {
      return ok(this._with(i, standing));
    }
    const core: BrokerCore = this._core;
    const superseded = await core.gated(async (writer): Promise<TaskResult<IStopTarget | undefined>> => {
      const root = await writer.readCommit(this._intent.rootId);
      if (root.isFailure()) {
        return propagate(root);
      }
      const current: ITaskCommitRecord | undefined = root.value;
      const now: IStopIntent | undefined =
        current !== undefined ? intentOf(current, this._intent.id) : undefined;
      const index: number = now?.targets.findIndex((t) => t.taskId === target.taskId) ?? -1;
      if (
        current === undefined ||
        current.recordType !== 'resolved' ||
        now === undefined ||
        !isLatchingStopState(now.state) ||
        now.targets[index].attempt !== target.attempt
      ) {
        return ok(undefined);
      }
      const key = core.mintOperationId();
      if (key.isFailure()) {
        return propagate(key);
      }
      const next: IStopTarget = {
        taskId: target.taskId,
        attempt: target.attempt + 1,
        operationId: key.value,
        state: 'pending',
        ...(target.violation !== undefined ? { violation: target.violation } : {})
      };
      // A satisfied intent with a target re-attempting is satisfied no longer.
      const stops = (current.stops ?? []).map(
        (intent): IStopIntent =>
          intent.id === now.id
            ? {
                ...intent,
                state: intent.state === 'satisfied' ? 'pending' : intent.state,
                targets: intent.targets.map((t, j) => (j === index ? next : t))
              }
            : intent
      );
      if (!this._ctx.epochIs(this._epoch)) {
        return changedSinceAuthorized('the authorization policy');
      }
      const committed = await writer.commit({
        purpose: 'maintenance',
        taskId: current.task.envelope.id,
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: {
          recordType: 'resolved',
          task: current.task,
          ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
          operations: current.operations,
          updates: current.updates,
          archived: current.archived,
          stops
        }
      });
      return committed.isSuccess() ? ok<IStopTarget | undefined>(next) : propagate(committed);
    });
    if (superseded.isFailure()) {
      const failed = this._failed(superseded);
      // The old attempt stands: the fresh one was not admitted.
      return failed.isSuccess() ? ok(this._with(i, standing)) : failed;
    }
    if (superseded.value === undefined) {
      return ok(this._unfinished());
    }
    this.targets[i] = superseded.value;
    return ok({ target: superseded.value });
  }
}

/**
 * Persists a pass's findings into the root's summary — merged, target by target, onto the intent as it
 * is now: a target whose attempt another caller superseded meanwhile keeps that caller's entry. Written
 * only when something changed, and only under the authorization the pass ran with.
 */
async function _persist(
  core: BrokerCore,
  ctx: AccessContext,
  epoch: string,
  intent: IStopIntent,
  pass: StopPass,
  topologyHeld: boolean
): Promise<TaskResult<IStopIntent>> {
  return core.gated(async (writer): Promise<TaskResult<IStopIntent>> => {
    const root = await writer.readCommit(intent.rootId);
    if (root.isFailure()) {
      return propagate(root);
    }
    const current: ITaskCommitRecord | undefined = root.value;
    const now: IStopIntent | undefined = current !== undefined ? intentOf(current, intent.id) : undefined;
    if (current === undefined || current.recordType !== 'resolved' || now === undefined) {
      return taskFailure(
        `task ${intent.rootId}: its stop ${intent.id} is gone`,
        'storage-corrupt',
        'after-host-action'
      );
    }
    if (!isLatchingStopState(now.state)) {
      // Released or settled while the pass ran: nothing this pass learned changes that.
      return ok(now);
    }
    const targets: ReadonlyArray<IStopTarget> = now.targets.map((mine, j) =>
      pass.targets[j].attempt === mine.attempt && pass.targets[j].operationId === mine.operationId
        ? pass.targets[j]
        : mine
    );
    const next: IStopIntent = { ...now, targets, state: _derive(targets, pass.complete, topologyHeld) };
    if (canonicallySame(now, next)) {
      return ok(now);
    }
    // A summary decided under a moved policy would record authority decisions nobody holds now.
    if (!ctx.epochIs(epoch)) {
      return ok(now);
    }
    const committed = await writer.commit({
      purpose: 'maintenance',
      taskId: intent.rootId,
      expectedRevision: current.task.envelope.revision,
      expectedRecordRevision: current.recordRevision,
      record: {
        recordType: 'resolved',
        task: current.task,
        ...(current.sourceRevision !== undefined ? { sourceRevision: current.sourceRevision } : {}),
        operations: current.operations,
        updates: current.updates,
        archived: current.archived,
        stops: (current.stops ?? []).map((i) => (i.id === intent.id ? next : i))
      }
    });
    return committed.isSuccess() ? ok(next) : propagate(committed);
  });
}

/**
 * `reconcileStop`: the host's stop pump — one bounded pass over one intent, then its latest result.
 *
 * @remarks
 * Needs `stop` authority on the root **now**: a pump resumed after that authority was revoked does
 * nothing. Each target is re-authorized for this principal as a `stop-target` before anything is
 * established or sent — a hidden target is still a target, and still visited. The pass checks the tree
 * is still the one captured: a descendant that appeared out of band is not covered, and the stop is
 * `blocked` rather than silently incomplete. A pass that revisited every target and confirmed each is
 * the only way to `satisfied`, and it also revalidates any external stable-stop evidence for this
 * broker instance.
 * @internal
 */
export async function reconcileStop(
  core: BrokerCore,
  ctx: AccessContext,
  input: unknown
): Promise<TaskResult<IStopResult>> {
  const converted = convertRequest(core, core.converters.stops.reconcile, input, 'reconcileStop');
  if (converted.isFailure()) {
    return propagate(converted);
  }
  const request: IStopReconcileRequest = converted.value.value;
  const read = await readExisting(core, request.taskId);
  if (read.isFailure()) {
    return propagate(read);
  }
  const root: ITaskCommitRecord = read.value;
  const epoch = ctx.epoch();
  if (epoch.isFailure()) {
    return propagate(epoch);
  }
  if (!(await ctx.sees(subjectOf(root)))) {
    return notFound(request.taskId);
  }
  const intent: IStopIntent | undefined = intentOf(root, request.intentId);
  if (intent === undefined) {
    return taskFailure(
      `task ${request.taskId}: holds no stop ${request.intentId}`,
      'not-found-or-denied',
      'after-host-action'
    );
  }
  if (!(await ctx.may('stop', subjectOf(root), 'subject'))) {
    return denied(request.taskId, 'stop', request.intentId);
  }
  if (!isLatchingStopState(intent.state)) {
    return presentStop(core, ctx, intent);
  }
  const tree = core.repository.subtree(intent.rootId, defaultMaxStopTargets);
  const topologyHeld: boolean =
    tree.isSuccess() &&
    canonicallySame(
      tree.value,
      intent.targets.map((target) => target.taskId)
    );
  if (!topologyHeld) {
    core.environment.logger.warn(
      `ts-agent-tasks: stop ${intent.id} of ${intent.rootId}: the tree is no longer the one captured; ` +
        `membership changed outside this broker, and the stop is not treated as covering it`
    );
  }
  const pass = new StopPass(core, ctx, epoch.value, intent, request.limit ?? defaultStopPumpLimit);
  for (let i = 0; i < intent.targets.length; i++) {
    const visited = await pass.visit(i);
    if (visited.isFailure()) {
      return propagate(visited);
    }
  }
  const persisted = await _persist(core, ctx, epoch.value, intent, pass, topologyHeld);
  if (persisted.isFailure()) {
    return propagate(persisted);
  }
  const key: string = stopKey(intent.rootId, intent.id);
  if (persisted.value.state === 'satisfied' && pass.complete) {
    core.revalidatedStops.add(key);
  } else {
    core.revalidatedStops.delete(key);
  }
  return presentStop(core, ctx, persisted.value, pass.capacity);
}
