/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { ICapacityFailure } from './failure';
import { OperationId, TaskId, TaskRevision } from './ids';
import { TaskLifecycleStatus, isTerminalTaskStatus } from './lifecycle';
import { ISourceRevision } from './source';

/**
 * What a cascade stop asks of its root and every transitive descendant (design § 10).
 * @public
 */
export type StopMode = 'pause' | 'cancel';

/**
 * Every {@link StopMode}.
 * @public
 */
export const allStopModes: ReadonlyArray<StopMode> = ['pause', 'cancel'];

/**
 * Where one target of a cascade stop stands.
 *
 * @remarks
 * - `unexamined` — captured, not yet visited by a pump pass.
 * - `pending` — a stop command was accepted, or is on its way, and quiescence is not yet confirmed.
 *   **A receipt is not a stop**: an accepted command stays here until authority confirms the state.
 * - `confirmed` — authoritative state satisfies the mode, and holds: a native state is held by the
 *   admission latch, an external one by its source's declared stable-stop contract.
 * - `unsupported` — the target cannot give the stop guarantee: an observation-only external task,
 *   a source that does not declare the mode, or one whose pause is only sampled. A present
 *   `confirmedRevision` means the stopped state was observed but is not held.
 * - `denied` — current host authority does not permit stopping (or establishing the state of) it.
 * - `unavailable` — its source is not attached or cannot be reached, it is an unresolved
 *   registration, or a fresh attempt could not be admitted.
 * - `refused` — its source definitively refused the stop for a reason a retry cannot change.
 * - `indeterminate` — the outcome is not known: an uncertain dispatch, or a stable stop the source
 *   later contradicted (see `violation`).
 *
 * Every state but `unexamined`, `pending` and `confirmed` is a **blocker**: the intent cannot be
 * satisfied while one stands, and it is never skipped.
 * @public
 */
export type StopTargetState =
  | 'unexamined'
  | 'pending'
  | 'confirmed'
  | 'unsupported'
  | 'denied'
  | 'unavailable'
  | 'refused'
  | 'indeterminate';

/**
 * Every {@link StopTargetState}.
 * @public
 */
export const allStopTargetStates: ReadonlyArray<StopTargetState> = [
  'unexamined',
  'pending',
  'confirmed',
  'unsupported',
  'denied',
  'unavailable',
  'refused',
  'indeterminate'
];

/**
 * Whether a target state blocks satisfaction: known and not stopped, rather than merely not yet
 * reached.
 * @public
 */
export function isStopBlocker(state: StopTargetState): boolean {
  return state !== 'unexamined' && state !== 'pending' && state !== 'confirmed';
}

/**
 * Where a cascade stop intent stands.
 *
 * @remarks
 * - `pending` — accepted; some target is not yet confirmed and none is known to block.
 * - `blocked` — some target blocks. Effects already applied stay applied: **there is no rollback**.
 * - `satisfied` — the last full pass confirmed every target.
 * - `released` — a host released the latch. Applied stops are not undone and commands already sent
 *   are not retracted; no further coordinated attempt is made.
 * - `settled` — a satisfied cancel whose root was archived; its report is retained.
 *
 * The first three **latch**: while one stands, the captured subtree is frozen (design § 10 step 2).
 * **Acceptance is not completion**: an accepted stop is `pending`, and only a pump pass that visited
 * every target can make it `satisfied`.
 * @public
 */
export type StopIntentState = 'pending' | 'blocked' | 'satisfied' | 'released' | 'settled';

/**
 * Every {@link StopIntentState}.
 * @public
 */
export const allStopIntentStates: ReadonlyArray<StopIntentState> = [
  'pending',
  'blocked',
  'satisfied',
  'released',
  'settled'
];

/**
 * Whether an intent in this state holds its latch.
 * @public
 */
export function isLatchingStopState(state: StopIntentState): boolean {
  return state === 'pending' || state === 'blocked' || state === 'satisfied';
}

/**
 * Whether a lifecycle status is in the stopped set a mode requires: paused or terminal for `pause`,
 * terminal for `cancel` (which may have succeeded or failed before cancellation won).
 * @public
 */
