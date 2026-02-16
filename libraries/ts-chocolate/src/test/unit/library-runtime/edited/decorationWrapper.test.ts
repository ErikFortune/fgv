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
  BaseDecorationId,
  IngredientId,
  Measurement,
  NoteCategory,
  ProcedureId,
  RatingScore
} from '../../../../packlets/common';
import { Decorations, Fillings, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedDecoration } from '../../../../packlets/library-runtime/edited/decorationWrapper';

type RatingCategory = Fillings.RatingCategory;

// ============================================================================
// Test Data Helpers
// ============================================================================

function makeEntity(overrides?: Partial<Decorations.IDecorationEntity>): Decorations.IDecorationEntity {
  return {
    baseId: 'test-decoration' as unknown as BaseDecorationId,
    name: 'Test Decoration',
    ingredients: [],
    ...overrides
  };
}

const basicIngredient: Decorations.IDecorationIngredientEntity = {
  ingredient: {
    ids: ['chocolate-chips' as unknown as IngredientId],
    preferredId: 'chocolate-chips' as unknown as IngredientId
  },
  amount: 100 as unknown as Measurement
};

const ingredientWithNotes: Decorations.IDecorationIngredientEntity = {
  ingredient: {
    ids: ['sprinkles' as unknown as IngredientId]
  },
  amount: 50 as unknown as Measurement,
  notes: [{ category: 'usage' as NoteCategory, note: 'Apply while wet' }]
};

const basicProcedure: Fillings.IProcedureRefEntity = {
  id: 'proc-1' as unknown as ProcedureId
};

const procedureWithNotes: Fillings.IProcedureRefEntity = {
  id: 'proc-2' as unknown as ProcedureId,
  notes: [{ category: 'timing' as NoteCategory, note: 'Do this first' }]
};

const basicRating: Decorations.IDecorationRating = {
  category: 'complexity' as RatingCategory,
  score: 3 as RatingScore
};

const ratingWithNotes: Decorations.IDecorationRating = {
  category: 'appearance' as RatingCategory,
  score: 5 as RatingScore,
  notes: [{ category: 'general' as NoteCategory, note: 'Very shiny' }]
};

// ============================================================================
// EditedDecoration Tests
// ============================================================================

