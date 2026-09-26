/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IPendingInventoryEntry,
  IResolvedTaskCommitRecord,
  IResolvedTaskRecordDraft,
  ITaskCommitRecord,
  ITaskOutstandingReport,
  ITaskRecordDraft,
  ITaskUpdate,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskResult,
  maxTaskPageLimit
} from '../types';
import { updatesOf } from './commitRules';
import { ISubscriptionEvidence } from './consumerRecords';
import { DeliveryBook } from './deliveryBook';
import { ok, propagate, taskFailure } from './failures';
import { TaskIndex } from './taskIndex';

// Retention: when an update may leave a task record, which updates cleanup may prune, whether a
// routine update may be superseded, and the report of every incomplete operation.

/**
 * Reads each subscription's durable evidence once per decision.
 * @internal
 */
export class EvidenceReader {
  private readonly _read: (subscription: SubscriptionId) => TaskResult<ISubscriptionEvidence>;
  private readonly _held: Map<SubscriptionId, ISubscriptionEvidence> = new Map();

  public constructor(read: (subscription: SubscriptionId) => TaskResult<ISubscriptionEvidence>) {
    this._read = read;
  }

  /** A subscription's evidence, read through the checkpoint store the first time it is asked for. */
  public of(subscription: SubscriptionId): TaskResult<ISubscriptionEvidence> {
    const held: ISubscriptionEvidence | undefined = this._held.get(subscription);
    if (held !== undefined) {
      return ok(held);
    }
    return this._read(subscription).onSuccess((evidence) => {
      this._held.set(subscription, evidence);
      return ok(evidence);
    });
  }
}

/**
 * The retention rule (design § 9, *Retention*), checked against durable evidence before any update
 * leaves a record.
 *
 * @remarks
 * An update with an audience may be dropped only when every audience member's checkpoint — read
 * through the store and verified against what was committed, never the resident index — holds its
 * id in the exact history (acknowledged or disposed); or when it is a routine update superseded, in
 * this very commit, by a newer update of its category whose `coalesced` marker records the gap, and
 * every member still owed it is active, takes coalescing, is in the newer update's audience, and has
 * no unacknowledged receipt naming it. A checkpoint that cannot be read or verified fences and
 * refuses: corruption blocks cleanup, it is never skipped.
 *
 * A tombstone owes nothing: archiving is refused while the record would still retain an update with
 * an audience, or while any subscription is still owed a baseline obligation for the task. (A command
 * that is unsettled or awaiting its feed is refused earlier, by the commit's purpose rules.)
 *
 * No message names a subscription: a refusal reaches whichever principal made the commit, and which
 * consumers exist is host knowledge (`outstanding()` reports it to the host).
 * @internal
 */
export function checkRetention(params: {
  readonly taskId: TaskId;
  readonly current: ITaskCommitRecord;
  readonly draft: ITaskRecordDraft;
  readonly operationId: OperationId | undefined;
  readonly evidence: EvidenceReader;
  /** Whether an active subscription takes coalescing. */
  readonly coalesces: (subscription: SubscriptionId) => boolean;
  readonly baselinesOwed: number;
}): TaskResult<true> {
  const { taskId, current, draft, operationId } = params;
  const detail = operationId !== undefined ? { operationId } : undefined;
  const blocked = (message: string): TaskResult<true> =>
    taskFailure(`commit ${taskId}: ${message}`, 'retention-blocked', 'after-host-action', detail);
  const before: ReadonlyArray<ITaskUpdate> = updatesOf(current);
  const next: ReadonlyArray<ITaskUpdate> = updatesOf(draft);
  const kept: ReadonlySet<string> = new Set(next.map((u) => u.id));
  const retained: ReadonlySet<string> = new Set(before.map((u) => u.id));
  const added: ReadonlyArray<ITaskUpdate> = next.filter((u) => !retained.has(u.id));
  const dropped: ReadonlyArray<ITaskUpdate> = before.filter((u) => !kept.has(u.id));

  // A coalescing marker describes exactly the updates of its category this commit drops: its
  // `fromRevision` is the earliest revision among them (carried forward from any they had superseded
  // themselves). A commit adds at most one update per category — update identity is (task, revision,
  // category) — so no two markers can claim the same drops.
  for (const update of added) {
    if (update.coalesced === undefined) {
      continue;
    }
    const superseded: ReadonlyArray<ITaskUpdate> = dropped.filter((u) => u.category === update.category);
    const from: number = Math.min(...superseded.map((u) => u.coalesced?.fromRevision ?? u.revision));
    if (superseded.length === 0 || from !== update.coalesced.fromRevision) {
      return taskFailure(
        `commit ${taskId}: update ${update.id} marks a gap from revision ${update.coalesced.fromRevision}, ` +
          `but this commit supersedes ${
            superseded.length === 0 ? 'no update of its category' : `from revision ${from}`
          }`,
        'invalid',
        'after-host-action',
        detail
      );
    }
  }

  for (const update of dropped) {
    for (const member of update.audience) {
      const held: TaskResult<ISubscriptionEvidence> = params.evidence.of(member);
      if (held.isFailure()) {
        return propagate(held);
      }
      if (held.value.discharged.has(update.id)) {
        continue;
      }
      const newer: ITaskUpdate | undefined = added.find(
        (u) => u.category === update.category && u.coalesced !== undefined
      );
      const coalescing: boolean =
        !update.required &&
        newer !== undefined &&
        newer.audience.includes(member) &&
        params.coalesces(member);
      if (!coalescing) {
        return blocked(`update ${update.id} is still owed; it leaves only once acknowledged or disposed`);
      }
      if (held.value.pinned.has(update.id)) {
        return blocked(
          `update ${update.id} is named by an issued receipt that is not acknowledged; it cannot be superseded`
        );
      }
    }
  }

  const archiving: boolean =
    draft.recordType === 'resolved' &&
    draft.archived &&
    !(current.recordType === 'resolved' && current.archived);
  if (archiving) {
    if (next.some((u) => u.audience.length > 0)) {
      return blocked(`updates are still owed; they must be acknowledged or disposed of first`);
    }
    if (params.baselinesOwed > 0) {
      return blocked(
        `a baseline obligation for it is still owed; it must be acknowledged or disposed of first`
      );
    }
  }
  return ok(true);
}