export function isStoppedFor(mode: StopMode, status: TaskLifecycleStatus): boolean {
  return isTerminalTaskStatus(status) || (mode === 'pause' && status === 'paused');
}

/**
 * Whether a lifecycle move is refused under these latches (design § 10 step 2): a move to `running`
 * from anything else — start, resume, a new execution attempt — or out of a latch's required stopped
 * set, such as `paused → waiting` under a pause. Decided on the states, not on the command, so no
 * command spelling can bypass it.
 * @public
 */
export function latchRefusesMove(
  latches: ReadonlyArray<IStopLatch>,
  from: TaskLifecycleStatus,
  to: TaskLifecycleStatus
): boolean {
  if (latches.length === 0 || from === to) {
    return false;
  }
  if (to === 'running') {
    return true;
  }
  return latches.some((latch) => isStoppedFor(latch.mode, from) && !isStoppedFor(latch.mode, to));
}

/**
 * The evidence a confirmed external target's stability rests on: its source's declared stop
 * contract, and the source revision that confirmed the stopped state. Revalidated after every reopen
 * before satisfaction is presented — a contract that held before a restart is not evidence it holds
 * now.
 * @public
 */
export interface IStableStopEvidence {
  readonly sourceId: string;
  readonly contractVersion: string;
  readonly sourceRevision: ISourceRevision;
}

/**
 * A stable stop its source later contradicted: the task was observed outside the stopped set after
 * it was confirmed. Kept on the target so the degradation is durable and inspectable, never silent.
 * @public
 */
export interface IStopViolation {
  readonly observedRevision: TaskRevision;
  readonly observedStatus: TaskLifecycleStatus;
}

/**
 * One target of a cascade stop: its current attempt, the stable command key of that attempt, and
 * where it stands.
 *
 * @remarks
 * `operationId` is minted when the attempt is persisted — before anything is dispatched — and a
 * restart finds the attempt's effect in the target's own record under that key. A definitely
 * rejected attempt (a source revision conflict) is superseded by a new persisted attempt with a
 * fresh key; an uncertain one keeps its key until its outcome is resolved. Earlier attempts remain
 * in the target's operation evidence.
 * @public
 */
export interface IStopTarget {
  readonly taskId: TaskId;
  readonly attempt: number;
  readonly operationId: OperationId;
  readonly state: StopTargetState;
  readonly confirmedRevision?: TaskRevision;
  readonly stableSourceEvidence?: IStableStopEvidence;
  readonly violation?: IStopViolation;
}

/**
 * A persisted cascade stop, held in its root's record.
 *
 * @remarks
 * `targets` is the complete authoritative subtree captured under the writer at acceptance — root
 * first, then breadth-first with task-id tie breaks — never a filtered or truncated tree. The intent
 * is coordination state beside the root's envelope, not part of it: public lifecycle keeps describing
 * the root's own execution. `requestedBy` is provenance, never a retained authorization grant — every
 * pump pass re-resolves current authority.
 * @public
 */
export interface IStopIntent {
  readonly id: OperationId;
  readonly rootId: TaskId;
  readonly mode: StopMode;
  readonly requestedBy: string;
  readonly targets: ReadonlyArray<IStopTarget>;
  readonly state: StopIntentState;
  readonly topologyGeneration: number;
}

/**
 * A request to stop a task and every transitive descendant.
 * @public
 */
export interface IStopRequest {
  readonly taskId: TaskId;
  readonly expectedRevision: TaskRevision;
  readonly operationId: OperationId;
  readonly mode: StopMode;
}

/**
 * A request to release a stop's latch.
 * @public
 */
export interface IReleaseStop {
  readonly taskId: TaskId;
  readonly expectedRevision: TaskRevision;
  readonly operationId: OperationId;
  readonly intentId: OperationId;
}

