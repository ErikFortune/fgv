// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Shared Markdown rendering helpers for the presentation packlet.
 * @packageDocumentation
 */

import { Result, mapResults, succeed } from '@fgv/ts-utils';

import { Model as CommonModel } from '../common';
import type { IProcedure, IResolvedProcedureStep } from '../library-runtime';

/**
 * Formats a categorized note as a string.
 * @internal
 */
export function formatCategorizedNote(note: CommonModel.ICategorizedNote): string {
  return `*${note.category}*: ${note.note}`;
}

/**
 * Formats a minutes value as a short label (e.g. "15 min active").
 * @internal
 */
export function formatTimeLabel(minutes: number | undefined, label: string): string | undefined {
  return minutes !== undefined && minutes > 0 ? `${minutes} min ${label}` : undefined;
}

function _renderProcedureStep(step: IResolvedProcedureStep): Result<string[]> {
  return step.resolvedTask
    .render(step.params)
    .withErrorFormat((msg) => `Failed to render step ${step.order}: ${msg}`)
    .onSuccess((rendered) => {
      const timeFragments = [
        formatTimeLabel(step.activeTime ?? step.resolvedTask.defaultActiveTime, 'active'),
        formatTimeLabel(step.waitTime ?? step.resolvedTask.defaultWaitTime, 'wait'),
        formatTimeLabel(step.holdTime ?? step.resolvedTask.defaultHoldTime, 'hold')
      ].filter((t): t is string => t !== undefined);

      const timeSuffix = timeFragments.length > 0 ? ` *(${timeFragments.join(' / ')})*` : '';
      const lines: string[] = [`${step.order}. ${rendered}${timeSuffix}`];

      const temp = step.temperature ?? step.resolvedTask.defaultTemperature;
      const stepNoteFragments: string[] = [];
      if (temp !== undefined) {
        stepNoteFragments.push(`**${temp}°C**`);
      }
      if (step.notes && step.notes.length > 0) {
        stepNoteFragments.push(...step.notes.map((note) => formatCategorizedNote(note)));
      }
      if (stepNoteFragments.length > 0) {
        lines.push(`   > ${stepNoteFragments.join(' — ')}`);
      }

      return succeed(lines);
    });
}

/**
 * Renders the steps of a procedure as Markdown.
 * @internal
 */
export function renderProcedureSection(procedure: IProcedure): Result<string[]> {
  return procedure
    .getSteps()
    .withErrorFormat((msg) => `Failed to get steps for procedure '${procedure.name}': ${msg}`)
    .onSuccess((steps) =>
      mapResults(
        steps.map((step) =>
          _renderProcedureStep(step).withErrorFormat(
            (msg) => `Procedure '${procedure.name}' step ${step.order}: ${msg}`
          )
        )
      ).onSuccess((renderedSteps) => {
        const lines: string[] = ['', `## Procedure: ${procedure.name}`];
        for (const stepLines of renderedSteps) {
          lines.push(...stepLines);
        }
        return succeed(lines);
      })
    );
}
