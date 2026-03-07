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
  BaseConfectionId,
  BaseIngredientId,
  BaseMoldId,
  CollectionId,
  ConfectionId,
  ConfectionName,
  ConfectionRecipeVariationId,
  ConfectionRecipeVariationSpec,
  FillingId,
  IngredientId,
  Measurement,
  Millimeters,
  MoldFormat,
  Model as CommonModel,
  MoldId,
  NoteCategory,
  Percentage,
  ProcedureId,
  SlotId
} from '../../../../packlets/common';
import {
  Confections,
  ConfectionsLibrary,
  FillingsLibrary,
  IGanacheCharacteristics,
  IChocolateIngredientEntity,
  IIngredientEntity,
  IMoldEntity,
  IngredientsLibrary,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  MoldsLibrary,
  Session
} from '../../../../packlets/entities';
import { ChocolateEntityLibrary, ChocolateLibrary } from '../../../../packlets/library-runtime';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  ProducedBarTruffle,
  ProducedMoldedBonBon,
  ProducedRolledTruffle
} from '../../../../packlets/library-runtime/produced/confectionWrapper';

// ============================================================================
// Test Data
// ============================================================================

const testVariationId = 'test.test-bonbon@2026-01-01-01' as ConfectionRecipeVariationId;

const moldedBonBonProduced: IProducedMoldedBonBonEntity = {
  confectionType: 'molded-bonbon',
  variationId: testVariationId,
  yield: {
    yieldType: 'frames',
    frames: 1,
    bufferPercentage: 0.1,
    count: 24,
    unit: 'pieces',
    weightPerPiece: 10 as Measurement
  },
  moldId: 'test.mold-a' as MoldId,
  shellChocolateId: 'test.dark-chocolate' as IngredientId,
  fillings: [
    {
      slotType: 'recipe' as const,
      slotId: 'center' as SlotId,
      fillingId: 'test.test-ganache' as FillingId
    }
  ]
};

const barTruffleVariationId = 'test.test-bar@2026-01-01-01' as ConfectionRecipeVariationId;
const barTruffleProduced: IProducedBarTruffleEntity = {
  confectionType: 'bar-truffle',
  variationId: barTruffleVariationId,
  yield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement },
  enrobingChocolateId: 'test.dark-chocolate' as IngredientId,
  fillings: [
    {
      slotType: 'recipe' as const,
      slotId: 'center' as SlotId,
      fillingId: 'test.test-ganache' as FillingId
    }
  ]
};

const rolledTruffleVariationId = 'test.test-rolled@2026-01-01-01' as ConfectionRecipeVariationId;
const rolledTruffleProduced: IProducedRolledTruffleEntity = {
  confectionType: 'rolled-truffle',
  variationId: rolledTruffleVariationId,
  yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
  enrobingChocolateId: 'test.dark-chocolate' as IngredientId,
  coatingId: 'test.cocoa-powder' as IngredientId,
  fillings: [
    {
      slotType: 'recipe' as const,
      slotId: 'center' as SlotId,
      fillingId: 'test.test-ganache' as FillingId
    }
  ]
};

// ============================================================================
// ProducedConfectionBase Tests (via ProducedMoldedBonBon)
// ============================================================================

