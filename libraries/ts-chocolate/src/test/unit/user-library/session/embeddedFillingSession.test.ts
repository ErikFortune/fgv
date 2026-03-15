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
  Model as CommonModel,
  NoteCategory,
  ProcedureId,
  CollectionId
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingRecipeEntity,
  FillingsLibrary
} from '../../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../../packlets/library-runtime';
import { Session } from '../../../../packlets/user-library';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EmbeddedFillingSession } from '../../../../packlets/user-library/session/embeddedFillingSession';

describe('EmbeddedFillingSession', () => {
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

  const darkChocolate: IChocolateIngredientEntity = {
    baseId: 'dark-chocolate' as BaseIngredientId,
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70 as Percentage,
    ganacheCharacteristics: testChars
  };

  const cream: IIngredientEntity = {
    baseId: 'cream' as BaseIngredientId,
    name: 'Heavy Cream',
    category: 'dairy',
    ganacheCharacteristics: creamChars
  };

  const butter: IIngredientEntity = {
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

  const testRecipe: IFillingRecipeEntity = {
    baseId: 'test-ganache' as BaseFillingId,
    name: 'Test Ganache' as FillingName,
    category: 'ganache',
    description: 'A test ganache recipe',
    goldenVariationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
    variations: [
      {
        variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec,
        createdDate: '2026-01-01',
        notes: [{ category: 'user', note: 'Original recipe' }] as CommonModel.ICategorizedNote[],
        ingredients: [
          { ingredient: { ids: ['test.dark-chocolate' as IngredientId] }, amount: 200 as Measurement },
          { ingredient: { ids: ['test.cream' as IngredientId] }, amount: 100 as Measurement }
        ],
        baseWeight: 300 as Measurement
      }
    ]
  };

  let ctx: ChocolateLibrary;

  function makeEmbeddedSession(onMutation?: () => void): EmbeddedFillingSession {
    const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
    const inner = Session.EditingSession.create(variation).orThrow();
    return new EmbeddedFillingSession(inner, onMutation);
  }

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'dark-chocolate': darkChocolate,
            cream,
            butter
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: true,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'test-ganache': testRecipe
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      libraries: { ingredients, fillings: recipes }
    }).orThrow();

    ctx = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();
  });

  // ============================================================================
  // Constructor
  // ============================================================================

  describe('constructor', () => {
    test('wraps a standalone EditingSession', () => {
      const embedded = makeEmbeddedSession();
      expect(embedded.standaloneSession).toBeDefined();
      expect(embedded.baseRecipe).toBeDefined();
    });

    test('works without an onMutation callback', () => {
      const embedded = makeEmbeddedSession(undefined);
      // Mutations should succeed even without a callback
      expect(embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement)).toSucceed();
    });
  });

  // ============================================================================
  // standaloneSession accessor
  // ============================================================================

  describe('standaloneSession', () => {
    test('returns the underlying EditingSession', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const inner = Session.EditingSession.create(variation).orThrow();
      const embedded = new EmbeddedFillingSession(inner);
      expect(embedded.standaloneSession).toBe(inner);
    });
  });

  // ============================================================================
  // Pass-through accessors
  // ============================================================================

  describe('baseRecipe', () => {
    test('delegates to inner session', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const inner = Session.EditingSession.create(variation).orThrow();
      const embedded = new EmbeddedFillingSession(inner);
      expect(embedded.baseRecipe).toBe(inner.baseRecipe);
    });
  });

  describe('produced', () => {
    test('delegates to inner session', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const inner = Session.EditingSession.create(variation).orThrow();
      const embedded = new EmbeddedFillingSession(inner);
      expect(embedded.produced).toBe(inner.produced);
    });
  });

  describe('targetWeight', () => {
    test('delegates to inner session', () => {
      const embedded = makeEmbeddedSession();
      expect(embedded.targetWeight).toBe(300);
    });
  });

  describe('hasChanges', () => {
    test('returns false for a fresh session', () => {
      const embedded = makeEmbeddedSession();
      expect(embedded.hasChanges).toBe(false);
    });

    test('returns true after a mutation', () => {
      const embedded = makeEmbeddedSession();
      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(embedded.hasChanges).toBe(true);
    });
  });

  // ============================================================================
  // setIngredient
  // ============================================================================

  describe('setIngredient', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement)).toSucceed();
      expect(callCount).toBe(1);

      const ingredient = embedded.produced.snapshot.ingredients.find(
        (i) => i.ingredientId === 'test.dark-chocolate'
      );
      expect(ingredient?.amount).toBe(250);
    });

    test('does not call callback when inner session fails', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      // Attempt to set an invalid amount (0 or negative will fail)
      const result = embedded.setIngredient('test.dark-chocolate' as IngredientId, -10 as Measurement);
      // If it fails, mutation callback must not be called
      if (result.isFailure()) {
        expect(callCount).toBe(0);
      }
    });
  });

  // ============================================================================
  // replaceIngredient
  // ============================================================================

  describe('replaceIngredient', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(
        embedded.replaceIngredient(
          'test.dark-chocolate' as IngredientId,
          'test.butter' as IngredientId,
          200 as Measurement
        )
      ).toSucceed();

      expect(callCount).toBe(1);
      const original = embedded.produced.snapshot.ingredients.find(
        (i) => i.ingredientId === 'test.dark-chocolate'
      );
      const replacement = embedded.produced.snapshot.ingredients.find(
        (i) => i.ingredientId === 'test.butter'
      );
      expect(original).toBeUndefined();
      expect(replacement).toBeDefined();
      expect(replacement?.amount).toBe(200);
    });

    test('notifies mutation callback when called without optional parameters', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(
        embedded.replaceIngredient(
          'test.cream' as IngredientId,
          'test.butter' as IngredientId,
          80 as Measurement
        )
      ).toSucceed();
      expect(callCount).toBe(1);
    });
  });

  // ============================================================================
  // removeIngredient
  // ============================================================================

  describe('removeIngredient', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.removeIngredient('test.cream' as IngredientId)).toSucceed();
      expect(callCount).toBe(1);

      const ingredient = embedded.produced.snapshot.ingredients.find((i) => i.ingredientId === 'test.cream');
      expect(ingredient).toBeUndefined();
    });
  });

  // ============================================================================
  // scaleToTargetWeight
  // ============================================================================

  describe('scaleToTargetWeight', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.scaleToTargetWeight(600 as Measurement)).toSucceedAndSatisfy((actualWeight) => {
        expect(actualWeight).toBeGreaterThan(0);
      });
      expect(callCount).toBe(1);
      expect(embedded.targetWeight).toBe(600);
    });
  });

  // ============================================================================
  // setNotes
  // ============================================================================

  describe('setNotes', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      const notes = [{ category: 'session' as NoteCategory, note: 'A test note' }];
      expect(embedded.setNotes(notes)).toSucceed();
      expect(callCount).toBe(1);
      expect(embedded.produced.snapshot.notes).toEqual(notes);
    });
  });

  // ============================================================================
  // setProcedure
  // ============================================================================

  describe('setProcedure', () => {
    test('delegates to inner session and notifies mutation callback', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.setProcedure('test.some-procedure' as ProcedureId)).toSucceed();
      expect(callCount).toBe(1);
    });

    test('notifies mutation when clearing procedure', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      embedded.setProcedure('test.some-procedure' as ProcedureId).orThrow();
      callCount = 0;

      expect(embedded.setProcedure(undefined)).toSucceed();
      expect(callCount).toBe(1);
    });
  });

  // ============================================================================
  // undo / redo
  // ============================================================================

  describe('undo', () => {
    test('returns true when undo is available and notifies mutation', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      callCount = 0;

      expect(embedded.undo()).toSucceedWith(true);
      expect(callCount).toBe(1);
    });

    test('returns false when no undo is available and does not notify', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.undo()).toSucceedWith(false);
      expect(callCount).toBe(0);
    });
  });

  describe('redo', () => {
    test('returns true when redo is available and notifies mutation', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      embedded.undo().orThrow();
      callCount = 0;

      expect(embedded.redo()).toSucceedWith(true);
      expect(callCount).toBe(1);
    });

    test('returns false when no redo is available and does not notify', () => {
      let callCount = 0;
      const embedded = makeEmbeddedSession(() => {
        callCount++;
      });

      expect(embedded.redo()).toSucceedWith(false);
      expect(callCount).toBe(0);
    });
  });

  // ============================================================================
  // canUndo / canRedo
  // ============================================================================

  describe('canUndo', () => {
    test('returns false initially', () => {
      const embedded = makeEmbeddedSession();
      expect(embedded.canUndo()).toBe(false);
    });

    test('returns true after a mutation', () => {
      const embedded = makeEmbeddedSession();
      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(embedded.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    test('returns false initially', () => {
      const embedded = makeEmbeddedSession();
      expect(embedded.canRedo()).toBe(false);
    });

    test('returns true after undo', () => {
      const embedded = makeEmbeddedSession();
      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      embedded.undo().orThrow();
      expect(embedded.canRedo()).toBe(true);
    });
  });

  // ============================================================================
  // analyzeSaveOptions
  // ============================================================================

  describe('analyzeSaveOptions', () => {
    test('delegates to inner session', () => {
      const embedded = makeEmbeddedSession();
      const analysis = embedded.analyzeSaveOptions();
      expect(analysis).toBeDefined();
      expect(typeof analysis.canCreateVariation).toBe('boolean');
      expect(typeof analysis.mustCreateNew).toBe('boolean');
    });
  });

  // ============================================================================
  // markSaved
  // ============================================================================

  describe('markSaved', () => {
    test('resets hasChanges to false after marking saved', () => {
      const embedded = makeEmbeddedSession();
      embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(embedded.hasChanges).toBe(true);

      embedded.markSaved();
      expect(embedded.hasChanges).toBe(false);
    });
  });

  // ============================================================================
  // Mutation notification — without callback
  // ============================================================================

  describe('mutation notification without callback', () => {
    test('all mutating methods succeed when no callback is registered', () => {
      const embedded = makeEmbeddedSession(); // no callback

      expect(embedded.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement)).toSucceed();
      expect(
        embedded.replaceIngredient(
          'test.dark-chocolate' as IngredientId,
          'test.butter' as IngredientId,
          250 as Measurement
        )
      ).toSucceed();
      expect(embedded.removeIngredient('test.butter' as IngredientId)).toSucceed();
      expect(embedded.scaleToTargetWeight(150 as Measurement)).toSucceed();
      expect(embedded.setNotes([])).toSucceed();
      expect(embedded.setProcedure('test.proc' as ProcedureId)).toSucceed();
    });
  });
});