/**
 * A request to run the host's stop pump once over one intent.
 *
 * @remarks
 * `limit` bounds the effects one pass performs — stop commands, dispatches, source reads,
 * capability checks and resolutions. Reading records costs nothing against it. A pass that stops at
 * its limit cannot make the intent `satisfied`: satisfaction needs every target revisited.
 * @public
 */
export interface IStopReconcileRequest {
  readonly taskId: TaskId;
  readonly intentId: OperationId;
  readonly limit?: number;
}

/**
 * A request to read one intent's current result.
 * @public
 */
export interface IStopInspectRequest {
  readonly taskId: TaskId;
  readonly intentId: OperationId;
}

/**
 * One target as a bound view presents it: never the source evidence, which names source internals.
 * @public
 */
export type IProjectedStopTarget = Omit<IStopTarget, 'stableSourceEvidence'>;

/**
 * A stop's result, as one principal may see it.
 *
 * @remarks
 * `targets` holds only targets the principal may read; the intent itself is not filtered — a target
 * the principal cannot see is still a target. `restrictedWorkRemains` says, without counts or
 * identities, that some target the principal cannot see is not confirmed. `capacity` is present when
 * this call had to make a fresh attempt and could not admit it: the attempt was not made.
 * @public
 */
export interface IStopResult {
  readonly intentId: OperationId;
  readonly rootId: TaskId;
  readonly mode: StopMode;
  readonly state: StopIntentState;
  readonly targets: ReadonlyArray<IProjectedStopTarget>;
  readonly restrictedWorkRemains: boolean;
  readonly capacity?: ICapacityFailure;
}

/**
 * The provenance a target's stop command carries in the target's own record: which intent, of which
 * root, it is an attempt of.
 * @public
 */
export interface IStopCommandMarker {
  readonly rootId: TaskId;
  readonly intentId: OperationId;
}

/**
 * One latch a task is under.
 * @public
 */
export interface IStopLatch {
  readonly rootId: TaskId;
  readonly intentId: OperationId;
  readonly mode: StopMode;
}

/**
 * A command a source designates for a stop, with the parameters to send.
 * @public
 */
export interface ISourceStopCommand {
  readonly command: string;
  readonly parameters: JsonValue;
}

/**
 * What a source declares about stopping one binding (design § 5, § 10 step 6).
 *
 * @remarks
 * - `pause: 'stable-until-explicit-resume'` — an acknowledged pause prevents autonomous restart or
 *   new work until an explicitly authorized resume. Only this makes a paused target `confirmed`.
 * - `pause: 'sampled'` — the source can report a paused state, but it may restart on its own: the
 *   target is `unsupported` for a standing stop even when observed paused.
 * - `cancel: 'terminal-absorbing'` — a terminal state never reopens.
 *
 * `pauseCommand` / `cancelCommand` name the command the kind registry declares for the mode, and its
 * parameters; a mode declared without one is not stoppable. `contractVersion` is persisted as
 * evidence and compared after every reopen. **No library assertion manufactures external fencing**:
 * this is the source's declaration, and a later contradicting observation degrades the stop.
 * @public
 */
export interface ISourceCapabilities {
  readonly contractVersion: string;
  readonly pause: 'unsupported' | 'sampled' | 'stable-until-explicit-resume';
  readonly cancel: 'unsupported' | 'terminal-absorbing';
  readonly pauseCommand?: ISourceStopCommand;
  readonly cancelCommand?: ISourceStopCommand;
}

/**
 * The default maximum number of targets one stop may capture (design § 10 step 1). A larger subtree
 * is refused before anything is written — never truncated.
 * @public
 */
export const defaultMaxStopTargets: number = 1000;

/**
 * The default bound on the effects one pump pass performs.
 * @public
 */
export const defaultStopPumpLimit: number = 50;

/**
 * The stops a replacement of a record carries forward. Every draft built from a record keeps its
 * intents — storage refuses a replacement that drops one — so every draft builder spreads this.
 * @public
 */
export function carriedStops(record: { readonly stops?: ReadonlyArray<IStopIntent> }): {
  readonly stops?: ReadonlyArray<IStopIntent>;
} {
  return record.stops !== undefined ? { stops: record.stops } : {};
}
