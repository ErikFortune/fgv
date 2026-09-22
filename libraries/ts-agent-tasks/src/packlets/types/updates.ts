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

/**
 * The longest suffix {@link taskUpdateId} appends to a task id: a separator, up to sixteen
 * revision digits (`Number.MAX_SAFE_INTEGER` has sixteen), a separator and one ordinal digit.
 * @public
 */
export const maxUpdateIdSuffixLength: number = 19;

/**
 * The canonical identity of the update a task owes for one `(revision, category)`.
 *
 * @remarks
 * Design §8.3: "a collision-free tuple encoding of task ID, task revision and category
 * ordinal; never a timestamp or CRC". The encoding is `<taskId>:<revision>:<ordinal>`. A task
 * id may itself contain `:`, but the revision and ordinal are digit-only and are read from
 * the right, so two distinct tuples can never produce the same string.
 *
 * Storage checks every stored update against this encoding, so an update id that disagrees
 * with the task, revision or category it names is an integrity failure rather than a second,
 * silently different identity. (T3: the update-id bound grew by
 * {@link maxUpdateIdSuffixLength} so a maximum-length task id still has one.)
 * @public
 */
export function taskUpdateId(taskId: TaskId, revision: TaskRevision, category: UpdateCategory): UpdateId {
  return `${taskId}:${revision}:${allUpdateCategories.indexOf(category)}` as UpdateId;
}
