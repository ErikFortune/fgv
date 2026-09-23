/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IResponsibility,
  ITaskScope,
  ITaskSelection,
  ITaskSummary,
  ITaskUpdate,
  IUnresolvedTaskReference,
  SubscriptionId,
  TaskId,
  TaskLifecycleClass,
  TaskLifecycleStatus,
  allTaskStatuses,
  openTaskStatuses,
  terminalTaskStatuses
} from '../types';
import { IVisitCounter, KeyStream, MergedStream, SortedKeySet } from './sortedKeys';
import { TaskIndex, dueKeyTask, labelKey } from './taskIndex';

/**
 * Query evaluation over one index generation. Every candidate comes from an ordered index set;
 * nothing here enumerates the task table, and nothing reads a record.
 * @internal
 */

/** Candidates a page may examine before it returns with a cursor instead of an answer. */
export const pageCandidateBudget: number = 1024;

/** The most quarantined task ids a page names in its issues. */
const maxNamedQuarantined: number = 16;

/**
 * A selection reduced to canonical form: scopes deduplicated and ordered, statuses resolved
 * against the class and ordered, so equal queries have equal descriptors.
 * @internal
 */
export interface INormalizedSelection {
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly responsibility?: IResponsibility;
  readonly parentId?: TaskId;
  readonly lifecycleClass: TaskLifecycleClass;
  /** Every status the selection admits, in canonical order. */
  readonly statuses: ReadonlyArray<TaskLifecycleStatus>;
}

function _classStatuses(lifecycleClass: TaskLifecycleClass): ReadonlyArray<TaskLifecycleStatus> {
  return lifecycleClass === 'open'
    ? openTaskStatuses
    : lifecycleClass === 'terminal'
    ? terminalTaskStatuses
    : allTaskStatuses;
}

/** Normalizes a converted selection. */
export function normalizeSelection(selection: ITaskSelection): INormalizedSelection {
  const byKey: Map<string, ITaskScope> = new Map();
  for (const scope of selection.scopes) {
    byKey.set(labelKey(scope), { namespace: scope.namespace, key: scope.key });
  }
  const scopes: ITaskScope[] = Array.from(byKey.keys())
    .sort()
    .map((key) => byKey.get(key)!);
  const admitted: ReadonlyArray<TaskLifecycleStatus> = _classStatuses(selection.lifecycleClass);
  const statuses: ReadonlyArray<TaskLifecycleStatus> =
    selection.statuses === undefined ? admitted : admitted.filter((s) => selection.statuses!.includes(s));
  return {
    scopes,
    ...(selection.responsibility !== undefined
      ? {
          responsibility: { namespace: selection.responsibility.namespace, key: selection.responsibility.key }
        }
      : {}),
    ...(selection.parentId !== undefined ? { parentId: selection.parentId } : {}),
    lifecycleClass: selection.lifecycleClass,
    statuses
  };
}

/**
 * The raw result of evaluating one page, before cursor issuance.
 * @internal
 */
export interface IPageEvaluation<TItem> {
  readonly items: ReadonlyArray<TItem>;
  readonly unresolved: ReadonlyArray<IUnresolvedTaskReference>;
  /** Where the next page starts, when there may be one. */
  readonly next?: string;
  readonly issues: ReadonlyArray<string>;
}

type Tag = 'task' | 'unresolved';

/** Whether a resident summary satisfies every non-scope criterion of a selection. */
function _matchesSummary(
  selection: INormalizedSelection,
  summary: ITaskSummary,
  scopeKeys: ReadonlySet<string>
): boolean {
  const envelope = summary.envelope;
  return (
    selection.statuses.includes(envelope.lifecycle.status) &&
    (selection.parentId === undefined || envelope.parentId === selection.parentId) &&
    (selection.responsibility === undefined ||
      (envelope.responsibility !== undefined &&
        labelKey(envelope.responsibility) === labelKey(selection.responsibility))) &&
    envelope.scopes.some((scope) => scopeKeys.has(labelKey(scope)))
  );
}

function _matchesUnresolved(selection: INormalizedSelection, reference: IUnresolvedTaskReference): boolean {
  return (
    (selection.parentId === undefined || reference.parentId === selection.parentId) &&
    (selection.responsibility === undefined ||
      (reference.responsibility !== undefined &&
        labelKey(reference.responsibility) === labelKey(selection.responsibility)))
  );
}

