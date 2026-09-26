/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IPendingConsumerEntry,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskSubscriptionSpecification,
  ITaskUpdate,
  SubscriptionId,
  TaskId,
  TaskResult,
  UpdateCategory
} from '../types';
import { updatesOf } from './commitRules';
import { ok, taskFailure } from './failures';
import { canonicallyEqual } from './layout';
import { ILedgerEntry } from './ledger';
import { ITaskProjection, deliveryUnits } from './projection';
import { INormalizedSelection, normalizeSelection } from './queries';
import {
  ICatalogFields,
  ISubscriptionState,
  audienceOf,
  catalogMatches,
  catalogOf,
  subscriptionEntry,
  subscriptionKey
} from './subscriptions';
import { TaskIndex } from './taskIndex';

/**
 * What one task commit does to the subscriptions: checked before anything is written, applied to
 * the book only after the record commits.
 * @internal
 */
export interface ITaskDeliveryPlan {
  readonly taskId: TaskId;
  /** Audience links the commit adds. Their acknowledgement evidence is part of the commit's growth. */
  readonly newLinks: number;
  /** The subscriptions that could be in the task's audience after the commit. */
  readonly potential: ReadonlyArray<SubscriptionId>;
  /** Each affected subscription's delivery units after the commit. */
  readonly units: ReadonlyMap<SubscriptionId, number>;
  /** Each affected subscription's ledger entry after the commit. */
  readonly entries: ReadonlyMap<string, ILedgerEntry>;
}

/**
 * The repository's resident subscription state (T7): the active subscriptions, pending
 * registrations, each task's potential audience and each subscription's delivery units.
 *
 * @remarks
 * Everything here is derived from committed records and rebuilt by open: nothing is persisted that
 * is not also in a consumer or task record. The potential audience of a task is every active
 * subscription whose selection matches its catalog fields — scopes, parent, responsibility — since
 * any open status and every terminal status is still reachable without a catalog operation. It is
 * capped at `maxAudiencePerUpdate`, which is exactly what the task's claims reserved per update, so
 * every required update the task has reserved room for can be delivered to everyone it could be owed
 * to. A subscription's delivery units are the sum, over the tasks in whose potential audience it is,
 * of those tasks' future protected commits.
 * @internal
 */
export class DeliveryBook {
  /** Active subscriptions: every one joins the audiences its selection and categories match. */
  public readonly subscriptions: Map<SubscriptionId, ISubscriptionState>;
  /**
   * Closed subscriptions: retained records that join no audience and hold no delivery units, but
   * still hold the obligations they kept, their history and — while they may drain — a preparation.
   */
  public readonly closed: Map<SubscriptionId, ISubscriptionState> = new Map();
  public readonly pending: Map<SubscriptionId, IPendingConsumerEntry>;
  private readonly _potential: Map<TaskId, ReadonlyArray<SubscriptionId>> = new Map();
  private readonly _units: Map<SubscriptionId, number> = new Map();

  public constructor(
    subscriptions: Map<SubscriptionId, ISubscriptionState>,
    pending: Map<SubscriptionId, IPendingConsumerEntry>
  ) {
    this.subscriptions = subscriptions;
    this.pending = pending;
  }

  /**
   * Builds a book from scanned subscriptions over the live tasks: each subscription joins the
   * potential audience of every task it catalog-matches, in id order.
   */
  public static build(
    subscriptions: Map<SubscriptionId, ISubscriptionState>,
    pending: Map<SubscriptionId, IPendingConsumerEntry>,
    index: TaskIndex,
    tasks: ReadonlyMap<TaskId, ITaskProjection>
  ): DeliveryBook {
    const book: DeliveryBook = new DeliveryBook(new Map(), pending);
    for (const id of Array.from(subscriptions.keys()).sort()) {
      const state: ISubscriptionState = subscriptions.get(id)!;
      if (state.descriptor.state === 'closed') {
        book.closed.set(id, state);
        continue;
      }
      const matched: ReadonlyArray<TaskId> = book._matching(state.selection, index);
      book.activate(state, matched, book._sumUnits(matched, tasks));
    }
    return book;
  }

  /** The subscriptions an update of `category` is owed to at a commit from `before` to `after`. */
  public audience(
    before: ITaskEnvelope | undefined,
    after: ITaskEnvelope,
    category: UpdateCategory
  ): ReadonlyArray<SubscriptionId> {
    return audienceOf(this.subscriptions.values(), before, after, category);
  }

