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
import { FillingId, FillingRecipeVariationSpec, IngredientId, LibraryRuntime } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError } from '../shared';
import { renderFillingSummary, renderFillingDetail, IEntityAction } from '../renderers';
import { showIngredientDetail } from './browseIngredients';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable filling item for interactive selection.
 */
interface IFillingSelectableItem extends ISelectableItem {
  id: FillingId;
  filling: LibraryRuntime.IFillingRecipe;
}

/**
 * Builds selectable items from the filling library.
 */
function buildFillingItems(context: IBrowseContext): IFillingSelectableItem[] {
  const items: IFillingSelectableItem[] = [];
  for (const filling of context.library.fillings.values()) {
    items.push({
      id: filling.id,
      name: filling.name,
      description: `[${filling.entity.category}] ${filling.variations.length} variation(s)`,
      filling
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Finds confections that use a given filling by scanning the confection library.
 */
function findConfectionsUsingFilling(
  fillingId: FillingId,
  context: IBrowseContext
): LibraryRuntime.IConfectionBase[] {
  const result: LibraryRuntime.IConfectionBase[] = [];
  for (const confection of context.library.confections.values()) {
    const fillings = confection.fillings;
    if (fillings) {
      for (const slot of fillings) {
        for (const option of slot.filling.options) {
          if (option.type === 'recipe' && option.id === fillingId) {
            result.push(confection);
            break;
          }
        }
        if (result.length > 0 && result[result.length - 1] === confection) {
          break;
        }
      }
    }
  }
  return result;
}

/**
 * Shows the detail view for a filling with action menu.
 */
export async function showFillingDetail(
  filling: LibraryRuntime.IFillingRecipe,
  context: IBrowseContext,
  variationSpec?: FillingRecipeVariationSpec
): Promise<Result<void>> {
  context.breadcrumb.push(filling.name);

  // Determine which variation to show
  let variation: LibraryRuntime.IFillingRecipeVariation;
  if (variationSpec) {
    const varResult = filling.getVariation(variationSpec);
    if (varResult.isFailure()) {
      showError(`Variation not found: ${variationSpec}`);
      context.breadcrumb.pop();
      return succeed(undefined);
    }
    variation = varResult.value;
  } else if (filling.variations.length > 1) {
    // If multiple variations, let user pick (or default to golden)
    variation = filling.goldenVariation;
  } else {
    variation = filling.goldenVariation;
  }

  const result = renderFillingDetail(filling, variation);

  // Augment actions with confection lookup
  const allActions = [...result.actions];
  const confectionsUsing = findConfectionsUsingFilling(filling.id, context);
  if (confectionsUsing.length > 0) {
    allActions.push({
      label: `View confections using this filling (${confectionsUsing.length})`,
      key: 'view-confections',
      description: `${confectionsUsing.length} confection(s) use this filling`
    });
  }

  console.log('');
  console.log(result.text);
  console.log('');

  // Show action menu if there are actions
  if (allActions.length > 0) {
    while (true) {
      const navResult = await showFillingActionMenu(
        allActions,
        filling,
        variation,
        confectionsUsing,
        context
      );
      if (navResult === 'back') {
        break;
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Shows the action menu for a filling and handles navigation.
 */
async function showFillingActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  filling: LibraryRuntime.IFillingRecipe,
  currentVariation: LibraryRuntime.IFillingRecipeVariation,
  confectionsUsing: LibraryRuntime.IConfectionBase[],
  context: IBrowseContext
): Promise<'back' | 'continue'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult = await showMenu({
    message: `${filling.name} - Actions`,
    choices,
    showBack: true,
    showExit: false
  });

  if (menuResult.action === 'back' || menuResult.action === 'exit') {
    return 'back';
  }

  if (menuResult.action === 'value') {
    const key = menuResult.value;

    // Navigate to ingredient
    if (key.startsWith('view-ingredient:')) {
      const ingredientId = key.substring('view-ingredient:'.length) as IngredientId;
      const ingredientResult = context.library.ingredients.get(ingredientId);
      if (ingredientResult.isSuccess()) {
        await showIngredientDetail(ingredientResult.value, context);
        return 'continue';
      } else {
        showError(`Ingredient not found: ${ingredientId}`);
      }
    }

    // View another variation
    if (key === 'view-variation') {
      const items = filling.variations
        .filter((v) => v.variationSpec !== currentVariation.variationSpec)
        .map((v) => ({
          id: v.variationId,
          name: `${v.variationSpec}${v.variationSpec === filling.goldenVariationSpec ? ' (golden)' : ''}`,
          description: `Created: ${v.createdDate}`
        }));

      const selectionResult = await interactiveSelect({
        items,
        prompt: 'Select a variation:',
        formatName: (item) => item.name
      });

      if (selectionResult.isSuccess() && selectionResult.value !== 'cancelled') {
        const selected = selectionResult.value;
        const selectedVariation = filling.variations.find((v) => v.variationId === selected.id);
        if (selectedVariation) {
          // Re-render with new variation
          context.breadcrumb.pop();
          await showFillingDetail(filling, context, selectedVariation.variationSpec);
          // After returning from the recursive call, we should exit this menu
          return 'back';
        }
      }
      return 'continue';
    }

    // View confections using this filling
    if (key === 'view-confections') {
      await showConfectionsUsingFilling(confectionsUsing, filling, context);
      return 'continue';
    }
  }

  return 'back';
}

/**
 * Shows confections that use a given filling.
 */
async function showConfectionsUsingFilling(
  confections: LibraryRuntime.IConfectionBase[],
  filling: LibraryRuntime.IFillingRecipe,
  context: IBrowseContext
): Promise<void> {
  if (confections.length === 0) {
    showInfo('No confections use this filling');
    return;
  }

  context.breadcrumb.push('Used by confections');

  const items = confections.map((c) => ({
    id: c.id,
    name: c.name,
    description: `[${c.confectionType}]`
  }));
  items.sort((a, b) => a.id.localeCompare(b.id));

  const selectionResult = await interactiveSelect({
    items,
    prompt: `Confections using ${filling.name} (${confections.length}):`,
    formatName: (item) => `${item.id} - ${item.name}`
  });

  if (selectionResult.isSuccess() && selectionResult.value !== 'cancelled') {
    const selected = selectionResult.value;
    const selectedConfection = confections.find((c) => c.id === selected.id);
    if (selectedConfection) {
      // Show a summary (full confection browse is Phase 4)
      console.log('');
      console.log(`Confection: ${selectedConfection.name}`);
      console.log(`ID: ${selectedConfection.id}`);
      console.log(`Type: ${selectedConfection.confectionType}`);
      if (selectedConfection.description) {
        console.log(`Description: ${selectedConfection.description}`);
      }
      console.log('');
    }
  }

  context.breadcrumb.pop();
}

/**
 * Browses fillings interactively.
 */
export async function browseFillingsInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Fillings');

  const items = buildFillingItems(context);

  if (items.length === 0) {
    showInfo('No fillings found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a filling (${items.length} available):`,
      formatName: (item) => renderFillingSummary(item.filling)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IFillingSelectableItem;
    await showFillingDetail(selected.filling, context);
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
