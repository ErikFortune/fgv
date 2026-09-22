/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

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
