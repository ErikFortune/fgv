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
 * Built-in ingredient collections (browser-safe)
 * @packageDocumentation
 */

import { IngredientCollectionEntryInit } from './ingredientsCollection';
import { Converters as CommonConverters } from '../common';

// Import JSON data directly (bundlers handle this)
// eslint-disable-next-line @rushstack/packlets/mechanics
import commonIngredients from '../../data/ingredients/common.json';
// eslint-disable-next-line @rushstack/packlets/mechanics
import felchlinIngredients from '../../data/ingredients/felchlin.json';
// eslint-disable-next-line @rushstack/packlets/mechanics
import guittardIngredients from '../../data/ingredients/guittard.json';
// eslint-disable-next-line @rushstack/packlets/mechanics
import cacaoBarryIngredients from '../../data/ingredients/cacao-barry.json';

/**
 * Built-in ingredient collections
 * @public
 */
export const builtInIngredientCollections: ReadonlyArray<IngredientCollectionEntryInit> = [
  {
    id: CommonConverters.sourceId.convert('common').orThrow(),
    isMutable: false,
    items: commonIngredients as Record<string, unknown>
  },
  {
    id: CommonConverters.sourceId.convert('felchlin').orThrow(),
    isMutable: false,
    items: felchlinIngredients as Record<string, unknown>
  },
  {
    id: CommonConverters.sourceId.convert('guittard').orThrow(),
    isMutable: false,
    items: guittardIngredients as Record<string, unknown>
  },
  {
    id: CommonConverters.sourceId.convert('cacao-barry').orThrow(),
    isMutable: false,
    items: cacaoBarryIngredients as Record<string, unknown>
  }
];