describe('ProducedMoldedBonBon', () => {
  describe('factory methods', () => {
    test('create() succeeds', () => {
      expect(ProducedMoldedBonBon.create(moldedBonBonProduced)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.variationId).toBe(testVariationId);
        expect(wrapper.yield).toEqual(moldedBonBonProduced.yield);
      });
    });

    test('restoreFromHistory() restores with undo/redo stacks', () => {
      const history: Session.ISerializedEditingHistoryEntity<IProducedMoldedBonBonEntity> = {
        current: moldedBonBonProduced,
        original: moldedBonBonProduced,
        undoStack: [
          {
            ...moldedBonBonProduced,
            yield: {
              yieldType: 'frames',
              frames: 1,
              bufferPercentage: 0.1,
              count: 12,
              unit: 'pieces',
              weightPerPiece: 10 as Measurement
            }
          }
        ],
        redoStack: [
          {
            ...moldedBonBonProduced,
            yield: {
              yieldType: 'frames',
              frames: 2,
              bufferPercentage: 0.1,
              count: 36,
              unit: 'pieces',
              weightPerPiece: 10 as Measurement
            }
          }
        ]
      };

      expect(ProducedMoldedBonBon.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(true);
      });
    });
  });

  describe('snapshot management', () => {
    test('createSnapshot() returns deep copy', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();
      const snapshot = wrapper.createSnapshot();

      expect(snapshot).toEqual(moldedBonBonProduced);

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      expect(snapshot.moldId).toBe('test.mold-a' as MoldId);
      expect(wrapper.current.moldId).toBe('test.mold-b' as MoldId);
    });

    test('restoreSnapshot() restores state, pushes undo, clears redo', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      wrapper.setMold('test.mold-c' as MoldId).orThrow();

      const snapshot = wrapper.createSnapshot();

      wrapper.undo().orThrow();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setMold('test.mold-d' as MoldId).orThrow();

      expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
      expect(wrapper.current.moldId).toBe('test.mold-c' as MoldId);
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('undo/redo', () => {
    test('undo() returns false when no history', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('undo() after a change restores previous state', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      expect(wrapper.current.moldId).toBe('test.mold-b' as MoldId);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.current.moldId).toBe('test.mold-a' as MoldId);
    });

    test('redo() returns false when no redo history', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('redo() after undo restores undone state', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      wrapper.undo().orThrow();

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.current.moldId).toBe('test.mold-b' as MoldId);
    });

    test('canUndo() and canRedo() reflect correct states', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);

      wrapper.undo().orThrow();
      expect(wrapper.canUndo()).toBe(false);
      expect(wrapper.canRedo()).toBe(true);
    });

    test('history truncation after MAX_HISTORY_SIZE changes', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      for (let i = 0; i < 51; i++) {
        wrapper.setMold(`test.mold-${i}` as MoldId).orThrow();
      }

      let undoCount = 0;
      while (wrapper.undo().orThrow()) {
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });

  describe('common editing', () => {
    test('setNotes() sets notes, empty array clears', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const notes: CommonModel.ICategorizedNote[] = [
        { category: 'general' as NoteCategory, note: 'Test note' }
      ];

      expect(wrapper.setNotes(notes)).toSucceed();
      expect(wrapper.notes).toEqual(notes);

      expect(wrapper.setNotes([])).toSucceed();
      expect(wrapper.notes).toBeUndefined();
    });

    test('setProcedure() sets procedure, undefined clears', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const procedureId = 'test.procedure-a' as ProcedureId;

      expect(wrapper.setProcedure(procedureId)).toSucceed();
      expect(wrapper.procedureId).toBe(procedureId);

      expect(wrapper.setProcedure(undefined)).toSucceed();
      expect(wrapper.procedureId).toBeUndefined();
    });

    test('scaleToYield() succeeds with valid yield', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const newYield: Confections.IConfectionYield = {
        count: 48,
        unit: 'pieces',
        weightPerPiece: 10 as Measurement
      };

      expect(wrapper.scaleToYield(newYield)).toSucceedWith(newYield);
      expect(wrapper.yield).toEqual(newYield);
    });

    test('scaleToYield() fails with non-positive count', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const invalidYield: Confections.IConfectionYield = {
        count: 0,
        unit: 'pieces',
        weightPerPiece: 10 as Measurement
      };

      expect(wrapper.scaleToYield(invalidYield)).toFailWith(/count must be positive/i);
    });

    test('scaleToYield() fails with non-positive weightPerPiece', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const invalidYield: Confections.IConfectionYield = {
        count: 24,
        unit: 'pieces',
        weightPerPiece: -5 as Measurement
      };

      expect(wrapper.scaleToYield(invalidYield)).toFailWith(/weight per piece must be positive/i);
    });

    test('setFillingSlot() adds new slot and updates existing', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(
        wrapper.setFillingSlot('topping' as SlotId, {
          type: 'recipe',
          fillingId: 'test.caramel' as FillingId
        })
      ).toSucceed();

      expect(wrapper.fillings).toHaveLength(2);
      expect(wrapper.fillings?.find((s) => s.slotId === ('topping' as SlotId))).toBeDefined();

      expect(
        wrapper.setFillingSlot('center' as SlotId, {
          type: 'recipe',
          fillingId: 'test.new-ganache' as FillingId
        })
      ).toSucceed();

      expect(wrapper.fillings).toHaveLength(2);
      const centerSlot = wrapper.fillings?.find((s) => s.slotId === ('center' as SlotId));
      expect(centerSlot?.slotType).toBe('recipe');
      if (centerSlot?.slotType === 'recipe') {
        expect(centerSlot.fillingId).toBe('test.new-ganache' as FillingId);
      }
    });

    test('setFillingSlot() supports ingredient slots', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(
        wrapper.setFillingSlot('coating' as SlotId, {
          type: 'ingredient',
          ingredientId: 'test.cocoa-powder' as IngredientId
        })
      ).toSucceed();

      const coatingSlot = wrapper.fillings?.find((s) => s.slotId === ('coating' as SlotId));
      expect(coatingSlot?.slotType).toBe('ingredient');
      if (coatingSlot?.slotType === 'ingredient') {
        expect(coatingSlot.ingredientId).toBe('test.cocoa-powder' as IngredientId);
      }
    });
  });

  describe('filling management', () => {
    test('removeFillingSlot() removes existing slot', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.removeFillingSlot('center' as SlotId)).toSucceed();
      expect(wrapper.fillings).toBeUndefined();
    });

    test('removeFillingSlot() fails for non-existent slot', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.removeFillingSlot('nonexistent' as SlotId)).toFailWith(/not found/i);
    });

    test('removeFillingSlot() fails when no fillings defined', () => {
      const noFillings = { ...moldedBonBonProduced, fillings: undefined };
      const wrapper = ProducedMoldedBonBon.create(noFillings).orThrow();

      expect(wrapper.removeFillingSlot('center' as SlotId)).toFailWith(/no fillings defined/i);
    });
  });

  describe('read-only access', () => {
    test('getters return current values', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.variationId).toBe(testVariationId);
      expect(wrapper.yield).toEqual(moldedBonBonProduced.yield);
      expect(wrapper.fillings).toEqual(moldedBonBonProduced.fillings);
      expect(wrapper.notes).toBeUndefined();
      expect(wrapper.current).toEqual(moldedBonBonProduced);
      expect(wrapper.procedureId).toBeUndefined();
    });

    test('snapshot property returns deep copy', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();
      const snapshot = wrapper.snapshot;

      expect(snapshot).toEqual(moldedBonBonProduced);

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      expect(snapshot.moldId).toBe('test.mold-a' as MoldId);
    });
  });

  describe('comparison', () => {
    test('hasChanges() false when unchanged, true after change', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.hasChanges(moldedBonBonProduced)).toBe(false);

      wrapper.setMold('test.mold-b' as MoldId).orThrow();

      expect(wrapper.hasChanges(moldedBonBonProduced)).toBe(true);
    });

    test('getChanges() returns detailed changes', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      let changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.hasChanges).toBe(false);

      wrapper.setMold('test.mold-b' as MoldId).orThrow();

      changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.hasChanges).toBe(true);
      expect(changes.moldChanged).toBe(true);
      expect(changes.shellChocolateChanged).toBe(false);
    });
  });

  describe('serialization', () => {
    test('getSerializedHistory() captures current/original/stacks', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      wrapper.setMold('test.mold-c' as MoldId).orThrow();
      wrapper.undo().orThrow();

      const history = wrapper.getSerializedHistory(moldedBonBonProduced);

      expect(history.current.moldId).toBe('test.mold-b' as MoldId);
      expect(history.original).toEqual(moldedBonBonProduced);
      expect(history.undoStack).toHaveLength(1);
      expect(history.redoStack).toHaveLength(1);
    });
  });

  describe('ProducedMoldedBonBon-specific', () => {
    test('setMold() changes mold', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.setMold('test.mold-b' as MoldId)).toSucceed();
      expect(wrapper.moldId).toBe('test.mold-b' as MoldId);
    });

    test('setShellChocolate() changes shell chocolate', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.setShellChocolate('test.milk-chocolate' as IngredientId)).toSucceed();
      expect(wrapper.shellChocolateId).toBe('test.milk-chocolate' as IngredientId);
    });

    test('setSealChocolate() sets and clears seal chocolate', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.setSealChocolate('test.white-chocolate' as IngredientId)).toSucceed();
      expect(wrapper.sealChocolateId).toBe('test.white-chocolate' as IngredientId);

      expect(wrapper.setSealChocolate(undefined)).toSucceed();
      expect(wrapper.sealChocolateId).toBeUndefined();
    });

    test('setDecorationChocolate() sets and clears decoration chocolate', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      expect(wrapper.setDecorationChocolate('test.ruby-chocolate' as IngredientId)).toSucceed();
      expect(wrapper.decorationChocolateId).toBe('test.ruby-chocolate' as IngredientId);

      expect(wrapper.setDecorationChocolate(undefined)).toSucceed();
      expect(wrapper.decorationChocolateId).toBeUndefined();
    });

    test('getChanges() detects mold/shell/seal/decoration changes', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      wrapper.setShellChocolate('test.milk-chocolate' as IngredientId).orThrow();
      wrapper.setSealChocolate('test.white-chocolate' as IngredientId).orThrow();
      wrapper.setDecorationChocolate('test.ruby-chocolate' as IngredientId).orThrow();

      const changes = wrapper.getChanges(moldedBonBonProduced);

      expect(changes.moldChanged).toBe(true);
      expect(changes.shellChocolateChanged).toBe(true);
      expect(changes.sealChocolateChanged).toBe(true);
      expect(changes.decorationChocolateChanged).toBe(true);
      expect(changes.enrobingChocolateChanged).toBe(false);
      expect(changes.coatingChanged).toBe(false);
    });

    test('getChanges() detects filling changes - both undefined', () => {
      const noFillings = { ...moldedBonBonProduced, fillings: undefined };
      const wrapper = ProducedMoldedBonBon.create(noFillings).orThrow();

      const changes = wrapper.getChanges(noFillings);
      expect(changes.fillingsChanged).toBe(false);
    });

    test('getChanges() detects filling changes - one undefined', () => {
      const noFillings = { ...moldedBonBonProduced, fillings: undefined };
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const changes = wrapper.getChanges(noFillings);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - length mismatch', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper
        .setFillingSlot('topping' as SlotId, {
          type: 'recipe',
          fillingId: 'test.caramel' as FillingId
        })
        .orThrow();

      const changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - slot content differs', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper
        .setFillingSlot('center' as SlotId, {
          type: 'recipe',
          fillingId: 'test.new-ganache' as FillingId
        })
        .orThrow();

      const changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - slotId mismatch', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const modifiedSnapshot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'recipe' as const,
            slotId: 'different' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      };

      const changes = wrapper.getChanges(modifiedSnapshot);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - slotType mismatch', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const modifiedSnapshot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'ingredient' as const,
            slotId: 'center' as SlotId,
            ingredientId: 'test.cocoa-powder' as IngredientId
          }
        ]
      };

      const changes = wrapper.getChanges(modifiedSnapshot);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - recipe fillingId differs', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const modifiedSnapshot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'recipe' as const,
            slotId: 'center' as SlotId,
            fillingId: 'test.different-ganache' as FillingId
          }
        ]
      };

      const changes = wrapper.getChanges(modifiedSnapshot);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects filling changes - ingredient ingredientId differs', () => {
      const withIngredient: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'ingredient' as const,
            slotId: 'center' as SlotId,
            ingredientId: 'test.cocoa-powder' as IngredientId
          }
        ]
      };
      const wrapper = ProducedMoldedBonBon.create(withIngredient).orThrow();

      const modifiedSnapshot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'ingredient' as const,
            slotId: 'center' as SlotId,
            ingredientId: 'test.different-powder' as IngredientId
          }
        ]
      };

      const changes = wrapper.getChanges(modifiedSnapshot);
      expect(changes.fillingsChanged).toBe(true);
    });

    test('getChanges() detects notes changes - both undefined', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      const changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.notesChanged).toBe(false);
    });

    test('getChanges() detects notes changes - one undefined', () => {
      const wrapper = ProducedMoldedBonBon.create(moldedBonBonProduced).orThrow();

      wrapper.setNotes([{ category: 'general' as NoteCategory, note: 'Test note' }]).orThrow();

      const changes = wrapper.getChanges(moldedBonBonProduced);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() detects notes changes - length mismatch', () => {
      const withNotes: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        notes: [{ category: 'general' as NoteCategory, note: 'Test note' }]
      };
      const wrapper = ProducedMoldedBonBon.create(withNotes).orThrow();

      wrapper
        .setNotes([
          { category: 'general' as NoteCategory, note: 'Test note' },
          { category: 'production' as NoteCategory, note: 'Another note' }
        ])
        .orThrow();

      const changes = wrapper.getChanges(withNotes);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() detects notes changes - content differs', () => {
      const withNotes: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        notes: [{ category: 'general' as NoteCategory, note: 'Test note' }]
      };
      const wrapper = ProducedMoldedBonBon.create(withNotes).orThrow();

      wrapper.setNotes([{ category: 'general' as NoteCategory, note: 'Different note' }]).orThrow();

      const changes = wrapper.getChanges(withNotes);
      expect(changes.notesChanged).toBe(true);
    });

    test('getChanges() compares notes by sorted order', () => {
      const withNotes: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        notes: [
          { category: 'general' as NoteCategory, note: 'First note' },
          { category: 'production' as NoteCategory, note: 'Second note' }
        ]
      };
      const wrapper = ProducedMoldedBonBon.create(withNotes).orThrow();

      // Same notes, different order - should be equal after sorting
      const reorderedSnapshot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        notes: [
          { category: 'production' as NoteCategory, note: 'Second note' },
          { category: 'general' as NoteCategory, note: 'First note' }
        ]
      };

      const changes = wrapper.getChanges(reorderedSnapshot);
      expect(changes.notesChanged).toBe(false);
    });
  });

  describe('optional fields - fillings undefined', () => {
    test('setFillingSlot() on confection with no fillings creates new array', () => {
      const noFillings = { ...moldedBonBonProduced, fillings: undefined };
      const wrapper = ProducedMoldedBonBon.create(noFillings).orThrow();

      expect(wrapper.fillings).toBeUndefined();

      expect(
        wrapper.setFillingSlot('center' as SlotId, {
          type: 'recipe',
          fillingId: 'test.test-ganache' as FillingId
        })
      ).toSucceed();

      expect(wrapper.fillings).toHaveLength(1);
      expect(wrapper.fillings![0].slotId).toBe('center' as SlotId);
    });

    test('removeFillingSlot() on last slot sets fillings to undefined', () => {
      const oneSlot: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: [
          {
            slotType: 'recipe' as const,
            slotId: 'only-slot' as SlotId,
            fillingId: 'test.test-ganache' as FillingId
          }
        ]
      };
      const wrapper = ProducedMoldedBonBon.create(oneSlot).orThrow();

      expect(wrapper.removeFillingSlot('only-slot' as SlotId)).toSucceed();
      expect(wrapper.fillings).toBeUndefined();
    });
  });

  describe('optional fields - undo/redo with no fillings/notes', () => {
    test('undo/redo on confection with no fillings exercises _deepCopy', () => {
      const minimal: IProducedMoldedBonBonEntity = {
        ...moldedBonBonProduced,
        fillings: undefined,
        notes: undefined
      };
      const wrapper = ProducedMoldedBonBon.create(minimal).orThrow();

      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      expect(wrapper.moldId).toBe('test.mold-b' as MoldId);

      wrapper.undo().orThrow();
      expect(wrapper.moldId).toBe('test.mold-a' as MoldId);

      wrapper.redo().orThrow();
      expect(wrapper.moldId).toBe('test.mold-b' as MoldId);
    });
  });

  describe('optional fields - fromSource without optional chocolates/fillings', () => {
    test('fromSource() with no fillings and no additionalChocolates', () => {
      const minimal: IProducedMoldedBonBonEntity = {
        confectionType: 'molded-bonbon',
        variationId: 'test.minimal-bonbon@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: {
          yieldType: 'frames',
          frames: 1,
          bufferPercentage: 0.1,
          count: 24,
          unit: 'pieces',
          weightPerPiece: 10 as Measurement
        },
        moldId: 'test.mold-a' as MoldId,
        shellChocolateId: 'test.dark-chocolate' as IngredientId
      };

      const wrapper = ProducedMoldedBonBon.create(minimal).orThrow();
      expect(wrapper.fillings).toBeUndefined();
      expect(wrapper.sealChocolateId).toBeUndefined();
      expect(wrapper.decorationChocolateId).toBeUndefined();

      // Exercise undo/redo to trigger _deepCopy
      wrapper.setMold('test.mold-b' as MoldId).orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.fillings).toBeUndefined();
    });
  });
});

