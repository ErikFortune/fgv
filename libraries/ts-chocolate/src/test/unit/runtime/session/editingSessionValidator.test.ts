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
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IIngredient,
  IngredientsLibrary
} from '../../../../packlets/ingredients';
import { IRecipe, RecipesLibrary } from '../../../../packlets/recipes';
import { ChocolateLibrary, RuntimeContext, Session } from '../../../../packlets/runtime';

describe('EditingSessionValidator', () => {
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

  const cream: IIngredient = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const butter: IIngredient = {
    baseId: 'butter' as BaseIngredientId,
    name: 'Butter',
    category: 'fat',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 0 as Percentage,
      milkFat: 82 as Percentage,
      water: 16 as Percentage,
      solids: 2 as Percentage,
      otherFats: 0 as Percentage
    }
  };

  const testRecipe: IRecipe = {
    baseId: 'test-ganache' as BaseRecipeId,
    name: 'Test Ganache' as RecipeName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVersionSpec: '2026-01-01-01' as RecipeVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as RecipeVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Original recipe',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Grams },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Grams }
        ],
        baseWeight: 300 as Grams
      }
    ]
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
            /* eslint-enable @typescript-eslint/naming-convention */
            cream,
            butter
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
            'test-ganache': testRecipe
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
  // Validator Access Tests
  // ============================================================================

  describe('validating property', () => {
    test('exposes validator via validating property', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating).toBeDefined();
      expect(session.validating.session).toBe(session);
    });

    test('validator toReadOnly returns the same validator', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      const readOnly = session.validating.toReadOnly();
      expect(readOnly).toBe(session.validating);
    });
  });

  // ============================================================================
  // Read Operations Tests
  // ============================================================================

  describe('getIngredient', () => {
    test('gets ingredient using plain string', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.getIngredient('test.dark-chocolate')).toSucceedAndSatisfy((ing) => {
        expect(ing.ingredientId).toBe('test.dark-chocolate');
        expect(ing.amount).toBe(200);
      });
    });

    test('fails for invalid ingredient ID format', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.getIngredient('invalid-no-dot')).toFailWith(/Invalid IngredientId/);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.getIngredient('test.non-existent')).toFailWith(/not found/);
    });
  });

  describe('hasIngredient', () => {
    test('returns true for existing ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.hasIngredient('test.dark-chocolate')).toBe(true);
    });

    test('returns false for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.hasIngredient('test.non-existent')).toBe(false);
    });

    test('returns false for invalid ingredient ID format', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.hasIngredient('invalid-no-dot')).toBe(false);
    });
  });

  // ============================================================================
  // Ingredient Amount Operations Tests
  // ============================================================================

  describe('setIngredientAmount', () => {
    test('sets ingredient amount using plain values', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setIngredientAmount('test.dark-chocolate', 250)).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
        expect(ing.status).toBe('modified');
      });
    });

    test('fails for invalid ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setIngredientAmount('invalid-no-dot', 100)).toFailWith(
        /Invalid IngredientId/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setIngredientAmount('test.dark-chocolate', -10)).toFailWith(/non-negative/);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setIngredientAmount('test.non-existent', 100)).toFailWith(/not found/);
    });
  });

  describe('addIngredientAmount', () => {
    test('adds to ingredient amount using plain values', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredientAmount('test.dark-chocolate', 50)).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
      });
    });

    test('fails for invalid ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredientAmount('invalid-no-dot', 50)).toFailWith(/Invalid IngredientId/);
    });

    test('fails for negative additional amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredientAmount('test.dark-chocolate', -10)).toFailWith(/non-negative/);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredientAmount('test.non-existent', 50)).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // Add/Remove Ingredient Tests
  // ============================================================================

  describe('addIngredient', () => {
    test('adds new ingredient using plain values', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredient('test.butter', 30)).toSucceed();
      expect(session.ingredients.size).toBe(3);
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(30);
        expect(ing.status).toBe('added');
      });
    });

    test('fails for invalid ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredient('invalid-no-dot', 30)).toFailWith(/Invalid IngredientId/);
    });

    test('fails for negative amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredient('test.butter', -10)).toFailWith(/non-negative/);
    });

    test('fails if ingredient already exists', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.addIngredient('test.dark-chocolate', 100)).toFailWith(/already exists/);
    });
  });

  describe('removeIngredient', () => {
    test('removes ingredient using plain string', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.removeIngredient('test.cream')).toSucceed();
      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('removed');
      });
    });

    test('fails for invalid ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.removeIngredient('invalid-no-dot')).toFailWith(/Invalid IngredientId/);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.removeIngredient('test.non-existent')).toFailWith(/not found/);
    });
  });

  // ============================================================================
  // Substitute Ingredient Tests
  // ============================================================================

  describe('substituteIngredient', () => {
    test('substitutes ingredient using plain values', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.cream', 'test.butter')).toSucceed();

      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('removed');
      });
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('substituted');
        expect(ing.amount).toBe(100);
      });
    });

    test('substitutes ingredient with specified amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.cream', 'test.butter', 80)).toSucceed();

      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(80);
      });
    });

    test('fails for invalid original ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('invalid-no-dot', 'test.butter')).toFailWith(
        /Invalid IngredientId/
      );
    });

    test('fails for invalid substitute ingredient ID', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.cream', 'invalid-no-dot')).toFailWith(
        /Invalid IngredientId/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.cream', 'test.butter', -10)).toFailWith(
        /non-negative/
      );
    });

    test('fails for non-existent original ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.non-existent', 'test.butter')).toFailWith(
        /not found/
      );
    });

    test('fails if substitute already exists', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.substituteIngredient('test.cream', 'test.dark-chocolate')).toFailWith(
        /already exists/
      );
    });
  });

  // ============================================================================
  // Target Weight Tests
  // ============================================================================

  describe('setTargetWeight', () => {
    test('sets target weight using plain number', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setTargetWeight(600)).toSucceed();
      expect(session.targetWeight).toBe(600);
      expect(session.scaleFactor).toBe(2.0);
    });

    test('fails for negative weight', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.validating.setTargetWeight(-100)).toFailWith(/non-negative/);
    });

    test('fails for zero weight (converted but rejected by session)', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      // 0 passes grams conversion but fails session validation
      expect(session.validating.setTargetWeight(0)).toFailWith(/positive/);
    });
  });
});
