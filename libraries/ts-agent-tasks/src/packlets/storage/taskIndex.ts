/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IResponsibility,
  ISourceBinding,
  ITaskEnvelope,
  ITaskScope,
  ITaskSummary,
  ITaskUpdate,
  IUnresolvedTaskReference,
  SubscriptionId,
  TaskId,
  TaskLifecycleStatus,
  UpdateId,
  allUpdateCategories,
  isTerminalTaskStatus
} from '../types';
import { encodeRecord } from './layout';
import { SortedKeySet } from './sortedKeys';

/**
 * What one task contributes to the index, by category (design §7, *Resident state*).
 * @internal
 */
export type IndexContent =
  /**
   * Resolved and not archived: the full summary and every applicable membership. `automaticList`
   * marks a task list whose details ask for completion when all children succeed — read from the
   * details when the record is indexed, because details are never resident.
   */
  | {
      readonly category: 'summary';
      readonly envelope: ITaskEnvelope;
      readonly automaticList?: boolean;
      /** The record holds an external command whose dispatch is not settled. */
      readonly unsettledCommands?: boolean;
    }
  /** Archived: identity, graph edge, final status and source identity only. */
  | { readonly category: 'archived'; readonly envelope: ITaskEnvelope }
  /** Registered, first observation not arrived: the bounded reference, no lifecycle. */
  | { readonly category: 'unresolved'; readonly reference: IUnresolvedTaskReference }
  /** A kind that is not registered: never a healthy entry, only a scope-indexed diagnostic. */
  | {
      readonly category: 'quarantined';
      readonly scopes: ReadonlyArray<ITaskScope>;
      readonly parentId?: TaskId;
      readonly binding?: ISourceBinding;
      readonly archived: boolean;
    };

/**
 * The index keys one task was added under, so replacing it removes exactly what it added.
 * An archived task keeps only its parent edge, final status and source identity.
 * @internal
 */
export interface IMemberships {
  readonly category: IndexContent['category'];
  readonly parentId?: TaskId;
  readonly sourceKey?: string;
  readonly scopeKeys?: ReadonlyArray<string>;
  readonly status?: TaskLifecycleStatus;
  readonly responsibilityKey?: string;
  readonly dueKey?: string;
  readonly automaticList?: boolean;
}

/** A collision-free key for a `(namespace, key)` pair. */
export function labelKey(label: ITaskScope | IResponsibility): string {
  return JSON.stringify([label.namespace, label.key]);
}

/** Whether a membership counts as a succeeded child: resolved (archived or not) and succeeded. */
function _succeeded(m: IMemberships): boolean {
  return (m.category === 'summary' || m.category === 'archived') && m.status === 'succeeded';
}

/** The due-set key: canonical instants are fixed-width, so code-unit order is time order. */
export function dueKey(notBefore: string, id: TaskId): string {
  return `${notBefore}\u0000${id}`;
}

/** The task id a due key names. */
export function dueKeyTask(key: string): TaskId {
  return key.slice(key.indexOf('\u0000') + 1) as TaskId;
}

const revisionWidth: number = 16;

/** The owed-set key: task, then revision numerically, then category ordinal. */
export function owedKey(update: ITaskUpdate): string {
  const revision: string = String(update.revision).padStart(revisionWidth, '0');
  return `${update.taskId}\u0000${revision}\u0000${allUpdateCategories.indexOf(update.category)}`;
}

/**
 * The owed-set key of a baseline obligation: it sorts beside the task updates of the same revision.
 */
export function baselineKey(update: ITaskUpdate): string {
  const revision: string = String(update.revision).padStart(revisionWidth, '0');
  return `${update.taskId}\u0000${revision}\u0000initial`;
}

const baselineSuffix: string = ':initial';

/**
 * The baseline key an update id names, if it is a baseline id held here. The encoding is read from
 * the right, as `baselineUpdateId` writes it, so a task id containing `:` cannot confuse it.
 */
