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
  ConfectionRecipeVariationId,
  FillingId,
  IngredientId,
  Measurement,
  Model as CommonModel,
  MoldId,
  NoteCategory,
  ProcedureId,
  SlotId
} from '../../../../packlets/common';
import {
  Confections,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  Session
} from '../../../../packlets/entities';
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
  yield: { count: 24, unit: 'pieces', weightPerPiece: 10 as Measurement },
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
          { ...moldedBonBonProduced, yield: { count: 12, unit: 'pieces', weightPerPiece: 10 as Measurement } }
        ],
        redoStack: [
          { ...moldedBonBonProduced, yield: { count: 36, unit: 'pieces', weightPerPiece: 10 as Measurement } }
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
});
