/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { ITaskContextBudget, TaskContextPresentation, defaultTaskContextBudget } from './context';
import { OperationId, PageCursor, TaskId, TaskKind, TaskRevision } from './ids';
import { TaskMutationDisposition } from './broker';
import { IStopViolation, StopIntentState, StopMode, StopTargetState } from './stop';

/**
 * Bounds on what one task tool call returns to a model.
 *
 * @remarks
 * `context` bounds every task presentation: tasks reach the model only as rendered context text,
 * and `context.maxItems` is also the largest page a query may ask for. `maxDetailsChars` bounds the
 * JSON text of a task's details, counted in UTF-16 code units; details over it are omitted and the
 * omission is reported.
 * @public
 */
export interface ITaskToolBudget {
  readonly context: ITaskContextBudget;
  readonly maxDetailsChars: number;
}

/**
 * The default {@link ITaskToolBudget}: the default context budget, and 4,000 characters of details.
 * @public
 */
export const defaultTaskToolBudget: ITaskToolBudget = {
  context: defaultTaskContextBudget,
  maxDetailsChars: 4000
};

/**
 * How a task tool presented one task: in full, abbreviated, or not at all.
 * @public
 */
export type TaskToolPresentation = TaskContextPresentation | 'omitted';

/**
 * What `task_query` returns to the model.
 *
 * @remarks
 * `context` is the rendered page. A task on the page that the rendering left out is named in
 * `omitted`, and one it shortened in `abbreviated`, so the model can inspect it: `nextCursor`
 * continues after the whole page, including what the text did not show. `completeness`,
 * `freshness` and `issues` are the view's own.
 * @public
 */
export interface ITaskQueryToolResult {
  readonly context: string;
  readonly omitted: ReadonlyArray<TaskId>;
  readonly abbreviated: ReadonlyArray<TaskId>;
  readonly nextCursor?: PageCursor;
  readonly completeness: 'complete' | 'partial';
  readonly freshness: 'native-current' | 'source-projection';
  readonly issues: ReadonlyArray<string>;
}

/**
 * What `task_inspect` returns to the model for a resolved task.
 *
 * @remarks
 * `revision` is the revision the view read. A mutation tool takes it back as `expectedRevision`,
 * and the writer refuses the change if the task has moved since: a stale inspection is the model's
 * to refresh, never overwritten by the tool.
 * `commands` are those the view reports available for this call. `details` appears only when the
 * view's projector exposes details and their JSON fits the budget; when it does not fit,
 * `detailsOmitted` says so and no part of them is returned. The details budget is independent of
 * the context budget, so details can be returned for a task whose text was omitted. Unlike
 * `context`, details are the host projector's JSON as it produced it — structured data, not framed
 * or escaped text.
 * @public
 */
export interface ITaskInspectResolvedToolResult {
  readonly state: 'resolved';
  readonly context: string;
  readonly presentation: TaskToolPresentation;
  readonly revision: TaskRevision;
  readonly archived: boolean;
  readonly commands: ReadonlyArray<string>;
  readonly details?: JsonValue;
  readonly detailsOmitted?: 'too-large';
}

/**
 * What `task_inspect` returns to the model for a registered task with no usable observation yet.
 * @public
 */
export interface ITaskInspectUnresolvedToolResult {
  readonly state: 'unresolved';
  readonly context: string;
  readonly presentation: TaskToolPresentation;
}

/**
 * What `task_inspect` returns to the model.
 * @public
 */
export type TaskInspectToolResult = ITaskInspectResolvedToolResult | ITaskInspectUnresolvedToolResult;

/**
 * A group of mutation tools a host can opt into.
 *
 * @remarks
 * - `tracked` — `task_create` (a tracked task, optionally under a parent and with a responsible
 *   party) and `task_update` (a tracked task's title, description and progress).
 * - `reassign` — `task_reassign` (a task's responsible party).
 *
 * Opting in makes a tool available; it authorizes nothing. Every call is authorized by the bound
 * writer's policy when it runs.
 * @public
 */
export type TaskMutationToolGroup = 'tracked' | 'reassign';

/**
 * Every {@link TaskMutationToolGroup}.
 * @public
 */