describe('EditedDecoration', () => {
  describe('factory methods', () => {
    test('create() succeeds with minimal entity', () => {
      const entity = makeEntity();
      expect(EditedDecoration.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Decoration');
        expect(wrapper.current.baseId).toBe(entity.baseId);
        expect(wrapper.current.ingredients).toHaveLength(0);
      });
    });

    test('create() succeeds with full entity', () => {
      const entity = makeEntity({
        description: 'A beautiful decoration',
        ingredients: [basicIngredient, ingredientWithNotes],
        procedures: {
          options: [basicProcedure, procedureWithNotes],
          preferredId: 'proc-1' as unknown as ProcedureId
        },
        ratings: [basicRating, ratingWithNotes],
        tags: ['simple', 'elegant'],
        notes: [{ category: 'storage' as NoteCategory, note: 'Keep dry' }]
      });

      expect(EditedDecoration.create(entity)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Test Decoration');
        expect(wrapper.current.description).toBe('A beautiful decoration');
        expect(wrapper.current.ingredients).toHaveLength(2);
        expect(wrapper.current.procedures?.options).toHaveLength(2);
        expect(wrapper.current.ratings).toHaveLength(2);
        expect(wrapper.current.tags).toHaveLength(2);
        expect(wrapper.current.notes).toHaveLength(1);
      });
    });

    test('create() deep copies the initial entity', () => {
      const mutableIngredients: Decorations.IDecorationIngredientEntity[] = [basicIngredient];
      const entity = makeEntity({ ingredients: mutableIngredients });

      const wrapper = EditedDecoration.create(entity).orThrow();
      mutableIngredients.push(ingredientWithNotes);

      expect(wrapper.current.ingredients).toHaveLength(1);
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const entity = makeEntity();
      const history: Session.ISerializedEditingHistoryEntity<Decorations.IDecorationEntity> = {
        current: entity,
        original: entity,
        undoStack: [makeEntity({ name: 'Previous Name' })],
        redoStack: [makeEntity({ name: 'Future Name' })]
      };

      expect(EditedDecoration.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
        expect(wrapper.name).toBe('Test Decoration');
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const entity = makeEntity({
        ingredients: [basicIngredient],
        tags: ['test']
      });
      const wrapper = EditedDecoration.create(entity).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(entity);

      wrapper.setName('Modified Name').orThrow();
      expect(snapshot.name).toBe('Test Decoration');
      expect(wrapper.name).toBe('Modified Name');
    });

    test('snapshot getter returns deep copy', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      const snap = wrapper.snapshot;

      expect(snap).toEqual(entity);
      expect(snap).not.toBe(wrapper.current);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();

      const snapshot = wrapper.createSnapshot();

      wrapper.setName('Change 3').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 4').orThrow();

      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.name).toBe('Change 2');
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });

    test('getSerializedHistory() captures complete state', () => {
      const original = makeEntity({ name: 'Original' });
      const wrapper = EditedDecoration.create(original).orThrow();

      wrapper.setName('Modified').orThrow();
      wrapper.setName('Modified Again').orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(original);

      expect(history.original.name).toBe('Original');
      expect(history.current.name).toBe('Modified');
      expect(history.undoStack.length).toBeGreaterThan(0);
      expect(history.redoStack.length).toBeGreaterThan(0);
    });

    test('getSerializedHistory() creates deep copies', () => {
      const original = makeEntity();
      const wrapper = EditedDecoration.create(original).orThrow();
      wrapper.setName('Changed').orThrow();

      const history = wrapper.getSerializedHistory(original);

      wrapper.setName('Changed Again').orThrow();

      expect(history.current.name).toBe('Changed');
      expect(wrapper.name).toBe('Changed Again');
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('redo() returns false when no future', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('undo() restores previous state', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 1');

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Test Decoration');
    });

    test('redo() restores future state', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();
      wrapper.undo().orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 1');

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Change 2');
    });

    test('canUndo() reflects undo availability', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setName('Change').orThrow();
      expect(wrapper.canUndo()).toBe(true);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });

    test('canRedo() reflects redo availability', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canRedo()).toBe(false);

      wrapper.setName('Change').orThrow();
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.redo().orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('new mutation clears redo stack', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();

      wrapper.setName('Change 1').orThrow();
      wrapper.setName('Change 2').orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('New Change').orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('max history size is enforced', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();

      for (let i = 0; i < 52; i++) {
        wrapper.setName(`Change ${i}`).orThrow();
      }

      let undoCount = 0;
      while (wrapper.canUndo()) {
        wrapper.undo().orThrow();
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('identity accessors', () => {
    test('current returns current entity', () => {
      const entity = makeEntity({ description: 'Test description' });
      const wrapper = EditedDecoration.create(entity).orThrow();

      expect(wrapper.current.name).toBe('Test Decoration');
      expect(wrapper.current.description).toBe('Test description');
      expect(wrapper.current.baseId).toBe(entity.baseId);
    });

    test('snapshot returns immutable copy', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const snap1 = wrapper.snapshot;
      const snap2 = wrapper.snapshot;

      expect(snap1).toEqual(snap2);
      expect(snap1).not.toBe(snap2);
    });

    test('name getter returns current name', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.name).toBe('Test Decoration');

      wrapper.setName('New Name').orThrow();
      expect(wrapper.name).toBe('New Name');
    });
  });

  describe('setName()', () => {
    test('updates name', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.setName('New Name')).toSucceed();
      expect(wrapper.name).toBe('New Name');
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setName('New Name').orThrow();
      expect(wrapper.canUndo()).toBe(true);

      wrapper.undo().orThrow();
      expect(wrapper.name).toBe('Test Decoration');
    });

    test('clears redo stack', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setName('Change 1').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Change 2').orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('setDescription()', () => {
    test('sets description', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.setDescription('A new description')).toSucceed();
      expect(wrapper.current.description).toBe('A new description');
    });

    test('clears description with undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity({ description: 'Old' })).orThrow();
      expect(wrapper.setDescription(undefined)).toSucceed();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setDescription('New Description').orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.description).toBeUndefined();
    });
  });

  describe('setIngredients()', () => {
    test('sets ingredients list', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const ingredients = [basicIngredient, ingredientWithNotes];

      expect(wrapper.setIngredients(ingredients)).toSucceed();
      expect(wrapper.current.ingredients).toHaveLength(2);
      expect(wrapper.current.ingredients[0].ingredient.ids).toEqual(basicIngredient.ingredient.ids);
    });

    test('deep copies ingredients', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableIds = ['chocolate-chips' as unknown as IngredientId];
      const ingredient: Decorations.IDecorationIngredientEntity = {
        ingredient: { ids: mutableIds },
        amount: 100 as unknown as Measurement
      };

      wrapper.setIngredients([ingredient]).orThrow();
      mutableIds.push('dark-chocolate' as unknown as IngredientId);

      expect(wrapper.current.ingredients[0].ingredient.ids).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      wrapper.setIngredients([]).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ingredients).toHaveLength(1);
    });
  });

  describe('addIngredient()', () => {
    test('adds ingredient to empty list', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.addIngredient(basicIngredient)).toSucceed();
      expect(wrapper.current.ingredients).toHaveLength(1);
      expect(wrapper.current.ingredients[0].ingredient.ids).toEqual(basicIngredient.ingredient.ids);
    });

    test('adds ingredient to existing list', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      expect(wrapper.addIngredient(ingredientWithNotes)).toSucceed();
      expect(wrapper.current.ingredients).toHaveLength(2);
    });

    test('deep copies ingredient', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableIds = ['chocolate-chips' as unknown as IngredientId];
      const ingredient: Decorations.IDecorationIngredientEntity = {
        ingredient: { ids: mutableIds },
        amount: 100 as unknown as Measurement
      };

      wrapper.addIngredient(ingredient).orThrow();
      mutableIds.push('dark-chocolate' as unknown as IngredientId);

      expect(wrapper.current.ingredients[0].ingredient.ids).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.addIngredient(basicIngredient).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ingredients).toHaveLength(0);
    });
  });

  describe('removeIngredient()', () => {
    test('removes ingredient at valid index', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({ ingredients: [basicIngredient, ingredientWithNotes] })
      ).orThrow();
      expect(wrapper.removeIngredient(0)).toSucceed();
      expect(wrapper.current.ingredients).toHaveLength(1);
      expect(wrapper.current.ingredients[0]).toEqual(ingredientWithNotes);
    });

    test('fails for negative index', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      expect(wrapper.removeIngredient(-1)).toFailWith(/index -1 out of bounds/i);
    });

    test('fails for index >= length', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      expect(wrapper.removeIngredient(1)).toFailWith(/index 1 out of bounds/i);
    });

    test('fails for empty array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.removeIngredient(0)).toFailWith(/index 0 out of bounds/i);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      wrapper.removeIngredient(0).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ingredients).toHaveLength(1);
    });

    test('does not push undo on failure', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.removeIngredient(0);
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('updateIngredient()', () => {
    test('updates ingredient at valid index', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      const newAmount = 200 as unknown as Measurement;

      expect(wrapper.updateIngredient(0, { amount: newAmount })).toSucceed();
      expect(wrapper.current.ingredients[0].amount).toEqual(newAmount);
      expect(wrapper.current.ingredients[0].ingredient.ids).toEqual(basicIngredient.ingredient.ids);
    });

    test('updates ingredient ref', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      const newIngredient = {
        ids: ['new-chocolate' as unknown as IngredientId],
        preferredId: 'new-chocolate' as unknown as IngredientId
      };

      expect(wrapper.updateIngredient(0, { ingredient: newIngredient })).toSucceed();
      expect(wrapper.current.ingredients[0].ingredient.ids).toEqual(newIngredient.ids);
    });

    test('updates notes', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      const newNotes = [{ category: 'usage' as NoteCategory, note: 'New note' }];

      expect(wrapper.updateIngredient(0, { notes: newNotes })).toSucceed();
      expect(wrapper.current.ingredients[0].notes).toEqual(newNotes);
    });

    test('fails for negative index', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      expect(wrapper.updateIngredient(-1, {})).toFailWith(/index -1 out of bounds/i);
    });

    test('fails for index >= length', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      expect(wrapper.updateIngredient(1, {})).toFailWith(/index 1 out of bounds/i);
    });

    test('pushes undo on success', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ingredients: [basicIngredient] })).orThrow();
      const originalAmount = basicIngredient.amount;

      wrapper.updateIngredient(0, { amount: 200 as unknown as Measurement }).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ingredients[0].amount).toEqual(originalAmount);
    });
  });

  describe('setProcedures()', () => {
    test('sets procedures with preferred', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const procedures = {
        options: [basicProcedure, procedureWithNotes],
        preferredId: 'proc-1' as unknown as ProcedureId
      };

      expect(wrapper.setProcedures(procedures)).toSucceed();
      expect(wrapper.current.procedures?.options).toHaveLength(2);
      expect(wrapper.current.procedures?.preferredId).toBe('proc-1' as unknown as ProcedureId);
    });

    test('sets procedures without preferred', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const procedures = {
        options: [basicProcedure],
        preferredId: undefined
      };

      expect(wrapper.setProcedures(procedures)).toSucceed();
      expect(wrapper.current.procedures?.options).toHaveLength(1);
      expect(wrapper.current.procedures?.preferredId).toBeUndefined();
    });

    test('clears procedures with undefined', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: undefined }
        })
      ).orThrow();

      expect(wrapper.setProcedures(undefined)).toSucceed();
      expect(wrapper.current.procedures).toBeUndefined();
    });

    test('deep copies procedure refs', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableNotes = [{ category: 'timing' as NoteCategory, note: 'First' }];
      const procedure: Fillings.IProcedureRefEntity = {
        id: 'proc-1' as unknown as ProcedureId,
        notes: mutableNotes
      };

      wrapper.setProcedures({ options: [procedure], preferredId: undefined }).orThrow();
      mutableNotes.push({ category: 'timing' as NoteCategory, note: 'Second' });

      expect(wrapper.current.procedures?.options[0].notes).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setProcedures({ options: [basicProcedure], preferredId: undefined }).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.procedures).toBeUndefined();
    });
  });

  describe('addProcedureRef()', () => {
    test('creates procedures field when undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.addProcedureRef(basicProcedure)).toSucceed();
      expect(wrapper.current.procedures?.options).toHaveLength(1);
      expect(wrapper.current.procedures?.preferredId).toBeUndefined();
    });

    test('adds to existing procedures', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: 'proc-1' as unknown as ProcedureId }
        })
      ).orThrow();

      expect(wrapper.addProcedureRef(procedureWithNotes)).toSucceed();
      expect(wrapper.current.procedures?.options).toHaveLength(2);
      expect(wrapper.current.procedures?.preferredId).toBe('proc-1' as unknown as ProcedureId);
    });

    test('deep copies procedure ref', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableNotes = [{ category: 'timing' as NoteCategory, note: 'First' }];
      const procedure: Fillings.IProcedureRefEntity = {
        id: 'proc-1' as unknown as ProcedureId,
        notes: mutableNotes
      };

      wrapper.addProcedureRef(procedure).orThrow();
      mutableNotes.push({ category: 'timing' as NoteCategory, note: 'Second' });

      expect(wrapper.current.procedures?.options[0].notes).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.addProcedureRef(basicProcedure).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.procedures).toBeUndefined();
    });
  });

  describe('removeProcedureRef()', () => {
    test('removes procedure by id', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: {
            options: [basicProcedure, procedureWithNotes],
            preferredId: 'proc-1' as unknown as ProcedureId
          }
        })
      ).orThrow();

      expect(wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId)).toSucceed();
      expect(wrapper.current.procedures?.options).toHaveLength(1);
      expect(wrapper.current.procedures?.options[0].id).toBe('proc-2' as unknown as ProcedureId);
    });

    test('clears preferredId when removing preferred procedure', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: {
            options: [basicProcedure, procedureWithNotes],
            preferredId: 'proc-1' as unknown as ProcedureId
          }
        })
      ).orThrow();

      wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId).orThrow();
      expect(wrapper.current.procedures?.preferredId).toBeUndefined();
    });

    test('preserves preferredId when removing non-preferred', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: {
            options: [basicProcedure, procedureWithNotes],
            preferredId: 'proc-1' as unknown as ProcedureId
          }
        })
      ).orThrow();

      wrapper.removeProcedureRef('proc-2' as unknown as ProcedureId).orThrow();
      expect(wrapper.current.procedures?.preferredId).toBe('proc-1' as unknown as ProcedureId);
    });

    test('clears procedures when removing last option', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: undefined }
        })
      ).orThrow();

      wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId).orThrow();
      expect(wrapper.current.procedures).toBeUndefined();
    });

    test('succeeds as no-op when procedures is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId)).toSucceed();
      expect(wrapper.current.procedures).toBeUndefined();
    });

    test('pushes undo when procedures exist', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: undefined }
        })
      ).orThrow();

      wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.procedures?.options).toHaveLength(1);
    });

    test('does not push undo when procedures is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.removeProcedureRef('proc-1' as unknown as ProcedureId).orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('setPreferredProcedure()', () => {
    test('sets preferred procedure', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure, procedureWithNotes], preferredId: undefined }
        })
      ).orThrow();

      expect(wrapper.setPreferredProcedure('proc-2' as unknown as ProcedureId)).toSucceed();
      expect(wrapper.current.procedures?.preferredId).toBe('proc-2' as unknown as ProcedureId);
    });

    test('clears preferred procedure with undefined', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: 'proc-1' as unknown as ProcedureId }
        })
      ).orThrow();

      expect(wrapper.setPreferredProcedure(undefined)).toSucceed();
      expect(wrapper.current.procedures?.preferredId).toBeUndefined();
    });

    test('succeeds as no-op when procedures is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.setPreferredProcedure('proc-1' as unknown as ProcedureId)).toSucceed();
      expect(wrapper.current.procedures).toBeUndefined();
    });

    test('pushes undo when procedures exist', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          procedures: { options: [basicProcedure], preferredId: undefined }
        })
      ).orThrow();

      wrapper.setPreferredProcedure('proc-1' as unknown as ProcedureId).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.procedures?.preferredId).toBeUndefined();
    });

    test('does not push undo when procedures is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.setPreferredProcedure('proc-1' as unknown as ProcedureId).orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('setRatings()', () => {
    test('sets ratings array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const ratings = [basicRating, ratingWithNotes];

      expect(wrapper.setRatings(ratings)).toSucceed();
      expect(wrapper.current.ratings).toHaveLength(2);
      expect(wrapper.current.ratings?.[0]).toEqual(basicRating);
    });

    test('clears ratings with undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ratings: [basicRating] })).orThrow();
      expect(wrapper.setRatings(undefined)).toSucceed();
      expect(wrapper.current.ratings).toBeUndefined();
    });

    test('deep copies ratings', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableNotes = [{ category: 'general' as NoteCategory, note: 'First' }];
      const rating: Decorations.IDecorationRating = {
        category: 'complexity' as RatingCategory,
        score: 3 as RatingScore,
        notes: mutableNotes
      };

      wrapper.setRatings([rating]).orThrow();
      mutableNotes.push({ category: 'general' as NoteCategory, note: 'Second' });

      expect(wrapper.current.ratings?.[0].notes).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setRatings([basicRating]).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ratings).toBeUndefined();
    });
  });

  describe('setRating()', () => {
    test('adds rating to undefined ratings', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.setRating('complexity' as RatingCategory, 4 as RatingScore)).toSucceed();
      expect(wrapper.current.ratings).toHaveLength(1);
      expect(wrapper.current.ratings?.[0].category).toBe('complexity');
      expect(wrapper.current.ratings?.[0].score).toBe(4);
    });

    test('adds rating to existing ratings', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ratings: [basicRating] })).orThrow();
      expect(wrapper.setRating('appearance' as RatingCategory, 5 as RatingScore)).toSucceed();
      expect(wrapper.current.ratings).toHaveLength(2);
    });

    test('updates existing rating for same category', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ratings: [basicRating] })).orThrow();
      expect(wrapper.setRating('complexity' as RatingCategory, 5 as RatingScore)).toSucceed();
      expect(wrapper.current.ratings).toHaveLength(1);
      expect(wrapper.current.ratings?.[0].score).toBe(5);
    });

    test('sets rating with notes', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const notes = [{ category: 'general' as NoteCategory, note: 'Very complex' }];

      wrapper.setRating('complexity' as RatingCategory, 4 as RatingScore, notes).orThrow();
      expect(wrapper.current.ratings?.[0].notes).toEqual(notes);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setRating('complexity' as RatingCategory, 4 as RatingScore).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ratings).toBeUndefined();
    });
  });

  describe('removeRating()', () => {
    test('removes rating by category', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({ ratings: [basicRating, ratingWithNotes] })
      ).orThrow();
      expect(wrapper.removeRating('complexity' as RatingCategory)).toSucceed();
      expect(wrapper.current.ratings).toHaveLength(1);
      expect(wrapper.current.ratings?.[0].category).toBe('appearance');
    });

    test('clears ratings when removing last rating', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ratings: [basicRating] })).orThrow();
      wrapper.removeRating('complexity' as RatingCategory).orThrow();
      expect(wrapper.current.ratings).toBeUndefined();
    });

    test('succeeds as no-op when ratings is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.removeRating('complexity' as RatingCategory)).toSucceed();
      expect(wrapper.current.ratings).toBeUndefined();
    });

    test('pushes undo when ratings exist', () => {
      const wrapper = EditedDecoration.create(makeEntity({ ratings: [basicRating] })).orThrow();
      wrapper.removeRating('complexity' as RatingCategory).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.ratings).toHaveLength(1);
    });

    test('does not push undo when ratings is undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      expect(wrapper.canUndo()).toBe(false);

      wrapper.removeRating('complexity' as RatingCategory).orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });
  });

  describe('setTags()', () => {
    test('sets tags array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const tags = ['elegant', 'simple'];

      expect(wrapper.setTags(tags)).toSucceed();
      expect(wrapper.current.tags).toEqual(tags);
    });

    test('clears tags with undefined', () => {
      const wrapper = EditedDecoration.create(makeEntity({ tags: ['test'] })).orThrow();
      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('deep copies tags array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableTags = ['elegant'];

      wrapper.setTags(mutableTags).orThrow();
      mutableTags.push('simple');

      expect(wrapper.current.tags).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setTags(['test']).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.tags).toBeUndefined();
    });
  });

  describe('setNotes()', () => {
    test('sets notes array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const notes = [{ category: 'storage' as NoteCategory, note: 'Keep dry' }];

      expect(wrapper.setNotes(notes)).toSucceed();
      expect(wrapper.current.notes).toEqual(notes);
    });

    test('clears notes with undefined', () => {
      const wrapper = EditedDecoration.create(
        makeEntity({
          notes: [{ category: 'storage' as NoteCategory, note: 'Keep dry' }]
        })
      ).orThrow();

      expect(wrapper.setNotes(undefined)).toSucceed();
      expect(wrapper.current.notes).toBeUndefined();
    });

    test('deep copies notes array', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const mutableNotes = [{ category: 'storage' as NoteCategory, note: 'Keep dry' }];

      wrapper.setNotes(mutableNotes).orThrow();
      mutableNotes.push({ category: 'general' as NoteCategory, note: 'Another note' });

      expect(wrapper.current.notes).toHaveLength(1);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const notes = [{ category: 'storage' as NoteCategory, note: 'Keep dry' }];
      wrapper.setNotes(notes).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.notes).toBeUndefined();
    });
  });

  describe('applyUpdate()', () => {
    test('applies partial update', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      const update: Partial<Decorations.IDecorationEntity> = {
        name: 'Updated Name',
        description: 'Updated Description',
        tags: ['updated']
      };

      expect(wrapper.applyUpdate(update)).toSucceed();
      expect(wrapper.current.name).toBe('Updated Name');
      expect(wrapper.current.description).toBe('Updated Description');
      expect(wrapper.current.tags).toEqual(['updated']);
      expect(wrapper.current.baseId).toBe('test-decoration' as unknown as BaseDecorationId);
    });

    test('pushes undo', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.applyUpdate({ description: 'New' }).orThrow();

      wrapper.undo().orThrow();
      expect(wrapper.current.description).toBeUndefined();
    });

    test('clears redo stack', () => {
      const wrapper = EditedDecoration.create(makeEntity()).orThrow();
      wrapper.setName('Change 1').orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.applyUpdate({ description: 'New' }).orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('change detection', () => {
    test('hasChanges() returns false when unchanged', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      expect(wrapper.hasChanges(entity)).toBe(false);
    });

    test('hasChanges() returns true when name changed', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setName('New Name').orThrow();
      expect(wrapper.hasChanges(entity)).toBe(true);
    });

    test('getChanges() detects name change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setName('New Name').orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.nameChanged).toBe(true);
      expect(changes.descriptionChanged).toBe(false);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects description change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setDescription('New Description').orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.descriptionChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects ingredients change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.addIngredient(basicIngredient).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.ingredientsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects procedures change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setProcedures({ options: [basicProcedure], preferredId: undefined }).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.proceduresChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects ratings change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setRating('complexity' as RatingCategory, 4 as RatingScore).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.ratingsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects tags change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setTags(['new-tag']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects notes change', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setNotes([{ category: 'storage' as NoteCategory, note: 'Keep dry' }]).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.notesChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() detects multiple changes', () => {
      const entity = makeEntity();
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setName('New Name').orThrow();
      wrapper.setDescription('New Description').orThrow();
      wrapper.addIngredient(basicIngredient).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.nameChanged).toBe(true);
      expect(changes.descriptionChanged).toBe(true);
      expect(changes.ingredientsChanged).toBe(true);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges() handles tags order difference', () => {
      const entity = makeEntity({ tags: ['a', 'b', 'c'] });
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setTags(['c', 'b', 'a']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(false);
    });

    test('getChanges() detects tags length difference', () => {
      const entity = makeEntity({ tags: ['a', 'b'] });
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setTags(['a', 'b', 'c']).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.tagsChanged).toBe(true);
    });

    test('getChanges() handles notes order difference', () => {
      const notes1 = [
        { category: 'storage' as NoteCategory, note: 'Keep dry' },
        { category: 'usage' as NoteCategory, note: 'Apply carefully' }
      ];
      const notes2 = [
        { category: 'usage' as NoteCategory, note: 'Apply carefully' },
        { category: 'storage' as NoteCategory, note: 'Keep dry' }
      ];

      const entity = makeEntity({ notes: notes1 });
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setNotes(notes2).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.notesChanged).toBe(false);
    });

    test('getChanges() detects notes length difference', () => {
      const notes1 = [{ category: 'storage' as NoteCategory, note: 'Keep dry' }];
      const notes2 = [
        { category: 'storage' as NoteCategory, note: 'Keep dry' },
        { category: 'usage' as NoteCategory, note: 'Apply carefully' }
      ];

      const entity = makeEntity({ notes: notes1 });
      const wrapper = EditedDecoration.create(entity).orThrow();
      wrapper.setNotes(notes2).orThrow();

      const changes = wrapper.getChanges(entity);
      expect(changes.notesChanged).toBe(true);
    });
  });
});
