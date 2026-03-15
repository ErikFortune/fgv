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
import { IngredientId, LibraryRuntime } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError, type MenuResult } from '../shared';
import { renderIngredientSummary, renderIngredientDetail, IEntityAction } from '../renderers';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable ingredient item for interactive selection.
 */
interface IIngredientSelectableItem extends ISelectableItem {
  id: IngredientId;
  ingredient: LibraryRuntime.IIngredient;
}

/**
 * Builds selectable items from the ingredient library.
 */
function buildIngredientItems(context: IBrowseContext): IIngredientSelectableItem[] {
  const items: IIngredientSelectableItem[] = [];
  for (const ingredient of context.library.ingredients.values()) {
    const categoryInfo = ingredient.isChocolate()
      ? `${ingredient.category}:${ingredient.chocolateType}`
      : ingredient.category;
    items.push({
      id: ingredient.id,
      name: ingredient.name,
      description: `[${categoryInfo}] ${ingredient.manufacturer ?? ''}`,
      ingredient
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows the detail view for an ingredient with action menu.
 */
export async function showIngredientDetail(
  ingredient: LibraryRuntime.IIngredient,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(ingredient.name);

  const result = renderIngredientDetail(ingredient, context.renderContext);
  console.log('');
  console.log(result.text);
  console.log('');

  // Build action menu if there are actions
  if (result.actions.length > 0) {
    while (true) {
      const menuResult = await showActionMenu(result.actions, ingredient, context);
      if (menuResult === 'exit') {
        context.breadcrumb.pop();
        return fail('exit');
      }
      if (menuResult === 'back') {
        break;
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Shows the action menu for an ingredient and handles navigation.
 * Returns 'back' to exit, 'continue' to re-show.
 */
async function showActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  ingredient: LibraryRuntime.IIngredient,
  context: IBrowseContext
): Promise<'back' | 'continue' | 'exit'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult: MenuResult<string> = await showMenu({
    message: `${ingredient.name} - Actions`,
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

  if (menuResult.action === 'value' && menuResult.value === 'view-fillings') {
    await showFillingsUsingIngredient(ingredient, context);
    return 'continue'; // Sub-navigation doesn't propagate exit
  }

  return 'back';
}

/**
 * Shows fillings that use a given ingredient, allowing selection to navigate to filling detail.
 */
async function showFillingsUsingIngredient(
  ingredient: LibraryRuntime.IIngredient,
  context: IBrowseContext
): Promise<void> {
  const fillings = ingredient.usedByFillings();
  if (fillings.length === 0) {
    showInfo('No fillings use this ingredient');
    return;
  }

  context.breadcrumb.push('Used by fillings');

  const items = fillings.map((filling) => ({
    id: filling.id,
    name: filling.name,
    description: `[${filling.entity.category}] ${filling.variations.length} variation(s)`
  }));
  items.sort((a, b) => a.id.localeCompare(b.id));

  const selectionResult = await interactiveSelect({
    items,
    prompt: `Fillings using ${ingredient.name} (${fillings.length}):`,
    formatName: (item) => `${item.id} - ${item.name}`
  });

  if (selectionResult.isFailure()) {
    showError(selectionResult.message);
    context.breadcrumb.pop();
    return;
  }

  if (selectionResult.value === 'cancelled') {
    context.breadcrumb.pop();
    return;
  }

  // Find the selected filling and show a summary (full filling browse is Phase 3)
  const selected = selectionResult.value;
  const selectedFilling = fillings.find((f) => f.id === selected.id);
  if (selectedFilling) {
    console.log('');
    console.log(`Filling: ${selectedFilling.name}`);
    console.log(`ID: ${selectedFilling.id}`);
    if (selectedFilling.description) {
      console.log(`Description: ${selectedFilling.description}`);
    }
    console.log(`Variations: ${selectedFilling.variations.length}`);
    console.log('');
  }

  context.breadcrumb.pop();
}

/**
 * Browses ingredients interactively.
 * Top-level entry point called from the main browse menu.
 */
export async function browseIngredients(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Ingredients');

  const items = buildIngredientItems(context);

  if (items.length === 0) {
    showInfo('No ingredients found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select an ingredient (${items.length} available):`,
      formatName: (item) => renderIngredientSummary(item.ingredient)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IIngredientSelectableItem;
    const detailResult = await showIngredientDetail(selected.ingredient, context);
    if (detailResult.isFailure() && detailResult.message === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
