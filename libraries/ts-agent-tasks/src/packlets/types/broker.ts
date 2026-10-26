/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import {
  IResponsibility,
  ITaskOutcome,
  ITaskProgress,
  ITaskReference,
  ITaskScope,
  ParentStopPolicy
} from './common';
import { ICommandReceipt, ICommandRequest } from './commands';
import {
  IProjectedTaskSummary,
  IProjectedUnresolvedReference,
  ITaskAuthorization,
  ITaskProjector,
  TaskInspection
} from './authority';
import { TaskResult } from './failure';
import { OperationId, PageCursor, TaskId, TaskKind, TaskRevision, UpdateId } from './ids';
import { TaskLifecycleClass } from './query';
import { TaskLifecycleStatus } from './lifecycle';
import { ISourceBinding, ISourceProjection, RecoveryDeclaration, SourceHistoryDeclaration } from './source';
import { ICommandResolutionReport, ICommandResolutionRequest } from './sourceAdapter';
import { TaskListCompletion } from './builtins';
import { IReleaseStop, IStopInspectRequest, IStopReconcileRequest, IStopRequest, IStopResult } from './stop';

/**
 * A request to create a tracked task through a bound writer.
 * @remarks
 * Scopes are not a field: a bound creation takes the view's host-configured creation scopes.
 * The request is a registration identity — a retry with the same `taskId`, `operationId` and
 * canonical request (under the same principal) replays; anything else under that id conflicts.
 * @public
 */
export interface ICreateTrackedTask {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly title: string;
  readonly description?: string;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
  readonly stopPolicy?: ParentStopPolicy;
}

/**
 * A request to create a task list.
 * @public
 */
export interface ICreateTaskList extends ICreateTrackedTask {
  readonly completion: TaskListCompletion;
}

/**
 * The identity and precondition every mutation of an existing task carries.
 * @public
 */
export interface ITaskMutationIdentity {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly expectedRevision: TaskRevision;
}

/**
 * A patch of a tracked task's presentable fields. An absent member is left alone; `clear` names
 * the optional fields to remove, and may not name a field the patch also sets.
 * @public
 */
export interface ITrackedTaskPatch {
  readonly title?: string;
  readonly description?: string;
  readonly progress?: ITaskProgress;
  readonly attention?: ReadonlyArray<ITaskReference>;
  readonly clear?: ReadonlyArray<'description' | 'progress'>;
}

/**
 * A request to patch a tracked task or list.
 * @public
 */
export interface IUpdateTrackedTask extends ITaskMutationIdentity {
  readonly patch: ITrackedTaskPatch;
}

/**
 * A request to change a task's responsibility. `'unassigned'` unassigns explicitly: the member is
 * required, so an omitted responsibility is never an accidental unassignment.
 * @public
 */
export interface IReassignTask extends ITaskMutationIdentity {
  readonly responsibility: IResponsibility | 'unassigned';
}

/**
 * A request to change a task's scopes.
 * @remarks
 * Expressed as additions and removals, each of which must lie within the bound view's
 * selectors, rather than as a replacement list: a replacement would require a principal to
 * restate scopes it cannot see. Scopes outside the view are never touched.
 * @public
 */
export interface IChangeTaskScopes extends ITaskMutationIdentity {
  readonly add?: ReadonlyArray<ITaskScope>;
  readonly remove?: ReadonlyArray<ITaskScope>;
}

/**
 * A request to move a task under another parent (`{ taskId }`), or to make it a root
 * (`'root'`). The member is required and a parent is tagged, so no task id can be mistaken for the
 * root.
 * @public
 */
export interface IReparentTask extends ITaskMutationIdentity {
  readonly parent: { readonly taskId: TaskId } | 'root';
}

/**
 * An explicit request to complete a task list.
 * @remarks
 * Succeeds only when every current child — the complete authoritative set, hidden and archived
 * children included — has succeeded. An empty list, manual or automatic, completes only this
 * way.
 * @public
 */
export interface ICompleteTaskList extends ITaskMutationIdentity {
  readonly outcome: ITaskOutcome;
}