  /** Every active subscription whose selection matches these catalog fields. */
  public potentialOf(fields: ICatalogFields | undefined): ReadonlyArray<SubscriptionId> {
    if (fields === undefined) {
      return [];
    }
    const potential: SubscriptionId[] = [];
    for (const state of this.subscriptions.values()) {
      if (catalogMatches(state.selection, fields)) {
        potential.push(state.descriptor.id);
      }
    }
    return potential.sort();
  }

  /** A subscription's delivery units: set when it is activated; a closed one holds none. */
  public unitsOf(subscription: SubscriptionId): number {
    return this._units.get(subscription) ?? 0;
  }

  /** A retained subscription's resident state, active or closed. */
  public stateOf(subscription: SubscriptionId): ISubscriptionState | undefined {
    return this.subscriptions.get(subscription) ?? this.closed.get(subscription);
  }

  /** Replaces a retained subscription's resident state, in whichever set holds it. */
  public setState(state: ISubscriptionState): void {
    const id: SubscriptionId = state.descriptor.id;
    (this.closed.has(id) ? this.closed : this.subscriptions).set(id, state);
  }

  /**
   * Closes an active subscription whose closed record has committed: it leaves every task's potential
   * audience and releases its delivery units.
   */
  public close(state: ISubscriptionState): void {
    const id: SubscriptionId = state.descriptor.id;
    this.subscriptions.delete(id);
    this._units.delete(id);
    for (const [taskId, potential] of this._potential) {
      if (potential.includes(id)) {
        const rest: ReadonlyArray<SubscriptionId> = potential.filter((s) => s !== id);
        if (rest.length > 0) {
          this._potential.set(taskId, rest);
        } else {
          this._potential.delete(taskId);
        }
      }
    }
    this.closed.set(id, state);
  }

  /** The potential audience the book holds for a task. */
  public potentialFor(taskId: TaskId): ReadonlyArray<SubscriptionId> {
    return this._potential.get(taskId) ?? [];
  }

  /** A subscription's ledger entry as it stands. */
  public entry(subscription: SubscriptionId, index: TaskIndex, profile: ITaskCapacityProfile): ILedgerEntry {
    return subscriptionEntry(
      this.stateOf(subscription)!,
      index.owedCount(subscription),
      this.unitsOf(subscription),
      profile
    );
  }

  /** Every retained subscription's ledger entry as it stands. */
  public entries(index: TaskIndex, profile: ITaskCapacityProfile): Map<string, ILedgerEntry> {
    const entries: Map<string, ILedgerEntry> = new Map();
    for (const id of [...this.subscriptions.keys(), ...this.closed.keys()]) {
      entries.set(subscriptionKey(id), this.entry(id, index, profile));
    }
    return entries;
  }

