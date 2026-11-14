/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters, boundedArrayOf } from '../converters';
import { IBoundTaskPage, IProjectedTaskSummary, TaskInspection } from '../types';

/**
 * The most command names an inspection may carry. A kind's command table is small; a longer list did
 * not come from a registry, and is refused rather than passed on.
 * @internal
 */
export const maxInspectionCommands: number = 100;

/**
 * The most issue lines a page may carry. Their text never reaches the model; the bound is on what a
 * view may hand the tool at all.
 * @internal
 */
export const maxPageIssues: number = 100;

/**
 * Converters for what a view answers, applied before the tools read any of it.
 *
 * @remarks
 * `createTaskTools` accepts any `IBoundTaskView`, so its answer is converted, not trusted: every
 * field the tools read has a strict converter here, and nothing is read from an answer that has not
 * passed through one. The broker's own view always passes; a view that does not is refused whole.
 * @internal
 */
export interface IViewAnswerConverters {
  /** A page holding at most `limit` items and unresolved references together — the page asked for. */
  page(limit: number): Converter<IBoundTaskPage>;
  /** An inspection: exactly a resolved or an unresolved shape, nothing in between. */
  readonly inspection: Converter<TaskInspection>;
}

/**
 * Builds the {@link IViewAnswerConverters} over a renderer's converters, so the bounds are the ones
 * the renderer enforces.
 * @internal
 */
export function buildViewAnswerConverters(converters: TaskConverters): IViewAnswerConverters {
  const broker = converters.broker;
  const summary: Converter<IProjectedTaskSummary> = Converters.strictObject<IProjectedTaskSummary>({
    envelope: broker.projectedEnvelope
  });

  const page = (limit: number): Converter<IBoundTaskPage> =>
    Converters.strictObject<IBoundTaskPage>({
      items: boundedArrayOf(summary, limit, 'page items'),
      unresolved: boundedArrayOf(broker.projectedReference, limit, 'page unresolved references'),
      nextCursor: converters.queries.pageCursor.optional(),
      completeness: Converters.enumeratedValue<IBoundTaskPage['completeness']>(['complete', 'partial']),
      freshness: Converters.enumeratedValue<IBoundTaskPage['freshness']>([
        'native-current',
        'source-projection'
      ]),
      issues: boundedArrayOf(Converters.string, maxPageIssues, 'page issues')
    }).withConstraint(
      (value: IBoundTaskPage): Result<IBoundTaskPage> =>
        value.items.length + value.unresolved.length > limit
          ? fail(`the page holds more than the ${limit} tasks asked for`)
          : succeed(value)
    );

  const resolved: Converter<TaskInspection> = Converters.strictObject<
    Extract<TaskInspection, { state: 'resolved' }>
  >({
    state: Converters.literal('resolved'),
    envelope: broker.projectedEnvelope,
    details: JsonConverters.jsonValue.optional(),
    archived: Converters.boolean,
    commands: boundedArrayOf(converters.commands.commandName, maxInspectionCommands, 'commands')
  });
  const unresolved: Converter<TaskInspection> = Converters.strictObject<
    Extract<TaskInspection, { state: 'unresolved' }>
  >({
    state: Converters.literal('unresolved'),
    reference: broker.projectedReference
  });

  return { page, inspection: Converters.oneOf<TaskInspection>([resolved, unresolved]) };
}