// ============================================================================
// ProducedBarTruffle Tests
// ============================================================================

describe('ProducedBarTruffle', () => {
  test('create() succeeds', () => {
    expect(ProducedBarTruffle.create(barTruffleProduced)).toSucceedAndSatisfy((wrapper) => {
      expect(wrapper.variationId).toBe(barTruffleVariationId);
      expect(wrapper.yield).toEqual(barTruffleProduced.yield);
    });
  });

  test('setEnrobingChocolate() sets and clears enrobing chocolate', () => {
    const wrapper = ProducedBarTruffle.create(barTruffleProduced).orThrow();

    expect(wrapper.setEnrobingChocolate('test.milk-chocolate' as IngredientId)).toSucceed();
    expect(wrapper.enrobingChocolateId).toBe('test.milk-chocolate' as IngredientId);

    expect(wrapper.setEnrobingChocolate(undefined)).toSucceed();
    expect(wrapper.enrobingChocolateId).toBeUndefined();
  });

  test('getChanges() detects enrobing chocolate change', () => {
    const wrapper = ProducedBarTruffle.create(barTruffleProduced).orThrow();

    wrapper.setEnrobingChocolate('test.milk-chocolate' as IngredientId).orThrow();

    const changes = wrapper.getChanges(barTruffleProduced);

    expect(changes.enrobingChocolateChanged).toBe(true);
    expect(changes.moldChanged).toBe(false);
    expect(changes.shellChocolateChanged).toBe(false);
    expect(changes.coatingChanged).toBe(false);
  });

  describe('optional fields - no fillings/enrobing/procedure', () => {
    test('undo/redo on bar truffle with no fillings/notes exercises _deepCopy', () => {
      const minimal: IProducedBarTruffleEntity = {
        confectionType: 'bar-truffle',
        variationId: 'test.minimal-bar@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement }
      };

      const wrapper = ProducedBarTruffle.create(minimal).orThrow();
      expect(wrapper.fillings).toBeUndefined();
      expect(wrapper.enrobingChocolateId).toBeUndefined();
      expect(wrapper.notes).toBeUndefined();

      wrapper.setEnrobingChocolate('test.dark-chocolate' as IngredientId).orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.enrobingChocolateId).toBeUndefined();

      wrapper.redo().orThrow();
      expect(wrapper.enrobingChocolateId).toBe('test.dark-chocolate' as IngredientId);
    });

    test('create() with all optional fields undefined', () => {
      const minimal: IProducedBarTruffleEntity = {
        confectionType: 'bar-truffle',
        variationId: 'test.minimal-bar-2@2026-01-01-02' as ConfectionRecipeVariationId,
        yield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement },
        fillings: undefined,
        enrobingChocolateId: undefined,
        procedureId: undefined,
        notes: undefined
      };

      expect(ProducedBarTruffle.create(minimal)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.fillings).toBeUndefined();
        expect(wrapper.enrobingChocolateId).toBeUndefined();
        expect(wrapper.procedureId).toBeUndefined();
        expect(wrapper.notes).toBeUndefined();
      });
    });
  });

  test('undo/redo with notes exercises _deepCopy notes branch', () => {
    const withNotes: IProducedBarTruffleEntity = {
      ...barTruffleProduced,
      notes: [{ category: 'general' as NoteCategory, note: 'Bar note' }]
    };
    const wrapper = ProducedBarTruffle.create(withNotes).orThrow();
    expect(wrapper.notes).toHaveLength(1);

    wrapper.setEnrobingChocolate('test.milk-chocolate' as IngredientId).orThrow();
    wrapper.undo().orThrow();
    expect(wrapper.notes).toHaveLength(1);
    expect(wrapper.notes![0].note).toBe('Bar note');
  });
});

