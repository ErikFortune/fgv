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
import { LibraryRuntime, MoldId } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError } from '../shared';
import { renderMoldSummary, renderMoldDetail, IEntityAction } from '../renderers';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable mold item for interactive selection.
 */
interface IMoldSelectableItem extends ISelectableItem {
  id: MoldId;
  mold: LibraryRuntime.IMold;
}

/**
 * Builds selectable items from the mold library.
 */
function buildMoldItems(context: IBrowseContext): IMoldSelectableItem[] {
  const items: IMoldSelectableItem[] = [];
  for (const mold of context.library.molds.values()) {
    items.push({
      id: mold.id,
      name: mold.displayName,
      description: `[${mold.manufacturer}] ${mold.cavityCount} cavities`,
      mold
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows the detail view for a mold with action menu.
 */
export async function showMoldDetail(
  mold: LibraryRuntime.IMold,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(mold.displayName);

  const result = renderMoldDetail(mold, context.renderContext);
  console.log('');
  console.log(result.text);
  console.log('');

  // Handle actions (navigate to related molds)
  if (result.actions.length > 0) {
    while (true) {
      const navResult = await showMoldActionMenu(result.actions, mold, context);
      if (navResult === 'back') {
        break;
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Shows the action menu for a mold and handles navigation.
 */
async function showMoldActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  mold: LibraryRuntime.IMold,
  context: IBrowseContext
): Promise<'back' | 'continue'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult = await showMenu({
    message: `${mold.displayName} - Actions`,
    choices,
    showBack: true,
    showExit: false
  });

  if (menuResult.action === 'back' || menuResult.action === 'exit') {
    return 'back';
  }

  if (menuResult.action === 'value') {
    const key = menuResult.value;
    if (key.startsWith('view-mold:')) {
      const moldId = key.substring('view-mold:'.length) as MoldId;
      const relatedResult = context.library.molds.get(moldId);
      if (relatedResult.isSuccess()) {
        await showMoldDetail(relatedResult.value, context);
        return 'continue';
      } else {
        showError(`Mold not found: ${moldId}`);
      }
    }
  }

  return 'back';
}

/**
 * Browses molds interactively.
 */
export async function browseMoldsInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Molds');

  const items = buildMoldItems(context);

  if (items.length === 0) {
    showInfo('No molds found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a mold (${items.length} available):`,
      formatName: (item) => renderMoldSummary(item.mold)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IMoldSelectableItem;
    await showMoldDetail(selected.mold, context);
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