function _baselineKeyOf(baseline: ReadonlyMap<string, ITaskUpdate>, updateId: UpdateId): string | undefined {
  if (!updateId.endsWith(baselineSuffix)) {
    return undefined;
  }
  const rest: string = updateId.slice(0, -baselineSuffix.length);
  const colon: number = rest.lastIndexOf(':');
  const revision: string = rest.slice(colon + 1).padStart(revisionWidth, '0');
  const key: string = `${rest.slice(0, colon)}\u0000${revision}\u0000initial`;
  return baseline.get(key)?.id === updateId ? key : undefined;
}

/**
 * The canonical identity of a source binding: which source, which reference version, which
 * canonical reference. Bounded by the profile's `maxSourceIdentityBytes` at every write.
 */
export function sourceKey(binding: ISourceBinding): Result<string> {
  return encodeRecord({
    sourceId: binding.sourceId,
    referenceVersion: binding.referenceVersion,
    reference: binding.reference
  }).onSuccess((encoded) => succeed(encoded.text));
}

/**
 * A task's scope keys, each once. The scopes converter admits a repeated scope, and every set
 * holds a task once, so a membership list with a repeat would be removed twice.
 */
function _distinctKeys(scopes: ReadonlyArray<ITaskScope>): string[] {
  return Array.from(new Set(scopes.map(labelKey)));
}

function _setIn<K>(map: Map<K, SortedKeySet>, key: K, member: string): void {
  let set: SortedKeySet | undefined = map.get(key);
  if (set === undefined) {
    set = new SortedKeySet();
    map.set(key, set);
  }
  set.add(member);
}

function _unsetIn<K>(map: Map<K, SortedKeySet>, key: K, member: string): void {
  const set: SortedKeySet | undefined = map.get(key);
  if (set !== undefined) {
    set.delete(member);
    if (set.size === 0) {
      map.delete(key);
    }
  }
}

/**
 * One generation of the resident query projection.
 *
 * @remarks
 * Every structure is keyed by identity, so no entry can be held twice: sets add a key once,
 * maps replace. A task's contribution is replaced as a whole — its previous memberships are
 * removed before the new ones are added — so an index cannot keep a task under a scope, status,
 * parent or responsibility it no longer has.
 *
 * Nothing here holds a record, a detail value, an operation or a historical acknowledgement set.
 * Owed payloads are held only while an audience remains.
 * @internal
 */
export class TaskIndex {
  /** Resolved, non-archived, registered-kind tasks — open and terminal awaiting cleanup. */
  public readonly summaries: Map<TaskId, ITaskSummary> = new Map();
  public readonly unresolved: Map<TaskId, IUnresolvedTaskReference> = new Map();
  public readonly byScopeStatus: Map<string, Map<TaskLifecycleStatus, SortedKeySet>> = new Map();
  public readonly byScopeClass: Map<string, { open: SortedKeySet; terminal: SortedKeySet }> = new Map();
  public readonly byResponsibility: Map<string, SortedKeySet> = new Map();
  /** Direct non-archived resolved children, for parent-filtered queries. */
  public readonly activeChildren: Map<TaskId, SortedKeySet> = new Map();
  public readonly dueByScope: Map<string, SortedKeySet> = new Map();
  public readonly unresolvedByScope: Map<string, SortedKeySet> = new Map();
  public readonly quarantinedByScope: Map<string, SortedKeySet> = new Map();
  /** Parent → children for every retained task, archived included. */
  public readonly children: Map<TaskId, Set<TaskId>> = new Map();
  /** Canonical source identity → task, for every retained task, archived included. */
  public readonly sources: Map<string, TaskId> = new Map();
  public readonly owedBySubscription: Map<SubscriptionId, SortedKeySet> = new Map();
  public readonly owedPayloads: Map<string, ITaskUpdate> = new Map();
  /**
   * Open automatic task lists with at least one child, every one of which has succeeded: the
   * list-completion candidates (design §4, *Built-ins*). Derived from the graph on every commit
   * and at every rebuild, never persisted.
   */
  public readonly listCandidates: SortedKeySet = new SortedKeySet();
  /** Tasks holding an unsettled external command, for the uncertain-command pump. */
  public readonly unsettledCommands: SortedKeySet = new SortedKeySet();
  /** Per parent, how many of its children are resolved (archived or not) and succeeded. */
  private readonly _succeededChildren: Map<TaskId, number> = new Map();
  private readonly _owedKeysByTask: Map<TaskId, ReadonlyArray<string>> = new Map();
  /** Owed key of each retained update with an audience, by update id. */
  private readonly _keyOfUpdate: Map<UpdateId, string> = new Map();
  /** Retained links already acknowledged: owed key → the subscriptions that acknowledged it. */
  private readonly _satisfied: Map<string, Set<SubscriptionId>> = new Map();
  /** Unacknowledged baseline payloads, by subscription then baseline key. */
  private readonly _baselines: Map<SubscriptionId, Map<string, ITaskUpdate>> = new Map();
  private readonly _memberships: Map<TaskId, IMemberships> = new Map();