/** The ordered lifecycle streams for one scope. */
function _scopeStreams(
  index: TaskIndex,
  scopeKey: string,
  selection: INormalizedSelection,
  after: string | undefined,
  counter: IVisitCounter
): Array<KeyStream<Tag>> {
  const streams: Array<KeyStream<Tag>> = [];
  const classes = index.byScopeClass.get(scopeKey);
  const wholeClass: boolean = selection.statuses.length === _classStatuses(selection.lifecycleClass).length;
  if (wholeClass && selection.lifecycleClass !== 'all') {
    if (classes !== undefined) {
      streams.push(
        new KeyStream<Tag>(
          selection.lifecycleClass === 'open' ? classes.open : classes.terminal,
          after,
          'task',
          counter
        )
      );
    }
    return streams;
  }
  const statuses = index.byScopeStatus.get(scopeKey);
  for (const status of selection.statuses) {
    const set: SortedKeySet | undefined = statuses?.get(status);
    if (set !== undefined) {
      streams.push(new KeyStream<Tag>(set, after, 'task', counter));
    }
  }
  return streams;
}

/** The quarantined tasks a selection's scopes reach, reported rather than silently omitted. */
function _quarantineIssues(
  index: TaskIndex,
  scopeKeys: ReadonlyArray<string>,
  counter: IVisitCounter
): string[] {
  const streams: Array<KeyStream<'q'>> = [];
  for (const scope of scopeKeys) {
    const set: SortedKeySet | undefined = index.quarantinedByScope.get(scope);
    if (set !== undefined) {
      streams.push(new KeyStream<'q'>(set, undefined, 'q', counter));
    }
  }
  const merged: MergedStream<'q'> = new MergedStream(streams);
  const ids: string[] = [];
  let total: number = 0;
  for (let next = merged.next(); next !== undefined; next = merged.next()) {
    total++;
    if (ids.length < maxNamedQuarantined) {
      ids.push(next.key);
    }
  }
  if (total === 0) {
    return [];
  }
  const more: string = total > ids.length ? ` and ${total - ids.length} more` : '';
  return [
    `tasks ${ids.join(
      ', '
    )}${more} match these scopes but their kind is not registered; they are quarantined and not listed`
  ];
}

/**
 * Evaluates one ordinary page, ordered by task id.
 *
 * @remarks
 * The driver is the cheapest ordered source of candidates: the union of the selection's
 * per-scope lifecycle sets, or the parent's direct children, or the responsibility set. Each
 * candidate is then checked against **every** criterion on its resident summary — including
 * those the driver already implies, so a stale membership can never leak a non-matching task.
 */
export function evaluateTasks(
  index: TaskIndex,
  selection: INormalizedSelection,
  limit: number,
  after: string | undefined,
  counter: IVisitCounter
): IPageEvaluation<ITaskSummary> {
  const scopeKeys: ReadonlyArray<string> = selection.scopes.map(labelKey);
  if (scopeKeys.length === 0) {
    return { items: [], unresolved: [], issues: [] };
  }
  const scopeSet: ReadonlySet<string> = new Set(scopeKeys);

  let lifecycle: Array<KeyStream<Tag>> = [];
  if (selection.statuses.length > 0) {
    const union: Array<KeyStream<Tag>> = [];
    let unionSize: number = 0;
    for (const scope of scopeKeys) {
      const classes = index.byScopeClass.get(scope);
      if (classes !== undefined) {
        unionSize += classes.open.size + classes.terminal.size;
      }
    }
    const byParent: SortedKeySet | undefined =
      selection.parentId !== undefined ? index.activeChildren.get(selection.parentId) : undefined;
    const byResponsibility: SortedKeySet | undefined =
      selection.responsibility !== undefined
        ? index.byResponsibility.get(labelKey(selection.responsibility))
        : undefined;
    // A filter whose set is absent matches nothing: no candidates from the task side.
    const absent: boolean =
      (selection.parentId !== undefined && byParent === undefined) ||
      (selection.responsibility !== undefined && byResponsibility === undefined);
    if (!absent) {
      const narrow: SortedKeySet | undefined = [byParent, byResponsibility]
        .filter((set): set is SortedKeySet => set !== undefined)
        .sort((a, b) => a.size - b.size)[0];
      if (narrow !== undefined && narrow.size < unionSize) {
        lifecycle = [new KeyStream<Tag>(narrow, after, 'task', counter)];
      } else {
        for (const scope of scopeKeys) {
          union.push(..._scopeStreams(index, scope, selection, after, counter));
        }
        lifecycle = union;
      }
    }
  }
  const unresolvedStreams: Array<KeyStream<Tag>> = [];
  for (const scope of scopeKeys) {
    const set: SortedKeySet | undefined = index.unresolvedByScope.get(scope);
    if (set !== undefined) {
      unresolvedStreams.push(new KeyStream<Tag>(set, after, 'unresolved', counter));
    }
  }

  const merged: MergedStream<Tag> = new MergedStream<Tag>([...lifecycle, ...unresolvedStreams]);
  const items: ITaskSummary[] = [];
  const unresolved: IUnresolvedTaskReference[] = [];
  let lastIncluded: string | undefined = after;
  let next: string | undefined = undefined;
  let examined: number = 0;
  for (let candidate = merged.next(); candidate !== undefined; candidate = merged.next()) {
    const id: TaskId = candidate.key as TaskId;
    let match: 'task' | 'unresolved' | undefined = undefined;
    if (candidate.tags.includes('unresolved')) {
      const reference: IUnresolvedTaskReference | undefined = index.unresolved.get(id);
      if (reference !== undefined && _matchesUnresolved(selection, reference)) {
        match = 'unresolved';
      }
    } else {
      const summary: ITaskSummary | undefined = index.summaries.get(id);
      if (summary !== undefined && _matchesSummary(selection, summary, scopeSet)) {
        match = 'task';
      }
    }
    if (match !== undefined) {
      if (items.length + unresolved.length === limit) {
        next = lastIncluded;
        break;
      }
      if (match === 'task') {
        items.push(index.summaries.get(id)!);
      } else {
        unresolved.push(index.unresolved.get(id)!);
      }
      lastIncluded = candidate.key;
    }
    examined++;
    if (examined >= pageCandidateBudget) {
      // Out of budget: everything up to here was included or did not match.
      next = candidate.key;
      break;
    }
  }
  return {
    items,
    unresolved,
    ...(next !== undefined ? { next } : {}),
    issues: _quarantineIssues(index, scopeKeys, counter)
  };
}

