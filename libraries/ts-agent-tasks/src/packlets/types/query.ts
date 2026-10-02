/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { TaskInputCompleteness } from './context';
import { IResponsibility, ITaskScope } from './common';
import { Instant, PageCursor, SubscriptionId, TaskId } from './ids';
import { TaskLifecycleStatus } from './lifecycle';
import { ITaskSummary, IUnresolvedTaskReference } from './summary';
import { ITaskUpdate } from './updates';

/**
 * Which lifecycle states a selection admits. `open` is pending, running, waiting and paused;
 * `terminal` is succeeded, failed and cancelled; `all` is both.
 * @public
 */
export type TaskLifecycleClass = 'open' | 'terminal' | 'all';

/**
 * Every {@link TaskLifecycleClass}.
 * @public
 */
export const allTaskLifecycleClasses: ReadonlyArray<TaskLifecycleClass> = ['open', 'terminal', 'all'];

/**
 * What a query selects.
 *
 * @remarks
 * `scopes` is a **union**, never a fallback order, and an empty list matches nothing — there is
 * no implicit global access. `parentId` selects direct children only. `responsibility` narrows;
 * it confers no access. `statuses`, when present, must all belong to `lifecycleClass` (an
 * incompatible pair is refused, not answered with an empty page); an empty list matches nothing.
 *
 * Ordinary selections enumerate **non-archived** tasks, terminal ones awaiting cleanup included.
 * An archived task is inspected directly by id, never enumerated.
 * @public
 */
export interface ITaskSelection {
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly responsibility?: IResponsibility;
  readonly parentId?: TaskId;
  readonly lifecycleClass: TaskLifecycleClass;
  readonly statuses?: ReadonlyArray<TaskLifecycleStatus>;
}

/**
 * A page request. `limit` defaults to 50 and may not exceed 200.
 * @public
 */
export interface ITaskQuery {
  readonly selection: ITaskSelection;
  readonly limit?: number;
  readonly cursor?: PageCursor;
}

/**
 * A due-candidate page request: waiting tasks whose `notBefore` is present and at or before
 * `cutoff`. Querying never starts, resumes or otherwise changes a task.
 * @public
 */
export interface IDueTaskQuery extends ITaskQuery {
  readonly cutoff: Instant;
}

/**
 * One page of tasks.
 *
 * @remarks
 * Ordinary pages are ordered by task id; due pages by `(notBefore, taskId)`. `unresolved`
 * references matched the selection's scopes, parent and responsibility but have no lifecycle to
 * classify; they consume the same page budget, and their presence makes the page `partial`, as
 * does a matching task whose kind is not registered (named in `issues`).
 *
 * `nextCursor` is present whenever the query may have more — including when the page's
 * candidate budget ran out before the page filled, which can return a short or even empty page
 * that is **not** the end. A cursor is valid only at the returned `generation`: any committed
 * change restarts paging.
 * @public
 */
export interface ITaskPage {
  readonly items: ReadonlyArray<ITaskSummary>;
  readonly unresolved: ReadonlyArray<IUnresolvedTaskReference>;
  readonly nextCursor?: PageCursor;
  readonly generation: number;
  readonly completeness: TaskInputCompleteness;
  /** `source-projection` when any item is bound to an external source. */
  readonly freshness: 'native-current' | 'source-projection';
  readonly issues: ReadonlyArray<string>;
}

/**
 * A request for the updates a subscription is owed.
 * @public
 */
export interface IOwedUpdateQuery {
  readonly subscription: SubscriptionId;
  readonly limit?: number;
  readonly cursor?: PageCursor;
}

/**
 * One page of owed updates, ordered by task, revision and category.
 *
 * @remarks
 * Owed-update lookup is independent of every lifecycle index: a terminal or archived task's
 * obligations remain listed after it leaves open work.
 * @public
 */
export interface IOwedUpdatePage {
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly nextCursor?: PageCursor;
  readonly generation: number;
  readonly completeness: TaskInputCompleteness;
}

/**
 * The default page size.
 * @public
 */
export const defaultTaskPageLimit: number = 50;

/**
 * The largest page a query may request.
 * @public
 */
export const maxTaskPageLimit: number = 200;