  /** The number of tasks the index knows about, in any category. */
  public get size(): number {
    return this._memberships.size;
  }

  /** The category a task is indexed under. */
  public categoryOf(id: TaskId): IndexContent['category'] | undefined {
    return this._memberships.get(id)?.category;
  }

  /** The index keys held for one task — for inspection only. */
  public membershipsOf(id: TaskId): IMemberships | undefined {
    return this._memberships.get(id);
  }

  /** The retained task a source binding is bound to, if any. */
  public sourceOwner(binding: ISourceBinding): Result<TaskId | undefined> {
    return sourceKey(binding).onSuccess((key) => succeed(this.sources.get(key)));
  }

  /**
   * The task holding a source identity other than `id`, if any. A binding maps to exactly one
   * retained task.
   */
  public sourceHolder(binding: ISourceBinding, id: TaskId): Result<TaskId | undefined> {
    return sourceKey(binding).onSuccess((key) => {
      const holder: TaskId | undefined = this.sources.get(key);
      return succeed(holder !== undefined && holder !== id ? holder : undefined);
    });
  }

  /**
   * Replaces one task's contribution. Fails — changing nothing — when its source identity is
   * already held by another task.
   */
  public put(id: TaskId, content: IndexContent): Result<true> {
    const binding: ISourceBinding | undefined =
      content.category === 'unresolved'
        ? content.reference.binding
        : content.category === 'quarantined'
        ? content.binding
        : content.envelope.binding;
    const key: Result<string | undefined> = binding === undefined ? succeed(undefined) : sourceKey(binding);
    return key.onSuccess((source) => {
      const holder: TaskId | undefined = source !== undefined ? this.sources.get(source) : undefined;
      if (holder !== undefined && holder !== id) {
        return fail<true>(`task ${id}: its source binding is already bound to task ${holder}`);
      }
      this._remove(id);
      this._add(id, content, source);
      return succeed<true>(true);
    });
  }

