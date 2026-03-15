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
  FillingId,
  FillingName,
  FillingRecipeVariationSpec,
  CollectionId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary
} from '../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../packlets/entities';
import { ChocolateEntityLibrary, RuntimeReverseIndex } from '../../../packlets/library-runtime';

describe('RuntimeReverseIndex', () => {
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
    name: 'Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin']
  };

  const milkChocolate: IChocolateIngredientEntity = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredientEntity = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 3 as Percentage,
      milkFat: 38 as Percentage,
      water: 55 as Percentage,
      solids: 4 as Percentage,
      otherFats: 0 as Percentage
    },
    tags: ['fresh']
  };

  const darkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'dark-ganache' as BaseFillingId,
    name: 'Dark Ganache' as FillingName,
    category: 'ganache',
    tags: ['classic', 'dark'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          {
            ingredient: {
              ids: ['test.dark-chocolate' as IngredientId, 'test.alt-chocolate' as IngredientId],
              preferredId: 'test.dark-chocolate' as IngredientId
            },
            amount: 200 as Measurement
          },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  const milkGanacheRecipe: IFillingRecipeEntity = {
    baseId: 'milk-ganache' as BaseFillingId,
    name: 'Milk Ganache' as FillingName,
    category: 'ganache',
    tags: ['classic', 'milk'],
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.milk-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 150 as Measurement }
        ],
        baseWeight: 350 as Measurement
      }
    ]
  };

  let library: ChocolateEntityLibrary;
  let reverseIndex: RuntimeReverseIndex;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            'milk-chocolate': milkChocolate,
            'alt-chocolate': altChocolate,
            /* eslint-enable @typescript-eslint/naming-convention */
            cream
          }
        }
      ]
    }).orThrow();

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-ganache': darkGanacheRecipe,
            'milk-ganache': milkGanacheRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    reverseIndex = new RuntimeReverseIndex(library);
  });

  // ============================================================================
  // Ingredient → Recipe Lookup Tests
  // ============================================================================

  describe('ingredient to recipe lookups', () => {
    test('getFillingsUsingIngredient returns recipes using a primary ingredient', () => {
      const recipes = reverseIndex.getFillingsUsingIngredient('test.dark-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsUsingIngredient returns recipes using an alternate ingredient', () => {
      const recipes = reverseIndex.getFillingsUsingIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsUsingIngredient returns multiple recipes for shared ingredient', () => {
      const recipes = reverseIndex.getFillingsUsingIngredient('test.cream' as IngredientId);
      expect(recipes.size).toBe(2);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
      expect(recipes.has('test.milk-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsUsingIngredient returns empty set for unused ingredient', () => {
      const recipes = reverseIndex.getFillingsUsingIngredient('test.nonexistent' as IngredientId);
      expect(recipes.size).toBe(0);
    });

    test('getFillingsWithPrimaryIngredient returns only primary usages', () => {
      const recipes = reverseIndex.getFillingsWithPrimaryIngredient('test.dark-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsWithPrimaryIngredient excludes alternate usages', () => {
      const recipes = reverseIndex.getFillingsWithPrimaryIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(0);
    });

    test('getFillingsWithAlternateIngredient returns only alternate usages', () => {
      const recipes = reverseIndex.getFillingsWithAlternateIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsWithAlternateIngredient excludes primary usages', () => {
      const recipes = reverseIndex.getFillingsWithAlternateIngredient('test.dark-chocolate' as IngredientId);
      expect(recipes.size).toBe(0);
    });
  });

  // ============================================================================
  // Ingredient Usage Info Tests
  // ============================================================================

  describe('ingredient usage info', () => {
    test('getIngredientUsage returns detailed usage info', () => {
      const usage = reverseIndex.getIngredientUsage('test.dark-chocolate' as IngredientId);
      expect(usage.length).toBe(1);
      expect(usage[0].fillingId).toBe('test.dark-ganache');
      expect(usage[0].isPrimary).toBe(true);
    });

    test('getIngredientUsage returns info for alternate ingredients', () => {
      const usage = reverseIndex.getIngredientUsage('test.alt-chocolate' as IngredientId);
      expect(usage.length).toBe(1);
      expect(usage[0].fillingId).toBe('test.dark-ganache');
      expect(usage[0].isPrimary).toBe(false);
    });

    test('getIngredientUsage returns multiple usage records', () => {
      const usage = reverseIndex.getIngredientUsage('test.cream' as IngredientId);
      expect(usage.length).toBe(2);
      const recipeIds = usage.map((u) => u.fillingId);
      expect(recipeIds).toContain('test.dark-ganache');
      expect(recipeIds).toContain('test.milk-ganache');
      expect(usage.every((u) => u.isPrimary)).toBe(true);
    });

    test('getIngredientUsage returns empty array for unused ingredient', () => {
      const usage = reverseIndex.getIngredientUsage('test.nonexistent' as IngredientId);
      expect(usage).toEqual([]);
    });
  });

  // ============================================================================
  // Tag Lookup Tests
  // ============================================================================

  describe('tag lookups', () => {
    test('getFillingsByTag returns recipes with tag', () => {
      const recipes = reverseIndex.getFillingsByTag('classic');
      expect(recipes.size).toBe(2);
    });

    test('getFillingsByTag is case-insensitive', () => {
      const recipes = reverseIndex.getFillingsByTag('CLASSIC');
      expect(recipes.size).toBe(2);
    });

    test('getFillingsByTag returns specific recipes for unique tag', () => {
      const recipes = reverseIndex.getFillingsByTag('dark');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsByTag returns empty set for unknown tag', () => {
      const recipes = reverseIndex.getFillingsByTag('unknown');
      expect(recipes.size).toBe(0);
    });

    test('getAllFillingTags returns all unique tags', () => {
      const tags = reverseIndex.getAllFillingTags();
      expect(tags).toContain('classic');
      expect(tags).toContain('dark');
      expect(tags).toContain('milk');
    });

    test('getIngredientsByTag returns ingredients with tag', () => {
      const ingredients = reverseIndex.getIngredientsByTag('premium');
      expect(ingredients.size).toBe(1);
      expect(ingredients.has('test.dark-chocolate' as IngredientId)).toBe(true);
    });

    test('getIngredientsByTag is case-insensitive', () => {
      const ingredients = reverseIndex.getIngredientsByTag('PREMIUM');
      expect(ingredients.size).toBe(1);
    });

    test('getAllIngredientTags returns all unique tags', () => {
      const tags = reverseIndex.getAllIngredientTags();
      expect(tags).toContain('premium');
      expect(tags).toContain('single-origin');
      expect(tags).toContain('classic');
      expect(tags).toContain('fresh');
    });
  });

  // ============================================================================
  // Chocolate Type Lookup Tests
  // ============================================================================

  describe('chocolate type lookups', () => {
    test('getFillingsByChocolateType returns recipes with dark chocolate', () => {
      const recipes = reverseIndex.getFillingsByChocolateType('dark');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsByChocolateType returns recipes with milk chocolate', () => {
      const recipes = reverseIndex.getFillingsByChocolateType('milk');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.milk-ganache' as FillingId)).toBe(true);
    });

    test('getFillingsByChocolateType returns empty set for unused type', () => {
      const recipes = reverseIndex.getFillingsByChocolateType('white');
      expect(recipes.size).toBe(0);
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('cache management', () => {
    test('indexes are built lazily', () => {
      // First access builds the index
      const recipes1 = reverseIndex.getFillingsByTag('classic');
      expect(recipes1.size).toBe(2);

      // Second access uses cached index
      const recipes2 = reverseIndex.getFillingsByTag('classic');
      expect(recipes2.size).toBe(2);
    });

    test('invalidate clears all indexes', () => {
      // Build indexes
      reverseIndex.getFillingsUsingIngredient('test.dark-chocolate' as IngredientId);
      reverseIndex.getFillingsByTag('classic');
      reverseIndex.getFillingsByChocolateType('dark');

      // Invalidate
      reverseIndex.invalidate();

      // Indexes should rebuild on next access
      const recipes = reverseIndex.getFillingsByTag('classic');
      expect(recipes.size).toBe(2);
    });

    test('warmUp pre-builds all indexes', () => {
      reverseIndex.warmUp();

      // All lookups should work
      expect(reverseIndex.getFillingsUsingIngredient('test.cream' as IngredientId).size).toBe(2);
      expect(reverseIndex.getFillingsByTag('classic').size).toBe(2);
      expect(reverseIndex.getIngredientsByTag('premium').size).toBe(1);
      expect(reverseIndex.getFillingsByChocolateType('dark').size).toBe(1);
    });
  });
});
