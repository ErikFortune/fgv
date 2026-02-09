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

import { showInfo } from '../shared';
import { IBrowseContext } from './browseTypes';

/**
 * Browses inventory (flat-dump stub).
 */
export async function browseInventoryInteractive(context: IBrowseContext): Promise<Result<void>> {
  context.breadcrumb.push('Inventory');

  const userLibrary = context.userLibrary;
  if (!userLibrary) {
    context.breadcrumb.pop();
    return fail('User library not available');
  }

  const moldInventory = Array.from(userLibrary.moldInventory.values());
  const ingredientInventory = Array.from(userLibrary.ingredientInventory.values());

  showInfo(`Mold Inventory: ${moldInventory.length} entry/entries`);
  showInfo(`Ingredient Inventory: ${ingredientInventory.length} entry/entries`);

  if (moldInventory.length > 0) {
    console.log('\nMold Inventory:');
    for (const entry of moldInventory) {
      console.log(`  - ${JSON.stringify(entry, null, 2)}`);
    }
  }

  if (ingredientInventory.length > 0) {
    console.log('\nIngredient Inventory:');
    for (const entry of ingredientInventory) {
      console.log(`  - ${JSON.stringify(entry, null, 2)}`);
    }
  }

  context.breadcrumb.pop();
  return succeed(undefined);
}
