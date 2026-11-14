/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ITaskChildState, TaskId } from '../types';

/**
 * Decides whether a task list may succeed, from its **complete authoritative** child set.
 *
 * @remarks
 * `children` must be every retained child — archived, unresolved, quarantined and hidden ones
 * included — never a view's filtered tree. Every child must be resolved and succeeded: an
 * unresolved or unreadable child has no lifecycle to count, and a failed or cancelled child
 * leaves the list open for host action. With `requireChild`, an empty list is refused (the pump's
 * rule: automatic completion needs at least one child; an empty list completes only
 * explicitly). Succeeds with the number of children counted.
 * @public
 */
export function checkListCompletion(
  listId: TaskId,
  children: ReadonlyArray<ITaskChildState>,
  requireChild: boolean
): Result<number> {
  if (requireChild && children.length === 0) {
    return fail(`list ${listId}: has no children; an empty list completes only explicitly`);
  }
  const blocking: number = children.filter(
    (child) => child.state !== 'resolved' || child.status !== 'succeeded'
  ).length;
  if (blocking > 0) {
    // A count, never identities: a child may be hidden from whoever is asking.
    return fail(`list ${listId}: ${blocking} child task(s) have not succeeded`);
  }
  return succeed(children.length);
}