/**
 * A request to archive a terminal task.
 * @public
 */
export type IArchiveTask = ITaskMutationIdentity;

/**
 * Whether a mutation changed semantic state. An `unchanged` mutation advances no task revision;
 * its evidence is still recorded, so a retry with the same key replays it.
 * @public
 */
export type TaskMutationDisposition = 'changed' | 'unchanged';

/**
 * The receipt of a catalog mutation, and its stored dedup evidence.
 * @remarks
 * `updateIds` names the update payloads the mutation committed. An update is retained only when
 * someone is owed it, so this is empty while no subscription matches.
 * @public
 */
export interface ITaskMutationResult {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly operationId: OperationId;
  readonly disposition: TaskMutationDisposition;
  readonly updateIds: ReadonlyArray<UpdateId>;
}

/**
 * The receipt of a reassignment.
 * @public
 */
export interface IReassignmentResult extends ITaskMutationResult {
  readonly previous?: IResponsibility;
  readonly current?: IResponsibility;
}

/**
 * A trusted host registration of an externally executed task.
 * @remarks
 * Not a bound-view operation: the host supplies scopes, the source binding and the recovery
 * declaration directly. Without an `initialObservation` the task is recorded unresolved, with no
 * lifecycle invented. The binding is catalog metadata and never changes afterwards.
 * @public
 */
export interface IRegisterExternalTask {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly title: string;
  readonly description?: string;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly binding: ISourceBinding;
  readonly recovery: RecoveryDeclaration;
  readonly initialObservation?: ISourceProjection;
  /**
   * The history guarantee this registration relies on. Absent means `observed-state`. A
   * `source-replay` declaration states the finite remaining envelope the task needs to reach a
   * terminal state; it is reserved at registration (design § 8.6) and is refused unless the
   * broker has the source attached and that source is `source-replay`. A `source-replay`
   * registration takes no `initialObservation`: its first state comes from the feed, never from
   * an independent latest read that could jump owed history.
   */
  readonly history?: SourceHistoryDeclaration;
}

/**
 * A bound view's query. Scopes are the view's own; a filter only narrows.
 * @remarks
 * `lifecycleClass` defaults to `all`. There is no `scopes` member, and the converter is strict:
 * a caller-supplied scope filter is refused, never merged.
 * @public
 */
export interface IBoundTaskQuery {
  readonly filter?: {
    readonly responsibility?: IResponsibility;
    readonly parentId?: TaskId;
    readonly lifecycleClass?: TaskLifecycleClass;
    readonly statuses?: ReadonlyArray<TaskLifecycleStatus>;
  };
  readonly limit?: number;
  readonly cursor?: PageCursor;
}

/**
 * One page of a bound view's query.
 * @remarks
 * Holds only tasks the principal may read, projected. Denied candidates are dropped before
 * inclusion and never counted, so a page can be short or empty and still carry a cursor. It has
 * no repository generation: a change counter over the whole repository would leak activity on
 * hidden tasks. `issues` never names a task.
 * @public
 */
export interface IBoundTaskPage {
  readonly items: ReadonlyArray<IProjectedTaskSummary>;
  readonly unresolved: ReadonlyArray<IProjectedUnresolvedReference>;
  readonly nextCursor?: PageCursor;
  readonly completeness: 'complete' | 'partial';
  readonly freshness: 'native-current' | 'source-projection';
  readonly issues: ReadonlyArray<string>;
}

/**
 * A read-only view bound to one principal.
 * @public
 */
export interface IBoundTaskView {
  readonly principal: string;
  query(request: IBoundTaskQuery): Promise<TaskResult<IBoundTaskPage>>;
  inspect(id: TaskId): Promise<TaskResult<TaskInspection>>;
  /**
   * One cascade stop's current result, as this principal may see it: the root must be visible, and
   * only visible targets are listed. Reading it performs no effect. (T9.)
   */
  inspectStop(request: IStopInspectRequest): Promise<TaskResult<IStopResult>>;
}

/**
 * A request to the list-completion pump.
 * @public
 */
export interface IListCompletionRequest {
  readonly limit: number;
  /** Continue where a previous pass stopped, as returned in its `next`. */
  readonly after?: PageCursor;
}

