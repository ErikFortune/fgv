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

import { UserLibrary as UserLib } from '@fgv/ts-chocolate';

import { formatCategorizedNotes } from '../../shared/outputFormatter';
import { IEntityAction, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for a journal entry (for list display).
 */
export function renderJournalSummary(entry: UserLib.AnyJournalEntry): string {
  return `${entry.timestamp} [${entry.entity.type}] ${entry.recipe.name}`;
}

/**
 * Returns whether a journal entry is filling-related based on entity type.
 */
function isFillingEntry(entry: UserLib.AnyJournalEntry): boolean {
  return entry.entity.type === 'filling-edit' || entry.entity.type === 'filling-production';
}

/**
 * Renders a full detail view for a journal entry.
 */
export function renderJournalDetail(entry: UserLib.AnyJournalEntry): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  lines.push(`Journal Entry: ${entry.recipe.name}`);
  lines.push(`ID: ${entry.id}`);
  lines.push(`Timestamp: ${entry.timestamp}`);
  lines.push(`Type: ${entry.entity.type}`);
  lines.push(`Recipe: ${entry.recipe.name} (${entry.recipe.id})`);
  lines.push(`Variation: ${entry.variationId}`);

  // Production-specific yield info
  if (entry.entity.type === 'filling-production') {
    lines.push(`Yield: ${entry.entity.yield}g`);
  } else if (entry.entity.type === 'confection-production') {
    const yieldInfo = entry.entity.yield;
    const unitStr = yieldInfo.unit ?? 'pieces';
    lines.push(`Yield: ${yieldInfo.count} ${unitStr}`);
  }

  // Updated variation
  if (entry.updated) {
    lines.push(`Updated Variation: ${entry.updatedId ?? '(unknown)'}`);
  }

  // Notes
  const notesStr = formatCategorizedNotes(entry.notes);
  if (notesStr) {
    lines.push(`Notes: ${notesStr}`);
  }

  // Navigation action
  if (isFillingEntry(entry)) {
    actions.push({
      label: `View filling: ${entry.recipe.name}`,
      key: `view-filling:${entry.recipe.id}`,
      description: `Navigate to filling ${entry.recipe.id}`
    });
  } else {
    actions.push({
      label: `View confection: ${entry.recipe.name}`,
      key: `view-confection:${entry.recipe.id}`,
      description: `Navigate to confection ${entry.recipe.id}`
    });
  }

  return { text: lines.join('\n'), actions };
}