export const allTaskMutationToolGroups: ReadonlyArray<TaskMutationToolGroup> = ['tracked', 'reassign'];

/**
 * What `task_create`, `task_update` and `task_reassign` return to the model.
 *
 * @remarks
 * The task's id, its revision after the call, and whether the call changed it. `revision` is what a
 * further mutation passes as `expectedRevision`. The writer's operation id and update ids are not
 * returned: the model never supplies an operation id, and which updates were retained says whether
 * anyone else is subscribed to the task.
 * @public
 */
export interface ITaskMutationToolResult {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly disposition: TaskMutationDisposition;
}

/**
 * One registered command a host offers the model as a tool.
 *
 * @remarks
 * The command is looked up in the kind registry when the tools are built — its kind, detail
 * version and command name must be registered — and the tool's wire schema carries that command's registered
 * parameter schema. The tool sends the command only to tasks of exactly this kind and detail version.
 *
 * `name` is the tool's name. It defaults to `task_command_` followed by the command name, with every
 * character a provider does not accept in a tool name replaced by `_`. It may not be one of the fixed
 * task tool names, whether or not those tools are offered, and no two command tools may share one: a
 * clash — including two kinds that register the same command name — refuses the whole tool set when
 * it is built, and the host names one of them.
 *
 * `description`, when given, replaces the first sentence of the tool's description; the sentences
 * that say what the result means are always appended.
 * @public
 */
export interface ITaskCommandToolSpec {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly command: string;
  readonly name?: string;
  readonly description?: string;
}

/**
 * What a command tool returns to the model when the command was taken: `accepted` — the command is
 * recorded for the task's executor, which does **not** mean it has taken effect (nor, in one race,
 * that it has been sent yet) — or `applied`, with the task's revision at which it took effect.
 *
 * @remarks
 * A refusal, and a command whose outcome is not known, are tool failures instead. A source's own
 * receipt text and a held command's reason are never returned; they go to the host's logger.
 * @public
 */
export type TaskCommandToolResult =
  | { readonly taskId: TaskId; readonly state: 'accepted' }
  | { readonly taskId: TaskId; readonly state: 'applied'; readonly revision: TaskRevision };

/**
 * One target of a stop as `task_stop` and `task_stop_inspect` show it to the model: the task, where it
 * stands, and — when present — the revision its stopped state was confirmed at and a violation of a
 * stable stop.
 *
 * @remarks
 * A target's attempt number and command key are not shown. The model never supplies an operation id,
 * so a command key is of no use to it, and the attempt counts the host's retries against a source.
 * @public
 */
export interface ITaskStopToolTarget {
  readonly taskId: TaskId;
  readonly state: StopTargetState;
  readonly confirmedRevision?: TaskRevision;
  readonly violation?: IStopViolation;
}

/**
 * What `task_stop` and `task_stop_inspect` return to the model: one stop as this principal may see
 * it, its targets a page at a time.
 *
 * @remarks
 * `intentId` names the stop; `task_stop_inspect` takes it back. `taskId` is the stop's root.
 *
 * `counts` counts every target this principal may see, by state — states with none are left out —
 * over the whole stop, not the page. `targets` is one page of those targets, in the stop's own order
 * (root first, then breadth-first), at most the tool budget's `context.maxItems`. `remaining` is how
 * many visible targets follow the page; when there are any, `nextAfter` names the page's last target,
 * and `task_stop_inspect` continues after it. Nothing is dropped: every visible target is on some page.
 *
 * `restrictedWorkRemains` says, without counts or identities, that some target this principal cannot
 * see is not confirmed. A host capacity refusal the stop met is never returned: it goes to the host's
 * logger, and the affected target's own state says it is blocked.
 * @public
 */
export interface ITaskStopToolResult {
  readonly intentId: OperationId;
  readonly taskId: TaskId;
  readonly mode: StopMode;
  readonly state: StopIntentState;
  readonly counts: Readonly<Partial<Record<StopTargetState, number>>>;
  readonly targets: ReadonlyArray<ITaskStopToolTarget>;
  readonly remaining: number;
  readonly nextAfter?: TaskId;
  readonly restrictedWorkRemains: boolean;
}
