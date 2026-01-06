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
    ]
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
    ]
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

  describe('tag discovery', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
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
  // Unified Find Interface Tests (Extensible Indexer System)
  // ============================================================================

  describe('unified find interface', () => {
    let ctx: RuntimeContext;

    beforeEach(() => {
      ctx = RuntimeContext.fromLibrary(library).orThrow();
    });

    describe('findRecipes', () => {
      test('finds recipes by tag using indexer', () => {
        expect(ctx.findRecipes({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('finds recipes by chocolate type using indexer', () => {
        expect(ctx.findRecipes({ byChocolateType: { chocolateType: 'dark' } })).toSucceedAndSatisfy(
          (recipes) => {
            expect(recipes.length).toBe(1);
            expect(recipes[0].name).toBe('Dark Ganache');
          }
        );
      });

      test('finds recipes by ingredient using indexer', () => {
        expect(
          ctx.findRecipes({ byIngredient: { ingredientId: 'test.cream' as IngredientId } })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('returns empty for no matches', () => {
        expect(ctx.findRecipes({ byChocolateType: { chocolateType: 'white' } })).toSucceedAndSatisfy(
          (recipes) => {
            expect(recipes.length).toBe(0);
          }
        );
      });

      test('returns empty for empty spec', () => {
        expect(ctx.findRecipes({})).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(0);
        });
      });
    });

    describe('findIngredients', () => {
      test('finds ingredients by tag using indexer', () => {
        expect(ctx.findIngredients({ byTag: { tag: 'premium' } })).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(1);
          expect(ingredients[0].name).toBe('Dark Chocolate 70%');
        });
      });

      test('returns empty for no matches', () => {
        expect(ctx.findIngredients({ byTag: { tag: 'nonexistent' } })).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(0);
        });
      });

      test('returns empty for empty spec', () => {
        expect(ctx.findIngredients({})).toSucceedAndSatisfy((ingredients) => {
          expect(ingredients.length).toBe(0);
        });
      });
    });

    describe('invalidateIndexers', () => {
      test('invalidates all indexer caches', () => {
        // Warm up indexers first
        ctx.warmUp();

        // Use an indexer to build its index
        expect(ctx.findRecipes({ byTag: { tag: 'classic' } })).toSucceed();

        // Invalidate and verify still works (rebuilds on next query)
        ctx.invalidateIndexers();

        expect(ctx.findRecipes({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });
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

    test('calculateGanache returns analysis', () => {
      expect(ctx.calculateGanache('test.dark-ganache' as RecipeId)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
      });
    });

    test('calculateGanache fails for non-existent recipe', () => {
      expect(ctx.calculateGanache('test.nonexistent' as RecipeId)).toFail();
    });

    test('calculateGanache with version spec calculates for specific version', () => {
      expect(
        ctx.calculateGanache('test.dark-ganache' as RecipeId, '2026-01-01-01' as RecipeVersionSpec)
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
      expect(ctx.findRecipes({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
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

    describe('findRecipes (unified JSON query)', () => {
      test('finds recipes by tag', () => {
        expect(ctx.validating.findRecipes({ byTag: { tag: 'classic' } })).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('returns empty for unknown tag', () => {
        expect(ctx.validating.findRecipes({ byTag: { tag: 'nonexistent' } })).toSucceedAndSatisfy(
          (recipes) => {
            expect(recipes.length).toBe(0);
          }
        );
      });

      test('finds recipes by chocolate type', () => {
        expect(
          ctx.validating.findRecipes({ byChocolateType: { chocolateType: 'dark' } })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(1);
          expect(recipes[0].name).toBe('Dark Ganache');
        });
      });

      test('returns empty for unused chocolate type', () => {
        expect(
          ctx.validating.findRecipes({ byChocolateType: { chocolateType: 'white' } })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(0);
        });
      });

      test('finds recipes by ingredient ID', () => {
        expect(
          ctx.validating.findRecipes({ byIngredient: { ingredientId: 'test.cream' } })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(2);
        });
      });

      test('finds recipes by primary ingredient only', () => {
        expect(
          ctx.validating.findRecipes({
            byIngredient: { ingredientId: 'test.dark-chocolate', usageType: 'primary' }
          })
        ).toSucceedAndSatisfy((recipes) => {
          expect(recipes.length).toBe(1);
          expect(recipes[0].name).toBe('Dark Ganache');
        });
      });

      test('fails with invalid ingredient ID', () => {
        expect(ctx.validating.findRecipes({ byIngredient: { ingredientId: 'invalid' } })).toFailWith(
          /invalid/i
        );
      });

      test('finds recipes using alternate ingredient', () => {
        expect(
          ctx.validating.findRecipes({ byIngredient: { ingredientId: 'test.alt-chocolate' } })
        ).toSucceedAndSatisfy((recipes) => {
          // alt-chocolate is only alternate, not primary, so 'any' will find it
          expect(recipes.length).toBe(1);
        });
      });

      test('fails with unknown indexer key', () => {
        expect(
          ctx.validating.findRecipes({ unknownIndexer: { foo: 'bar' } } as unknown as Record<string, unknown>)
        ).toFailWith(/unexpected propert/i);
      });

      test('fails when JSON is not an object', () => {
        expect(ctx.validating.findRecipes(null)).toFailWith(/from non-object/i);
        expect(ctx.validating.findRecipes('string')).toFailWith(/from non-object/i);
        expect(ctx.validating.findRecipes(123)).toFailWith(/from non-object/i);
      });

      test('fails when config is not an object', () => {
        expect(
          ctx.validating.findRecipes({ byTag: 'invalid' as unknown as Record<string, unknown> })
        ).toFailWith(/from non-object|is not an object/i);
      });

      test('fails when byTag missing tag', () => {
        expect(ctx.validating.findRecipes({ byTag: {} })).toFailWith(/Field tag not found/i);
      });

      test('fails when byChocolateType missing chocolateType', () => {
        expect(ctx.validating.findRecipes({ byChocolateType: {} })).toFailWith(
          /Field chocolateType not found/i
        );
      });

      test('fails when byChocolateType has invalid chocolateType', () => {
        expect(ctx.validating.findRecipes({ byChocolateType: { chocolateType: 'invalid' } })).toFailWith(
          /invalid.*enumerated value/i
        );
      });

      test('fails when byIngredient missing ingredientId', () => {
        expect(ctx.validating.findRecipes({ byIngredient: {} })).toFailWith(/Field ingredientId not found/i);
      });

      test('fails when byIngredient has invalid usageType', () => {
        expect(
          ctx.validating.findRecipes({
            byIngredient: { ingredientId: 'test.cream', usageType: 'invalid' }
          })
        ).toFailWith(/invalid.*enumerated value/i);
      });
    });

    describe('findIngredients (unified JSON query)', () => {
      test('finds ingredients by tag', () => {
        expect(ctx.validating.findIngredients({ byTag: { tag: 'premium' } })).toSucceedAndSatisfy(
          (ingredients) => {
            expect(ingredients.length).toBe(1);
            expect(ingredients[0].name).toBe('Dark Chocolate 70%');
          }
        );
      });

      test('returns empty for unknown tag', () => {
        expect(ctx.validating.findIngredients({ byTag: { tag: 'nonexistent' } })).toSucceedAndSatisfy(
          (ingredients) => {
            expect(ingredients.length).toBe(0);
          }
        );
      });

      test('fails when byTag missing tag', () => {
        expect(ctx.validating.findIngredients({ byTag: {} })).toFailWith(/Field tag not found/i);
      });

      test('fails when JSON is not an object', () => {
        expect(ctx.validating.findIngredients(null)).toFailWith(/from non-object/i);
      });
    });
  });
});
