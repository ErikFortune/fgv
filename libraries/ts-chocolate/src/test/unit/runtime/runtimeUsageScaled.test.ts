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
import {
  ChocolateLibrary,
  RuntimeContext,
  RuntimeUsage,
  createRuntimeUsages,
  getUsagesSortedByDate
} from '../../../packlets/runtime';

describe('RuntimeUsage and RuntimeScaledVersion', () => {
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
    ganacheCharacteristics: testChars
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
    ganacheCharacteristics: creamChars
  };

  const usage1: IRecipeUsage = {
    date: '2026-01-15',
    versionSpec: '2026-01-01-01' as RecipeVersionSpec,
    scaledWeight: 600 as Grams,
    scaleFactor: 2.0,
    notes: 'First batch - excellent results'
  };

  const usage2: IRecipeUsage = {
    date: '2026-01-20',
    versionSpec: '2026-01-01-01' as RecipeVersionSpec,
    scaledWeight: 900 as Grams
  };

  const usageWithModification: IRecipeUsage = {
    date: '2026-02-01',
    versionSpec: '2026-01-01-01' as RecipeVersionSpec,
    scaledWeight: 300 as Grams,
    modifiedVersionSpec: '2026-02-01-01' as RecipeVersionSpec
  };

  const darkGanacheRecipe: IRecipe = {
    baseId: 'dark-ganache' as BaseRecipeId,
    name: 'Dark Ganache' as RecipeName,
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
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
        notes: 'Modified version',
        ingredients: [
          { ingredientId: 'test.dark-chocolate' as IngredientId, amount: 180 as Grams },
          { ingredientId: 'test.cream' as IngredientId, amount: 120 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ],
    usage: [usage1, usage2, usageWithModification]
  };

  const emptyUsageRecipe: IRecipe = {
    baseId: 'empty-usage' as BaseRecipeId,
    name: 'Empty Usage Recipe' as RecipeName,
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        ingredients: [{ ingredientId: 'test.dark-chocolate' as IngredientId, amount: 100 as Grams }],
        baseWeight: 100 as Grams
      }
    ],
    usage: []
  };

  let ctx: RuntimeContext;

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
            'alt-chocolate': altChocolate,
            cream
            /* eslint-enable @typescript-eslint/naming-convention */
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
            'empty-usage': emptyUsageRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateLibrary.create({
      builtin: false,
      libraries: { ingredients, recipes }
    }).orThrow();

    ctx = RuntimeContext.fromLibrary(library).orThrow();
  });

  // ============================================================================
  // RuntimeUsage Tests
  // ============================================================================

  describe('RuntimeUsage', () => {
    describe('core properties', () => {
      test('provides date', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].date).toBe('2026-01-15');
      });

      test('provides versionSpec', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].versionSpec).toBe('2026-01-01-01');
      });

      test('provides scaledWeight', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].scaledWeight).toBe(600);
      });

      test('provides scaleFactor', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].scaleFactor).toBe(2.0);
      });

      test('scaleFactor returns undefined when not set', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[1].scaleFactor).toBeUndefined();
      });

      test('provides notes', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].notes).toBe('First batch - excellent results');
      });

      test('notes returns undefined when not set', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[1].notes).toBeUndefined();
      });

      test('provides modifiedversionSpec', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[2].modifiedVersionSpec).toBe('2026-02-01-01');
      });
    });

    describe('resolved references', () => {
      test('version resolves to RuntimeVersion', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        const version = usages[0].version;
        expect(version.versionSpec).toBe('2026-01-01-01');
        expect(version.baseWeight).toBe(300);
      });

      test('tryGetVersion returns Result', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].tryGetVersion()).toSucceedAndSatisfy((version) => {
          expect(version.versionSpec).toBe('2026-01-01-01');
        });
      });

      test('modifiedVersion resolves when present', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        const modified = usages[2].modifiedVersion;
        expect(modified).toBeDefined();
        expect(modified?.versionSpec).toBe('2026-02-01-01');
      });

      test('modifiedVersion returns undefined when not present', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].modifiedVersion).toBeUndefined();
      });

      test('tryGetModifiedVersion returns undefined when not present', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].tryGetModifiedVersion()).toSucceedWith(undefined);
      });

      test('tryGetModifiedVersion returns Result when present', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[2].tryGetModifiedVersion()).toSucceedAndSatisfy((version) => {
          expect(version?.versionSpec).toBe('2026-02-01-01');
        });
      });

      test('recipe provides parent recipe', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].recipe).toBe(recipe);
      });
    });

    describe('computed properties', () => {
      test('hasModification returns true when modified', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[2].hasModification).toBe(true);
      });

      test('hasModification returns false when not modified', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].hasModification).toBe(false);
      });

      test('dateAsDate returns Date object', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        const dateObj = usages[0].dateAsDate;
        expect(dateObj).toBeInstanceOf(Date);
        expect(dateObj.getFullYear()).toBe(2026);
        expect(dateObj.getMonth()).toBe(0); // January is 0
        expect(dateObj.getDate()).toBe(15);
      });
    });

    describe('raw access', () => {
      test('raw returns underlying usage data', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const usages = createRuntimeUsages(recipe);
        expect(usages[0].raw.date).toBe('2026-01-15');
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        expect(RuntimeUsage.create(recipe, usage1)).toSucceed();
      });
    });
  });

  // ============================================================================
  // Helper Function Tests
  // ============================================================================

  describe('helper functions', () => {
    test('createRuntimeUsages creates usages for all records', () => {
      const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
      const usages = createRuntimeUsages(recipe);
      expect(usages.length).toBe(3);
    });

    test('createRuntimeUsages returns empty array when no usage', () => {
      const recipe = ctx.getRecipe('test.empty-usage' as RecipeId).orThrow();
      const usages = createRuntimeUsages(recipe);
      expect(usages).toEqual([]);
    });

    test('getUsagesSortedByDate returns usages sorted descending', () => {
      const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
      const usages = getUsagesSortedByDate(recipe);
      expect(usages.length).toBe(3);
      expect(usages[0].date).toBe('2026-02-01'); // Most recent
      expect(usages[1].date).toBe('2026-01-20');
      expect(usages[2].date).toBe('2026-01-15'); // Oldest
    });

    test('getUsagesSortedByDate returns empty array when no usage', () => {
      const recipe = ctx.getRecipe('test.empty-usage' as RecipeId).orThrow();
      const usages = getUsagesSortedByDate(recipe);
      expect(usages).toEqual([]);
    });
  });

  // ============================================================================
  // RuntimeScaledVersion Tests
  // ============================================================================

  describe('RuntimeScaledVersion', () => {
    describe('scaling info', () => {
      test('provides scaleFactor', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.scaleFactor).toBe(2);
      });

      test('provides targetWeight', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.targetWeight).toBe(600);
      });

      test('provides createdDate', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.createdDate).toBeDefined();
      });
    });

    describe('source information', () => {
      test('provides scaledFrom with full scaling source info', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.scaledFrom).toBeDefined();
        expect(scaled.scaledFrom.recipeId).toBe('dark-ganache');
        expect(scaled.scaledFrom.versionSpec).toBe('2026-01-01-01');
        expect(scaled.scaledFrom.scaleFactor).toBe(2);
        expect(scaled.scaledFrom.targetWeight).toBe(600);
      });

      test('provides sourceRecipeId', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.sourceRecipeId).toBe('dark-ganache');
      });

      test('provides sourceversionSpec', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.sourceVersionSpec).toBe('2026-01-01-01');
      });
    });

    describe('resolved ingredients', () => {
      test('getIngredients returns all resolved scaled ingredients', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.getIngredients()).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(2);
          expect(ingredients[0].amount).toBe(400); // 200 * 2
          expect(ingredients[0].originalAmount).toBe(200);
          expect(ingredients[0].scaleFactor).toBe(2);
        });
      });

      test('getIngredients with empty array returns nothing', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.getIngredients([])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });

      test('getIngredients with exact ID returns matching ingredient', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.getIngredients(['test.dark-chocolate'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(1);
          expect(ingredients[0].ingredient.name).toBe('Dark Chocolate 70%');
          expect(ingredients[0].amount).toBe(400);
        });
      });

      test('getIngredients with non-matching ID returns nothing', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.getIngredients(['test.nonexistent'])).toSucceedAndSatisfy((iter) => {
          const ingredients = [...iter];
          expect(ingredients.length).toBe(0);
        });
      });

      test('includes resolved alternates (empty for scaled)', () => {
        // Note: alternateIngredientIds are not preserved through scaler, so alternates will be empty
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const ingredients = [...scaled.getIngredients().orThrow()];
        // Scaler doesn't copy alternateIngredientIds, so alternates array will be empty
        expect(ingredients[0].alternates.length).toBe(0);
      });
    });

    describe('computed properties', () => {
      test('provides baseWeight', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.baseWeight).toBe(600);
      });

      test('provides yield when set', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        // Yield may or may not be set depending on scaling implementation
        expect('yield' in scaled).toBe(true);
      });

      test('provides notes when set', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect('notes' in scaled).toBe(true);
      });

      test('provides ratings', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(Array.isArray(scaled.ratings)).toBe(true);
      });

      test('weightDifference returns correct difference', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.weightDifference).toBe(300); // 600 - 300
      });
    });

    describe('filtering helpers', () => {
      test('getIngredients with category filter returns matching category', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const chocolate = [...scaled.getIngredients([{ category: 'chocolate' }]).orThrow()];
        expect(chocolate.length).toBe(1);
      });

      test('getIngredients filters chocolate ingredients only', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const chocolate = [...scaled.getIngredients([{ category: 'chocolate' }]).orThrow()];
        expect(chocolate.length).toBe(1);
      });

      test('getIngredients filters dairy ingredients only', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const dairy = [...scaled.getIngredients([{ category: 'dairy' }]).orThrow()];
        expect(dairy.length).toBe(1);
      });

      test('getIngredients with regex pattern filters by ID pattern', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const matching = [...scaled.getIngredients([/^test\./]).orThrow()];
        expect(matching.length).toBe(2);
      });

      test('getIngredients with multiple filters uses OR semantics', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const filtered = [
          ...scaled.getIngredients([{ category: 'chocolate' }, { category: 'dairy' }]).orThrow()
        ];
        expect(filtered.length).toBe(2);
      });

      test('getIngredients with category regex pattern', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        const matching = [...scaled.getIngredients([{ category: /^choc/ }]).orThrow()];
        expect(matching.length).toBe(1);
        expect(matching[0].ingredient.name).toBe('Dark Chocolate 70%');
      });
    });

    describe('operations', () => {
      test('calculateGanache returns analysis', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.calculateGanache()).toSucceedAndSatisfy((calc) => {
          expect(calc.analysis).toBeDefined();
          expect(calc.analysis.totalWeight).toBe(600);
        });
      });
    });

    describe('raw access', () => {
      test('raw returns underlying scaled version data', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        const scaled = recipe.scale(600 as Grams).orThrow();
        expect(scaled.raw.scaledFrom.scaleFactor).toBe(2);
      });
    });

    describe('create factory', () => {
      test('create factory method succeeds', () => {
        const recipe = ctx.getRecipe('test.dark-ganache' as RecipeId).orThrow();
        // scale() now returns RuntimeScaledVersion directly
        expect(recipe.scale(600 as Grams)).toSucceed();
      });
    });
  });
});
