/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { succeedWithDetail } from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import {
  IBoundTaskPage,
  ITaskContext,
  ITaskFailure,
  ITaskQueryToolResult,
  ITaskToolBudget,
  TaskContextPresentation,
  TaskId,
  TaskInspection,
  TaskInspectToolResult,
  TaskResult,
  TaskToolPresentation
} from '../types';

/**
 * The one issue line the model is told when the view reports any. A view's own issue text is host
 * text — the broker's is already this line, but any `IBoundTaskView` may be passed — so it goes to the
 * host's logger, never to the model.
 * @internal
 */
export const pageIssueLine: string =
  'some tasks within this view could not be read; the page may be incomplete';

/**
 * Presents one page of a bound view's query: the page rendered as bounded context, with every task
 * the rendering left out or shortened named, so paging past the page skips nothing unannounced. The
 * page has already been converted (`IViewAnswerConverters.page`).
 * @internal
 */
export function presentPage(
  renderer: TaskContextRenderer,
  budget: ITaskToolBudget,
  page: IBoundTaskPage
): TaskResult<ITaskQueryToolResult> {
  // A page with more after it is part of a larger selection, which the rendering must say.
  const whole: boolean = page.completeness === 'complete' && page.nextCursor === undefined;
  return renderer
    .render(
      { tasks: page.items, unresolved: page.unresolved, completeness: whole ? 'complete' : 'partial' },
      budget.context
    )
    .onSuccess((context) => {
      const shown: Map<string, TaskToolPresentation> = _presentations(context);
      const ids: ReadonlyArray<TaskId> = [
        ...page.items.map((item) => item.envelope.id),
        ...page.unresolved.map((reference) => reference.id)
      ];
      return succeedWithDetail<ITaskQueryToolResult, ITaskFailure>({
        context: context.text,
        omitted: ids.filter((id) => !shown.has(id)),
        abbreviated: ids.filter((id) => shown.get(id) === 'abbreviated'),
        ...(page.nextCursor !== undefined ? { nextCursor: page.nextCursor } : {}),
        completeness: page.completeness,
        freshness: page.freshness,
        issues: page.issues.length > 0 ? [pageIssueLine] : []
      });
    });
}

/**
 * Presents one inspection: the task rendered as bounded context, and — for a resolved task — its
 * available commands and, when they fit the budget, its details. The inspection has already been
 * converted (`IViewAnswerConverters.inspection`).
 * @internal
 */
export function presentInspection(
  renderer: TaskContextRenderer,
  budget: ITaskToolBudget,
  inspection: TaskInspection
): TaskResult<TaskInspectToolResult> {
  if (inspection.state === 'unresolved') {
    return renderer
      .render({ tasks: [], unresolved: [inspection.reference], completeness: 'complete' }, budget.context)
      .onSuccess((context) =>
        succeedWithDetail<TaskInspectToolResult, ITaskFailure>({
          state: 'unresolved',
          context: context.text,
          presentation: _presentations(context).get(inspection.reference.id) ?? 'omitted'
        })
      );
  }
  return renderer
    .render({ tasks: [{ envelope: inspection.envelope }], completeness: 'complete' }, budget.context)
    .onSuccess((context) => {
      const details: string | undefined =
        inspection.details !== undefined ? JSON.stringify(inspection.details) : undefined;
      return succeedWithDetail<TaskInspectToolResult, ITaskFailure>({
        state: 'resolved',
        context: context.text,
        presentation: _presentations(context).get(inspection.envelope.id) ?? 'omitted',
        revision: inspection.envelope.revision,
        archived: inspection.archived,
        commands: inspection.commands,
        ...(details === undefined
          ? {}
          : details.length <= budget.maxDetailsChars
          ? { details: inspection.details }
          : { detailsOmitted: 'too-large' })
      });
    });
}

/** How the rendering presented each task it included; an unresolved diagnostic is always whole. */
function _presentations(context: ITaskContext): Map<string, TaskToolPresentation> {
  const shown: Map<string, TaskToolPresentation> = new Map<string, TaskContextPresentation>(
    context.entries.map((entry) => [entry.summary.envelope.id, entry.presentation])
  );
  for (const diagnostic of context.diagnostics) {
    shown.set(diagnostic.id, 'complete');
  }
  return shown;
}