  /**
   * Plans what one task commit does to the subscriptions, and refuses a commit that would break a
   * delivery invariant — before anything is written.
   *
   * @remarks
   * - Every update the commit adds must name exactly the audience storage computes for it; a caller
   *   cannot owe an update to a subscription that is not owed it, or leave out one that is.
   * - One update is owed to at most `maxAudiencePerUpdate` subscriptions, and so is a live task's
   *   potential audience: past it, the task's claims could not pay for the evidence.
   * - A `source-replay` subscription never comes to cover an external task that was not admitted
   *   with a finite replay envelope: its guarantee would silently be weaker than promised.
   */
  public plan(params: {
    readonly taskId: TaskId;
    readonly before: ITaskCommitRecord | undefined;
    readonly next: ITaskCommitRecord;
    readonly index: TaskIndex;
    readonly profile: ITaskCapacityProfile;
    /**
     * The record is a first record that landed before a crash, adopted rather than written: its
     * audiences were computed then, so a subscription activated since may be missing from them.
     * Each must still name only subscriptions owed the update.
     */
    readonly adopted?: boolean;
  }): TaskResult<ITaskDeliveryPlan> {
    const { taskId, before, next, index, profile } = params;
    const max: number = profile.perOwner.maxAudiencePerUpdate;
    const beforeEnvelope: ITaskEnvelope | undefined =
      before?.recordType === 'resolved' ? before.task.envelope : undefined;
    const previous: ReadonlyMap<string, ITaskUpdate> = new Map(
      updatesOf(before ?? next).map((update) => [update.id, update] as const)
    );
    const retainedBefore: ReadonlyArray<ITaskUpdate> = before === undefined ? [] : updatesOf(before);
    const nextUpdates: ReadonlyArray<ITaskUpdate> = updatesOf(next);
    const added: ITaskUpdate[] = nextUpdates.filter(
      (update) => before === undefined || !previous.has(update.id)
    );

    // An update is only ever added to a resolved record, and describes exactly the state committed
    // with it: a snapshot that differs — forged scopes or responsibility, say — would decide an
    // audience for a state the task is not in.
    const committed: ITaskEnvelope | undefined =
      next.recordType === 'resolved' ? next.task.envelope : undefined;
    for (const update of added) {
      const after: ITaskEnvelope = update.snapshot.envelope;
      if (!canonicallyEqual(after, committed)) {
        return taskFailure(
          `task ${taskId}: update ${update.id} carries a snapshot that is not the committed state`,
          'invalid',
          'after-host-action'
        );
      }
      const expected: ReadonlyArray<SubscriptionId> = this.audience(beforeEnvelope, after, update.category);
      if (expected.length > max) {
        return _backpressure(
          taskId,
          `update ${update.id} would be owed to ${expected.length} subscriptions, over the limit of ${max}`,
          expected.length,
          max
        );
      }
      const matches: boolean =
        params.adopted === true
          ? update.audience.every((id) => expected.includes(id))
          : canonicallyEqual(update.audience, expected);
      if (!matches) {
        return taskFailure(
          `task ${taskId}: update ${update.id} names audience [${update.audience.join(', ')}], but the ` +
            `subscriptions owed it are [${expected.join(', ')}]`,
          'invalid',
          'after-host-action'
        );
      }
    }

    const potential: ReadonlyArray<SubscriptionId> = this.potentialOf(catalogOf(next));
    if (potential.length > max) {
      return _backpressure(
        taskId,
        `${potential.length} subscriptions would cover the task, over the limit of ${max}`,
        potential.length,
        max
      );
    }
    const external: boolean = next.recordType === 'unresolved' || next.task.envelope.binding !== undefined;
    const sourceReplay: boolean = next.capacityClaims.some((c) => c.purpose === 'admitted-source-replay');
    if (external && !sourceReplay) {
      const replaying: SubscriptionId | undefined = potential.find(
        (id) => this.subscriptions.get(id)!.descriptor.policy.history === 'source-replay'
      );
      if (replaying !== undefined) {
        return taskFailure(
          `task ${taskId}: subscription ${replaying} promises source-replay delivery, and this external task ` +
            `was not admitted with a finite replay envelope`,
          'unsupported',
          'after-host-action'
        );
      }
    }

    const potentialBefore: ReadonlyArray<SubscriptionId> = this.potentialFor(taskId);
    const unitsBefore: number = before === undefined ? 0 : deliveryUnits(before);
    const unitsAfter: number = deliveryUnits(next);
    const owedDelta: Map<SubscriptionId, number> = new Map();
    const bump = (id: SubscriptionId, by: number): void => {
      owedDelta.set(id, (owedDelta.get(id) ?? 0) + by);
    };
    let newLinks: number = 0;
    for (const update of added) {
      for (const id of update.audience) {
        bump(id, 1);
        newLinks++;
      }
    }
    const kept: ReadonlySet<string> = new Set(nextUpdates.map((update) => update.id));
    for (const update of retainedBefore) {
      if (!kept.has(update.id)) {
        for (const id of update.audience) {
          if (index.isOwed(id, update.id)) {
            bump(id, -1);
          }
        }
      }
    }

    const affected: Set<SubscriptionId> = new Set([...potentialBefore, ...potential, ...owedDelta.keys()]);
    const units: Map<SubscriptionId, number> = new Map();
    const entries: Map<string, ILedgerEntry> = new Map();
    for (const id of Array.from(affected).sort()) {
      // An audience member of a dropped update may have been closed since; it is still retained.
      const state: ISubscriptionState = this.stateOf(id)!;
      const total: number =
        this.unitsOf(id) -
        (potentialBefore.includes(id) ? unitsBefore : 0) +
        (potential.includes(id) ? unitsAfter : 0);
      units.set(id, total);
      entries.set(
        subscriptionKey(id),
        subscriptionEntry(state, index.owedCount(id) + (owedDelta.get(id) ?? 0), total, profile)
      );
    }
    return ok({ taskId, newLinks, potential, units, entries });
  }

