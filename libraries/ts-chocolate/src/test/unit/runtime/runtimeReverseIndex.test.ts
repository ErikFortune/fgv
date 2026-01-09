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
  BaseRecipeId,
  Grams,
  IngredientId,
  Percentage,
  RecipeId,
  RecipeName,
  RecipeVersionSpec,
  SourceId
} from '../../../packlets/common';

import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IIngredient,
  IngredientsLibrary
} from '../../../packlets/ingredients';
import { IRecipe, RecipesLibrary } from '../../../packlets/recipes';
import { ChocolateLibrary, RuntimeReverseIndex } from '../../../packlets/runtime';

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

  const darkChocolate: IChocolateIngredient = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin']
  };

  const milkChocolate: IChocolateIngredient = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredient = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredient = {
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

  const darkGanacheRecipe: IRecipe = {
    baseId: 'dark-ganache' as BaseRecipeId,
    name: 'Dark Ganache' as RecipeName,
    category: 'ganache',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          {
            ingredient: {
              ids: ['test.dark-chocolate' as IngredientId, 'test.alt-chocolate' as IngredientId],
              preferredId: 'test.dark-chocolate' as IngredientId
            },
            amount: 200 as Grams
          },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ]
  };

  const milkGanacheRecipe: IRecipe = {
    baseId: 'milk-ganache' as BaseRecipeId,
    name: 'Milk Ganache' as RecipeName,
    category: 'ganache',
    tags: ['classic', 'milk'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredient: { ids: ['test.milk-chocolate' as IngredientId] }, amount: 200 as Grams },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 150 as Grams }
        ],
        baseWeight: 350 as Grams
      }
    ]
  };

  let library: ChocolateLibrary;
  let reverseIndex: RuntimeReverseIndex;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
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

    const recipes = RecipesLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as SourceId,
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

    library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, recipes }
    }).orThrow();

    reverseIndex = new RuntimeReverseIndex(library);
  });

  // ============================================================================
  // Ingredient → Recipe Lookup Tests
  // ============================================================================

  describe('ingredient to recipe lookups', () => {
    test('getRecipesUsingIngredient returns recipes using a primary ingredient', () => {
      const recipes = reverseIndex.getRecipesUsingIngredient('test.dark-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesUsingIngredient returns recipes using an alternate ingredient', () => {
      const recipes = reverseIndex.getRecipesUsingIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesUsingIngredient returns multiple recipes for shared ingredient', () => {
      const recipes = reverseIndex.getRecipesUsingIngredient('test.cream' as IngredientId);
      expect(recipes.size).toBe(2);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
      expect(recipes.has('test.milk-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesUsingIngredient returns empty set for unused ingredient', () => {
      const recipes = reverseIndex.getRecipesUsingIngredient('test.nonexistent' as IngredientId);
      expect(recipes.size).toBe(0);
    });

    test('getRecipesWithPrimaryIngredient returns only primary usages', () => {
      const recipes = reverseIndex.getRecipesWithPrimaryIngredient('test.dark-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesWithPrimaryIngredient excludes alternate usages', () => {
      const recipes = reverseIndex.getRecipesWithPrimaryIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(0);
    });

    test('getRecipesWithAlternateIngredient returns only alternate usages', () => {
      const recipes = reverseIndex.getRecipesWithAlternateIngredient('test.alt-chocolate' as IngredientId);
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesWithAlternateIngredient excludes primary usages', () => {
      const recipes = reverseIndex.getRecipesWithAlternateIngredient('test.dark-chocolate' as IngredientId);
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
      expect(usage[0].recipeId).toBe('test.dark-ganache');
      expect(usage[0].isPrimary).toBe(true);
    });

    test('getIngredientUsage returns info for alternate ingredients', () => {
      const usage = reverseIndex.getIngredientUsage('test.alt-chocolate' as IngredientId);
      expect(usage.length).toBe(1);
      expect(usage[0].recipeId).toBe('test.dark-ganache');
      expect(usage[0].isPrimary).toBe(false);
    });

    test('getIngredientUsage returns multiple usage records', () => {
      const usage = reverseIndex.getIngredientUsage('test.cream' as IngredientId);
      expect(usage.length).toBe(2);
      const recipeIds = usage.map((u) => u.recipeId);
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
    test('getRecipesByTag returns recipes with tag', () => {
      const recipes = reverseIndex.getRecipesByTag('classic');
      expect(recipes.size).toBe(2);
    });

    test('getRecipesByTag is case-insensitive', () => {
      const recipes = reverseIndex.getRecipesByTag('CLASSIC');
      expect(recipes.size).toBe(2);
    });

    test('getRecipesByTag returns specific recipes for unique tag', () => {
      const recipes = reverseIndex.getRecipesByTag('dark');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesByTag returns empty set for unknown tag', () => {
      const recipes = reverseIndex.getRecipesByTag('unknown');
      expect(recipes.size).toBe(0);
    });

    test('getAllRecipeTags returns all unique tags', () => {
      const tags = reverseIndex.getAllRecipeTags();
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
    test('getRecipesByChocolateType returns recipes with dark chocolate', () => {
      const recipes = reverseIndex.getRecipesByChocolateType('dark');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesByChocolateType returns recipes with milk chocolate', () => {
      const recipes = reverseIndex.getRecipesByChocolateType('milk');
      expect(recipes.size).toBe(1);
      expect(recipes.has('test.milk-ganache' as RecipeId)).toBe(true);
    });

    test('getRecipesByChocolateType returns empty set for unused type', () => {
      const recipes = reverseIndex.getRecipesByChocolateType('white');
      expect(recipes.size).toBe(0);
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('cache management', () => {
    test('indexes are built lazily', () => {
      // First access builds the index
      const recipes1 = reverseIndex.getRecipesByTag('classic');
      expect(recipes1.size).toBe(2);

      // Second access uses cached index
      const recipes2 = reverseIndex.getRecipesByTag('classic');
      expect(recipes2.size).toBe(2);
    });

    test('invalidate clears all indexes', () => {
      // Build indexes
      reverseIndex.getRecipesUsingIngredient('test.dark-chocolate' as IngredientId);
      reverseIndex.getRecipesByTag('classic');
      reverseIndex.getRecipesByChocolateType('dark');

      // Invalidate
      reverseIndex.invalidate();

      // Indexes should rebuild on next access
      const recipes = reverseIndex.getRecipesByTag('classic');
      expect(recipes.size).toBe(2);
    });

    test('warmUp pre-builds all indexes', () => {
      reverseIndex.warmUp();

      // All lookups should work
      expect(reverseIndex.getRecipesUsingIngredient('test.cream' as IngredientId).size).toBe(2);
      expect(reverseIndex.getRecipesByTag('classic').size).toBe(2);
      expect(reverseIndex.getIngredientsByTag('premium').size).toBe(1);
      expect(reverseIndex.getRecipesByChocolateType('dark').size).toBe(1);
    });
  });
});
