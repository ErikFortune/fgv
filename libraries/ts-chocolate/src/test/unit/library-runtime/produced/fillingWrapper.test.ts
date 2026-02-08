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
  FillingRecipeVariationId,
  IngredientId,
  Measurement,
  MeasurementUnit,
  Model as CommonModel,
  NoteCategory,
  ProcedureId
} from '../../../../packlets/common';
import { Fillings, IProducedFillingEntity, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { ProducedFilling } from '../../../../packlets/library-runtime/produced/fillingWrapper';

// ============================================================================
// Test Data
// ============================================================================

const testVariationId = 'test.test-ganache@2026-01-01-01' as FillingRecipeVariationId;

const baseProducedFilling: IProducedFillingEntity = {
  variationId: testVariationId,
  scaleFactor: 1.0,
  targetWeight: 300 as Measurement,
  ingredients: [
    {
      ingredientId: 'test.dark-chocolate' as IngredientId,
      amount: 200 as Measurement,
      unit: 'g' as MeasurementUnit
    },
    {
      ingredientId: 'test.cream' as IngredientId,
      amount: 100 as Measurement,
      unit: 'mL' as MeasurementUnit
    }
  ]
};

const fillingWithNonWeightIngredients: IProducedFillingEntity = {
  variationId: testVariationId,
  scaleFactor: 1.0,
  targetWeight: 300 as Measurement,
  ingredients: [
    {
      ingredientId: 'test.dark-chocolate' as IngredientId,
      amount: 200 as Measurement,
      unit: 'g' as MeasurementUnit
    },
    {
      ingredientId: 'test.cream' as IngredientId,
      amount: 100 as Measurement,
      unit: 'mL' as MeasurementUnit
    },
    {
      ingredientId: 'test.vanilla' as IngredientId,
      amount: 1 as Measurement,
      unit: 'tsp' as MeasurementUnit
    },
    {
      ingredientId: 'test.salt' as IngredientId,
      amount: 1 as Measurement,
      unit: 'pinch' as MeasurementUnit
    }
  ]
};

const fillingWithModifiers: IProducedFillingEntity = {
  variationId: testVariationId,
  scaleFactor: 1.0,
  targetWeight: 300 as Measurement,
  ingredients: [
    {
      ingredientId: 'test.dark-chocolate' as IngredientId,
      amount: 200 as Measurement,
      unit: 'g' as MeasurementUnit
    },
    {
      ingredientId: 'test.vanilla' as IngredientId,
      amount: 1 as Measurement,
      unit: 'tsp' as MeasurementUnit,
      modifiers: { spoonLevel: 'level' }
    },
    {
      ingredientId: 'test.salt' as IngredientId,
      amount: 1 as Measurement,
      unit: 'pinch' as MeasurementUnit,
      modifiers: { toTaste: true }
    }
  ]
};

const fillingWithNotes: IProducedFillingEntity = {
  ...baseProducedFilling,
  notes: [
    { category: 'general' as NoteCategory, note: 'Test note 1' },
    { category: 'warning' as NoteCategory, note: 'Test note 2' }
  ]
};

// ============================================================================
// ProducedFilling Tests
// ============================================================================

describe('ProducedFilling', () => {
  describe('factory methods', () => {
    test('create() succeeds', () => {
      expect(ProducedFilling.create(baseProducedFilling)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.variationId).toBe(testVariationId);
        expect(wrapper.targetWeight).toBe(300 as Measurement);
        expect(wrapper.ingredients).toHaveLength(2);
      });
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const history: Session.ISerializedEditingHistoryEntity<IProducedFillingEntity> = {
        current: baseProducedFilling,
        original: baseProducedFilling,
        undoStack: [
          {
            ...baseProducedFilling,
            targetWeight: 250 as Measurement
          }
        ],
        redoStack: [
          {
            ...baseProducedFilling,
            targetWeight: 350 as Measurement
          }
        ]
      };

      expect(ProducedFilling.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(baseProducedFilling);

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      expect(snapshot.ingredients).toHaveLength(2);
      expect(wrapper.ingredients).toHaveLength(3);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      // Make some changes
      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      wrapper
        .setIngredient('test.sugar' as IngredientId, 25 as Measurement, 'g' as MeasurementUnit)
        .orThrow();

      const snapshot = wrapper.createSnapshot();

      // Make another change and undo it
      wrapper
        .setIngredient('test.vanilla' as IngredientId, 5 as Measurement, 'mL' as MeasurementUnit)
        .orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.canRedo()).toBe(true);

      // Make another change
      wrapper
        .setIngredient('test.cinnamon' as IngredientId, 1 as Measurement, 'tsp' as MeasurementUnit)
        .orThrow();

      // Restore snapshot
      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.ingredients).toHaveLength(4);
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('undo() after a change restores previous state', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      expect(wrapper.ingredients).toHaveLength(3);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.ingredients).toHaveLength(2);
    });

    test('redo() returns false when no redo history', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('redo() after undo restores undone state', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.ingredients).toHaveLength(3);
    });

    test('canUndo() and canRedo() reflect correct states', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(false);

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(true);
    });

    test('history truncation after MAX_HISTORY_SIZE changes', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      // Make 51 changes to exceed MAX_HISTORY_SIZE (50)
      for (let i = 0; i < 51; i++) {
        wrapper
          .setIngredient(
            `test.ingredient-${i}` as IngredientId,
            (10 + i) as Measurement,
            'g' as MeasurementUnit
          )
          .orThrow();
      }

      // Count how many undos are available
      let undoCount = 0;
      while (wrapper.undo().orThrow()) {
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('ingredient management', () => {
    test('setIngredient() adds new ingredient', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(
        wrapper.setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
      ).toSucceed();

      expect(wrapper.ingredients).toHaveLength(3);
      expect(
        wrapper.ingredients.find((i) => i.ingredientId === ('test.butter' as IngredientId))
      ).toBeDefined();
    });

    test('setIngredient() updates existing ingredient', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(
        wrapper.setIngredient(
          'test.dark-chocolate' as IngredientId,
          250 as Measurement,
          'g' as MeasurementUnit
        )
      ).toSucceed();

      expect(wrapper.ingredients).toHaveLength(2);
      const chocolate = wrapper.ingredients.find(
        (i) => i.ingredientId === ('test.dark-chocolate' as IngredientId)
      );
      expect(chocolate?.amount).toBe(250 as Measurement);
    });

    test('setIngredient() fails with non-positive amount', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(
        wrapper.setIngredient('test.butter' as IngredientId, 0 as Measurement, 'g' as MeasurementUnit)
      ).toFailWith(/amount must be positive/i);

      expect(
        wrapper.setIngredient('test.butter' as IngredientId, -10 as Measurement, 'g' as MeasurementUnit)
      ).toFailWith(/amount must be positive/i);
    });

    test('setIngredient() supports modifiers', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      const modifiers: Fillings.IIngredientModifiers = {
        spoonLevel: 'level',
        toTaste: false
      };

      expect(
        wrapper.setIngredient(
          'test.vanilla' as IngredientId,
          1 as Measurement,
          'tsp' as MeasurementUnit,
          modifiers
        )
      ).toSucceed();

      const vanilla = wrapper.ingredients.find((i) => i.ingredientId === ('test.vanilla' as IngredientId));
      expect(vanilla?.modifiers).toEqual(modifiers);
    });

    test('removeIngredient() removes existing ingredient', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.removeIngredient('test.dark-chocolate' as IngredientId)).toSucceed();
      expect(wrapper.ingredients).toHaveLength(1);
      expect(
        wrapper.ingredients.find((i) => i.ingredientId === ('test.dark-chocolate' as IngredientId))
      ).toBeUndefined();
    });

    test('removeIngredient() fails for non-existent ingredient', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.removeIngredient('test.nonexistent' as IngredientId)).toFailWith(/not found/i);
    });
  });

  describe('scaling', () => {
    test('scaleToTargetWeight() scales weight-contributing ingredients', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      // Current weight: 200g + 100mL = 300
      // Scale to 600: factor is 2.0
      expect(wrapper.scaleToTargetWeight(600 as Measurement)).toSucceedWith(600 as Measurement);

      const chocolate = wrapper.ingredients.find(
        (i) => i.ingredientId === ('test.dark-chocolate' as IngredientId)
      );
      const cream = wrapper.ingredients.find((i) => i.ingredientId === ('test.cream' as IngredientId));

      expect(chocolate?.amount).toBe(400 as Measurement);
      expect(cream?.amount).toBe(200 as Measurement);
      expect(wrapper.targetWeight).toBe(600 as Measurement);
    });

    test('scaleToTargetWeight() preserves non-weight-contributing ingredients', () => {
      const wrapper = ProducedFilling.create(fillingWithNonWeightIngredients).orThrow();

      // Current weight: 200g + 100mL = 300 (tsp and pinch not counted)
      // Scale to 600: factor is 2.0
      expect(wrapper.scaleToTargetWeight(600 as Measurement)).toSucceedWith(600 as Measurement);

      const chocolate = wrapper.ingredients.find(
        (i) => i.ingredientId === ('test.dark-chocolate' as IngredientId)
      );
      const cream = wrapper.ingredients.find((i) => i.ingredientId === ('test.cream' as IngredientId));
      const vanilla = wrapper.ingredients.find((i) => i.ingredientId === ('test.vanilla' as IngredientId));
      const salt = wrapper.ingredients.find((i) => i.ingredientId === ('test.salt' as IngredientId));

      // Weight-contributing ingredients scaled
      expect(chocolate?.amount).toBe(400 as Measurement);
      expect(cream?.amount).toBe(200 as Measurement);

      // Non-weight-contributing ingredients unchanged
      expect(vanilla?.amount).toBe(1 as Measurement);
      expect(salt?.amount).toBe(1 as Measurement);
    });

    test('scaleToTargetWeight() fails with non-positive target weight', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.scaleToTargetWeight(0 as Measurement)).toFailWith(/target weight must be positive/i);

      expect(wrapper.scaleToTargetWeight(-100 as Measurement)).toFailWith(/target weight must be positive/i);
    });

    test('scaleToTargetWeight() fails with no weight-contributing ingredients', () => {
      const noWeightIngredients: IProducedFillingEntity = {
        variationId: testVariationId,
        scaleFactor: 1.0,
        targetWeight: 0 as Measurement,
        ingredients: [
          {
            ingredientId: 'test.vanilla' as IngredientId,
            amount: 1 as Measurement,
            unit: 'tsp' as MeasurementUnit
          },
          {
            ingredientId: 'test.salt' as IngredientId,
            amount: 1 as Measurement,
            unit: 'pinch' as MeasurementUnit
          }
        ]
      };

      const wrapper = ProducedFilling.create(noWeightIngredients).orThrow();

      expect(wrapper.scaleToTargetWeight(100 as Measurement)).toFailWith(
        /no weight-contributing ingredients/i
      );
    });
  });

  describe('notes and procedure', () => {
    test('setNotes() sets notes, empty array clears', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'Test note' }
      ];

      expect(wrapper.setNotes(notes)).toSucceed();
      expect(wrapper.snapshot.notes).toEqual(notes);

      expect(wrapper.setNotes([])).toSucceed();
      expect(wrapper.snapshot.notes).toBeUndefined();
    });

    test('setProcedure() sets procedure, undefined clears', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      const procedureId = 'test.procedure-a' as ProcedureId;

      expect(wrapper.setProcedure(procedureId)).toSucceed();
      expect(wrapper.snapshot.procedureId).toBe(procedureId);

      expect(wrapper.setProcedure(undefined)).toSucceed();
      expect(wrapper.snapshot.procedureId).toBeUndefined();
    });
  });

  describe('read-only access', () => {
    test('getters return current values', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.variationId).toBe(testVariationId);
      expect(wrapper.targetWeight).toBe(300 as Measurement);
      expect(wrapper.ingredients).toHaveLength(2);
    });

    test('snapshot property returns deep copy', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();
      const snapshot = wrapper.snapshot;

      expect(snapshot).toEqual(baseProducedFilling);

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      expect(snapshot.ingredients).toHaveLength(2);
    });
  });

  describe('comparison', () => {
    test('hasChanges() false when unchanged, true after change', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      expect(wrapper.hasChanges(baseProducedFilling)).toBe(false);

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();

      expect(wrapper.hasChanges(baseProducedFilling)).toBe(true);
    });

    test('getChanges() returns detailed changes for target weight', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      let changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.hasChanges).toBe(false);

      wrapper.scaleToTargetWeight(600 as Measurement).orThrow();

      changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.hasChanges).toBe(true);
      expect(changes.targetWeightChanged).toBe(true);
      expect(changes.ingredientsChanged).toBe(true);
    });

    test('getChanges() returns detailed changes for ingredients', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();

      const changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.hasChanges).toBe(true);
      expect(changes.ingredientsChanged).toBe(true);
    });

    test('getChanges() returns detailed changes for notes', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper.setNotes([{ category: 'general' as NoteCategory, note: 'Test note' }]).orThrow();

      const changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.hasChanges).toBe(true);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() returns detailed changes for procedure', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper.setProcedure('test.procedure-a' as ProcedureId).orThrow();

      const changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.hasChanges).toBe(true);
      expect(changes.procedureChanged).toBe(true);
    });

    test('getChanges() detects modifier differences', () => {
      const withModifiers = ProducedFilling.create(fillingWithModifiers).orThrow();

      // Create a version without modifiers
      const withoutModifiers: IProducedFillingEntity = {
        ...fillingWithModifiers,
        ingredients: fillingWithModifiers.ingredients.map((ing) => ({
          ...ing,
          modifiers: undefined
        }))
      };

      const changes = withModifiers.getChanges(withoutModifiers);
      expect(changes.ingredientsChanged).toBe(true);
    });

    test('getChanges() detects one-sided undefined modifiers', () => {
      const wrapper1 = ProducedFilling.create(baseProducedFilling).orThrow();

      // Add ingredient with modifiers
      wrapper1
        .setIngredient('test.vanilla' as IngredientId, 1 as Measurement, 'tsp' as MeasurementUnit, {
          spoonLevel: 'level'
        })
        .orThrow();

      // Create version without modifiers
      const wrapper2 = ProducedFilling.create(baseProducedFilling).orThrow();
      wrapper2
        .setIngredient('test.vanilla' as IngredientId, 1 as Measurement, 'tsp' as MeasurementUnit, undefined)
        .orThrow();

      const snapshot2 = wrapper2.snapshot;

      const changes = wrapper1.getChanges(snapshot2);
      expect(changes.ingredientsChanged).toBe(true);
    });

    test('getChanges() detects notes array length difference', () => {
      const wrapper = ProducedFilling.create(fillingWithNotes).orThrow();

      const fewerNotes: IProducedFillingEntity = {
        ...fillingWithNotes,
        notes: [{ category: 'general' as NoteCategory, note: 'Test note 1' }]
      };

      const changes = wrapper.getChanges(fewerNotes);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() detects one-sided undefined notes', () => {
      const wrapper = ProducedFilling.create(fillingWithNotes).orThrow();

      const changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() handles both undefined notes as equal', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      const changes = wrapper.getChanges(baseProducedFilling);
      expect(changes.notesChanged).toBe(false);
    });
  });

  describe('serialization', () => {
    test('getSerializedHistory() captures current/original/stacks', () => {
      const wrapper = ProducedFilling.create(baseProducedFilling).orThrow();

      wrapper
        .setIngredient('test.butter' as IngredientId, 50 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      wrapper
        .setIngredient('test.sugar' as IngredientId, 25 as Measurement, 'g' as MeasurementUnit)
        .orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(baseProducedFilling);

      expect(history.current.ingredients).toHaveLength(3);
      expect(history.original).toEqual(baseProducedFilling);
      expect(history.undoStack).toHaveLength(1);
      expect(history.redoStack).toHaveLength(1);
    });
  });
});