  /**
   * Replaces the owed payloads one task holds: every retained update with a non-empty audience,
   * listed under each audience subscription that has not acknowledged it.
   *
   * @remarks
   * A link a subscription has acknowledged stays *satisfied* while its payload is retained, so a
   * later commit of the same task — which re-lists all its retained updates — cannot make it owed
   * again. Satisfaction is by exact update id, never by revision. A link whose payload is no longer
   * retained is forgotten with it.
   */
  public putOwed(id: TaskId, updates: ReadonlyArray<ITaskUpdate>): void {
    const retained: Set<string> = new Set<string>();
    for (const update of updates) {
      if (update.audience.length > 0) {
        retained.add(owedKey(update));
      }
    }
    for (const key of this._owedKeysByTask.get(id) ?? []) {
      const previous: ITaskUpdate = this.owedPayloads.get(key)!;
      for (const subscription of previous.audience) {
        _unsetIn(this.owedBySubscription, subscription, key);
      }
      this.owedPayloads.delete(key);
      this._keyOfUpdate.delete(previous.id);
      if (!retained.has(key)) {
        this._satisfied.delete(key);
      }
    }
    const keys: string[] = [];
    for (const update of updates) {
      if (update.audience.length === 0) {
        continue;
      }
      const key: string = owedKey(update);
      keys.push(key);
      this.owedPayloads.set(key, update);
      this._keyOfUpdate.set(update.id, key);
      const satisfied: ReadonlySet<SubscriptionId> | undefined = this._satisfied.get(key);
      for (const subscription of update.audience) {
        if (satisfied?.has(subscription) !== true) {
          _setIn(this.owedBySubscription, subscription, key);
        }
      }
    }
    if (keys.length > 0) {
      this._owedKeysByTask.set(id, keys);
    } else {
      this._owedKeysByTask.delete(id);
    }
  }

  /**
   * Lists a subscription's unacknowledged baseline obligations. Their payloads live in the
   * subscription's record and are resident only while owed.
   */
  public putBaseline(subscription: SubscriptionId, baseline: ReadonlyArray<ITaskUpdate>): void {
    const payloads: Map<string, ITaskUpdate> = new Map<string, ITaskUpdate>();
    for (const update of baseline) {
      const key: string = baselineKey(update);
      payloads.set(key, update);
      _setIn(this.owedBySubscription, subscription, key);
    }
    if (payloads.size > 0) {
      this._baselines.set(subscription, payloads);
    }
  }

  /**
   * Marks exact update ids as acknowledged by one subscription: each is removed from what it is
   * owed. A task update's link stays satisfied while its payload is retained; a baseline payload is
   * released. Returns how many owed links this removed.
   */
  public satisfy(subscription: SubscriptionId, updateIds: Iterable<UpdateId>): number {
    let removed: number = 0;
    const baseline: Map<string, ITaskUpdate> | undefined = this._baselines.get(subscription);
    for (const updateId of updateIds) {
      const key: string | undefined = this._keyOfUpdate.get(updateId);
      if (key !== undefined && this.owedPayloads.get(key)!.audience.includes(subscription)) {
        let satisfied: Set<SubscriptionId> | undefined = this._satisfied.get(key);
        if (satisfied === undefined) {
          satisfied = new Set<SubscriptionId>();
          this._satisfied.set(key, satisfied);
        }
        if (!satisfied.has(subscription)) {
          satisfied.add(subscription);
          _unsetIn(this.owedBySubscription, subscription, key);
          removed++;
        }
        continue;
      }
      const bKey: string | undefined =
        baseline !== undefined ? _baselineKeyOf(baseline, updateId) : undefined;
      if (bKey !== undefined) {
        baseline!.delete(bKey);
        _unsetIn(this.owedBySubscription, subscription, bKey);
        removed++;
      }
    }
    if (baseline !== undefined && baseline.size === 0) {
      this._baselines.delete(subscription);
    }
    return removed;
  }

  /** The payload an owed key names for a subscription. */
  public owedPayload(subscription: SubscriptionId, key: string): ITaskUpdate {
    return this.owedPayloads.get(key) ?? this._baselines.get(subscription)!.get(key)!;
  }

  /** How many links a subscription is owed. */
  public owedCount(subscription: SubscriptionId): number {
    return this.owedBySubscription.get(subscription)?.size ?? 0;
  }

  /** Whether a subscription is owed an exact update id — a retained, unacknowledged link to it. */
  public isOwed(subscription: SubscriptionId, updateId: UpdateId): boolean {
    const key: string | undefined = this._keyOfUpdate.get(updateId);
    if (key !== undefined) {
      return this.owedBySubscription.get(subscription)?.has(key) === true;
    }
    const baseline: Map<string, ITaskUpdate> | undefined = this._baselines.get(subscription);
    return baseline !== undefined && _baselineKeyOf(baseline, updateId) !== undefined;
  }

