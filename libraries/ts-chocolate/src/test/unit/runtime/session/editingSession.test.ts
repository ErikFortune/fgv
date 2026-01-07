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

describe('EditingSession', () => {
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

  const sugar: IIngredient = {
    baseId: 'sugar' as BaseIngredientId,
    name: 'Sugar',
    category: 'sugar',
    ganacheCharacteristics: {
      cacaoFat: 0 as Percentage,
      sugar: 100 as Percentage,
      milkFat: 0 as Percentage,
      water: 0 as Percentage,
      solids: 0 as Percentage,
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
          { ingredientId: 'test.dark-chocolate' as IngredientId, amount: 200 as Grams },
          { ingredientId: 'test.cream' as IngredientId, amount: 100 as Grams }
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
            butter,
            sugar
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
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session with default scale factor', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      expect(Session.EditingSession.create({ sourceVersion: version })).toSucceedAndSatisfy((session) => {
        expect(session.scaleFactor).toBe(1.0);
        expect(session.targetWeight).toBe(300);
        expect(session.isDirty).toBe(false);
        expect(session.isJournalingEnabled).toBe(true);
        expect(session.sessionId).toBeDefined();
        expect(session.sourceVersion).toBe(version);
      });
    });

    test('creates session with specified scale factor', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      expect(
        Session.EditingSession.create({
          sourceVersion: version,
          scaleFactor: 2.0
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.scaleFactor).toBe(2.0);
        expect(session.targetWeight).toBe(600);
      });
    });

    test('creates session with specified target weight', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      expect(
        Session.EditingSession.create({
          sourceVersion: version,
          targetWeight: 450 as Grams
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.targetWeight).toBe(450);
        expect(session.scaleFactor).toBe(1.5);
      });
    });

    test('creates session with journaling disabled', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      expect(
        Session.EditingSession.create({
          sourceVersion: version,
          enableJournal: false
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.isJournalingEnabled).toBe(false);
      });
    });

    test('initializes ingredients from source version', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      expect(Session.EditingSession.create({ sourceVersion: version })).toSucceedAndSatisfy((session) => {
        expect(session.ingredients.size).toBe(2);
        expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
          expect(ing.amount).toBe(200);
          expect(ing.originalAmount).toBe(200);
          expect(ing.status).toBe('original');
        });
      });
    });
  });

  // ============================================================================
  // Scale Operations Tests
  // ============================================================================

  describe('setScaleFactor', () => {
    test('scales all ingredients proportionally', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setScaleFactor(2.0)).toSucceed();
      expect(session.scaleFactor).toBe(2.0);
      expect(session.targetWeight).toBe(600);
      expect(session.isDirty).toBe(true);

      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(400);
      });
      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(200);
      });
    });

    test('adds journal entry for scale change', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setScaleFactor(1.5).orThrow();

      expect(session.journalEntries.length).toBe(1);
      expect(session.journalEntries[0].eventType).toBe('scale-adjust');
      expect(session.journalEntries[0].text).toContain('1.00');
      expect(session.journalEntries[0].text).toContain('1.50');
    });

    test('fails for non-positive scale factor', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setScaleFactor(0)).toFailWith(/positive/);
      expect(session.setScaleFactor(-1)).toFailWith(/positive/);
    });

    test('does not rescale added ingredients', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      // Add a new ingredient
      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();

      // Scale the recipe
      session.setScaleFactor(2.0).orThrow();

      // Original ingredients should be scaled
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(400); // 200 * 2
      });

      // Added ingredient should NOT be scaled (it was added at a specific amount)
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(30); // Still 30, not 60
        expect(ing.status).toBe('added');
      });
    });
  });

  describe('setTargetWeight', () => {
    test('calculates scale factor from target weight', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setTargetWeight(600 as Grams)).toSucceed();
      expect(session.scaleFactor).toBe(2.0);
      expect(session.targetWeight).toBe(600);
    });

    test('fails for non-positive target weight', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setTargetWeight(0 as Grams)).toFailWith(/positive/);
      expect(session.setTargetWeight(-100 as Grams)).toFailWith(/positive/);
    });
  });

  // ============================================================================
  // Ingredient Operations Tests
  // ============================================================================

  describe('getIngredient', () => {
    test('returns existing ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.ingredientId).toBe('test.dark-chocolate');
      });
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.getIngredient('test.non-existent' as IngredientId)).toFailWith(/not found/);
    });
  });

  describe('setIngredientAmount', () => {
    test('updates ingredient amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Grams)).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
        expect(ing.status).toBe('modified');
      });
      expect(session.isDirty).toBe(true);
    });

    test('reverts to original status if amount matches original', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Grams).orThrow();
      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 200 as Grams).orThrow();

      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('original');
      });
    });

    test('adds journal entry for amount change', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Grams).orThrow();

      const modifyEntries = session.journalEntries.filter((e) => e.eventType === 'ingredient-modify');
      expect(modifyEntries.length).toBe(1);
      expect(modifyEntries[0].ingredientId).toBe('test.dark-chocolate');
      expect(modifyEntries[0].originalAmount).toBe(200);
      expect(modifyEntries[0].newAmount).toBe(250);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setIngredientAmount('test.non-existent' as IngredientId, 100 as Grams)).toFailWith(
        /not found/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setIngredientAmount('test.dark-chocolate' as IngredientId, -10 as Grams)).toFailWith(
        /negative/
      );
    });

    test('maintains added status when modifying added ingredient amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      // Add a new ingredient
      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();

      // Modify its amount
      session.setIngredientAmount('test.butter' as IngredientId, 50 as Grams).orThrow();

      // Status should still be 'added', not 'modified'
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(50);
        expect(ing.status).toBe('added');
      });
    });
  });

  describe('addIngredientAmount', () => {
    test('adds to existing ingredient amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredientAmount('test.dark-chocolate' as IngredientId, 50 as Grams)).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
      });
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredientAmount('test.non-existent' as IngredientId, 50 as Grams)).toFailWith(
        /not found/
      );
    });
  });

  describe('addIngredient', () => {
    test('adds new ingredient to session', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.butter' as IngredientId, 30 as Grams)).toSucceed();
      expect(session.ingredients.size).toBe(3);
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(30);
        expect(ing.originalAmount).toBe(0);
        expect(ing.status).toBe('added');
      });
    });

    test('adds journal entry for new ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();

      const addEntries = session.journalEntries.filter((e) => e.eventType === 'ingredient-add');
      expect(addEntries.length).toBe(1);
      expect(addEntries[0].ingredientId).toBe('test.butter');
      expect(addEntries[0].newAmount).toBe(30);
    });

    test('fails if ingredient already exists', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.dark-chocolate' as IngredientId, 100 as Grams)).toFailWith(
        /already exists/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.butter' as IngredientId, -10 as Grams)).toFailWith(/negative/);
    });
  });

  describe('removeIngredient', () => {
    test('marks original ingredient as removed', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.removeIngredient('test.cream' as IngredientId)).toSucceed();
      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(0);
        expect(ing.status).toBe('removed');
      });
    });

    test('completely removes added ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();
      expect(session.removeIngredient('test.butter' as IngredientId)).toSucceed();
      expect(session.ingredients.has('test.butter' as IngredientId)).toBe(false);
    });

    test('adds journal entry for removal', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.removeIngredient('test.cream' as IngredientId).orThrow();

      const removeEntries = session.journalEntries.filter((e) => e.eventType === 'ingredient-remove');
      expect(removeEntries.length).toBe(1);
      expect(removeEntries[0].ingredientId).toBe('test.cream');
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.removeIngredient('test.non-existent' as IngredientId)).toFailWith(/not found/);
    });
  });

  describe('substituteIngredient', () => {
    test('substitutes one ingredient for another', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.cream' as IngredientId, 'test.butter' as IngredientId)
      ).toSucceed();

      // Original is marked as removed
      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('removed');
        expect(ing.amount).toBe(0);
      });

      // Substitute is added with original amount
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('substituted');
        expect(ing.amount).toBe(100); // Same as original cream amount
        expect(ing.substitutedFor).toBe('test.cream');
      });
    });

    test('allows specifying different amount for substitute', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.cream' as IngredientId, 'test.butter' as IngredientId, 80 as Grams)
      ).toSucceed();

      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(80);
      });
    });

    test('adds journal entry for substitution', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.substituteIngredient('test.cream' as IngredientId, 'test.butter' as IngredientId).orThrow();

      const subEntries = session.journalEntries.filter((e) => e.eventType === 'ingredient-substitute');
      expect(subEntries.length).toBe(1);
      expect(subEntries[0].ingredientId).toBe('test.cream');
      expect(subEntries[0].substituteIngredientId).toBe('test.butter');
    });

    test('fails if original not found', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.non-existent' as IngredientId, 'test.butter' as IngredientId)
      ).toFailWith(/not found/);
    });

    test('fails if substitute already exists', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.cream' as IngredientId, 'test.dark-chocolate' as IngredientId)
      ).toFailWith(/already exists/);
    });
  });

  describe('addNote', () => {
    test('adds note to journal', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.addNote('Starting cooking session');

      const noteEntries = session.journalEntries.filter((e) => e.eventType === 'note');
      expect(noteEntries.length).toBe(1);
      expect(noteEntries[0].text).toBe('Starting cooking session');
    });

    test('does not add note when journaling is disabled', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({
        sourceVersion: version,
        enableJournal: false
      }).orThrow();

      session.addNote('This should not appear');
      expect(session.journalEntries.length).toBe(0);
    });
  });

  // ============================================================================
  // Output Methods Tests
  // ============================================================================

  describe('toJournalRecord', () => {
    test('creates journal record from session', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setScaleFactor(1.5).orThrow();
      session.addNote('Test note');

      expect(session.toJournalRecord('Session notes')).toSucceedAndSatisfy((record) => {
        expect(record.journalId).toBeDefined();
        expect(record.recipeVersionId).toBe('test.test-ganache@2026-01-01-01');
        expect(record.targetWeight).toBe(450);
        expect(record.scaleFactor).toBe(1.5);
        expect(record.notes).toBe('Session notes');
        expect(record.entries).toHaveLength(2); // scale + note
      });
    });

    test('omits entries when journaling is disabled', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({
        sourceVersion: version,
        enableJournal: false
      }).orThrow();

      expect(session.toJournalRecord()).toSucceedAndSatisfy((record) => {
        expect(record.entries).toBeUndefined();
      });
    });
  });

  describe('toRecipeIngredients', () => {
    test('returns non-removed ingredients', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.removeIngredient('test.cream' as IngredientId).orThrow();
      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();

      const ingredients = session.toRecipeIngredients();
      expect(ingredients.length).toBe(2);
      expect(ingredients.find((i) => i.ingredientId === 'test.dark-chocolate')).toBeDefined();
      expect(ingredients.find((i) => i.ingredientId === 'test.butter')).toBeDefined();
      expect(ingredients.find((i) => i.ingredientId === 'test.cream')).toBeUndefined();
    });

    test('excludes zero-amount ingredients', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setIngredientAmount('test.cream' as IngredientId, 0 as Grams).orThrow();

      const ingredients = session.toRecipeIngredients();
      expect(ingredients.length).toBe(1);
      expect(ingredients[0].ingredientId).toBe('test.dark-chocolate');
    });
  });

  describe('toRecipeVersion', () => {
    test('creates recipe version from session state', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.setScaleFactor(2).orThrow();

      expect(session.toRecipeVersion('2026-02-01-01')).toSucceedAndSatisfy((newVersion) => {
        expect(newVersion.versionSpec).toBe('2026-02-01-01');
        expect(newVersion.ingredients.length).toBe(2);
        expect(newVersion.baseWeight).toBe(600); // 200*2 + 100*2
      });
    });

    test('fails if no ingredients remain', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      session.removeIngredient('test.dark-chocolate' as IngredientId).orThrow();
      session.removeIngredient('test.cream' as IngredientId).orThrow();

      expect(session.toRecipeVersion('2026-02-01-01')).toFailWith(/no ingredients/);
    });
  });

  describe('save', () => {
    test('creates journal record when requested', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createJournalRecord: true,
          journalNotes: 'Test session'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
      });
      expect(session.isDirty).toBe(false);
    });

    test('creates new version when requested', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createNewVersion: true,
          versionLabel: '2026-02-01-01'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.newVersionSpec).toBe('2026-02-01-01');
      });
    });

    test('fails if versionLabel missing when creating new version', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createNewVersion: true
        })
      ).toFailWith(/versionLabel.*required/);
    });

    test('creates both journal record and version', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createJournalRecord: true,
          createNewVersion: true,
          versionLabel: '2026-02-01-01',
          journalNotes: 'Created new version'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.newVersionSpec).toBe('2026-02-01-01');
      });
    });
  });

  // ============================================================================
  // Journaling Disabled Tests
  // ============================================================================

  describe('journaling disabled', () => {
    test('does not record journal entries when disabled', () => {
      const version = ctx.recipes.get('test.test-ganache' as RecipeId).orThrow().goldenVersion;
      const session = Session.EditingSession.create({
        sourceVersion: version,
        enableJournal: false
      }).orThrow();

      session.setScaleFactor(2).orThrow();
      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Grams).orThrow();
      session.addIngredient('test.butter' as IngredientId, 30 as Grams).orThrow();
      session.removeIngredient('test.cream' as IngredientId).orThrow();

      expect(session.journalEntries.length).toBe(0);
    });
  });
});
