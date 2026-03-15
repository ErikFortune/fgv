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

import '@fgv/ts-utils-jest';

import {
  BaseIngredientId,
  BaseFillingId,
  Measurement,
  IngredientId,
  Percentage,
  FillingName,
  FillingRecipeVariationSpec,
  CollectionId
} from '../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary
} from '../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../packlets/library-runtime';

describe('ChocolateLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testChars: IGanacheCharacteristics = {
    cacaoFat: 36 as Percentage,
    sugar: 34 as Percentage,
    milkFat: 0 as Percentage,
    water: 1 as Percentage,
    solids: 29 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement }
        ],
        baseWeight: 200 as Measurement
      }
    ]
  };

  let ctx: ChocolateLibrary;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: true,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: { 'dark-chocolate': darkChocolate }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: true,
          /* eslint-disable @typescript-eslint/naming-convention */
          items: { 'test-ganache': testRecipe }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
  });

  // ============================================================================
  // isCollectionMutable Tests
  // ============================================================================

  describe('isCollectionMutable', () => {
    test('returns true for mutable collection', () => {
      expect(ctx.isCollectionMutable('test' as CollectionId)).toSucceedWith(true);
    });

    test('returns false for immutable collection', () => {
      const immutableIngredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: { 'dark-chocolate': darkChocolate }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const immutableRecipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: { 'test-ganache': testRecipe }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const immutableLibrary = ChocolateEntityLibrary.create({
        libraries: { ingredients: immutableIngredients, fillings: immutableRecipes }
      }).orThrow();

      const immutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(immutableLibrary).orThrow();

      expect(immutableCtx.isCollectionMutable('immutable' as CollectionId)).toSucceedWith(false);
    });

    test('fails for non-existent collection', () => {
      expect(ctx.isCollectionMutable('nonexistent' as CollectionId)).toFailWith(/not found/i);
    });
  });
});
