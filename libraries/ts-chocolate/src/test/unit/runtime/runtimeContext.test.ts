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
import { IRecipe, IRecipeUsage, RecipesLibrary } from '../../../packlets/recipes';
import { ChocolateLibrary, RuntimeContext } from '../../../packlets/runtime';

describe('RuntimeContext', () => {
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

  const creamChars: IGanacheCharacteristics = {
    cacaoFat: 0 as Percentage,
    sugar: 3 as Percentage,
    milkFat: 38 as Percentage,
    water: 55 as Percentage,
    solids: 4 as Percentage,
    otherFats: 0 as Percentage
  };

  const darkChocolate: IChocolateIngredient = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars,
    tags: ['premium', 'single-origin'],
    manufacturer: 'Test Manufacturer'
  };

  const milkChocolate: IChocolateIngredient = {
    baseId: 'milk-chocolate' as BaseIngredientId,
    name: 'Milk Chocolate 40%',
    category: 'chocolate',
    chocolateType: 'milk',
    cacaoPercentage: 40 as Percentage,
    ganacheCharacteristics: { ...testChars, milkFat: 8 as Percentage },
    tags: ['classic']
  };

  const altChocolate: IChocolateIngredient = {
    baseId: 'alt-chocolate' as BaseIngredientId,
    name: 'Alternative Dark Chocolate',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 65 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredient = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars,
    tags: ['fresh']
  };

  const usage1: IRecipeUsage = {
    date: '2026-01-15',
    versionSpec: '2026-01-01-01' as RecipeVersionSpec,
    scaledWeight: 600 as Grams,
    scaleFactor: 2.0,
    notes: 'First batch'
  };

  const usage2: IRecipeUsage = {
    date: '2026-01-20',
    versionSpec: '2026-01-01-01' as RecipeVersionSpec,
    scaledWeight: 900 as Grams,
    scaleFactor: 3.0
  };

  const darkGanacheRecipe: IRecipe = {
    baseId: 'dark-ganache' as BaseRecipeId,
    name: 'Dark Ganache' as RecipeName,
    description: 'A classic dark chocolate ganache',
    tags: ['classic', 'dark'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Original version',
        ingredients: [
          {
            ingredientId: 'test.dark-chocolate' as IngredientId,
            amount: 200 as Grams,
            alternateIngredientIds: ['test.alt-chocolate' as IngredientId]
          },
          { ingredientId: 'test.cream' as IngredientId, amount: 100 as Grams }
        ],
        baseWeight: 300 as Grams
      },
      {
        versionSpec: '2026-02-01-01' as RecipeVersionSpec,
        createdDate: '2026-02-01',
        notes: 'Revised version',
        ingredients: [
          { ingredientId: 'test.dark-chocolate' as IngredientId, amount: 180 as Grams },
          { ingredientId: 'test.cream' as IngredientId, amount: 120 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ],
    usage: [usage1, usage2]
  };

  const milkGanacheRecipe: IRecipe = {
    baseId: 'milk-ganache' as BaseRecipeId,
    name: 'Milk Ganache' as RecipeName,
    tags: ['classic', 'milk'],
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [
          { ingredientId: 'test.milk-chocolate' as IngredientId, amount: 200 as Grams },
          { ingredientId: 'test.cream' as IngredientId, amount: 150 as Grams }
        ],
        baseWeight: 350 as Grams
      }
    ],
    usage: []
  };

  let library: ChocolateLibrary;

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
  });

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('creation', () => {
    test('fromLibrary wraps existing library', () => {
      expect(RuntimeContext.fromLibrary(library)).toSucceedAndSatisfy((ctx) => {
        expect(ctx.library).toBe(library);
      });
    });

    test('create with no params creates context with default library', () => {
      expect(RuntimeContext.create()).toSucceedAndSatisfy((ctx) => {
        // Default includes builtin data
        expect(ctx.library.ingredients.size).toBeGreaterThan(0);
      });
    });

    test('create with no builtins creates empty library', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: false } })).toSucceedAndSatisfy((ctx) => {
        expect(ctx.library.ingredients.size).toBe(0);
        expect(ctx.library.recipes.size).toBe(0);
      });
    });

    test('create with preWarm option', () => {
      expect(RuntimeContext.create({ libraryParams: { builtin: false }, preWarm: true })).toSucceedAndSatisfy(
        (ctx) => {
          // preWarm causes reverse index to be built eagerly
          expect(ctx.cachedRecipeCount).toBe(0);
          expect(ctx.cachedIngredientCount).toBe(0);
        }
      );
    });

    test('fromLibrary with preWarm option', () => {
      expect(RuntimeContext.fromLibrary(library, true)).toSucceedAndSatisfy((ctx) => {
        // preWarm causes reverse index to be built eagerly
        // Verify context was created successfully with preWarm
        expect(ctx.cachedRecipeCount).toBe(0); // Cache starts empty, preWarm only affects reverse index
        expect(ctx.cachedIngredientCount).toBe(0);
      });
    });
  });

  // ============================================================================
  // Ingredient Resolution Tests
  // ============================================================================

  describe('ingredient resolution', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('getIngredient returns RuntimeIngredient', () => {
      expect(ctx.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.id).toBe('test.dark-chocolate');
        expect(ing.name).toBe('Dark Chocolate 70%');
        expect(ing.category).toBe('chocolate');
        expect(ing.sourceId).toBe('test');
        expect(ing.baseId).toBe('dark-chocolate');
      });
    });

    test('getIngredient caches results', () => {
      const result1 = ctx.getIngredient('test.dark-chocolate' as IngredientId).orThrow();
      const result2 = ctx.getIngredient('test.dark-chocolate' as IngredientId).orThrow();
      expect(result1).toBe(result2); // Same instance
    });

    test('getIngredient fails for non-existent', () => {
      expect(ctx.getIngredient('test.nonexistent' as IngredientId)).toFail();
    });

    test('hasIngredient returns true for existing', () => {
      expect(ctx.hasIngredient('test.dark-chocolate' as IngredientId)).toBe(true);
    });

    test('hasIngredient returns false for non-existent', () => {
      expect(ctx.hasIngredient('test.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Recipe Resolution Tests
  // ============================================================================

  describe('recipe resolution', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('getRecipe returns RuntimeRecipe', () => {
      expect(ctx.getRecipe('test.dark-ganache' as RecipeId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.id).toBe('test.dark-ganache');
        expect(recipe.name).toBe('Dark Ganache');
        expect(recipe.sourceId).toBe('test');
        expect(recipe.baseId).toBe('dark-ganache');
      });
    });

    test('getRecipe caches results', () => {
      const result1 = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
      const result2 = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
      expect(result1).toBe(result2); // Same instance
    });

    test('getRecipe fails for non-existent', () => {
      expect(ctx.getRecipe('test.nonexistent' as RecipeId)).toFail();
    });

    test('hasRecipe returns true for existing', () => {
      expect(ctx.hasRecipe('test.dark-ganache' as RecipeId)).toBe(true);
    });

    test('hasRecipe returns false for non-existent', () => {
      expect(ctx.hasRecipe('test.nonexistent' as RecipeId)).toBe(false);
    });
  });

  // ============================================================================
  // Iteration Tests
  // ============================================================================

  describe('iteration', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('ingredients() iterates all ingredients', () => {
      const ingredients = Array.from(ctx.ingredients());
      expect(ingredients.length).toBe(4);
      const names = ingredients.map((i) => i.name);
      expect(names).toContain('Dark Chocolate 70%');
      expect(names).toContain('Heavy Cream');
    });

    test('recipes() iterates all recipes', () => {
      const recipes = Array.from(ctx.recipes());
      expect(recipes.length).toBe(2);
      const names = recipes.map((r) => r.name);
      expect(names).toContain('Dark Ganache');
      expect(names).toContain('Milk Ganache');
    });

    test('getAllIngredients returns array', () => {
      const ingredients = ctx.getAllIngredients();
      expect(Array.isArray(ingredients)).toBe(true);
      expect(ingredients.length).toBe(4);
    });

    test('getAllRecipes returns array', () => {
      const recipes = ctx.getAllRecipes();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBe(2);
    });
  });

  // ============================================================================
  // Reverse Lookup Tests
  // ============================================================================

  describe('reverse lookups', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('getRecipeIdsUsingIngredient returns correct recipes', () => {
      expect(ctx.getRecipeIdsUsingIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy(
        (recipeIds) => {
          expect(recipeIds.size).toBe(2);
        }
      );
    });

    test('getRecipeIdsUsingIngredient fails for unknown ingredient', () => {
      expect(ctx.getRecipeIdsUsingIngredient('test.unknown' as IngredientId)).toFailWith(/not found/i);
    });

    test('getRecipeIdsWithPrimaryIngredient returns primary usages', () => {
      expect(
        ctx.getRecipeIdsWithPrimaryIngredient('test.dark-chocolate' as IngredientId)
      ).toSucceedAndSatisfy((recipeIds) => {
        expect(recipeIds.size).toBe(1);
        expect(recipeIds.has('test.dark-ganache' as RecipeId)).toBe(true);
      });
    });

    test('getRecipeIdsWithPrimaryIngredient fails for unknown ingredient', () => {
      expect(ctx.getRecipeIdsWithPrimaryIngredient('test.unknown' as IngredientId)).toFailWith(/not found/i);
    });

    test('getRecipeIdsWithAlternateIngredient returns alternate usages', () => {
      expect(
        ctx.getRecipeIdsWithAlternateIngredient('test.alt-chocolate' as IngredientId)
      ).toSucceedAndSatisfy((recipeIds) => {
        expect(recipeIds.size).toBe(1);
        expect(recipeIds.has('test.dark-ganache' as RecipeId)).toBe(true);
      });
    });

    test('getRecipeIdsWithAlternateIngredient fails for unknown ingredient', () => {
      expect(ctx.getRecipeIdsWithAlternateIngredient('test.unknown' as IngredientId)).toFailWith(
        /not found/i
      );
    });

    test('findRecipesUsingIngredient returns RuntimeRecipe objects', () => {
      expect(ctx.findRecipesUsingIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((recipes) => {
        expect(recipes.length).toBe(2);
        expect(recipes[0].name).toBeDefined();
      });
    });

    test('findRecipesUsingIngredient fails for unknown ingredient', () => {
      expect(ctx.findRecipesUsingIngredient('test.unknown' as IngredientId)).toFailWith(/not found/i);
    });

    test('getIngredientUsage returns usage info', () => {
      expect(ctx.getIngredientUsage('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((usage) => {
        expect(usage.length).toBe(1);
        expect(usage[0].isPrimary).toBe(true);
      });
    });

    test('getIngredientUsage fails for unknown ingredient', () => {
      expect(ctx.getIngredientUsage('test.unknown' as IngredientId)).toFailWith(/not found/i);
    });
  });

  // ============================================================================
  // Tag Lookup Tests
  // ============================================================================

  describe('tag lookups', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('findRecipesByTag returns matching recipes', () => {
      expect(ctx.findRecipesByTag('classic')).toSucceedAndSatisfy((recipes) => {
        expect(recipes.length).toBe(2);
      });
    });

    test('findRecipesByTag fails for unknown tag', () => {
      expect(ctx.findRecipesByTag('nonexistent')).toFailWith(/unknown recipe tag/i);
    });

    test('findIngredientsByTag returns matching ingredients', () => {
      expect(ctx.findIngredientsByTag('premium')).toSucceedAndSatisfy((ingredients) => {
        expect(ingredients.length).toBe(1);
        expect(ingredients[0].name).toBe('Dark Chocolate 70%');
      });
    });

    test('findIngredientsByTag fails for unknown tag', () => {
      expect(ctx.findIngredientsByTag('nonexistent')).toFailWith(/unknown ingredient tag/i);
    });

    test('getAllRecipeTags returns unique tags', () => {
      const tags = ctx.getAllRecipeTags();
      expect(tags).toContain('classic');
      expect(tags).toContain('dark');
      expect(tags).toContain('milk');
    });

    test('getAllIngredientTags returns unique tags', () => {
      const tags = ctx.getAllIngredientTags();
      expect(tags).toContain('premium');
      expect(tags).toContain('single-origin');
      expect(tags).toContain('fresh');
    });
  });

  // ============================================================================
  // Chocolate Type Lookup Tests
  // ============================================================================

  describe('chocolate type lookups', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('findRecipesByChocolateType returns matching recipes', () => {
      const darkRecipes = ctx.findRecipesByChocolateType('dark');
      expect(darkRecipes.length).toBe(1);
      expect(darkRecipes[0].name).toBe('Dark Ganache');

      const milkRecipes = ctx.findRecipesByChocolateType('milk');
      expect(milkRecipes.length).toBe(1);
      expect(milkRecipes[0].name).toBe('Milk Ganache');
    });

    test('findRecipesByChocolateType returns empty for unused type', () => {
      const whiteRecipes = ctx.findRecipesByChocolateType('white');
      expect(whiteRecipes.length).toBe(0);
    });
  });

  // ============================================================================
  // Operations Tests
  // ============================================================================

  describe('operations', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('scaleRecipe scales to target weight', () => {
      expect(ctx.scaleRecipe('test.dark-ganache' as RecipeId, 600 as Grams)).toSucceedAndSatisfy((scaled) => {
        expect(scaled.scaledFrom.scaleFactor).toBe(2);
        expect(scaled.baseWeight).toBe(600);
      });
    });

    test('scaleRecipe fails for non-existent recipe', () => {
      expect(ctx.scaleRecipe('test.nonexistent' as RecipeId, 600 as Grams)).toFail();
    });

    test('calculateGanache returns analysis', () => {
      expect(ctx.calculateGanache('test.dark-ganache' as RecipeId)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
      });
    });

    test('calculateGanache fails for non-existent recipe', () => {
      expect(ctx.calculateGanache('test.nonexistent' as RecipeId)).toFail();
    });

    test('calculateGanacheForVersion calculates for specific version', () => {
      expect(
        ctx.calculateGanacheForVersion('test.dark-ganache' as RecipeId, '2026-01-01-01' as RecipeVersionSpec)
      ).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis.totalWeight).toBe(300);
      });
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('cache management', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    test('cache counts reflect cached items', () => {
      // Access some items to populate cache
      ctx.getIngredient('test.dark-chocolate' as IngredientId);
      ctx.getRecipe('test.dark-ganache' as RecipeId);

      expect(ctx.cachedIngredientCount).toBe(1);
      expect(ctx.cachedRecipeCount).toBe(1);
    });

    test('clearCache clears all caches', () => {
      // Populate cache
      ctx.getIngredient('test.dark-chocolate' as IngredientId);
      ctx.getRecipe('test.dark-ganache' as RecipeId);

      ctx.clearCache();

      expect(ctx.cachedIngredientCount).toBe(0);
      expect(ctx.cachedRecipeCount).toBe(0);
    });

    test('warmUp pre-builds reverse indexes', () => {
      ctx.warmUp();

      // Lookups should still work
      expect(ctx.findRecipesByTag('classic')).toSucceedAndSatisfy((recipes) => {
        expect(recipes.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // ValidatingAccessor Tests
  // ============================================================================

  describe('validating accessor', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    describe('getIngredient', () => {
      test('succeeds with valid string ID', () => {
        expect(ctx.validating.getIngredient('test.dark-chocolate')).toSucceedAndSatisfy((ing) => {
          expect(ing.id).toBe('test.dark-chocolate');
          expect(ing.name).toBe('Dark Chocolate 70%');
        });
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.getIngredient('invalid')).toFailWith(/invalid/i);
      });

      test('fails with non-existent ingredient', () => {
        expect(ctx.validating.getIngredient('test.nonexistent')).toFail();
      });
    });

    describe('getRecipe', () => {
      test('succeeds with valid string ID', () => {
        expect(ctx.validating.getRecipe('test.dark-ganache')).toSucceedAndSatisfy((recipe) => {
          expect(recipe.id).toBe('test.dark-ganache');
          expect(recipe.name).toBe('Dark Ganache');
        });
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.getRecipe('invalid')).toFailWith(/invalid/i);
      });

      test('fails with non-existent recipe', () => {
        expect(ctx.validating.getRecipe('test.nonexistent')).toFail();
      });
    });

    describe('hasIngredient', () => {
      test('returns true for existing ingredient', () => {
        expect(ctx.validating.hasIngredient('test.dark-chocolate')).toSucceedWith(true);
      });

      test('returns false for non-existent ingredient', () => {
        expect(ctx.validating.hasIngredient('test.nonexistent')).toSucceedWith(false);
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.hasIngredient('invalid')).toFailWith(/invalid/i);
      });
    });

    describe('hasRecipe', () => {
      test('returns true for existing recipe', () => {
        expect(ctx.validating.hasRecipe('test.dark-ganache')).toSucceedWith(true);
      });

      test('returns false for non-existent recipe', () => {
        expect(ctx.validating.hasRecipe('test.nonexistent')).toSucceedWith(false);
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.hasRecipe('invalid')).toFailWith(/invalid/i);
      });
    });

    describe('scaleRecipe', () => {
      test('succeeds with valid string ID', () => {
        expect(ctx.validating.scaleRecipe('test.dark-ganache', 600 as Grams)).toSucceedAndSatisfy(
          (scaled) => {
            expect(scaled.scaledFrom.scaleFactor).toBe(2);
            expect(scaled.baseWeight).toBe(600);
          }
        );
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.scaleRecipe('invalid', 600 as Grams)).toFailWith(/invalid/i);
      });

      test('fails with non-existent recipe', () => {
        expect(ctx.validating.scaleRecipe('test.nonexistent', 600 as Grams)).toFail();
      });
    });

    describe('calculateGanache', () => {
      test('succeeds with valid recipe ID only', () => {
        expect(ctx.validating.calculateGanache('test.dark-ganache')).toSucceedAndSatisfy((calc) => {
          expect(calc.analysis).toBeDefined();
        });
      });

      test('succeeds with valid recipe and version IDs', () => {
        expect(ctx.validating.calculateGanache('test.dark-ganache', '2026-01-01-01')).toSucceedAndSatisfy(
          (calc) => {
            expect(calc.analysis.totalWeight).toBe(300);
          }
        );
      });

      test('fails with invalid recipe ID format', () => {
        expect(ctx.validating.calculateGanache('invalid')).toFailWith(/invalid/i);
      });

      test('fails with invalid version ID format', () => {
        expect(ctx.validating.calculateGanache('test.dark-ganache', 'bad')).toFailWith(/invalid/i);
      });

      test('fails with non-existent recipe', () => {
        expect(ctx.validating.calculateGanache('test.nonexistent')).toFail();
      });
    });

    describe('getRecipeIdsUsingIngredient', () => {
      test('succeeds with valid ingredient ID', () => {
        expect(ctx.validating.getRecipeIdsUsingIngredient('test.cream')).toSucceedAndSatisfy((ids) => {
          expect(ids.size).toBe(2);
        });
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.getRecipeIdsUsingIngredient('invalid')).toFailWith(/invalid/i);
      });

      test('fails with non-existent ingredient', () => {
        expect(ctx.validating.getRecipeIdsUsingIngredient('test.unknown')).toFailWith(/not found/i);
      });
    });

    describe('findRecipesUsingIngredient', () => {
      test('succeeds with valid ingredient ID', () => {
        expect(ctx.validating.findRecipesUsingIngredient('test.cream')).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('fails with invalid ID format', () => {
        expect(ctx.validating.findRecipesUsingIngredient('invalid')).toFailWith(/invalid/i);
      });

      test('fails with non-existent ingredient', () => {
        expect(ctx.validating.findRecipesUsingIngredient('test.unknown')).toFailWith(/not found/i);
      });
    });
  });
});
