/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { TaskKind } from './ids';

/**
 * The built-in tracked task kind.
 *
 * @remarks
 * Its details are deliberately an *empty* strict object: every field a tracked task
 * needs is already a common envelope field, so a second place to put them would be a
 * second authority.
 * @public
 */
export const trackedTaskKind: TaskKind = 'fgv.tracked' as TaskKind;

/**
 * The detail version of {@link trackedTaskKind} this release registers.
 * @public
 */
export const trackedTaskDetailVersion: number = 1;

/**
 * Details for `fgv.tracked@1` — empty, and strict, so an unexpected property fails.
 * @public
 */
export type TrackedTaskDetails = Readonly<Record<string, never>>;

/**
 * The commands `fgv.tracked@1` registers.
 *
 * @remarks
 * These are narrow transitions, not an arbitrary external `setStatus`. Responsibility,
 * scopes and parentage move through separate broker metadata operations and are
 * deliberately absent here.
 * @public
 */
export type TrackedTaskCommandName =
  | 'start'
  | 'wait'
  | 'pause'
  | 'resume'
  | 'succeed'
  | 'fail'
  | 'cancel'
  | 'set-title'
  | 'set-description'
  | 'set-progress'
  | 'set-attention';

/**
 * Every {@link TrackedTaskCommandName}, transitions first.
 * @public
 */
export const trackedTaskCommandNames: ReadonlyArray<TrackedTaskCommandName> = [
  'start',
  'wait',
  'pause',
  'resume',
  'succeed',
  'fail',
  'cancel',
  'set-title',
  'set-description',
  'set-progress',
  'set-attention'
];

/**
 * The built-in task-list kind.
 * @public
 */
export const taskListKind: TaskKind = 'fgv.task-list' as TaskKind;

/**
 * The detail version of {@link taskListKind} this release registers.
 * @public
 */
export const taskListDetailVersion: number = 1;

/**
 * How a task list reaches `succeeded`.
 *
 * @remarks
 * `all-children-succeeded` is a *recoverable derived action*, not a cross-record
 * transaction with child success: it requires at least one child, an authoritative
 * complete child set, every child succeeded and no active stop, and it is committed by
 * an explicit host reconciliation pass. An empty list needs explicit completion; an
 * ordinary tracked parent never aggregates at all.
 * @public
 */
export type TaskListCompletion = 'manual' | 'all-children-succeeded';

/**
 * Details for `fgv.task-list@1`.
 * @public
 */
export interface ITaskListDetails {
  readonly completion: TaskListCompletion;
}