// ============================================================================
// ProducedRolledTruffle Tests
// ============================================================================

describe('ProducedRolledTruffle', () => {
  test('create() succeeds', () => {
    expect(ProducedRolledTruffle.create(rolledTruffleProduced)).toSucceedAndSatisfy((wrapper) => {
      expect(wrapper.variationId).toBe(rolledTruffleVariationId);
      expect(wrapper.yield).toEqual(rolledTruffleProduced.yield);
    });
  });

  test('setEnrobingChocolate() and setCoating() set and clear', () => {
    const wrapper = ProducedRolledTruffle.create(rolledTruffleProduced).orThrow();

    expect(wrapper.setEnrobingChocolate('test.milk-chocolate' as IngredientId)).toSucceed();
    expect(wrapper.enrobingChocolateId).toBe('test.milk-chocolate' as IngredientId);

    expect(wrapper.setCoating('test.powdered-sugar' as IngredientId)).toSucceed();
    expect(wrapper.coatingId).toBe('test.powdered-sugar' as IngredientId);

    expect(wrapper.setEnrobingChocolate(undefined)).toSucceed();
    expect(wrapper.enrobingChocolateId).toBeUndefined();

    expect(wrapper.setCoating(undefined)).toSucceed();
    expect(wrapper.coatingId).toBeUndefined();
  });

  test('getChanges() detects enrobing and coating changes', () => {
    const wrapper = ProducedRolledTruffle.create(rolledTruffleProduced).orThrow();

    wrapper.setEnrobingChocolate('test.milk-chocolate' as IngredientId).orThrow();
    wrapper.setCoating('test.powdered-sugar' as IngredientId).orThrow();

    const changes = wrapper.getChanges(rolledTruffleProduced);

    expect(changes.enrobingChocolateChanged).toBe(true);
    expect(changes.coatingChanged).toBe(true);
    expect(changes.moldChanged).toBe(false);
    expect(changes.shellChocolateChanged).toBe(false);
  });

  test('getChanges() detects only coating change without enrobing change', () => {
    const wrapper = ProducedRolledTruffle.create(rolledTruffleProduced).orThrow();

    wrapper.setCoating('test.powdered-sugar' as IngredientId).orThrow();

    const changes = wrapper.getChanges(rolledTruffleProduced);

    expect(changes.hasChanges).toBe(true);
    expect(changes.coatingChanged).toBe(true);
    expect(changes.enrobingChocolateChanged).toBe(false);
  });

  describe('optional fields - no fillings/enrobing/coating', () => {
    test('undo/redo on rolled truffle with no fillings/notes exercises _deepCopy', () => {
      const minimal: IProducedRolledTruffleEntity = {
        confectionType: 'rolled-truffle',
        variationId: 'test.minimal-rolled@2026-01-01-01' as ConfectionRecipeVariationId,
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement }
      };

      const wrapper = ProducedRolledTruffle.create(minimal).orThrow();
      expect(wrapper.fillings).toBeUndefined();
      expect(wrapper.enrobingChocolateId).toBeUndefined();
      expect(wrapper.coatingId).toBeUndefined();
      expect(wrapper.notes).toBeUndefined();

      wrapper.setCoating('test.cocoa-powder' as IngredientId).orThrow();
      wrapper.undo().orThrow();
      expect(wrapper.coatingId).toBeUndefined();

      wrapper.redo().orThrow();
      expect(wrapper.coatingId).toBe('test.cocoa-powder' as IngredientId);
    });

    test('create() with all optional fields undefined', () => {
      const minimal: IProducedRolledTruffleEntity = {
        confectionType: 'rolled-truffle',
        variationId: 'test.minimal-rolled-2@2026-01-01-02' as ConfectionRecipeVariationId,
        yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
        fillings: undefined,
        enrobingChocolateId: undefined,
        coatingId: undefined,
        procedureId: undefined,
        notes: undefined
      };

      expect(ProducedRolledTruffle.create(minimal)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.fillings).toBeUndefined();
        expect(wrapper.enrobingChocolateId).toBeUndefined();
        expect(wrapper.coatingId).toBeUndefined();
        expect(wrapper.procedureId).toBeUndefined();
        expect(wrapper.notes).toBeUndefined();
      });
    });
  });

  test('undo/redo with notes exercises _deepCopy notes branch', () => {
    const withNotes: IProducedRolledTruffleEntity = {
      ...rolledTruffleProduced,
      notes: [{ category: 'general' as NoteCategory, note: 'Rolled note' }]
    };
    const wrapper = ProducedRolledTruffle.create(withNotes).orThrow();
    expect(wrapper.notes).toHaveLength(1);

    wrapper.setCoating('test.powdered-sugar' as IngredientId).orThrow();
    wrapper.undo().orThrow();
    expect(wrapper.notes).toHaveLength(1);
    expect(wrapper.notes![0].note).toBe('Rolled note');
  });
});

