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

import { Result, succeed } from '@fgv/ts-utils';
import { LibraryRuntime, ProcedureId } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showInfo, showError } from '../shared';
import { renderProcedureSummary, renderProcedureDetail } from '../renderers';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable procedure item for interactive selection.
 */
interface IProcedureSelectableItem extends ISelectableItem {
  id: ProcedureId;
  procedure: LibraryRuntime.IProcedure;
}

/**
 * Builds selectable items from the procedure library.
 */
function buildProcedureItems(context: IBrowseContext): IProcedureSelectableItem[] {
  const items: IProcedureSelectableItem[] = [];
  for (const procedure of context.library.procedures.values()) {
    const categoryInfo = procedure.category ? `[${procedure.category}] ` : '';
    items.push({
      id: procedure.id,
      name: procedure.name,
      description: `${categoryInfo}${procedure.stepCount} steps`,
      procedure
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows the detail view for a procedure.
 */
export async function showProcedureDetail(
  procedure: LibraryRuntime.IProcedure,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(procedure.name);

  const result = renderProcedureDetail(procedure);
  console.log('');
  console.log(result.text);
  console.log('');

  // Procedures have no cross-entity actions currently

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses procedures interactively.
 */
export async function browseProceduresInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Procedures');

  const items = buildProcedureItems(context);

  if (items.length === 0) {
    showInfo('No procedures found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a procedure (${items.length} available):`,
      formatName: (item) => renderProcedureSummary(item.procedure)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IProcedureSelectableItem;
    await showProcedureDetail(selected.procedure, context);
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
