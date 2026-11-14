/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IDueTaskQuery,
  IOwedUpdateQuery,
  ITaskFieldBounds,
  ITaskQuery,
  ITaskSelection,
  PageCursor,
  TaskLifecycleClass,
  TaskLifecycleStatus,
  allTaskLifecycleClasses,
  allTaskStatuses,
  maxTaskPageLimit,
  openTaskStatuses,
  terminalTaskStatuses
} from '../types';
import { IIdentityConverters } from './identityConverters';
import { boundedArrayOf, boundedIdentifier, instant, positiveSafeInteger } from './primitives';
import { IValueConverters } from './valueConverters';

/**
 * Converters for repository queries.
 * @public
 */
export interface IQueryConverters {
  readonly lifecycleClass: Converter<TaskLifecycleClass>;
  readonly status: Converter<TaskLifecycleStatus>;
  /**
   * A page cursor token. Only its syntax is checked here: whether it names a live handle, for
   * this query and this generation, is the issuing repository's question.
   */
  readonly pageCursor: Converter<PageCursor>;
  /** A page limit: a positive safe integer no greater than {@link maxTaskPageLimit}. */
  readonly limit: Converter<number>;
  /** A selection whose `statuses` all belong to its `lifecycleClass`. */
  readonly selection: Converter<ITaskSelection>;
  readonly query: Converter<ITaskQuery>;
  /** A due query: its selection must admit `waiting`. */
  readonly dueQuery: Converter<IDueTaskQuery>;
  readonly owedQuery: Converter<IOwedUpdateQuery>;
}

/** The statuses a class admits. */
function _classStatuses(lifecycleClass: TaskLifecycleClass): ReadonlyArray<TaskLifecycleStatus> {
  return lifecycleClass === 'open'
    ? openTaskStatuses
    : lifecycleClass === 'terminal'
    ? terminalTaskStatuses
    : allTaskStatuses;
}

/**
 * Builds the {@link IQueryConverters}.
 * @public
 */
export function buildQueryConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters
): IQueryConverters {
  const lifecycleClass: Converter<TaskLifecycleClass> =
    Converters.enumeratedValue<TaskLifecycleClass>(allTaskLifecycleClasses);
  const status: Converter<TaskLifecycleStatus> =
    Converters.enumeratedValue<TaskLifecycleStatus>(allTaskStatuses);
  // A token is `<epoch>.<sequence>`: a host-minted identifier and a decimal counter.
  const pageCursor: Converter<PageCursor> = boundedIdentifier(
    bounds.maxIdLength + 17,
    'page cursor'
  ).withBrand('TaskPageCursor');
  const limit: Converter<number> = positiveSafeInteger.withConstraint(
    (value: number): Result<number> =>
      value <= maxTaskPageLimit
        ? succeed(value)
        : fail(`limit ${value} exceeds the maximum of ${maxTaskPageLimit}`)
  );
  const selection: Converter<ITaskSelection> = Converters.strictObject<ITaskSelection>({
    scopes: values.scopes,
    responsibility: values.responsibility.optional(),
    parentId: ids.taskId.optional(),
    lifecycleClass,
    statuses: boundedArrayOf(status, allTaskStatuses.length * 4, 'statuses').optional()
  }).withConstraint((value: ITaskSelection): Result<ITaskSelection> => {
    const admitted: ReadonlyArray<TaskLifecycleStatus> = _classStatuses(value.lifecycleClass);
    const foreign: ReadonlyArray<TaskLifecycleStatus> = (value.statuses ?? []).filter(
      (s) => !admitted.includes(s)
    );
    return foreign.length === 0
      ? succeed(value)
      : fail(`statuses [${foreign.join(', ')}] are not in lifecycle class '${value.lifecycleClass}'`);
  });
  const query: Converter<ITaskQuery> = Converters.strictObject<ITaskQuery>({
    selection,
    limit: limit.optional(),
    cursor: pageCursor.optional()
  });
  const dueQuery: Converter<IDueTaskQuery> = Converters.strictObject<IDueTaskQuery>({
    selection,
    limit: limit.optional(),
    cursor: pageCursor.optional(),
    cutoff: instant
  }).withConstraint((value: IDueTaskQuery): Result<IDueTaskQuery> => {
    if (value.selection.lifecycleClass === 'terminal') {
      return fail(`a due query selects waiting tasks; lifecycle class 'terminal' excludes them`);
    }
    if (value.selection.statuses !== undefined && !value.selection.statuses.includes('waiting')) {
      return fail(`a due query selects waiting tasks; its statuses must include 'waiting'`);
    }
    return succeed(value);
  });
  const owedQuery: Converter<IOwedUpdateQuery> = Converters.strictObject<IOwedUpdateQuery>({
    subscription: ids.subscriptionId,
    limit: limit.optional(),
    cursor: pageCursor.optional()
  });
  return { lifecycleClass, status, pageCursor, limit, selection, query, dueQuery, owedQuery };
}