// ============================================================================
// Ingredient-Type Filling Slot Tests
// ============================================================================

describe('Ingredient-type filling slot conversion', () => {
  test('ProducedMoldedBonBon.fromSource() converts ingredient-type filling slot', () => {
    const cocoaChars: IGanacheCharacteristics = {
      cacaoFat: 10 as Percentage,
      sugar: 5 as Percentage,
      milkFat: 0 as Percentage,
      water: 2 as Percentage,
      solids: 83 as Percentage,
      otherFats: 0 as Percentage
    };

    const testChars: IGanacheCharacteristics = {
      cacaoFat: 36 as Percentage,
      sugar: 34 as Percentage,
      milkFat: 0 as Percentage,
      water: 1 as Percentage,
      solids: 29 as Percentage,
      otherFats: 0 as Percentage
    };

    const cocoaPowder: IIngredientEntity = {
      baseId: 'cocoa-powder' as BaseIngredientId,
      name: 'Cocoa Powder',
      category: 'other',
      ganacheCharacteristics: cocoaChars
    };

    const darkChocolate: IChocolateIngredientEntity = {
      baseId: 'dark-chocolate' as BaseIngredientId,
      name: 'Dark Chocolate 70%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 70 as Percentage,
      ganacheCharacteristics: testChars
    };

    const moldA: IMoldEntity = {
      baseId: 'mold-a' as BaseMoldId,
      manufacturer: 'Test Molds',
      productNumber: 'TM-001',
      name: 'Test mold A',
      cavities: { kind: 'count', count: 24, info: { weight: 10 as Measurement } },
      format: 'other' as MoldFormat
    };

    const ingredientFillingConfection: Confections.MoldedBonBonRecipeEntity = {
      baseId: 'ingredient-filling-bonbon' as BaseConfectionId,
      confectionType: 'molded-bonbon',
      name: 'Cocoa Dusted Bonbon' as ConfectionName,
      goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      variations: [
        {
          variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
          createdDate: '2026-01-01',
          yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
          fillings: [
            {
              slotId: 'coating' as SlotId,
              name: 'Cocoa Coating',
              filling: {
                options: [{ type: 'ingredient' as const, id: 'test.cocoa-powder' as IngredientId }],
                preferredId: 'test.cocoa-powder' as Confections.FillingOptionId
              }
            }
          ],
          molds: {
            options: [{ id: 'test.mold-a' as MoldId }],
            preferredId: 'test.mold-a' as MoldId
          },
          shellChocolate: {
            ids: ['test.dark-chocolate' as IngredientId],
            preferredId: 'test.dark-chocolate' as IngredientId
          }
        }
      ]
    };

    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'cocoa-powder': cocoaPowder,
            'dark-chocolate': darkChocolate
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: []
    }).orThrow();

    const molds = MoldsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'mold-a': moldA
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'ingredient-filling-bonbon': ingredientFillingConfection
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, molds, confections }
    }).orThrow();

    const chocolateLib = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();

    const confection = chocolateLib.confections
      .get('test.ingredient-filling-bonbon' as ConfectionId)
      .orThrow();

    expect(confection.isMoldedBonBon()).toBe(true);
    if (!confection.isMoldedBonBon()) {
      throw new Error('Expected molded bonbon');
    }

    const variation = confection.goldenVariation;

    expect(ProducedMoldedBonBon.fromSource(variation)).toSucceedAndSatisfy((produced) => {
      expect(produced.fillings).toHaveLength(1);
      const slot = produced.fillings![0];
      expect(slot.slotType).toBe('ingredient');
      if (slot.slotType === 'ingredient') {
        expect(slot.ingredientId).toBe('test.cocoa-powder' as IngredientId);
        expect(slot.slotId).toBe('coating' as SlotId);
      }
    });
  });

  test('ProducedBarTruffle.fromSource() converts ingredient-type filling slot', () => {
    const cocoaChars: IGanacheCharacteristics = {
      cacaoFat: 10 as Percentage,
      sugar: 5 as Percentage,
      milkFat: 0 as Percentage,
      water: 2 as Percentage,
      solids: 83 as Percentage,
      otherFats: 0 as Percentage
    };

    const testChars: IGanacheCharacteristics = {
      cacaoFat: 36 as Percentage,
      sugar: 34 as Percentage,
      milkFat: 0 as Percentage,
      water: 1 as Percentage,
      solids: 29 as Percentage,
      otherFats: 0 as Percentage
    };

    const cocoaPowder: IIngredientEntity = {
      baseId: 'cocoa-powder' as BaseIngredientId,
      name: 'Cocoa Powder',
      category: 'other',
      ganacheCharacteristics: cocoaChars
    };

    const darkChocolate: IChocolateIngredientEntity = {
      baseId: 'dark-chocolate' as BaseIngredientId,
      name: 'Dark Chocolate 70%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 70 as Percentage,
      ganacheCharacteristics: testChars
    };

    const ingredientFillingBarTruffle: Confections.BarTruffleRecipeEntity = {
      baseId: 'ingredient-filling-bar' as BaseConfectionId,
      confectionType: 'bar-truffle',
      name: 'Cocoa Dusted Bar' as ConfectionName,
      goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      variations: [
        {
          variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
          createdDate: '2026-01-01',
          yield: { count: 48, unit: 'pieces', weightPerPiece: 10 as Measurement },
          frameDimensions: { width: 300 as Millimeters, height: 200 as Millimeters, depth: 8 as Millimeters },
          singleBonBonDimensions: { width: 25 as Millimeters, height: 25 as Millimeters },
          fillings: [
            {
              slotId: 'coating' as SlotId,
              name: 'Cocoa Coating',
              filling: {
                options: [{ type: 'ingredient' as const, id: 'test.cocoa-powder' as IngredientId }],
                preferredId: 'test.cocoa-powder' as Confections.FillingOptionId
              }
            }
          ],
          enrobingChocolate: {
            ids: ['test.dark-chocolate' as IngredientId],
            preferredId: 'test.dark-chocolate' as IngredientId
          }
        }
      ]
    };

    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'cocoa-powder': cocoaPowder,
            'dark-chocolate': darkChocolate
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: []
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'ingredient-filling-bar': ingredientFillingBarTruffle
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, confections }
    }).orThrow();

    const chocolateLib = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();

    const confection = chocolateLib.confections.get('test.ingredient-filling-bar' as ConfectionId).orThrow();

    expect(confection.isBarTruffle()).toBe(true);
    if (!confection.isBarTruffle()) {
      throw new Error('Expected bar truffle');
    }

    const variation = confection.goldenVariation;

    expect(ProducedBarTruffle.fromSource(variation)).toSucceedAndSatisfy((produced) => {
      expect(produced.fillings).toHaveLength(1);
      const slot = produced.fillings![0];
      expect(slot.slotType).toBe('ingredient');
      if (slot.slotType === 'ingredient') {
        expect(slot.ingredientId).toBe('test.cocoa-powder' as IngredientId);
        expect(slot.slotId).toBe('coating' as SlotId);
      }
    });
  });

  test('ProducedRolledTruffle.fromSource() converts ingredient-type filling slot', () => {
    const cocoaChars: IGanacheCharacteristics = {
      cacaoFat: 10 as Percentage,
      sugar: 5 as Percentage,
      milkFat: 0 as Percentage,
      water: 2 as Percentage,
      solids: 83 as Percentage,
      otherFats: 0 as Percentage
    };

    const testChars: IGanacheCharacteristics = {
      cacaoFat: 36 as Percentage,
      sugar: 34 as Percentage,
      milkFat: 0 as Percentage,
      water: 1 as Percentage,
      solids: 29 as Percentage,
      otherFats: 0 as Percentage
    };

    const cocoaPowder: IIngredientEntity = {
      baseId: 'cocoa-powder' as BaseIngredientId,
      name: 'Cocoa Powder',
      category: 'other',
      ganacheCharacteristics: cocoaChars
    };

    const darkChocolate: IChocolateIngredientEntity = {
      baseId: 'dark-chocolate' as BaseIngredientId,
      name: 'Dark Chocolate 70%',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 70 as Percentage,
      ganacheCharacteristics: testChars
    };

    const ingredientFillingRolledTruffle: Confections.RolledTruffleRecipeEntity = {
      baseId: 'ingredient-filling-rolled' as BaseConfectionId,
      confectionType: 'rolled-truffle',
      name: 'Cocoa Dusted Rolled' as ConfectionName,
      goldenVariationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
      variations: [
        {
          variationSpec: '2026-01-01-01' as ConfectionRecipeVariationSpec,
          createdDate: '2026-01-01',
          yield: { count: 40, unit: 'pieces', weightPerPiece: 15 as Measurement },
          fillings: [
            {
              slotId: 'dusting' as SlotId,
              name: 'Cocoa Dusting',
              filling: {
                options: [{ type: 'ingredient' as const, id: 'test.cocoa-powder' as IngredientId }],
                preferredId: 'test.cocoa-powder' as Confections.FillingOptionId
              }
            }
          ],
          enrobingChocolate: {
            ids: ['test.dark-chocolate' as IngredientId],
            preferredId: 'test.dark-chocolate' as IngredientId
          },
          coatings: {
            ids: ['test.cocoa-powder' as IngredientId],
            preferredId: 'test.cocoa-powder' as IngredientId
          }
        }
      ]
    };

    const ingredients = IngredientsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'cocoa-powder': cocoaPowder,
            'dark-chocolate': darkChocolate
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const fillings = FillingsLibrary.create({
      builtin: false,
      collections: []
    }).orThrow();

    const confections = ConfectionsLibrary.create({
      builtin: false,
      collections: [
        {
          id: 'test' as CollectionId,
          isMutable: false,
          items: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'ingredient-filling-rolled': ingredientFillingRolledTruffle
            /* eslint-enable @typescript-eslint/naming-convention */
          }
        }
      ]
    }).orThrow();

    const library = ChocolateEntityLibrary.create({
      builtin: false,
      libraries: { ingredients, fillings, confections }
    }).orThrow();

    const chocolateLib = ChocolateLibrary.fromChocolateEntityLibrary(library).orThrow();

    const confection = chocolateLib.confections
      .get('test.ingredient-filling-rolled' as ConfectionId)
      .orThrow();

    expect(confection.isRolledTruffle()).toBe(true);
    if (!confection.isRolledTruffle()) {
      throw new Error('Expected rolled truffle');
    }

    const variation = confection.goldenVariation;

    expect(ProducedRolledTruffle.fromSource(variation)).toSucceedAndSatisfy((produced) => {
      expect(produced.fillings).toHaveLength(1);
      const slot = produced.fillings![0];
      expect(slot.slotType).toBe('ingredient');
      if (slot.slotType === 'ingredient') {
        expect(slot.ingredientId).toBe('test.cocoa-powder' as IngredientId);
        expect(slot.slotId).toBe('dusting' as SlotId);
      }
    });
  });
});