/**
 * What one pump pass did.
 * @remarks
 * `completed` names only lists this principal completed. A candidate it may not complete, or
 * that no longer qualifies when rechecked under the writer, is left as it is and not reported.
 * `next` is present when the pass stopped at its limit. It is an opaque continuation, bound to the
 * view and the policy epoch it was issued under: the candidate it resumes after may be one this
 * principal cannot see, so it is never named.
 * @public
 */
export interface IListCompletionReport {
  readonly completed: ReadonlyArray<ITaskMutationResult>;
  readonly next?: PageCursor;
}

/**
 * A writer bound to one principal.
 * @remarks
 * Every method authorizes its own subject (and each affected parent) and re-verifies that
 * authorization inside the serialized writer before it commits.
 * @public
 */
export interface IBoundTaskWriter extends IBoundTaskView {
  execute(request: ICommandRequest): Promise<TaskResult<ICommandReceipt>>;
  createTracked(request: ICreateTrackedTask): Promise<TaskResult<ITaskMutationResult>>;
  createTaskList(request: ICreateTaskList): Promise<TaskResult<ITaskMutationResult>>;
  updateTracked(request: IUpdateTrackedTask): Promise<TaskResult<ITaskMutationResult>>;
  reassign(request: IReassignTask): Promise<TaskResult<IReassignmentResult>>;
  changeScopes(request: IChangeTaskScopes): Promise<TaskResult<ITaskMutationResult>>;
  reparent(request: IReparentTask): Promise<TaskResult<ITaskMutationResult>>;
  completeList(request: ICompleteTaskList): Promise<TaskResult<ITaskMutationResult>>;
  archive(request: IArchiveTask): Promise<TaskResult<ITaskMutationResult>>;
  reconcileListCompletions(request: IListCompletionRequest): Promise<TaskResult<IListCompletionReport>>;
  /**
   * The uncertain-command pump: settles external commands left unsent or uncertain — by a lookup, a
   * deduplicated resend, or a first dispatch of an intent that was never sent — each re-authorized
   * for this principal at the dispatch boundary. Never re-sends a command its source cannot
   * deduplicate. Repository open never runs it.
   */
  resolveCommands(request: ICommandResolutionRequest): Promise<TaskResult<ICommandResolutionReport>>;
  /**
   * Accepts a cascade stop of a task and its whole authoritative subtree (design § 10). The intent,
   * its complete target set and each target's command key are persisted — and the subtree frozen —
   * before anything is dispatched; nothing is dispatched here. **Acceptance is not completion**: the
   * result is `pending` until {@link IBoundTaskWriter.reconcileStop} confirms every target. (T9.)
   */
  requestStop(request: IStopRequest): Promise<TaskResult<IStopResult>>;
  /**
   * Releases a stop's latch. Applied stops are not undone and commands already sent are not
   * retracted; nothing resumes. A cancel whose root is terminal cannot be released. (T9.)
   */
  releaseStop(request: IReleaseStop): Promise<TaskResult<IStopResult>>;
  /**
   * The host's stop pump: one bounded pass over one intent under current authority — dispatching,
   * resolving and confirming — then the latest result. Installs no timer and starts no work. (T9.)
   */
  reconcileStop(request: IStopReconcileRequest): Promise<TaskResult<IStopResult>>;
  /**
   * Resumes a native registration left pending — accepted into the inventory and not yet marked
   * live; its first record may or may not have landed — from the canonical request the repository
   * stored with it, so a host that lost the original request can still finish it.
   *
   * @remarks
   * Nothing about authority is stored with the intent: `create` is authorized again now, against
   * this view's current policy, and the epoch it was authorized under is re-checked inside the
   * writer immediately before anything is committed. **It is authorized for the scopes that will be
   * committed.** When the first record already landed (its write succeeded, marking it live did
   * not), that record is committed as it is, so `create` is asked of the landed record's scopes,
   * which this view must select. Otherwise the record is written now with this view's creation
   * scopes (the stored request carries none). Storage independently refuses to adopt a landed
   * record whose scopes differ from the ones a registration was authorized for — which also covers
   * an identical `createTracked` retry from a view with other creation scopes.
   *
   * The registration must have been accepted for this view's principal; another principal's is
   * `not-found-or-denied`, like an id with none. A registration an earlier resume committed — its
   * response lost — replays its stored receipt, re-authorized for the live task's scopes, as an
   * identical `createTracked` retry does.
   *
   * A pending `register-external` registration is a trusted host operation with no authorization to
   * repeat; it resumes through `TaskBroker.resumePendingRegistration`, and is `invalid` here.
   * Withdrawing a pending identity, or recycling its slot, is not offered.
   */
  resumePendingRegistration(taskId: TaskId): Promise<TaskResult<ITaskMutationResult>>;
}

