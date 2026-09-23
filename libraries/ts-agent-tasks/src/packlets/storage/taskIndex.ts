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
  /** Resolved and not archived: the full summary and every applicable membership. */
  | { readonly category: 'summary'; readonly envelope: ITaskEnvelope }
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
}

/** A collision-free key for a `(namespace, key)` pair. */
export function labelKey(label: ITaskScope | IResponsibility): string {
  return JSON.stringify([label.namespace, label.key]);
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
  private readonly _owedKeysByTask: Map<TaskId, ReadonlyArray<string>> = new Map();
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
   * listed under each audience subscription.
   */
  public putOwed(id: TaskId, updates: ReadonlyArray<ITaskUpdate>): void {
    for (const key of this._owedKeysByTask.get(id) ?? []) {
      for (const subscription of this.owedPayloads.get(key)!.audience) {
        _unsetIn(this.owedBySubscription, subscription, key);
      }
      this.owedPayloads.delete(key);
    }
    const keys: string[] = [];
    for (const update of updates) {
      if (update.audience.length === 0) {
        continue;
      }
      const key: string = owedKey(update);
      keys.push(key);
      this.owedPayloads.set(key, update);
      for (const subscription of update.audience) {
        _setIn(this.owedBySubscription, subscription, key);
      }
    }
    if (keys.length > 0) {
      this._owedKeysByTask.set(id, keys);
    } else {
      this._owedKeysByTask.delete(id);
    }
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
    }
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
    this._memberships.set(id, {
      category: 'summary',
      ...base,
      scopeKeys,
      status,
      ...(responsibilityKey !== undefined ? { responsibilityKey } : {}),
      ...(due !== undefined ? { dueKey: due } : {})
    });
  }
}
