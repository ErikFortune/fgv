/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import { ITaskCapacityProfile, ITaskRecordDraft, TaskId, TaskResult } from '../types';
import { ok, taskFailure } from './failures';

// Rules a write is checked against that need only the profile and the live graph.

/**
 * The per-task operation limit, with the closeout path's own slots held back.
 *
 * @remarks
 * Every accepted task reserves room for a terminal operation and an archive operation
 * (`maximumClosureCharges`). The repository-wide ledger holds those as claims; the per-task
 * bound needs the same protection, or a task could spend its last slot on ordinary work and
 * be unable to finish. So an ordinary operation may use the limit less the closeout slots
 * still owed, and a closeout step may use the whole limit.
 * @internal
 */
export function operationCountFits(
  profile: ITaskCapacityProfile,
  taskId: TaskId,
  count: number,
  heldBack: number
): TaskResult<true> {
  const limit: number = profile.perOwner.maxOperationsPerTask;
  if (count <= limit - heldBack) {
    return ok(true);
  }
  return taskFailure(
    `capacity: task ${taskId} would hold ${count} operations; its limit is ${limit}, ` +
      `of which ${heldBack} are held for closeout`,
    'backpressure',
    'after-host-action',
    {
      capacity: {
        reason: 'capacity-exhausted',
        dimension: 'operations',
        recordId: taskId,
        used: count - 1,
        reserved: heldBack,
        requested: 1,
        limit,
        reclaimableByCleanup: false
      }
    }
  );
}

/**
 * A parent edge must name a live task, and must not close a cycle.
 * @internal
 */
export function parentEdgeFits(
  taskId: TaskId,
  draft: ITaskRecordDraft,
  parentOf: (id: TaskId) => TaskId | undefined,
  isLive: (id: TaskId) => boolean
): TaskResult<true> {
  const parentId: TaskId | undefined =
    draft.recordType === 'resolved' ? draft.task.envelope.parentId : draft.reference.parentId;
  if (parentId === undefined || parentId === parentOf(taskId)) {
    return ok(true);
  }
  const seen: Set<TaskId> = new Set<TaskId>([taskId]);
  let cursor: TaskId | undefined = parentId;
  while (cursor !== undefined) {
    if (seen.has(cursor)) {
      return taskFailure(
        `task ${taskId}: parent ${parentId} would close a cycle`,
        'invalid',
        'after-host-action'
      );
    }
    if (!isLive(cursor)) {
      return taskFailure(
        `task ${taskId}: parent ${cursor} is not a live task`,
        'invalid',
        'after-host-action'
      );
    }
    seen.add(cursor);
    cursor = parentOf(cursor);
  }
  return ok(true);
}

/**
 * A requested profile that raises the stored one: it converts, and no limit or bound is lower than
 * its stored value — lowering in place is unsupported.
 * @internal
 */
export function raisedProfile(
  converters: TaskConverters,
  stored: ITaskCapacityProfile,
  requested: ITaskCapacityProfile
): TaskResult<ITaskCapacityProfile> {
  const converted: Result<ITaskCapacityProfile> = converters.capacity.profile.convert(requested);
  if (converted.isFailure()) {
    return taskFailure(`raiseCapacityLimits: ${converted.message}`, 'invalid', 'after-host-action');
  }
  const profile: ITaskCapacityProfile = converted.value;
  const lowered: string[] = [];
  const compare = (
    group: string,
    before: Readonly<Record<string, number>>,
    after: Readonly<Record<string, number>>
  ): void => {
    for (const key of Object.keys(before)) {
      if (after[key] < before[key]) {
        lowered.push(`${group}.${key}`);
      }
    }
  };
  compare('limits', stored.limits, profile.limits);
  compare('perOwner', { ...stored.perOwner }, { ...profile.perOwner });
  compare('encoded', { ...stored.encoded }, { ...profile.encoded });
  if (lowered.length > 0) {
    return taskFailure(
      `raiseCapacityLimits: lowering limits in place is unsupported (${lowered.join(', ')})`,
      'unsupported',
      'after-host-action'
    );
  }
  return ok(profile);
}
