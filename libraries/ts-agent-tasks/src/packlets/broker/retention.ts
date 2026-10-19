/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ITaskUpdate, TaskRevision } from '../types';
import { ITaskRepository } from '../storage';

/**
 * A commit's updates: those the record retains, with the new ones added — and, where coalescing
 * applies (design § 9), each earlier routine update of a new routine update's category that the
 * repository says it may supersede dropped, the new update marking the earliest revision it replaced.
 *
 * @remarks
 * A plan, not a decision: the repository re-decides every drop from durable evidence in the commit
 * and refuses one it cannot prove, so an optimistic plan here fails loudly rather than losing an
 * obligation.
 * @internal
 */
export function mergeUpdates(
  repository: Pick<ITaskRepository, 'supersedable'>,
  retained: ReadonlyArray<ITaskUpdate>,
  added: ReadonlyArray<ITaskUpdate>
): ReadonlyArray<ITaskUpdate> {
  let kept: ReadonlyArray<ITaskUpdate> = retained;
  const next: ITaskUpdate[] = [];
  for (const update of added) {
    const superseded: ReadonlyArray<ITaskUpdate> = update.required
      ? []
      : kept.filter(
          (u) =>
            u.category === update.category &&
            u.revision < update.revision &&
            repository.supersedable(u, update.audience)
        );
    if (superseded.length === 0) {
      next.push(update);
      continue;
    }
    const fromRevision: TaskRevision = Math.min(
      ...superseded.map((u) => u.coalesced?.fromRevision ?? u.revision)
    ) as TaskRevision;
    kept = kept.filter((u) => !superseded.includes(u));
    next.push({ ...update, coalesced: { fromRevision } });
  }
  return [...kept, ...next];
}
