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
import { IngredientId, MoldId, UserLibrary as UserLib } from '@fgv/ts-chocolate';

import { interactiveSelect, ISelectableItem } from '../../shared';
import { showMenu, showInfo, showError } from '../shared';
import {
  renderMoldInventorySummary,
  renderIngredientInventorySummary,
  renderMoldInventoryDetail,
  renderIngredientInventoryDetail,
  IEntityAction
} from '../renderers';
import { showMoldDetail } from './browseMolds';
import { showIngredientDetail } from './browseIngredients';
import { IBrowseContext } from './browseTypes';

/**
 * Selectable mold inventory item for interactive selection.
 */
interface IMoldInventorySelectableItem extends ISelectableItem {
  entry: UserLib.IMoldInventoryEntry;
}

/**
 * Selectable ingredient inventory item for interactive selection.
 */
interface IIngredientInventorySelectableItem extends ISelectableItem {
  entry: UserLib.IIngredientInventoryEntry;
}

/**
 * Builds selectable items from the mold inventory.
 */
function buildMoldInventoryItems(userLibrary: UserLib.IUserLibrary): IMoldInventorySelectableItem[] {
  const items: IMoldInventorySelectableItem[] = [];
  for (const entry of userLibrary.moldInventory.values()) {
    items.push({
      id: entry.id,
      name: entry.item.displayName,
      description: `qty: ${entry.quantity}`,
      entry
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Builds selectable items from the ingredient inventory.
 */
function buildIngredientInventoryItems(
  userLibrary: UserLib.IUserLibrary
): IIngredientInventorySelectableItem[] {
  const items: IIngredientInventorySelectableItem[] = [];
  for (const entry of userLibrary.ingredientInventory.values()) {
    items.push({
      id: entry.id,
      name: entry.item.name,
      description: `${entry.quantity}${entry.entity.unit ?? 'g'}`,
      entry
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Shows detail view for a mold inventory entry and handles action navigation.
 */
async function showMoldInventoryDetail(
  entry: UserLib.IMoldInventoryEntry,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(entry.item.displayName);

  const result = renderMoldInventoryDetail(entry);
  console.log('');
  console.log(result.text);
  console.log('');

  if (result.actions.length > 0) {
    while (true) {
      const navResult = await showInventoryActionMenu(result.actions, entry.item.displayName, context);
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
 * Shows detail view for an ingredient inventory entry and handles action navigation.
 */
async function showIngredientInventoryDetail(
  entry: UserLib.IIngredientInventoryEntry,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push(entry.item.name);

  const result = renderIngredientInventoryDetail(entry);
  console.log('');
  console.log(result.text);
  console.log('');

  if (result.actions.length > 0) {
    while (true) {
      const navResult = await showInventoryActionMenu(result.actions, entry.item.name, context);
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
 * Shows the action menu for an inventory entry and handles navigation.
 */
async function showInventoryActionMenu(
  actions: ReadonlyArray<IEntityAction>,
  itemName: string,
  context: IBrowseContext
): Promise<'back' | 'continue' | 'exit'> {
  const choices = actions.map((action) => ({
    value: action.key,
    name: action.label,
    description: action.description
  }));

  const menuResult = await showMenu({
    message: `${itemName} - Actions`,
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
  }

  return 'back';
}

/**
 * Browses mold inventory interactively.
 */
async function browseMoldInventory(
  userLibrary: UserLib.IUserLibrary,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push('Mold Inventory');

  const items = buildMoldInventoryItems(userLibrary);

  if (items.length === 0) {
    showInfo('No mold inventory entries');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select a mold inventory entry (${items.length} available):`,
      formatName: (item) => renderMoldInventorySummary(item.entry)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IMoldInventorySelectableItem;
    const detailResult = await showMoldInventoryDetail(selected.entry, context);
    if (detailResult.isFailure() && detailResult.message === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses ingredient inventory interactively.
 */
async function browseIngredientInventory(
  userLibrary: UserLib.IUserLibrary,
  context: IBrowseContext
): Promise<Result<void>> {
  context.breadcrumb.push('Ingredient Inventory');

  const items = buildIngredientInventoryItems(userLibrary);

  if (items.length === 0) {
    showInfo('No ingredient inventory entries');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const selectionResult = await interactiveSelect({
      items,
      prompt: `Select an ingredient inventory entry (${items.length} available):`,
      formatName: (item) => renderIngredientInventorySummary(item.entry)
    });

    if (selectionResult.isFailure()) {
      showError(selectionResult.message);
      break;
    }

    if (selectionResult.value === 'cancelled') {
      break;
    }

    const selected = selectionResult.value as IIngredientInventorySelectableItem;
    const detailResult = await showIngredientInventoryDetail(selected.entry, context);
    if (detailResult.isFailure() && detailResult.message === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}

/**
 * Browses inventory interactively with a two-level menu.
 */
export async function browseInventoryInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Inventory');

  const userLibrary = context.userLibrary;
  if (!userLibrary) {
    context.breadcrumb.pop();
    return fail('User library not available');
  }

  const moldCount = Array.from(userLibrary.moldInventory.values()).length;
  const ingredientCount = Array.from(userLibrary.ingredientInventory.values()).length;

  if (moldCount === 0 && ingredientCount === 0) {
    showInfo('No inventory entries found');
    context.breadcrumb.pop();
    return succeed(undefined);
  }

  while (true) {
    const menuResult = await showMenu({
      message: 'Inventory Categories',
      choices: [
        {
          value: 'molds',
          name: `Mold Inventory (${moldCount})`,
          description: `${moldCount} mold inventory entry/entries`
        },
        {
          value: 'ingredients',
          name: `Ingredient Inventory (${ingredientCount})`,
          description: `${ingredientCount} ingredient inventory entry/entries`
        }
      ],
      showBack: true,
      showExit: true
    });

    if (menuResult.action === 'exit') {
      context.breadcrumb.pop();
      return fail('exit');
    }

    if (menuResult.action === 'back') {
      break;
    }

    if (menuResult.action === 'value') {
      let subResult: Result<void> = succeed(undefined);
      if (menuResult.value === 'molds') {
        subResult = await browseMoldInventory(userLibrary, context);
      } else if (menuResult.value === 'ingredients') {
        subResult = await browseIngredientInventory(userLibrary, context);
      }
      if (subResult.isFailure() && subResult.message === 'exit') {
        context.breadcrumb.pop();
        return fail('exit');
      }
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
