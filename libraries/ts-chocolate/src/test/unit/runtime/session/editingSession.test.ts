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
  Model as CommonModel,
  NoteCategory,
  ProcedureId,
  BaseSessionId,
  CollectionId
} from '../../../../packlets/common';
import {
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IngredientsLibrary,
  IFillingSessionEntity
} from '../../../../packlets/entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../../../../packlets/entities';
import { ChocolateLibrary } from '../../../../packlets/library-runtime';
import { RuntimeContext, Session } from '../../../../packlets/runtime';

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
    goldenVersionSpec: '2026-01-01-01' as FillingVersionSpec,
    versions: [
      {
        versionSpec: '2026-01-01-01' as FillingVersionSpec,
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

  let ctx: RuntimeContext;

  beforeEach(() => {
    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
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

    const recipes = FillingsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
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
    test('creates session from base recipe', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(Session.EditingSession.create(version)).toSucceedAndSatisfy((session) => {
        expect(session.sessionId).toBeDefined();
        expect(session.baseRecipe).toBe(version);
        expect(session.hasChanges).toBe(false);
      });
    });

    test('creates session with initial scale factor', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(Session.EditingSession.create(version, 2.0)).toSucceedAndSatisfy((session) => {
        expect(session.produced.targetWeight).toBe(600);
      });
    });

    test('fails for non-positive scale factor', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      expect(Session.EditingSession.create(version, 0)).toFailWith(/positive/i);
      expect(Session.EditingSession.create(version, -1)).toFailWith(/positive/i);
    });
  });

  // ============================================================================
  // Editing Methods Tests (delegation to produced wrapper)
  // ============================================================================

  describe('setIngredient', () => {
    test('delegates to produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find(
        (i) => i.ingredientId === 'test.dark-chocolate'
      );
      expect(ingredient?.amount).toBe(250);
    });

    test('allows adding new ingredient', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.setIngredient('test.butter' as IngredientId, 30 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find((i) => i.ingredientId === 'test.butter');
      expect(ingredient).toBeDefined();
      expect(ingredient?.amount).toBe(30);
    });
  });

  describe('removeIngredient', () => {
    test('delegates to produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.removeIngredient('test.cream' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find((i) => i.ingredientId === 'test.cream');
      expect(ingredient).toBeUndefined();
    });
  });

  describe('scaleToTargetWeight', () => {
    test('delegates to produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.scaleToTargetWeight(600 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.targetWeight).toBe(600);
    });
  });

  describe('setNotes', () => {
    test('delegates to produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test note' }];
      expect(session.setNotes(notes)).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.snapshot.notes).toEqual(notes);
    });
  });

  describe('setProcedure', () => {
    test('delegates to produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      // Setting procedure to a value when it was undefined should register as a change
      expect(session.setProcedure('test.procedure' as ProcedureId)).toSucceed();
      expect(session.hasChanges).toBe(true);
    });
  });

  // ============================================================================
  // Undo/Redo Tests
  // ============================================================================

  describe('undo/redo', () => {
    test('can undo changes', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);

      expect(session.undo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(false);
    });

    test('can redo changes', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.undo().orThrow();

      expect(session.redo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(true);
    });

    test('returns false when no undo available', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.undo()).toSucceedWith(false);
    });

    test('returns false when no redo available', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.redo()).toSucceedWith(false);
    });

    test('canUndo reflects undo availability', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.canUndo()).toBe(false);
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.canUndo()).toBe(true);
    });

    test('canRedo reflects redo availability', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.canRedo()).toBe(false);
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.undo().orThrow();
      expect(session.canRedo()).toBe(true);
    });
  });

  // ============================================================================
  // Save Analysis Tests
  // ============================================================================

  describe('analyzeSaveOptions', () => {
    test('recommends version for weight changes', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canCreateVersion).toBe(true);
      // Scaling changes ingredients proportionally, so it's an "alternatives" scenario
      expect(analysis.recommendedOption).toBe('alternatives');
      expect(analysis.changes.weightChanged).toBe(true);
    });

    test('recommends alternatives for ingredient changes', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.setIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canAddAlternatives).toBe(true);
      expect(analysis.recommendedOption).toBe('alternatives');
      expect(analysis.changes.ingredientsChanged).toBe(true);
    });
  });

  // ============================================================================
  // Save Operations Tests
  // ============================================================================

  describe('saveAsNewVersion', () => {
    test('creates journal entry with new version spec', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewVersion({
          versionSpec: '2026-01-02-01' as FillingVersionSpec,
          baseWeight: 600 as Measurement
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.newVersionSpec).toBe('2026-01-02-01');
      });
    });
  });

  describe('saveAsAlternatives', () => {
    test('creates journal entry', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.setIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

      expect(
        session.saveAsAlternatives({
          versionSpec: '2026-01-01-01' as FillingVersionSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
      });
    });
  });

  describe('saveAsNewRecipe', () => {
    test('creates journal entry with new recipe info', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewRecipe({
          newId: 'test.new-ganache' as FillingId,
          versionSpec: '2026-01-01-01' as FillingVersionSpec,
          baseWeight: 600 as Measurement
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Journal Creation Tests
  // ============================================================================

  describe('toEditJournalEntry', () => {
    test('creates edit journal entry', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(session.toEditJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('filling-edit');
        expect(entry.baseId).toBeDefined();
        expect(entry.versionId).toBe('test.test-ganache@2026-01-01-01');
        expect(entry.recipe).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test session' }];
      expect(session.toEditJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });
  });

  describe('toProductionJournalEntry', () => {
    test('creates production journal entry', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('filling-production');
        expect(entry.baseId).toBeDefined();
        expect(entry.versionId).toBe('test.test-ganache@2026-01-01-01');
        expect(entry.yield).toBe(300);
        expect(entry.produced).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      const notes = [{ category: 'production' as NoteCategory, note: 'Production run' }];
      expect(session.toProductionJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });
  });

  // ============================================================================
  // Change Detection Tests
  // ============================================================================

  describe('hasChanges', () => {
    test('returns false for new session', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.hasChanges).toBe(false);
    });

    test('returns true after modifications', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);
    });

    test('returns false after undo to original state', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      session.undo().orThrow();
      expect(session.hasChanges).toBe(false);
    });
  });

  // ============================================================================
  // Accessor Tests
  // ============================================================================

  describe('accessors', () => {
    test('provides sessionId', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
    });

    test('provides baseRecipe', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.baseRecipe).toBe(version);
    });

    test('provides produced wrapper', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(session.produced).toBeDefined();
      expect(session.produced.snapshot).toBeDefined();
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  describe('toPersistedState', () => {
    test('creates persisted state from session', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.sessionType).toBe('filling');
        expect(persisted.status).toBe('active');
        expect(persisted.baseId).toBeDefined();
        expect(persisted.sourceVersionId).toBe('test.test-ganache@2026-01-01-01');
        expect(persisted.history.current).toBeDefined();
        expect(persisted.history.original).toBeDefined();
        expect(persisted.history.undoStack).toHaveLength(0);
        expect(persisted.history.redoStack).toHaveLength(0);
        expect(persisted.destination?.defaultCollectionId).toBe('user');
      });
    });

    test('preserves undo/redo stacks in persisted state', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      // Make changes to create undo history
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.setIngredient('test.dark-chocolate' as IngredientId, 280 as Measurement).orThrow();

      // Undo one change to create redo history
      session.undo().orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((persisted) => {
        // Should have one item in undo stack (first edit)
        expect(persisted.history.undoStack.length).toBeGreaterThan(0);
        // Should have one item in redo stack (second edit was undone)
        expect(persisted.history.redoStack.length).toBeGreaterThan(0);
      });
    });

    test('uses provided baseId', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId,
          baseId: '2026-01-15-120000-12345678' as BaseSessionId
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.baseId).toBe('2026-01-15-120000-12345678');
      });
    });

    test('respects status option', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId,
          status: 'planning'
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.status).toBe('planning');
      });
    });

    test('includes label and notes when provided', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test session notes' }];
      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId,
          label: 'My Session',
          notes
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.label).toBe('My Session');
        expect(persisted.notes).toEqual(notes);
      });
    });
  });

  describe('fromPersistedState', () => {
    test('restores session from persisted state', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      // Make a change
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();

      // Persist
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Restore
      expect(Session.EditingSession.fromPersistedState(persisted, version)).toSucceedAndSatisfy(
        (restored) => {
          expect(restored.baseRecipe).toBe(version);
          expect(restored.hasChanges).toBe(true);

          // Verify current state matches
          const ingredient = restored.produced.snapshot.ingredients.find(
            (i) => i.ingredientId === 'test.dark-chocolate'
          );
          expect(ingredient?.amount).toBe(250);
        }
      );
    });

    test('restores undo/redo stacks', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();

      // Make changes
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.setIngredient('test.dark-chocolate' as IngredientId, 280 as Measurement).orThrow();
      session.undo().orThrow();

      // Persist
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Restore
      expect(Session.EditingSession.fromPersistedState(persisted, version)).toSucceedAndSatisfy(
        (restored) => {
          // Verify we can undo (there's history)
          expect(restored.canUndo()).toBe(true);
          // Verify we can redo (there's future)
          expect(restored.canRedo()).toBe(true);

          // Redo should restore the 280 value
          expect(restored.redo()).toSucceedWith(true);
          const ingredient = restored.produced.snapshot.ingredients.find(
            (i) => i.ingredientId === 'test.dark-chocolate'
          );
          expect(ingredient?.amount).toBe(280);
        }
      );
    });

    test('fails for version mismatch', () => {
      const version = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVersion;
      const session = Session.EditingSession.create(version).orThrow();
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Create a fake persisted state with wrong version ID
      const wrongPersisted: IFillingSessionEntity = {
        ...persisted,
        sourceVersionId: 'wrong.wrong@2026-01-01-01' as unknown as typeof persisted.sourceVersionId
      };

      expect(Session.EditingSession.fromPersistedState(wrongPersisted, version)).toFailWith(
        /version mismatch/i
      );
    });
  });
});
