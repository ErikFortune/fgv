/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

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
import { ISourceBinding, ISourceProjection, RecoveryDeclaration } from './source';
import { TaskListCompletion } from './builtins';

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
