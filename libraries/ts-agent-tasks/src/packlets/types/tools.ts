/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { ITaskContextBudget, TaskContextPresentation, defaultTaskContextBudget } from './context';
import { PageCursor, TaskId } from './ids';

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
