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

import { Entities, LibraryRuntime } from '@fgv/ts-chocolate';

import { formatCategorizedNotes } from '../../shared/outputFormatter';
import { IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a procedure (for list display).
 */
export function renderProcedureSummary(procedure: LibraryRuntime.IProcedure): string {
  const category = procedure.category ? ` [${procedure.category}]` : '';
  const steps = `${procedure.stepCount} steps`;
  const time = procedure.totalTime !== undefined ? `, ${procedure.totalTime}min total` : '';
  return `${procedure.id} - ${procedure.name}${category} (${steps}${time})`;
}

/**
 * Formats a single procedure step for display.
 */
function formatStep(step: Entities.Procedures.IProcedureStepEntity): string[] {
  const lines: string[] = [];

  // Get task description
  let description: string;
  if (Entities.Tasks.isTaskRefEntity(step.task)) {
    description = `Task: ${step.task.taskId}`;
  } else {
    description = step.task.task.template;
  }

  lines.push(`  ${step.order}. ${description}`);

  // Step timing details
  const details: string[] = [];
  if (step.activeTime !== undefined) {
    details.push(`active: ${step.activeTime}min`);
  }
  if (step.waitTime !== undefined) {
    details.push(`wait: ${step.waitTime}min`);
  }
  if (step.holdTime !== undefined) {
    details.push(`hold: ${step.holdTime}min`);
  }
  if (step.temperature !== undefined) {
    details.push(`temp: ${step.temperature}\u00B0C`);
  }

  if (details.length > 0) {
    lines.push(`     [${details.join(', ')}]`);
  }

  if (step.notes) {
    lines.push(`     Note: ${step.notes}`);
  }

  return lines;
}

/**
 * Renders a full detail view for a procedure.
 */
export function renderProcedureDetail(procedure: LibraryRuntime.IProcedure): IRenderResult {
  const lines: string[] = [];

  lines.push(`Procedure: ${procedure.name}`);
  lines.push(`ID: ${procedure.id}`);

  if (procedure.category) {
    lines.push(`Category: ${procedure.category}`);
  }

  if (procedure.description) {
    lines.push(`Description: ${procedure.description}`);
  }

  if (procedure.tags && procedure.tags.length > 0) {
    lines.push(`Tags: ${procedure.tags.join(', ')}`);
  }

  // Steps
  lines.push('');
  lines.push(`Steps (${procedure.stepCount}):`);
  for (const step of procedure.steps) {
    lines.push(...formatStep(step));
  }

  // Timing summary
  if (
    procedure.totalActiveTime !== undefined ||
    procedure.totalWaitTime !== undefined ||
    procedure.totalHoldTime !== undefined
  ) {
    lines.push('');
    lines.push('Timing Summary:');
    if (procedure.totalActiveTime !== undefined) {
      lines.push(`  Active Time: ${procedure.totalActiveTime}min`);
    }
    if (procedure.totalWaitTime !== undefined) {
      lines.push(`  Wait Time: ${procedure.totalWaitTime}min`);
    }
    if (procedure.totalHoldTime !== undefined) {
      lines.push(`  Hold Time: ${procedure.totalHoldTime}min`);
    }
    if (procedure.totalTime !== undefined) {
      lines.push(`  Total Time: ${procedure.totalTime}min`);
    }
  }

  // Notes
  const notesStr = formatCategorizedNotes(procedure.notes);
  if (notesStr) {
    lines.push('');
    lines.push(`Notes: ${notesStr}`);
  }

  return { text: lines.join('\n'), actions: [] };
}
