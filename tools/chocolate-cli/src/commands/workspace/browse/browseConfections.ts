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

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ConfectionId, FillingId, IngredientId, LibraryRuntime, MoldId } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError } from '../shared';
import { renderConfectionSummary, renderConfectionDetail, IEntityAction } from '../renderers';
import { showIngredientDetail } from './browseIngredients';
import { showFillingDetail } from './browseFillings';
import { showMoldDetail } from './browseMolds';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable confection item for interactive selection.
 */
interface IConfectionSelectableItem extends ISelectableItem {
  id: ConfectionId;
  confection: LibraryRuntime.IConfectionBase;
}

/**
 * Builds selectable items from the confection library.
 */
function buildConfectionItems(context: IBrowseContext): IConfectionSelectableItem[] {
  const items: IConfectionSelectableItem[] = [];
  for (const confection of context.library.confections.values()) {
    items.push({
      id: confection.id,
      name: confection.name,
      description: `[${confection.confectionType}] ${confection.variations.length} variation(s)`,
      confection
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows the detail view for a confection with action menu.
 */
export async function showConfectionDetail(
  confection: LibraryRuntime.IConfectionBase,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(confection.name);

  const result = renderConfectionDetail(confection);

  console.log('');
  console.log(result.text);
  console.log('');

  // Show action menu if there are actions
  if (result.actions.length > 0) {
    while (true) {
      const navResult = await showConfectionActionMenu(result.actions, confection, context);
      if (navResult === 'exit') {
        context.breadcrumb.pop();
        return fail('exit');
      }
      if (navResult === 'back') {
        break;
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Shows the action menu for a confection and handles navigation.
 */
async function showConfectionActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  confection: LibraryRuntime.IConfectionBase,
  context: IBrowseContext
): Promise<'back' | 'continue' | 'exit'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult = await showMenu({
    message: `${confection.name} - Actions`,
    choices,
    showBack: true,
    showExit: true
  });

  if (menuResult.action === 'exit') {
    return 'exit';
  }

  if (menuResult.action === 'back') {
    return 'back';
  }

  if (menuResult.action === 'value') {
    const key = menuResult.value;

    // Navigate to ingredient (chocolate)
    if (key.startsWith('view-ingredient:')) {
      const ingredientId = key.substring('view-ingredient:'.length) as IngredientId;
      const ingredientResult = context.library.ingredients.get(ingredientId);
      if (ingredientResult.isSuccess()) {
        const detailResult = await showIngredientDetail(ingredientResult.value, context);
        if (detailResult.isFailure() && detailResult.message === 'exit') {
          return 'exit';
        }
        return 'continue';
      } else {
        showError(`Ingredient not found: ${ingredientId}`);
      }
    }

    // Navigate to filling
    if (key.startsWith('view-filling:')) {
      const fillingId = key.substring('view-filling:'.length) as FillingId;
      const fillingResult = context.library.fillings.get(fillingId);
      if (fillingResult.isSuccess()) {
        const detailResult = await showFillingDetail(fillingResult.value, context);
        if (detailResult.isFailure() && detailResult.message === 'exit') {
          return 'exit';
        }
        return 'continue';
      } else {
        showError(`Filling not found: ${fillingId}`);
      }
    }

    // Navigate to mold
    if (key.startsWith('view-mold:')) {
      const moldId = key.substring('view-mold:'.length) as MoldId;
      const moldResult = context.library.molds.get(moldId);
      if (moldResult.isSuccess()) {
        const detailResult = await showMoldDetail(moldResult.value, context);
        if (detailResult.isFailure() && detailResult.message === 'exit') {
          return 'exit';
        }
        return 'continue';
      } else {
        showError(`Mold not found: ${moldId}`);
      }
    }
  }

  return 'back';
}

/**
 * Browses confections interactively.
 */
export async function browseConfectionsInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Confections');

  const items = buildConfectionItems(context);

  if (items.length === 0) {
    showInfo('No confections found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a confection (${items.length} available):`,
      formatName: (item) => renderConfectionSummary(item.confection)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IConfectionSelectableItem;
    const detailResult = await showConfectionDetail(selected.confection, context);
    if (detailResult.isFailure() && detailResult.message === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
