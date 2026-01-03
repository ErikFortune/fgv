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

import { BaseRecipeId, Grams, IngredientId, RecipeId, RecipeName, SourceId } from '../../../packlets/common';

import {
  IRecipe,
  IRecipeDetails,
  RecipesLibrary,
  scaleRecipe,
  scaleRecipeByFactor,
  calculateBaseWeight,
  recalculateRecipeDetails
} from '../../../packlets/recipes';

describe('RecipesLibrary', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const testRecipeDetails: IRecipeDetails = {
    ingredients: [
      { ingredientId: 'felchlin.maracaibo-65' as IngredientId, amount: 100 as Grams },
      { ingredientId: 'common.heavy-cream-35' as IngredientId, amount: 50 as Grams }
    ],
    baseWeight: 150 as Grams,
    yield: '10 bonbons',
    usage: []
  };

  const testRecipe: IRecipe = {
    baseId: 'test-ganache' as BaseRecipeId,
    name: 'Test Ganache' as RecipeName,
    description: 'A test ganache recipe',
    tags: ['test', 'dark'],
    versions: [testRecipeDetails],
    currentVersion: testRecipeDetails
  };

  // ============================================================================
  // Creation Tests
  // ============================================================================

  describe('create', () => {
    test('creates empty library with no params', () => {
      expect(RecipesLibrary.create()).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with initial collections', () => {
      const result = RecipesLibrary.create({
        collections: [
          {
            id: 'user' as SourceId,
            isMutable: true,
            items: {
              testGanache: testRecipe
            }
          }
        ]
      });

      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });
  });

  // ============================================================================
  // Lookup and Iteration Tests
  // ============================================================================

  describe('lookup and iteration', () => {
    let library: RecipesLibrary;

    beforeEach(() => {
      library = RecipesLibrary.create({
        collections: [
          {
            id: 'user' as SourceId,
            isMutable: true,
            items: { testGanache: testRecipe }
          }
        ]
      }).orThrow();
    });

    test('gets existing recipe', () => {
      expect(library.get('user.testGanache' as RecipeId)).toSucceedAndSatisfy((recipe) => {
        expect(recipe.name).toBe('Test Ganache');
      });
    });

    test('has returns true for existing recipe', () => {
      expect(library.has('user.testGanache' as RecipeId)).toBe(true);
    });

    test('has returns false for non-existent recipe', () => {
      expect(library.has('user.nonexistent' as RecipeId)).toBe(false);
    });

    test('entries, keys, values iterate correctly', () => {
      expect(Array.from(library.entries()).length).toBe(1);
      expect(Array.from(library.keys()).length).toBe(1);
      expect(Array.from(library.values()).length).toBe(1);
    });

    test('Symbol.iterator works', () => {
      expect(Array.from(library).length).toBe(1);
    });
  });

  // ============================================================================
  // Mutation Tests
  // ============================================================================

  describe('mutation', () => {
    let library: RecipesLibrary;

    beforeEach(() => {
      library = RecipesLibrary.create({
        collections: [{ id: 'user' as SourceId, isMutable: true, items: {} }]
      }).orThrow();
    });

    test.each([
      ['add', (lib: RecipesLibrary, id: RecipeId) => lib.add(id, testRecipe)],
      ['set', (lib: RecipesLibrary, id: RecipeId) => lib.set(id, testRecipe)]
    ])('%s adds new recipe', (_name, fn) => {
      const id = 'user.newRecipe' as RecipeId;
      expect(fn(library, id)).toSucceed();
      expect(library.has(id)).toBe(true);
    });

    test('update succeeds for existing recipe', () => {
      const id = 'user.updateTest' as RecipeId;
      library.add(id, testRecipe).orThrow();
      const updated = { ...testRecipe, description: 'Updated' };
      expect(library.update(id, updated)).toSucceed();
    });

    test('update fails for non-existent recipe', () => {
      expect(library.update('user.nonexistent' as RecipeId, testRecipe)).toFail();
    });

    test('delete removes recipe', () => {
      const id = 'user.deleteTest' as RecipeId;
      library.add(id, testRecipe).orThrow();
      expect(library.delete(id)).toSucceed();
      expect(library.has(id)).toBe(false);
    });
  });

  // ============================================================================
  // Collection Management Tests
  // ============================================================================

  describe('collection management', () => {
    let library: RecipesLibrary;

    beforeEach(() => {
      library = RecipesLibrary.create().orThrow();
    });

    test('addCollectionEntry adds collection', () => {
      expect(
        library.addCollectionEntry({
          id: 'new' as SourceId,
          isMutable: true,
          items: {}
        })
      ).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('addCollectionWithItems adds collection with items', () => {
      expect(library.addCollectionWithItems('custom', [['recipe1', testRecipe]])).toSucceed();
      expect(library.collectionCount).toBe(1);
    });

    test('composeId creates valid composite ID', () => {
      expect(library.composeId('source' as SourceId, 'base' as BaseRecipeId)).toSucceedWith(
        'source.base' as RecipeId
      );
    });
  });

  // ============================================================================
  // Validating and Collections Access
  // ============================================================================

  describe('accessors', () => {
    let library: RecipesLibrary;

    beforeEach(() => {
      library = RecipesLibrary.create({
        collections: [{ id: 'user' as SourceId, isMutable: true, items: { testGanache: testRecipe } }]
      }).orThrow();
    });

    test('validating.get works with string key', () => {
      expect(library.validating.get('user.testGanache')).toSucceed();
    });

    test('validating.has works with string key', () => {
      expect(library.validating.has('user.testGanache')).toBe(true);
    });

    test('collections returns readonly map', () => {
      expect(library.collections.has('user' as SourceId)).toBe(true);
    });
  });
});

// ============================================================================
// Recipe Scaling Tests
// ============================================================================

describe('Recipe scaling', () => {
  const testDetails: IRecipeDetails = {
    ingredients: [
      { ingredientId: 'source.choco' as IngredientId, amount: 100 as Grams },
      { ingredientId: 'source.cream' as IngredientId, amount: 50 as Grams }
    ],
    baseWeight: 150 as Grams,
    usage: []
  };

  const testRecipe: IRecipe = {
    baseId: 'test' as BaseRecipeId,
    name: 'Test' as RecipeName,
    versions: [testDetails],
    currentVersion: testDetails
  };

  describe('scaleRecipe', () => {
    test('scales ingredients proportionally', () => {
      expect(scaleRecipe(testRecipe, 300 as Grams)).toSucceedAndSatisfy((scaled) => {
        expect(scaled.scaleFactor).toBe(2);
        expect(scaled.targetWeight).toBe(300);
        expect(scaled.ingredients[0].amount).toBe(200);
        expect(scaled.ingredients[1].amount).toBe(100);
      });
    });

    test('preserves original amounts', () => {
      expect(scaleRecipe(testRecipe, 300 as Grams)).toSucceedAndSatisfy((scaled) => {
        expect(scaled.ingredients[0].originalAmount).toBe(100);
      });
    });

    test('fails with zero target weight', () => {
      expect(scaleRecipe(testRecipe, 0 as Grams)).toFailWith(/greater than zero/);
    });

    test('fails with negative target weight', () => {
      expect(scaleRecipe(testRecipe, -100 as Grams)).toFailWith(/greater than zero/);
    });

    test('fails with invalid version index', () => {
      expect(scaleRecipe(testRecipe, 300 as Grams, { versionIndex: 99 })).toFailWith(/out of bounds/);
    });

    test('respects precision option', () => {
      expect(scaleRecipe(testRecipe, 333 as Grams, { precision: 0 })).toSucceedAndSatisfy((scaled) => {
        expect(Number.isInteger(scaled.ingredients[0].amount)).toBe(true);
      });
    });

    test('respects minimumAmount option', () => {
      // Scale to very small amount that would be below minimum
      expect(scaleRecipe(testRecipe, 15 as Grams, { minimumAmount: 5 as Grams })).toSucceedAndSatisfy(
        (scaled) => {
          // Scaled amount would be 10 * 0.1 = 1, but minimum is 5
          expect(scaled.ingredients[0].amount).toBeGreaterThanOrEqual(5);
        }
      );
    });
  });

  describe('scaleRecipeByFactor', () => {
    test('scales by factor', () => {
      expect(scaleRecipeByFactor(testRecipe, 0.5)).toSucceedAndSatisfy((scaled) => {
        expect(scaled.scaleFactor).toBe(0.5);
        expect(scaled.ingredients[0].amount).toBe(50);
      });
    });

    test('fails with zero factor', () => {
      expect(scaleRecipeByFactor(testRecipe, 0)).toFailWith(/greater than zero/);
    });

    test('fails with negative factor', () => {
      expect(scaleRecipeByFactor(testRecipe, -1)).toFailWith(/greater than zero/);
    });

    test('fails with invalid version index', () => {
      expect(scaleRecipeByFactor(testRecipe, 0.5, { versionIndex: 99 })).toFailWith(/out of bounds/);
    });

    test('fails with negative version index', () => {
      expect(scaleRecipeByFactor(testRecipe, 0.5, { versionIndex: -1 })).toFailWith(/out of bounds/);
    });
  });

  describe('edge cases', () => {
    test('scaleRecipe fails with zero baseWeight', () => {
      const zeroWeightDetails: IRecipeDetails = {
        ingredients: [],
        baseWeight: 0 as Grams,
        usage: []
      };
      const zeroWeightRecipe: IRecipe = {
        baseId: 'zero' as BaseRecipeId,
        name: 'Zero' as RecipeName,
        versions: [zeroWeightDetails],
        currentVersion: zeroWeightDetails
      };
      expect(scaleRecipe(zeroWeightRecipe, 100 as Grams)).toFailWith(/base weight must be greater than zero/);
    });
  });

  describe('calculateBaseWeight', () => {
    test('sums ingredient amounts', () => {
      expect(calculateBaseWeight(testDetails)).toBe(150);
    });
  });

  describe('recalculateRecipeDetails', () => {
    test('updates baseWeight from ingredients', () => {
      const details: IRecipeDetails = {
        ...testDetails,
        baseWeight: 999 as Grams // Wrong value
      };
      const recalced = recalculateRecipeDetails(details);
      expect(recalced.baseWeight).toBe(150);
    });
  });
});