/**
 * Wraps every write a broker makes — a cooperative write gate a host supplies to
 * `TaskBroker.create`.
 *
 * @remarks
 * Structural, so any host gate with this shape fits — including `AsyncControl.WriteGate` from
 * `@fgv/ts-extras`, whose `guard` answers an `AsyncResult` over a plain `Result`. `guard` is given
 * the broker's whole writer section and calls it at most once. The broker tracks whether it did:
 *
 * - **Not called.** A failure the gate returns is the operation's result when its detail is a valid
 *   task failure; any other failure (a gate typed over plain `Result`) is reported as
 *   `storage-unavailable`, retry `after-host-action`, since nothing was written. A gate that
 *   answers success without calling the section, or throws, is `invalid`.
 * - **Called.** The section's own result is the operation's result when the gate returns it, or
 *   any success. When the gate then fails or throws, the operation is `storage-unavailable`, retry
 *   `reconcile-first`: the section may have committed. A section the gate started without awaiting
 *   is awaited before the broker's turn ends.
 * - **Called twice.** The second call is refused without running (`invalid`).
 * - **Called after the gate's answer settled.** Refused without running (`invalid`): the section
 *   must be started before the gate's answer settles, or it would run outside the broker's turn. A
 *   gate may wait — on a pause, say — before starting it, as long as it starts it before settling.
 *
 * **The gate must not call the broker.** A broker operation started from inside `guard` queues
 * behind the very section the gate is holding and never runs, and every later broker write queues
 * behind both. The broker cannot tell such a call from a concurrent caller's without an async
 * context the library does not assume, so it is not detected; `TaskBroker.whenIdle` from inside the
 * gate is the one safe call — it does not queue — and times out, since the gate's own section is
 * busy.
 * @public
 */
export interface ITaskWriteGuard {
  guard<T>(write: () => Promise<TaskResult<T>>): PromiseLike<Result<T>>;
}

/**
 * The state of one child, as the authoritative graph holds it.
 * @remarks
 * Every retained child is listed — archived, unresolved and quarantined ones too — so list
 * completion and relationship checks never see a filtered tree.
 * @public
 */
export interface ITaskChildState {
  readonly id: TaskId;
  readonly state: 'resolved' | 'unresolved' | 'quarantined';
  /** The lifecycle status of a resolved child; archived children keep their final status. */
  readonly status?: TaskLifecycleStatus;
  readonly archived: boolean;
}

/**
 * A page of list-completion candidates.
 * @public
 */
export interface IListCompletionCandidateQuery {
  readonly limit: number;
  readonly after?: TaskId;
}

/**
 * What a host binds a view or writer to.
 * @remarks
 * Host-side only: nothing here reaches a request. `principal` is the identity stored with every
 * operation the binding performs and is part of each operation's dedup identity. `scopes` are the
 * view's maximum selectors — a task outside them is invisible whatever the policy says, and a task
 * inside them still needs the policy's `read`. `creationScopes` (default: `scopes`) are what a
 * bound creation labels its task with, and must lie within `scopes`. `projector` defaults to
 * {@link defaultTaskProjector}.
 * @public
 */
export interface IBoundTaskViewParams {
  readonly principal: string;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly creationScopes?: ReadonlyArray<ITaskScope>;
  readonly authorization: ITaskAuthorization;
  readonly projector?: ITaskProjector;
}