  /**
   * The links a subscription is owed among one task's retained updates, by the task's owed keys.
   */
  public owedLinksOf(
    id: TaskId
  ): ReadonlyArray<{ readonly subscription: SubscriptionId; readonly key: string }> {
    const links: Array<{ subscription: SubscriptionId; key: string }> = [];
    for (const key of this._owedKeysByTask.get(id) ?? []) {
      for (const subscription of this.owedPayloads.get(key)!.audience) {
        if (this.owedBySubscription.get(subscription)?.has(key) === true) {
          links.push({ subscription, key });
        }
      }
    }
    return links;
  }

  private _remove(id: TaskId): void {
    const m: IMemberships | undefined = this._memberships.get(id);
    if (m === undefined) {
      return;
    }
    this._memberships.delete(id);
    this.summaries.delete(id);
    this.unresolved.delete(id);
    if (m.parentId !== undefined) {
      // A membership's parent edge was added with it, so its sibling set exists.
      const siblings: Set<TaskId> = this.children.get(m.parentId)!;
      siblings.delete(id);
      if (siblings.size === 0) {
        this.children.delete(m.parentId);
      }
      _unsetIn(this.activeChildren, m.parentId, id);
      if (_succeeded(m)) {
        this._countSucceeded(m.parentId, -1);
      }
      this._recheckCandidate(m.parentId);
    }
    this.listCandidates.delete(id);
    this.unsettledCommands.delete(id);
    if (m.sourceKey !== undefined) {
      this.sources.delete(m.sourceKey);
    }
    if (m.responsibilityKey !== undefined) {
      _unsetIn(this.byResponsibility, m.responsibilityKey, id);
    }
    for (const scope of m.scopeKeys ?? []) {
      if (m.category === 'unresolved') {
        _unsetIn(this.unresolvedByScope, scope, id);
      } else if (m.category === 'quarantined') {
        _unsetIn(this.quarantinedByScope, scope, id);
      } else {
        const statuses = this.byScopeStatus.get(scope)!;
        statuses.get(m.status!)!.delete(id);
        if (statuses.get(m.status!)!.size === 0) {
          statuses.delete(m.status!);
        }
        const classes = this.byScopeClass.get(scope)!;
        (isTerminalTaskStatus(m.status!) ? classes.terminal : classes.open).delete(id);
        if (classes.open.size === 0 && classes.terminal.size === 0) {
          this.byScopeClass.delete(scope);
        }
        if (statuses.size === 0) {
          this.byScopeStatus.delete(scope);
        }
        if (m.dueKey !== undefined) {
          _unsetIn(this.dueByScope, scope, m.dueKey);
        }
      }
    }
  }

  private _add(id: TaskId, content: IndexContent, source: string | undefined): void {
    this._addMemberships(id, content, source);
    const m: IMemberships = this._memberships.get(id)!;
    if (m.parentId !== undefined) {
      if (_succeeded(m)) {
        this._countSucceeded(m.parentId, 1);
      }
      this._recheckCandidate(m.parentId);
    }
    this._recheckCandidate(id);
  }

  private _countSucceeded(parentId: TaskId, delta: number): void {
    const count: number = (this._succeededChildren.get(parentId) ?? 0) + delta;
    if (count === 0) {
      this._succeededChildren.delete(parentId);
    } else {
      this._succeededChildren.set(parentId, count);
    }
  }

  /** Re-derives one task's candidacy from its membership and its children's. */
  private _recheckCandidate(id: TaskId): void {
    const m: IMemberships | undefined = this._memberships.get(id);
    const children: number = this.children.get(id)?.size ?? 0;
    const candidate: boolean =
      m?.automaticList === true &&
      !isTerminalTaskStatus(m.status!) &&
      children > 0 &&
      this._succeededChildren.get(id) === children;
    if (candidate) {
      this.listCandidates.add(id);
    } else {
      this.listCandidates.delete(id);
    }
  }

