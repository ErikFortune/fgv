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
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../../packlets/library-runtime';
import { Session } from '../../../../packlets/user-library';

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
  // Factory Method Tests
  // ============================================================================

  describe('create', () => {
    test('creates session from base recipe', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      expect(Session.EditingSession.create(variation)).toSucceedAndSatisfy((session) => {
        expect(session.sessionId).toBeDefined();
        expect(session.baseRecipe).toBe(variation);
        expect(session.hasChanges).toBe(false);
      });
    });

    test('auto-generates session ID when not provided', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session1 = Session.EditingSession.create(variation).orThrow();
      const session2 = Session.EditingSession.create(variation).orThrow();

      // Both should have valid session IDs
      expect(session1.sessionId).toBeDefined();
      expect(session2.sessionId).toBeDefined();
      // Session IDs format: YYYY-MM-DD-HHMMSS-xxxxxxxx
      expect(session1.sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
      expect(session2.sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
      // Should be different due to random component
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    test('creates session with initial scale factor', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      expect(Session.EditingSession.create(variation, 2.0)).toSucceedAndSatisfy((session) => {
        expect(session.produced.targetWeight).toBe(600);
      });
    });

    test('fails for non-positive scale factor', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      expect(Session.EditingSession.create(variation, 0)).toFailWith(/positive/i);
      expect(Session.EditingSession.create(variation, -1)).toFailWith(/positive/i);
    });
  });

  // ============================================================================
  // Editing Methods Tests (delegation to produced wrapper)
  // ============================================================================

  describe('setIngredient', () => {
    test('delegates to produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find(
        (i) => i.ingredientId === 'test.dark-chocolate'
      );
      expect(ingredient?.amount).toBe(250);
    });

    test('allows adding new ingredient', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.setIngredient('test.butter' as IngredientId, 30 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find((i) => i.ingredientId === 'test.butter');
      expect(ingredient).toBeDefined();
      expect(ingredient?.amount).toBe(30);
    });
  });

  describe('removeIngredient', () => {
    test('delegates to produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.removeIngredient('test.cream' as IngredientId)).toSucceed();
      expect(session.hasChanges).toBe(true);

      const ingredient = session.produced.snapshot.ingredients.find((i) => i.ingredientId === 'test.cream');
      expect(ingredient).toBeUndefined();
    });
  });

  describe('scaleToTargetWeight', () => {
    test('delegates to produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.scaleToTargetWeight(600 as Measurement)).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.targetWeight).toBe(600);
    });
  });

  describe('setNotes', () => {
    test('delegates to produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test note' }];
      expect(session.setNotes(notes)).toSucceed();
      expect(session.hasChanges).toBe(true);
      expect(session.produced.snapshot.notes).toEqual(notes);
    });
  });

  describe('setProcedure', () => {
    test('delegates to produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);

      expect(session.undo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(false);
    });

    test('can redo changes', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.undo().orThrow();

      expect(session.redo()).toSucceedWith(true);
      expect(session.hasChanges).toBe(true);
    });

    test('returns false when no undo available', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.undo()).toSucceedWith(false);
    });

    test('returns false when no redo available', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.redo()).toSucceedWith(false);
    });

    test('canUndo reflects undo availability', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.canUndo()).toBe(false);
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      expect(session.canUndo()).toBe(true);
    });

    test('canRedo reflects redo availability', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
    test('recommends variation for weight changes', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canCreateVariation).toBe(true);
      // Uniform scaling is a weight change, not an ingredient change
      expect(analysis.recommendedOption).toBe('variation');
      expect(analysis.changes.weightChanged).toBe(true);
      expect(analysis.changes.ingredientsChanged).toBe(false);
    });

    test('recommends variation for notes-only changes', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Only change notes (no ingredients or procedure changed)
      const notes = [{ category: 'session' as NoteCategory, note: 'Updated notes only' }];
      session.setNotes(notes).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canCreateVariation).toBe(true);
      expect(analysis.recommendedOption).toBe('variation');
      expect(analysis.changes.notesChanged).toBe(true);
      expect(analysis.changes.ingredientsChanged).toBe(false);
      expect(analysis.changes.procedureChanged).toBe(false);
    });

    test('recommends alternatives for ingredient changes', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.setIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canAddAlternatives).toBe(true);
      expect(analysis.recommendedOption).toBe('alternatives');
      expect(analysis.changes.ingredientsChanged).toBe(true);
    });

    test('indicates immutable collection cannot create variations', () => {
      // Create a context with an immutable collection
      const immutableIngredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: {
              'dark-chocolate': darkChocolate,
              cream,
              butter
            }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const immutableRecipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache': {
                ...testRecipe,
                variations: [
                  {
                    ...testRecipe.variations[0],
                    ingredients: [
                      {
                        ingredient: { ids: ['immutable.dark-chocolate' as IngredientId] },
                        amount: 200 as Measurement
                      },
                      { ingredient: { ids: ['immutable.cream' as IngredientId] }, amount: 100 as Measurement }
                    ]
                  }
                ]
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const immutableLibrary = ChocolateEntityLibrary.create({
        libraries: { ingredients: immutableIngredients, fillings: immutableRecipes }
      }).orThrow();

      const immutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(immutableLibrary).orThrow();
      const variation = immutableCtx.fillings
        .get('immutable.test-ganache' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      const analysis = session.analyzeSaveOptions();

      expect(analysis.canCreateVariation).toBe(false);
      expect(analysis.canAddAlternatives).toBe(false);
      expect(analysis.mustCreateNew).toBe(true);
      expect(analysis.recommendedOption).toBe('new');
    });
  });

  // ============================================================================
  // Save Operations Tests
  // ============================================================================

  describe('saveAsNewVariation', () => {
    test('creates journal entry with new variation spec and variation entity', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewVariation({
          variationSpec: '2026-01-02-01' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.newVariationSpec).toBe('2026-01-02-01');
        expect(result.variationEntity).toBeDefined();
        expect(result.variationEntity?.variationSpec).toBe('2026-01-02-01');
        // Base weight matches the scaled target weight (600g)
        expect(result.variationEntity?.baseWeight).toBe(600);
        expect(result.variationEntity?.ingredients).toHaveLength(2);
        // Check ingredients are properly converted with scaled amounts
        expect(result.variationEntity?.ingredients[0].ingredient.ids).toHaveLength(1);
        expect(result.variationEntity?.ingredients[0].amount).toBe(400); // 200 * 2
        expect(result.variationEntity?.ingredients[1].amount).toBe(200); // 100 * 2
      });
    });

    test('handles session with undefined notes', () => {
      // Create a recipe without notes to test the undefined branch
      const recipeWithoutNotes: IFillingRecipeEntity = {
        ...testRecipe,
        baseId: 'test-ganache-no-notes' as BaseFillingId,
        variations: [
          {
            ...testRecipe.variations[0],
            notes: undefined
          }
        ]
      };

      const fillingsNoNotes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test-no-notes' as CollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache-no-notes': recipeWithoutNotes
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredientsLib = IngredientsLibrary.create({
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

      const libraryNoNotes = ChocolateEntityLibrary.create({
        libraries: { ingredients: ingredientsLib, fillings: fillingsNoNotes }
      }).orThrow();

      const ctxNoNotes = ChocolateLibrary.fromChocolateEntityLibrary(libraryNoNotes).orThrow();
      const variation = ctxNoNotes.fillings
        .get('test-no-notes.test-ganache-no-notes' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Make a change but don't set notes (notes will be undefined)
      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewVariation({
          variationSpec: '2026-01-02-02' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalEntry).toBeDefined();
        // Journal entry should not have notes field or it should be undefined
        if (result.journalEntry) {
          expect(result.journalEntry.notes).toBeUndefined();
        }
      });
    });

    test('converts procedure to source format', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Set a procedure
      session.setProcedure('test.procedure' as ProcedureId).orThrow();

      expect(
        session.saveAsNewVariation({
          variationSpec: '2026-01-03-01' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.variationEntity).toBeDefined();
        expect(result.variationEntity?.procedures).toBeDefined();
        expect(result.variationEntity?.procedures?.preferredId).toBe('test.procedure');
        expect(result.variationEntity?.procedures?.options).toHaveLength(1);
        expect(result.variationEntity?.procedures?.options[0].id).toBe('test.procedure');
      });
    });

    test('fails for immutable collection', () => {
      // Create a context with an immutable collection
      const immutableIngredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: {
              'dark-chocolate': darkChocolate,
              cream,
              butter
            }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const immutableRecipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache': {
                ...testRecipe,
                variations: [
                  {
                    ...testRecipe.variations[0],
                    ingredients: [
                      {
                        ingredient: { ids: ['immutable.dark-chocolate' as IngredientId] },
                        amount: 200 as Measurement
                      },
                      { ingredient: { ids: ['immutable.cream' as IngredientId] }, amount: 100 as Measurement }
                    ]
                  }
                ]
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const immutableLibrary = ChocolateEntityLibrary.create({
        libraries: { ingredients: immutableIngredients, fillings: immutableRecipes }
      }).orThrow();

      const immutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(immutableLibrary).orThrow();
      const variation = immutableCtx.fillings
        .get('immutable.test-ganache' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewVariation({
          variationSpec: '2026-01-02-01' as FillingRecipeVariationSpec
        })
      ).toFailWith(/collection is immutable/i);
    });
  });

  describe('saveAsAlternatives', () => {
    test('creates journal entry with merged variation entity', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.setIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

      expect(
        session.saveAsAlternatives({
          variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.variationEntity).toBeDefined();
        expect(result.variationEntity?.ingredients).toHaveLength(3);
        expect(result.variationEntity?.ingredients[0].amount).toBe(200 as Measurement);
        expect(result.variationEntity?.ingredients[1].amount).toBe(100 as Measurement);
        expect(result.variationEntity?.ingredients[2].amount).toBe(30 as Measurement);
      });
    });

    test('handles session with undefined notes', () => {
      // Use the same recipe without notes from the previous test
      const recipeWithoutNotes: IFillingRecipeEntity = {
        ...testRecipe,
        baseId: 'test-ganache-no-notes-alt' as BaseFillingId,
        variations: [
          {
            ...testRecipe.variations[0],
            notes: undefined
          }
        ]
      };

      const fillingsNoNotes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test-no-notes-alt' as CollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache-no-notes-alt': recipeWithoutNotes
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredientsLib = IngredientsLibrary.create({
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

      const libraryNoNotes = ChocolateEntityLibrary.create({
        libraries: { ingredients: ingredientsLib, fillings: fillingsNoNotes }
      }).orThrow();

      const ctxNoNotes = ChocolateLibrary.fromChocolateEntityLibrary(libraryNoNotes).orThrow();
      const variation = ctxNoNotes.fillings
        .get('test-no-notes-alt.test-ganache-no-notes-alt' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Make a change but don't set notes (notes will be undefined)
      session.setIngredient('test.butter' as IngredientId, 30 as Measurement).orThrow();

      expect(
        session.saveAsAlternatives({
          variationSpec: '2026-01-01-02' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalEntry).toBeDefined();
        // Journal entry should not have notes field or it should be undefined
        if (result.journalEntry) {
          expect(result.journalEntry.notes).toBeUndefined();
        }
      });
    });

    test('fails for immutable collection', () => {
      // Create a context with an immutable collection
      const immutableIngredients = IngredientsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            /* eslint-disable @typescript-eslint/naming-convention */
            items: {
              'dark-chocolate': darkChocolate,
              cream,
              butter
            }
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        ]
      }).orThrow();

      const immutableRecipes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'immutable' as CollectionId,
            isMutable: false,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache': {
                ...testRecipe,
                variations: [
                  {
                    ...testRecipe.variations[0],
                    ingredients: [
                      {
                        ingredient: { ids: ['immutable.dark-chocolate' as IngredientId] },
                        amount: 200 as Measurement
                      },
                      { ingredient: { ids: ['immutable.cream' as IngredientId] }, amount: 100 as Measurement }
                    ]
                  }
                ]
              }
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const immutableLibrary = ChocolateEntityLibrary.create({
        libraries: { ingredients: immutableIngredients, fillings: immutableRecipes }
      }).orThrow();

      const immutableCtx = ChocolateLibrary.fromChocolateEntityLibrary(immutableLibrary).orThrow();
      const variation = immutableCtx.fillings
        .get('immutable.test-ganache' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.setIngredient('immutable.butter' as IngredientId, 30 as Measurement).orThrow();

      expect(
        session.saveAsAlternatives({
          variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec
        })
      ).toFailWith(/collection is immutable/i);
    });
  });

  describe('saveAsNewRecipe', () => {
    test('creates journal entry with new recipe info and variation entity', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewRecipe({
          newId: 'test.new-ganache' as FillingId,
          variationSpec: '2026-01-01-01' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalId).toBeDefined();
        expect(result.journalEntry).toBeDefined();
        expect(result.variationEntity).toBeDefined();
        expect(result.variationEntity?.variationSpec).toBe('2026-01-01-01');
        // Base weight matches the scaled target weight (600g)
        expect(result.variationEntity?.baseWeight).toBe(600);
        expect(result.variationEntity?.ingredients).toHaveLength(2);
        // Check ingredients are properly converted with scaled amounts
        expect(result.variationEntity?.ingredients[0].ingredient.ids).toHaveLength(1);
        expect(result.variationEntity?.ingredients[0].amount).toBe(400); // 200 * 2
        expect(result.variationEntity?.ingredients[1].amount).toBe(200); // 100 * 2
      });
    });

    test('handles session with undefined notes', () => {
      // Use the same recipe without notes pattern
      const recipeWithoutNotes: IFillingRecipeEntity = {
        ...testRecipe,
        baseId: 'test-ganache-no-notes-new' as BaseFillingId,
        variations: [
          {
            ...testRecipe.variations[0],
            notes: undefined
          }
        ]
      };

      const fillingsNoNotes = FillingsLibrary.create({
        builtin: false,
        collections: [
          {
            id: 'test-no-notes-new' as CollectionId,
            isMutable: true,
            items: {
              /* eslint-disable @typescript-eslint/naming-convention */
              'test-ganache-no-notes-new': recipeWithoutNotes
              /* eslint-enable @typescript-eslint/naming-convention */
            }
          }
        ]
      }).orThrow();

      const ingredientsLib = IngredientsLibrary.create({
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

      const libraryNoNotes = ChocolateEntityLibrary.create({
        libraries: { ingredients: ingredientsLib, fillings: fillingsNoNotes }
      }).orThrow();

      const ctxNoNotes = ChocolateLibrary.fromChocolateEntityLibrary(libraryNoNotes).orThrow();
      const variation = ctxNoNotes.fillings
        .get('test-no-notes-new.test-ganache-no-notes-new' as FillingId)
        .orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Make a change but don't set notes (notes will be undefined)
      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(
        session.saveAsNewRecipe({
          newId: 'test.new-ganache-2' as FillingId,
          variationSpec: '2026-01-01-02' as FillingRecipeVariationSpec
        })
      ).toSucceedAndSatisfy((result) => {
        expect(result.journalEntry).toBeDefined();
        // Journal entry should not have notes field or it should be undefined
        if (result.journalEntry) {
          expect(result.journalEntry.notes).toBeUndefined();
        }
      });
    });
  });

  // ============================================================================
  // Journal Creation Tests
  // ============================================================================

  describe('toEditJournalEntry', () => {
    test('creates edit journal entry', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();

      expect(session.toEditJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('filling-edit');
        expect(entry.baseId).toBeDefined();
        expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01');
        expect(entry.recipe).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      const notes = [{ category: 'session' as NoteCategory, note: 'Test session' }];
      expect(session.toEditJournalEntry(notes)).toSucceedAndSatisfy((entry) => {
        expect(entry.notes).toEqual(notes);
      });
    });
  });

  describe('toProductionJournalEntry', () => {
    test('creates production journal entry', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.toProductionJournalEntry()).toSucceedAndSatisfy((entry) => {
        expect(entry.type).toBe('filling-production');
        expect(entry.baseId).toBeDefined();
        expect(entry.variationId).toBe('test.test-ganache@2026-01-01-01');
        expect(entry.yield).toBe(300);
        expect(entry.produced).toBeDefined();
      });
    });

    test('includes notes when provided', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.hasChanges).toBe(false);
    });

    test('returns true after modifications', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      session.scaleToTargetWeight(600 as Measurement).orThrow();
      expect(session.hasChanges).toBe(true);
    });

    test('returns false after undo to original state', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.sessionId).toBeDefined();
      expect(typeof session.sessionId).toBe('string');
    });

    test('provides baseRecipe', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.baseRecipe).toBe(variation);
    });

    test('provides produced wrapper', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(session.produced).toBeDefined();
      expect(session.produced.snapshot).toBeDefined();
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  describe('toPersistedState', () => {
    test('creates persisted state from session', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      expect(
        session.toPersistedState({
          collectionId: 'user' as CollectionId
        })
      ).toSucceedAndSatisfy((persisted) => {
        expect(persisted.sessionType).toBe('filling');
        expect(persisted.status).toBe('active');
        expect(persisted.baseId).toBeDefined();
        expect(persisted.sourceVariationId).toBe('test.test-ganache@2026-01-01-01');
        expect(persisted.history.current).toBeDefined();
        expect(persisted.history.original).toBeDefined();
        expect(persisted.history.undoStack).toHaveLength(0);
        expect(persisted.history.redoStack).toHaveLength(0);
        expect(persisted.destination?.defaultCollectionId).toBe('user');
      });
    });

    test('preserves undo/redo stacks in persisted state', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Make a change
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();

      // Persist
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Restore
      expect(Session.EditingSession.fromPersistedState(persisted, variation)).toSucceedAndSatisfy(
        (restored) => {
          expect(restored.baseRecipe).toBe(variation);
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
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();

      // Make changes
      session.setIngredient('test.dark-chocolate' as IngredientId, 250 as Measurement).orThrow();
      session.setIngredient('test.dark-chocolate' as IngredientId, 280 as Measurement).orThrow();
      session.undo().orThrow();

      // Persist
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Restore
      expect(Session.EditingSession.fromPersistedState(persisted, variation)).toSucceedAndSatisfy(
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

    test('fails for variation mismatch', () => {
      const variation = ctx.fillings.get('test.test-ganache' as FillingId).orThrow().goldenVariation;
      const session = Session.EditingSession.create(variation).orThrow();
      const persisted = session.toPersistedState({ collectionId: 'user' as CollectionId }).orThrow();

      // Create a fake persisted state with wrong variation ID
      const wrongPersisted: IFillingSessionEntity = {
        ...persisted,
        sourceVariationId: 'wrong.wrong@2026-01-01-01' as unknown as typeof persisted.sourceVariationId
      };

      expect(Session.EditingSession.fromPersistedState(wrongPersisted, variation)).toFailWith(
        /variation mismatch/i
      );
    });
  });
});