/**
 * The ids of the updates every audience member has discharged, by durable evidence: what cleanup may
 * prune. An update owed to no one is left for the ordinary commit path.
 * @internal
 */
export function dischargedUpdates(
  updates: ReadonlyArray<ITaskUpdate>,
  evidence: EvidenceReader
): TaskResult<ReadonlySet<string>> {
  const discharged: Set<string> = new Set();
  for (const update of updates) {
    if (update.audience.length === 0) {
      continue;
    }
    let all: boolean = true;
    for (const member of update.audience) {
      const held: TaskResult<ISubscriptionEvidence> = evidence.of(member);
      if (held.isFailure()) {
        return propagate(held);
      }
      all = all && held.value.discharged.has(update.id);
    }
    if (all) {
      discharged.add(update.id);
    }
  }
  return ok(discharged);
}

/**
 * A resolved record, unchanged but for the updates `ids` names, as a maintenance draft.
 * @internal
 */
export function withoutUpdates(
  record: IResolvedTaskCommitRecord,
  ids: ReadonlySet<string>
): IResolvedTaskRecordDraft {
  return {
    recordType: 'resolved',
    task: record.task,
    ...(record.sourceRevision !== undefined ? { sourceRevision: record.sourceRevision } : {}),
    operations: record.operations,
    updates: record.updates.filter((u) => !ids.has(u.id)),
    archived: record.archived
  };
}

/**
 * Whether a newer routine update owed to `audience` may supersede `update`, from resident state: it
 * is not required, and every member still owed it is active, takes coalescing, is in `audience`, and
 * has no unacknowledged receipt naming it. A plan only — the commit re-decides from durable evidence.
 * @internal
 */
export function isSupersedable(
  update: ITaskUpdate,
  audience: ReadonlyArray<SubscriptionId>,
  index: TaskIndex,
  book: DeliveryBook
): boolean {
  // Asked only about an earlier update of a routine category — `required` follows the category — so
  // `update` is never required here; the commit refuses a required drop regardless.
  return update.audience.every((member) => {
    if (!index.isOwed(member, update.id)) {
      return true;
    }
    const state = book.subscriptions.get(member);
    return (
      state !== undefined &&
      state.descriptor.policy.coalesceProgress &&
      audience.includes(member) &&
      !state.pinned.has(update.id)
    );
  });
}

/**
 * Every incomplete operation, from resident state, each list bounded by `limit`.
 * @internal
 */
export function outstandingReport(
  requested: number | undefined,
  index: TaskIndex,
  pending: ReadonlyMap<string, IPendingInventoryEntry>,
  book: DeliveryBook
): TaskResult<ITaskOutstandingReport> {
  const limit: number = requested ?? maxTaskPageLimit;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxTaskPageLimit) {
    return taskFailure(
      `outstanding: limit must be an integer from 1 to ${maxTaskPageLimit}`,
      'invalid',
      'after-host-action'
    );
  }
  let truncated: boolean = false;
  const bounded = <T>(items: ReadonlyArray<T>): ReadonlyArray<T> => {
    truncated = truncated || items.length > limit;
    return items.slice(0, limit);
  };
  // Every key in these sets is a task id the index added under that brand.
  const ids = (keys: ReadonlyArray<string>): ReadonlyArray<TaskId> => bounded(keys.map((k) => k as TaskId));
  const retained = [...book.subscriptions.values(), ...book.closed.values()].sort((a, b) =>
    a.descriptor.id < b.descriptor.id ? -1 : 1
  );
  return ok({
    // Pending task entries were validated with the task-id syntax by the manifest converter.
    pendingRegistrations: bounded(
      Array.from(pending.values())
        .map((e) => ({ taskId: e.id as TaskId, operationId: e.operationId }))
        .sort((a, b) => (a.taskId < b.taskId ? -1 : 1))
    ),
    pendingSubscriptions: bounded(
      Array.from(book.pending.values())
        .map((e) => ({ subscriptionId: e.id, operationId: e.operationId }))
        .sort((a, b) => (a.subscriptionId < b.subscriptionId ? -1 : 1))
    ),
    unsettledCommands: ids(index.unsettledCommands.keys),
    awaitingCommands: ids(index.awaitingCommands.keys),
    prunable: ids(index.prunable.keys),
    subscriptions: bounded(
      retained.map((state) => ({
        subscriptionId: state.descriptor.id,
        state: state.descriptor.state,
        owed: index.owedCount(state.descriptor.id),
        pinned: state.pinned.size
      }))
    ),
    truncated
  });
}