  private _addMemberships(id: TaskId, content: IndexContent, source: string | undefined): void {
    const parentId: TaskId | undefined =
      content.category === 'unresolved'
        ? content.reference.parentId
        : content.category === 'quarantined'
        ? content.parentId
        : content.envelope.parentId;
    if (parentId !== undefined) {
      let siblings: Set<TaskId> | undefined = this.children.get(parentId);
      if (siblings === undefined) {
        siblings = new Set<TaskId>();
        this.children.set(parentId, siblings);
      }
      siblings.add(id);
    }
    if (source !== undefined) {
      this.sources.set(source, id);
    }
    const base = {
      ...(parentId !== undefined ? { parentId } : {}),
      ...(source !== undefined ? { sourceKey: source } : {})
    };

    if (content.category === 'archived') {
      this._memberships.set(id, { category: 'archived', ...base, status: content.envelope.lifecycle.status });
      return;
    }
    if (content.category === 'quarantined') {
      const scopeKeys: string[] = content.archived ? [] : _distinctKeys(content.scopes);
      for (const scope of scopeKeys) {
        _setIn(this.quarantinedByScope, scope, id);
      }
      this._memberships.set(id, { category: 'quarantined', ...base, scopeKeys });
      return;
    }
    if (content.category === 'unresolved') {
      const reference: IUnresolvedTaskReference = content.reference;
      const scopeKeys: string[] = _distinctKeys(reference.scopes);
      for (const scope of scopeKeys) {
        _setIn(this.unresolvedByScope, scope, id);
      }
      this.unresolved.set(id, reference);
      this._memberships.set(id, { category: 'unresolved', ...base, scopeKeys });
      return;
    }

    const envelope: ITaskEnvelope = content.envelope;
    const status: TaskLifecycleStatus = envelope.lifecycle.status;
    const scopeKeys: string[] = _distinctKeys(envelope.scopes);
    const lifecycle = envelope.lifecycle;
    const due: string | undefined =
      lifecycle.status === 'waiting' && lifecycle.reason.notBefore !== undefined
        ? dueKey(lifecycle.reason.notBefore, id)
        : undefined;
    for (const scope of scopeKeys) {
      let statuses = this.byScopeStatus.get(scope);
      if (statuses === undefined) {
        statuses = new Map();
        this.byScopeStatus.set(scope, statuses);
      }
      let set: SortedKeySet | undefined = statuses.get(status);
      if (set === undefined) {
        set = new SortedKeySet();
        statuses.set(status, set);
      }
      set.add(id);
      let classes = this.byScopeClass.get(scope);
      if (classes === undefined) {
        classes = { open: new SortedKeySet(), terminal: new SortedKeySet() };
        this.byScopeClass.set(scope, classes);
      }
      (isTerminalTaskStatus(status) ? classes.terminal : classes.open).add(id);
      if (due !== undefined) {
        _setIn(this.dueByScope, scope, due);
      }
    }
    const responsibilityKey: string | undefined =
      envelope.responsibility !== undefined ? labelKey(envelope.responsibility) : undefined;
    if (responsibilityKey !== undefined) {
      _setIn(this.byResponsibility, responsibilityKey, id);
    }
    if (parentId !== undefined) {
      _setIn(this.activeChildren, parentId, id);
    }
    this.summaries.set(id, { envelope });
    if (content.unsettledCommands === true) {
      this.unsettledCommands.add(id);
    }
    this._memberships.set(id, {
      category: 'summary',
      ...base,
      scopeKeys,
      status,
      ...(responsibilityKey !== undefined ? { responsibilityKey } : {}),
      ...(due !== undefined ? { dueKey: due } : {}),
      ...(content.automaticList === true ? { automaticList: true } : {})
    });
  }
}
