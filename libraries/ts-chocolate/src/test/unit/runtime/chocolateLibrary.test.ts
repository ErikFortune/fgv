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
  BaseRecipeId,
  Grams,
  IngredientId,
  Percentage,
  RecipeId,
  RecipeName,
  SourceId
} from '../../../packlets/common';

import { IGanacheCharacteristics, IIngredient, IngredientsLibrary } from '../../../packlets/ingredients';

import { IRecipe, IRecipeVersion, RecipesLibrary } from '../../../packlets/recipes';

import { ChocolateLibrary } from '../../../packlets/runtime';

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

  const testIngredient: IIngredient = {
    baseId: 'testChoco' as unknown as import('../../../packlets/common').BaseIngredientId,
    name: 'Test Chocolate',
    category: 'chocolate',
    ganacheCharacteristics: testChars
  };

  const testRecipeVersion: IRecipeVersion = {
    versionId: '2026-01-01-01' as unknown as import('../../../packlets/common').RecipeVersionId,
    createdDate: '2026-01-01',
    ingredients: [{ ingredientId: 'test.testChoco' as IngredientId, amount: 100 as Grams }],
    baseWeight: 100 as Grams
  };

  const testRecipe: IRecipe = {
    baseId: 'testRecipe' as BaseRecipeId,
    name: 'Test Recipe' as RecipeName,
    versions: [testRecipeVersion],
    goldenVersionId: '2026-01-01-01' as unknown as import('../../../packlets/common').RecipeVersionId,
    usage: []
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates with built-in ingredients and recipes by default', () => {
      expect(ChocolateLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBeGreaterThan(0);
        expect(lib.recipes.size).toBeGreaterThan(0);
      });
    });

    test('creates without built-in ingredients when specified', () => {
      expect(ChocolateLibrary.create({ includeBuiltInIngredients: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(0);
      });
    });

    test('creates with provided ingredients library', () => {
      const ingredients = IngredientsLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ ingredients })).toSucceedAndSatisfy((lib) => {
        expect(lib.ingredients.size).toBe(1);
      });
    });

    test('creates with provided recipes library', () => {
      const recipes = RecipesLibrary.create({
        builtin: false,
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      expect(ChocolateLibrary.create({ recipes })).toSucceedAndSatisfy((lib) => {
        expect(lib.recipes.size).toBe(1);
      });
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const ingredients = IngredientsLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = RecipesLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ ingredients, recipes }).orThrow();
    });

    test('ingredients returns IngredientsLibrary', () => {
      expect(library.ingredients).toBeInstanceOf(IngredientsLibrary);
    });

    test('recipes returns RecipesLibrary', () => {
      expect(library.recipes).toBeInstanceOf(RecipesLibrary);
    });
  });

  // ============================================================================
  // Ingredient Lookup Tests
  // ============================================================================

  describe('ingredient lookup', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      library = ChocolateLibrary.create().orThrow();
    });

    test('getIngredient returns existing ingredient', () => {
      expect(library.getIngredient('felchlin.maracaibo-65' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.name).toContain('Maracaibo');
      });
    });

    test('getIngredient fails for non-existent', () => {
      expect(library.getIngredient('test.nonexistent' as IngredientId)).toFail();
    });

    test('hasIngredient returns true for existing', () => {
      expect(library.hasIngredient('felchlin.maracaibo-65' as IngredientId)).toBe(true);
    });

    test('hasIngredient returns false for non-existent', () => {
      expect(library.hasIngredient('test.nonexistent' as IngredientId)).toBe(false);
    });
  });

  // ============================================================================
  // Recipe Lookup Tests
  // ============================================================================

  describe('recipe lookup', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const recipes = RecipesLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ recipes }).orThrow();
    });

    test('getRecipe returns existing recipe', () => {
      expect(library.getRecipe('test.testRecipe' as RecipeId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.name).toBe('Test Recipe');
      });
    });

    test('getRecipe fails for non-existent', () => {
      expect(library.getRecipe('test.nonexistent' as RecipeId)).toFail();
    });

    test('hasRecipe returns true for existing', () => {
      expect(library.hasRecipe('test.testRecipe' as RecipeId)).toBe(true);
    });

    test('hasRecipe returns false for non-existent', () => {
      expect(library.hasRecipe('test.nonexistent' as RecipeId)).toBe(false);
    });
  });

  // ============================================================================
  // Recipe Scaling Tests
  // ============================================================================

  describe('recipe scaling', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const recipes = RecipesLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ recipes }).orThrow();
    });

    test('scaleRecipe scales to target weight', () => {
      expect(library.scaleRecipe('test.testRecipe' as RecipeId, 200 as Grams)).toSucceedAndSatisfy(
        (scaled) => {
          expect(scaled.targetWeight).toBe(200);
          expect(scaled.scaleFactor).toBe(2);
        }
      );
    });

    test('scaleRecipe fails for non-existent recipe', () => {
      expect(library.scaleRecipe('test.nonexistent' as RecipeId, 200 as Grams)).toFail();
    });

    test('scaleRecipeByFactor scales by factor', () => {
      expect(library.scaleRecipeByFactor('test.testRecipe' as RecipeId, 0.5)).toSucceedAndSatisfy(
        (scaled) => {
          expect(scaled.scaleFactor).toBe(0.5);
          expect(scaled.targetWeight).toBe(50);
        }
      );
    });

    test('scaleRecipeByFactor fails for non-existent recipe', () => {
      expect(library.scaleRecipeByFactor('test.nonexistent' as RecipeId, 0.5)).toFail();
    });

    test('scaleRecipeByFactor fails for invalid version', () => {
      expect(
        library.scaleRecipeByFactor('test.testRecipe' as RecipeId, 0.5, {
          versionId: '2026-12-31-99' as unknown as import('../../../packlets/common').RecipeVersionId
        })
      ).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // Ganache Calculation Tests
  // ============================================================================

  describe('ganache calculations', () => {
    let library: ChocolateLibrary;

    beforeEach(() => {
      const ingredients = IngredientsLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testChoco: testIngredient } }]
      }).orThrow();

      const recipes = RecipesLibrary.create({
        collections: [{ id: 'test' as SourceId, isMutable: true, items: { testRecipe } }]
      }).orThrow();

      library = ChocolateLibrary.create({ ingredients, recipes }).orThrow();
    });

    test('createIngredientResolver returns working resolver', () => {
      const resolver = library.createIngredientResolver();
      expect(resolver('test.testChoco' as IngredientId)).toSucceed();
    });

    test('calculateGanache returns analysis for valid recipe', () => {
      expect(library.calculateGanache('test.testRecipe' as RecipeId)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis).toBeDefined();
        expect(calc.validation).toBeDefined();
      });
    });

    test('calculateGanache fails for non-existent recipe', () => {
      expect(library.calculateGanache('test.nonexistent' as RecipeId)).toFail();
    });

    test('calculateGanacheForRecipe calculates for recipe object', () => {
      expect(library.calculateGanacheForRecipe(testRecipe)).toSucceedAndSatisfy((calc) => {
        expect(calc.analysis.totalWeight).toBe(100);
      });
    });
  });
});
