/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { IResponsibility } from './common';
import { ITaskContextBudget, TaskContextPresentation, defaultTaskContextBudget } from './context';
import { PageCursor, TaskId, TaskRevision } from './ids';
import { TaskMutationDisposition } from './broker';

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
 * What `task_create` and `task_update` return to the model.
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
 * What `task_reassign` returns to the model: a {@link ITaskMutationToolResult} and the responsible
 * party before and after. An absent party is unassigned.
 * @public
 */
export interface ITaskReassignToolResult extends ITaskMutationToolResult {
  readonly previous?: IResponsibility;
  readonly current?: IResponsibility;
}
