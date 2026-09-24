/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ITaskEnvelope, ITaskUpdate, SubscriptionId, UpdateCategory, taskUpdateId } from '../types';

/**
 * Who is owed an update: the subscriptions whose selection matched the task before **or** after
 * the change, so an exit from a selection is still delivered.
 * @remarks
 * Subscriptions are T7's. Until then the broker's resolver answers "nobody".
 * @public
 */
export type TaskAudienceResolver = (
  before: ITaskEnvelope | undefined,
  after: ITaskEnvelope,
  category: UpdateCategory
) => ReadonlyArray<SubscriptionId>;

/**
 * The resolver with no subscriptions to consult.
 * @public
 */
export const noAudience: TaskAudienceResolver = () => [];

/**
 * Whether an update of a category is required: it must not be coalesced or expire before its
 * audience has it. Progress and observation freshness are informative only.
 * @public
 */
export function isRequiredCategory(category: UpdateCategory): boolean {
  return category !== 'progress' && category !== 'observation';
}

/**
 * The immutable updates a committed revision owes, one per category, each carrying the
 * presentation snapshot of that revision.
 * @remarks
 * An update owed to no one is not retained: nobody could ever acknowledge it, and a subscription
 * created later starts from a baseline rather than back-history. So the result holds only
 * updates with a non-empty audience.
 * @public
 */
export function planUpdates(
  before: ITaskEnvelope | undefined,
  after: ITaskEnvelope,
  categories: ReadonlyArray<UpdateCategory>,
  audience: TaskAudienceResolver
): ReadonlyArray<ITaskUpdate> {
  const updates: ITaskUpdate[] = [];
  for (const category of new Set(categories)) {
    const owed: ReadonlyArray<SubscriptionId> = Array.from(new Set(audience(before, after, category))).sort();
    if (owed.length > 0) {
      updates.push({
        id: taskUpdateId(after.id, after.revision, category),
        taskId: after.id,
        revision: after.revision,
        category,
        required: isRequiredCategory(category),
        snapshot: { envelope: after },
        audience: owed
      });
    }
  }
  return updates;
}