/**
 * Evaluates one due page: waiting tasks with `notBefore <= cutoff`, ordered by
 * `(notBefore, taskId)`. Each scope's due set is read only up to the cutoff — plus the one key
 * past it that says to stop.
 */
export function evaluateDue(
  index: TaskIndex,
  selection: INormalizedSelection,
  cutoff: string,
  limit: number,
  after: string | undefined,
  counter: IVisitCounter
): IPageEvaluation<ITaskSummary> {
  const scopeKeys: ReadonlyArray<string> = selection.scopes.map(labelKey);
  const scopeSet: ReadonlySet<string> = new Set(scopeKeys);
  // Every key for an instant at or before the cutoff sorts before `<cutoff>\u0001`.
  const upper: string = `${cutoff}\u0001`;
  const streams: Array<KeyStream<'due'>> = [];
  for (const scope of scopeKeys) {
    const set: SortedKeySet | undefined = index.dueByScope.get(scope);
    if (set !== undefined) {
      streams.push(new KeyStream<'due'>(set, after, 'due', counter, upper));
    }
  }
  const merged: MergedStream<'due'> = new MergedStream(streams);
  const items: ITaskSummary[] = [];
  let lastIncluded: string | undefined = after;
  let next: string | undefined = undefined;
  let examined: number = 0;
  for (let candidate = merged.next(); candidate !== undefined; candidate = merged.next()) {
    // A due key is added and removed with its task's summary, so the summary exists; everything
    // it implies is still re-checked on the summary itself.
    const summary: ITaskSummary = index.summaries.get(dueKeyTask(candidate.key))!;
    const lifecycle = summary.envelope.lifecycle;
    const due: boolean =
      lifecycle.status === 'waiting' &&
      lifecycle.reason.notBefore !== undefined &&
      lifecycle.reason.notBefore <= cutoff &&
      _matchesSummary(selection, summary, scopeSet);
    if (due) {
      if (items.length === limit) {
        next = lastIncluded;
        break;
      }
      items.push(summary);
      lastIncluded = candidate.key;
    }
    examined++;
    if (examined >= pageCandidateBudget) {
      next = candidate.key;
      break;
    }
  }
  return {
    items,
    unresolved: [],
    ...(next !== undefined ? { next } : {}),
    issues: _quarantineIssues(index, scopeKeys, counter)
  };
}

/**
 * Evaluates one owed-update page for a subscription. Reads only that subscription's owed set:
 * no lifecycle index, and no task history, is consulted.
 */
export function evaluateOwed(
  index: TaskIndex,
  subscription: SubscriptionId,
  limit: number,
  after: string | undefined,
  counter: IVisitCounter
): IPageEvaluation<ITaskUpdate> {
  const set: SortedKeySet | undefined = index.owedBySubscription.get(subscription);
  const items: ITaskUpdate[] = [];
  let next: string | undefined = undefined;
  if (set !== undefined) {
    const stream: KeyStream<'owed'> = new KeyStream<'owed'>(set, after, 'owed', counter);
    let lastIncluded: string | undefined = after;
    for (let key = stream.head; key !== undefined; key = stream.head) {
      if (items.length === limit) {
        next = lastIncluded;
        break;
      }
      items.push(index.owedPayloads.get(key)!);
      lastIncluded = key;
      stream.advance();
    }
  }
  return { items, unresolved: [], ...(next !== undefined ? { next } : {}), issues: [] };
}
