/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { SubscriptionId, TaskId, TaskRevision, UpdateId } from './ids';
import { ITaskSummary } from './summary';

/**
 * The categories of owed update a task commit can produce.
 *
 * @remarks
 * The set is closed and its size is load-bearing: a terminal closeout must reserve room
 * for one required payload of every category, so "at most seven" is an arithmetic input
 * to {@link maximumClosureCharges}, not a description.
 * @public
 */
export type UpdateCategory =
  | 'lifecycle'
  | 'progress'
  | 'attention'
  | 'result'
  | 'assignment'
  | 'observation'
  | 'relationship';

/**
 * Every update category.
 * @public
 */
export const allUpdateCategories: ReadonlyArray<UpdateCategory> = [
  'lifecycle',
  'progress',
  'attention',
  'result',
  'assignment',
  'observation',
  'relationship'
];

/**
 * One immutable update payload a task commit owes to an audience.
 *
 * @remarks
 * `snapshot` is the bounded presentation data *for this revision*, frozen when the update
 * was committed — never a reference to mutable current state, which is what lets a required
 * attention change or terminal outcome survive a later revision.
 *
 * An update's identity is the tuple (`taskId`, `revision`, `category`): there is at most one
 * update per category per task revision, and the renderer rejects input that carries two.
 * `snapshot` must describe the same task and revision the update names.
 * @public
 */
export interface ITaskUpdate {
  readonly id: UpdateId;
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly category: UpdateCategory;
  readonly required: boolean;
  readonly snapshot: ITaskSummary;
  readonly audience: ReadonlyArray<SubscriptionId>;
}