  /** Applies a plan whose record has committed. */
  public commit(plan: ITaskDeliveryPlan): void {
    if (plan.potential.length > 0) {
      this._potential.set(plan.taskId, plan.potential);
    } else {
      this._potential.delete(plan.taskId);
    }
    for (const [id, total] of plan.units) {
      if (this.subscriptions.has(id)) {
        this._units.set(id, total);
      }
    }
  }

  /**
   * Checks that a new subscription can be activated over the live tasks, and returns the tasks it
   * would cover and the delivery units it would hold.
   *
   * @remarks
   * Refused, before anything is written, when it would push any task's potential audience past
   * `maxAudiencePerUpdate`, or when it promises `source-replay` and would cover an external task
   * admitted without a replay envelope.
   */
  public admission(params: {
    readonly subscriptionId: SubscriptionId;
    readonly specification: ITaskSubscriptionSpecification;
    readonly index: TaskIndex;
    readonly tasks: ReadonlyMap<TaskId, ITaskProjection>;
    readonly profile: ITaskCapacityProfile;
  }): TaskResult<{ readonly matched: ReadonlyArray<TaskId>; readonly units: number }> {
    const { subscriptionId, specification, index, tasks, profile } = params;
    const selection: INormalizedSelection = normalizeSelection(specification.selection);
    const matched: ReadonlyArray<TaskId> = this._matching(selection, index);
    const max: number = profile.perOwner.maxAudiencePerUpdate;
    for (const taskId of matched) {
      const count: number = this.potentialFor(taskId).length + 1;
      if (count > max) {
        return _backpressure(
          taskId,
          `subscription ${subscriptionId} would be the ${count}th to cover the task, over the limit of ${max}`,
          count,
          max
        );
      }
      const projection: ITaskProjection = tasks.get(taskId)!;
      if (
        specification.policy.history === 'source-replay' &&
        projection.external === true &&
        projection.sourceReplay !== true
      ) {
        return taskFailure(
          `subscription ${subscriptionId}: promises source-replay delivery, and it would cover external task ` +
            `${taskId}, which was not admitted with a finite replay envelope`,
          'unsupported',
          'after-host-action'
        );
      }
    }
    return ok({ matched, units: this._sumUnits(matched, tasks) });
  }

  /** Activates a subscription whose record is live: it joins the audience of every task it covers. */
  public activate(state: ISubscriptionState, matched: ReadonlyArray<TaskId>, units: number): void {
    const id: SubscriptionId = state.descriptor.id;
    this.subscriptions.set(id, state);
    for (const taskId of matched) {
      this._potential.set(taskId, [...this.potentialFor(taskId), id].sort());
    }
    this._units.set(id, units);
  }

  /** Live, non-archived tasks whose catalog fields a selection matches, in id order. */
  private _matching(selection: INormalizedSelection, index: TaskIndex): ReadonlyArray<TaskId> {
    const matched: TaskId[] = [];
    for (const [taskId, summary] of index.summaries) {
      if (catalogMatches(selection, summary.envelope)) {
        matched.push(taskId);
      }
    }
    for (const [taskId, reference] of index.unresolved) {
      if (catalogMatches(selection, reference)) {
        matched.push(taskId);
      }
    }
    return matched.sort();
  }

  private _sumUnits(matched: ReadonlyArray<TaskId>, tasks: ReadonlyMap<TaskId, ITaskProjection>): number {
    // Matched tasks are live and non-archived, so each carries its units.
    return matched.reduce((total, taskId) => total + tasks.get(taskId)!.deliveryUnits!, 0);
  }
}

function _backpressure<T>(taskId: TaskId, message: string, requested: number, limit: number): TaskResult<T> {
  return taskFailure(`capacity: task ${taskId}: ${message}`, 'backpressure', 'after-host-action', {
    capacity: {
      reason: 'capacity-exhausted',
      dimension: 'audience-links',
      recordId: taskId,
      used: requested - 1,
      reserved: 0,
      requested: 1,
      limit,
      reclaimableByCleanup: false
    }
  });
}

/**
 * How many audience links a commit adds: every link of every update in `next` that `before` did not
 * retain. Updates are immutable, so an update retained by both adds nothing.
 * @internal
 */
export function newLinks(before: ITaskCommitRecord, next: ITaskCommitRecord): number {
  const retained: ReadonlySet<string> = new Set(updatesOf(before).map((update) => update.id));
  return updatesOf(next)
    .filter((update) => !retained.has(update.id))
    .reduce((total, update) => total + update.audience.length, 0);
}
