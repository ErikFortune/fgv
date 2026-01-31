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
  FillingVersionSpec,
  SourceId
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredient,
  IIngredient,
  IngredientsLibrary
} from '../../../../packlets/entities';
import { IFillingRecipe, FillingsLibrary } from '../../../../packlets/entities';
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

  const testRecipe: IFillingRecipe = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
        createdDate: '2026-01-01',
        notes: 'Original recipe',
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
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

    const recipes = FillingsLibrary.create({
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
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    ctx = RuntimeContext.fromLibrary(library).orThrow();
  });

  // ============================================================================
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session with default scale factor', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(Session.RecipeEditingSession.create({ sourceVersion: version })).toSucceedAndSatisfy(
        (session) => {
          expect(session.scaleFactor).toBe(1.0);
          expect(session.targetWeight).toBe(300);
          expect(session.isDirty).toBe(false);
          expect(session.isJournalingEnabled).toBe(true);
          expect(session.sessionId).toBeDefined();
          expect(session.sourceVersion).toBe(version);
        }
      );
    });

    test('creates session with specified scale factor', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(
        Session.RecipeEditingSession.create({
          sourceVersion: version,
          scaleFactor: 2.0
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.scaleFactor).toBe(2.0);
        expect(session.targetWeight).toBe(600);
      });
    });

    test('creates session with specified target weight', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(
        Session.RecipeEditingSession.create({
          sourceVersion: version,
          targetWeight: 450 as Measurement
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.targetWeight).toBe(450);
        expect(session.scaleFactor).toBe(1.5);
      });
    });

    test('creates session with journaling disabled', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(
        Session.RecipeEditingSession.create({
          sourceVersion: version,
          enableJournal: false
        })
      ).toSucceedAndSatisfy((session) => {
        expect(session.isJournalingEnabled).toBe(false);
      });
    });

    test('initializes ingredients from source version', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(Session.RecipeEditingSession.create({ sourceVersion: version })).toSucceedAndSatisfy(
        (session) => {
          expect(session.ingredients.size).toBe(2);
          expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
            expect(ing.amount).toBe(200);
            expect(ing.originalAmount).toBe(200);
            expect(ing.status).toBe('original');
          });
        }
      );
    });
  });

  // ============================================================================
  // Scale Operations Tests
  // ============================================================================

  describe('setScaleFactor', () => {
    test('scales all ingredients proportionally', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

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

    test('marks session as dirty after scale change', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.isDirty).toBe(false);
      session.setScaleFactor(1.5).orThrow();
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-positive scale factor', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setScaleFactor(0)).toFailWith(/positive/);
      expect(session.setScaleFactor(-1)).toFailWith(/positive/);
    });

    test('does not rescale added ingredients', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      // Add a new ingredient
      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

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
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setTargetWeight(600 as Measurement)).toSucceed();
      expect(session.scaleFactor).toBe(2.0);
      expect(session.targetWeight).toBe(600);
    });

    test('fails for non-positive target weight', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setTargetWeight(0 as Measurement)).toFailWith(/positive/);
      expect(session.setTargetWeight(-100 as Measurement)).toFailWith(/positive/);
    });
  });

  // ============================================================================
  // Ingredient Operations Tests
  // ============================================================================

  describe('getIngredient', () => {
    test('returns existing ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.ingredientId).toBe('test.dark-chocolate');
      });
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.getIngredient('test.non-existent' as IngredientId)).toFailWith(/not found/);
    });
  });

  describe('setIngredientAmount', () => {
    test('updates ingredient amount', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Measurement)
      ).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
        expect(ing.status).toBe('modified');
      });
      expect(session.isDirty).toBe(true);
    });

    test('reverts to original status if amount matches original', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 200 as Measurement).orThrow();

      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.status).toBe('original');
      });
    });

    test('marks session as dirty after amount change', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.isDirty).toBe(false);
      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.setIngredientAmount('test.non-existent' as IngredientId, 100 as Measurement)).toFailWith(
        /not found/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.setIngredientAmount('test.dark-chocolate' as IngredientId, -10 as Measurement)
      ).toFailWith(/negative/);
    });

    test('maintains added status when modifying added ingredient amount', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      // Add a new ingredient
      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

      // Modify its amount
      session.setIngredientAmount('test.butter' as IngredientId, 50 as Measurement).orThrow();

      // Status should still be 'added', not 'modified'
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(50);
        expect(ing.status).toBe('added');
      });
    });
  });

  describe('addIngredientAmount', () => {
    test('adds to existing ingredient amount', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.addIngredientAmount('test.dark-chocolate' as IngredientId, 50 as Measurement)
      ).toSucceed();
      expect(session.getIngredient('test.dark-chocolate' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(250);
      });
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredientAmount('test.non-existent' as IngredientId, 50 as Measurement)).toFailWith(
        /not found/
      );
    });
  });

  describe('addIngredient', () => {
    test('adds new ingredient to session', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.butter' as IngredientId, 30 as Measurement)).toSucceed();
      expect(session.ingredients.size).toBe(3);
      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(30);
        expect(ing.originalAmount).toBe(0);
        expect(ing.status).toBe('added');
      });
    });

    test('marks session as dirty after adding ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.isDirty).toBe(false);
      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();
      expect(session.isDirty).toBe(true);
    });

    test('fails if ingredient already exists', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.dark-chocolate' as IngredientId, 100 as Measurement)).toFailWith(
        /already exists/
      );
    });

    test('fails for negative amount', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.addIngredient('test.butter' as IngredientId, -10 as Measurement)).toFailWith(/negative/);
    });
  });

  describe('removeIngredient', () => {
    test('marks original ingredient as removed', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.removeIngredient('test.cream' as IngredientId)).toSucceed();
      expect(session.getIngredient('test.cream' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(0);
        expect(ing.status).toBe('removed');
      });
    });

    test('completely removes added ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();
      expect(session.removeIngredient('test.butter' as IngredientId)).toSucceed();
      expect(session.ingredients.has('test.butter' as IngredientId)).toBe(false);
    });

    test('marks session as dirty after removing ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.isDirty).toBe(false);
      session.removeIngredient('test.cream' as IngredientId).orThrow();
      expect(session.isDirty).toBe(true);
    });

    test('fails for non-existent ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.removeIngredient('test.non-existent' as IngredientId)).toFailWith(/not found/);
    });
  });

  describe('substituteIngredient', () => {
    test('substitutes one ingredient for another', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

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
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient(
          'test.cream' as IngredientId,
          'test.butter' as IngredientId,
          80 as Measurement
        )
      ).toSucceed();

      expect(session.getIngredient('test.butter' as IngredientId)).toSucceedAndSatisfy((ing) => {
        expect(ing.amount).toBe(80);
      });
    });

    test('marks session as dirty after substitution', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(session.isDirty).toBe(false);
      session.substituteIngredient('test.cream' as IngredientId, 'test.butter' as IngredientId).orThrow();
      expect(session.isDirty).toBe(true);
    });

    test('fails if original not found', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.non-existent' as IngredientId, 'test.butter' as IngredientId)
      ).toFailWith(/not found/);
    });

    test('fails if substitute already exists', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.substituteIngredient('test.cream' as IngredientId, 'test.dark-chocolate' as IngredientId)
      ).toFailWith(/already exists/);
    });
  });

  describe('addNote', () => {
    test('adds note without error', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(() => session.addNote('Starting cooking session')).not.toThrow();
    });

    test('accepts note when journaling is disabled', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({
        sourceVersion: version,
        enableJournal: false
      }).orThrow();

      expect(() => session.addNote('This note is accepted')).not.toThrow();
    });
  });

  // ============================================================================
  // Output Methods Tests
  // ============================================================================

  describe('toEditJournalEntry', () => {
    test('creates journal entry from session', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.setScaleFactor(1.5).orThrow();
      session.addNote('Test note');

      expect(session.toEditJournalEntry(undefined, undefined, 'Session notes')).toSucceedAndSatisfy(
        (entry) => {
          expect(entry.type).toBe('filling-edit');
          expect(entry.id).toBeDefined();
          expect(entry.versionId).toBe('test.test-ganache@2026-01-01-01');
          expect(entry.recipe).toBeDefined();
          expect(entry.notes).toBeDefined();
          expect(entry.notes?.[0]?.note).toBe('Session notes');
        }
      );
    });

    test('includes source recipe in entry', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({
        sourceVersion: version,
        enableJournal: true
      }).orThrow();

      expect(session.toEditJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.recipe).toBeDefined();
        expect(entry.versionId).toBe('test.test-ganache@2026-01-01-01');
      });
    });
  });

  describe('toRecipeIngredients', () => {
    test('returns non-removed ingredients', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.removeIngredient('test.cream' as IngredientId).orThrow();
      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

      const ingredients = session.toRecipeIngredients();
      expect(ingredients.length).toBe(2);
      expect(ingredients.find((i) => i.ingredient.ids[0] === 'test.dark-chocolate')).toBeDefined();
      expect(ingredients.find((i) => i.ingredient.ids[0] === 'test.butter')).toBeDefined();
      expect(ingredients.find((i) => i.ingredient.ids[0] === 'test.cream')).toBeUndefined();
    });

    test('excludes zero-amount ingredients', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.setIngredientAmount('test.cream' as IngredientId, 0 as Measurement).orThrow();

      const ingredients = session.toRecipeIngredients();
      expect(ingredients.length).toBe(1);
      expect(ingredients[0].ingredient.ids[0]).toBe('test.dark-chocolate');
    });
  });

  describe('toRecipeVersion', () => {
    test('creates recipe version from session state', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.setScaleFactor(2).orThrow();

      expect(session.toRecipeVersion('2026-02-01-01' as FillingVersionSpec)).toSucceedAndSatisfy(
        (newVersion) => {
          expect(newVersion.versionSpec).toBe('2026-02-01-01');
          expect(newVersion.ingredients.length).toBe(2);
          expect(newVersion.baseWeight).toBe(600); // 200*2 + 100*2
        }
      );
    });

    test('fails if no ingredients remain', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      session.removeIngredient('test.dark-chocolate' as IngredientId).orThrow();
      session.removeIngredient('test.cream' as IngredientId).orThrow();

      expect(session.toRecipeVersion('2026-02-01-01' as FillingVersionSpec)).toFailWith(/no ingredients/);
    });
  });

  describe('save', () => {
    test('creates journal entry when requested', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createJournalRecord: true,
          journalNotes: 'Test session'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
      });
      expect(session.isDirty).toBe(false);
    });

    test('creates new version when requested', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createNewVersion: true,
          versionLabel: '2026-02-01-01' as FillingVersionSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.newVersionSpec).toBe('2026-02-01-01');
      });
    });

    test('fails if versionLabel missing when creating new version', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createNewVersion: true
        })
      ).toFailWith(/versionLabel.*required/);
    });

    test('creates both journal entry and version', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({ sourceVersion: version }).orThrow();

      expect(
        session.save({
          createJournalRecord: true,
          createNewVersion: true,
          versionLabel: '2026-02-01-01' as FillingVersionSpec,
          journalNotes: 'Created new version'
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.newVersionSpec).toBe('2026-02-01-01');
      });
    });
  });

  // ============================================================================
  // Journaling Disabled Tests
  // ============================================================================

  describe('journaling disabled', () => {
    test('tracks dirty state even when journaling is disabled', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.RecipeEditingSession.create({
        sourceVersion: version,
        enableJournal: false
      }).orThrow();

      expect(session.isDirty).toBe(false);
      session.setScaleFactor(2).orThrow();
      expect(session.isDirty).toBe(true);

      session.setIngredientAmount('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.addIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();
      session.removeIngredient('test.cream' as IngredientId).orThrow();

      expect(session.isDirty).toBe(true);
    });
  });
});
