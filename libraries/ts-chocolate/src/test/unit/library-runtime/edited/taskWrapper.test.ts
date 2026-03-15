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

import { BaseTaskId, Celsius, Minutes, Model as CommonModel } from '../../../../packlets/common';
import { Tasks, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedTask } from '../../../../packlets/library-runtime/edited/taskWrapper';

// ============================================================================
// Test Data
// ============================================================================

type IRawTaskEntity = Tasks.IRawTaskEntity;

const baseTask: IRawTaskEntity = {
  baseId: 'melt-chocolate' as BaseTaskId,
  name: 'Melt Chocolate',
  template: 'Melt {{ingredient}} at {{temperature}}°C'
};

const fullTask: IRawTaskEntity = {
  ...baseTask,
  defaultActiveTime: 15 as Minutes,
  defaultWaitTime: 30 as Minutes,
  defaultHoldTime: 60 as Minutes,
  defaultTemperature: 45 as Celsius,
  tags: ['melting', 'prep'],
  notes: [{ category: 'user' as never, note: 'Stir gently' }],
  defaults: { ingredient: 'dark chocolate', temperature: '45' }
};

// ============================================================================
// Tests
// ============================================================================

describe('EditedTask', () => {
  describe('create', () => {
    test('creates from a minimal entity', () => {
      expect(EditedTask.create(baseTask)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.current.baseId).toBe(baseTask.baseId);
        expect(wrapper.current.name).toBe(baseTask.name);
        expect(wrapper.current.template).toBe(baseTask.template);
      });
    });

    test('creates from a fully-populated entity', () => {
      expect(EditedTask.create(fullTask)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.current.defaultActiveTime).toBe(15);
        expect(wrapper.current.defaultWaitTime).toBe(30);
        expect(wrapper.current.defaultHoldTime).toBe(60);
        expect(wrapper.current.defaultTemperature).toBe(45);
        expect(wrapper.current.tags).toEqual(['melting', 'prep']);
        expect(wrapper.current.notes).toEqual(fullTask.notes);
        expect(wrapper.current.defaults).toEqual(fullTask.defaults);
      });
    });

    test('deep copies the initial entity', () => {
      const mutable = { ...fullTask, tags: ['a', 'b'] };
      expect(EditedTask.create(mutable)).toSucceedAndSatisfy((wrapper) => {
        mutable.tags = ['changed'];
        expect(wrapper.current.tags).toEqual(['a', 'b']);
      });
    });
  });

  describe('property accessors', () => {
    test('name returns current name', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.name).toBe('Melt Chocolate');
    });

    test('template returns current template', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.template).toBe('Melt {{ingredient}} at {{temperature}}°C');
    });
  });

  describe('editing methods', () => {
    test('setName updates the name', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setName('Temper Chocolate')).toSucceed();
      expect(wrapper.name).toBe('Temper Chocolate');
    });

    test('setTemplate updates the template', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setTemplate('New template {{var}}')).toSucceed();
      expect(wrapper.template).toBe('New template {{var}}');
    });

    test('setDefaultActiveTime updates the value', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setDefaultActiveTime(20 as Minutes)).toSucceed();
      expect(wrapper.current.defaultActiveTime).toBe(20);
    });

    test('setDefaultActiveTime clears with undefined', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      expect(wrapper.setDefaultActiveTime(undefined)).toSucceed();
      expect(wrapper.current.defaultActiveTime).toBeUndefined();
    });

    test('setDefaultWaitTime updates the value', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setDefaultWaitTime(45 as Minutes)).toSucceed();
      expect(wrapper.current.defaultWaitTime).toBe(45);
    });

    test('setDefaultHoldTime updates the value', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setDefaultHoldTime(90 as Minutes)).toSucceed();
      expect(wrapper.current.defaultHoldTime).toBe(90);
    });

    test('setDefaultTemperature updates the value', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setDefaultTemperature(32 as Celsius)).toSucceed();
      expect(wrapper.current.defaultTemperature).toBe(32);
    });

    test('setTags updates the tags', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setTags(['new-tag'])).toSucceed();
      expect(wrapper.current.tags).toEqual(['new-tag']);
    });

    test('setTags clears with undefined', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      expect(wrapper.setTags(undefined)).toSucceed();
      expect(wrapper.current.tags).toBeUndefined();
    });

    test('setNotes updates the notes', () => {
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'user' as never, note: 'Updated note' }
      ];
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setNotes(notes)).toSucceed();
      expect(wrapper.current.notes).toEqual(notes);
    });

    test('setNotes clears with undefined', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      expect(wrapper.setNotes(undefined)).toSucceed();
      expect(wrapper.current.notes).toBeUndefined();
    });

    test('setDefaults updates the defaults', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.setDefaults({ ingredient: 'milk chocolate' })).toSucceed();
      expect(wrapper.current.defaults).toEqual({ ingredient: 'milk chocolate' });
    });

    test('setDefaults clears with undefined', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      expect(wrapper.setDefaults(undefined)).toSucceed();
      expect(wrapper.current.defaults).toBeUndefined();
    });

    test('applyUpdate merges partial fields', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.applyUpdate({ name: 'Updated', defaultActiveTime: 5 as Minutes })).toSucceed();
      expect(wrapper.name).toBe('Updated');
      expect(wrapper.current.defaultActiveTime).toBe(5);
      expect(wrapper.template).toBe(baseTask.template);
    });
  });

  describe('undo/redo', () => {
    test('canUndo is false initially', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.canUndo()).toBe(false);
    });

    test('canRedo is false initially', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.canRedo()).toBe(false);
    });

    test('undo returns false when no history', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.undo()).toSucceedWith(false);
    });

    test('redo returns false when no future', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.redo()).toSucceedWith(false);
    });

    test('undo restores previous state', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('Changed');
      expect(wrapper.name).toBe('Changed');
      expect(wrapper.canUndo()).toBe(true);

      expect(wrapper.undo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Melt Chocolate');
    });

    test('redo restores undone state', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('Changed');
      wrapper.undo();
      expect(wrapper.canRedo()).toBe(true);

      expect(wrapper.redo()).toSucceedWith(true);
      expect(wrapper.name).toBe('Changed');
    });

    test('new edit clears redo stack', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('First');
      wrapper.undo();
      expect(wrapper.canRedo()).toBe(true);

      wrapper.setName('Second');
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  describe('snapshot', () => {
    test('createSnapshot returns a copy', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      const snap = wrapper.createSnapshot();
      expect(snap).toEqual(baseTask);
      expect(snap).not.toBe(wrapper.current);
    });

    test('snapshot getter returns a copy', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      const snap = wrapper.snapshot;
      expect(snap).toEqual(baseTask);
      expect(snap).not.toBe(wrapper.current);
    });

    test('restoreSnapshot restores state and pushes undo', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('Changed');
      const snap = wrapper.createSnapshot();

      wrapper.setName('Another');
      expect(wrapper.restoreSnapshot(snap)).toSucceed();
      expect(wrapper.name).toBe('Changed');
      expect(wrapper.canUndo()).toBe(true);
    });
  });

  describe('serialization', () => {
    test('getSerializedHistory captures state', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('Changed');
      const history = wrapper.getSerializedHistory(baseTask);

      expect(history.current.name).toBe('Changed');
      expect(history.original.name).toBe('Melt Chocolate');
      expect(history.undoStack.length).toBe(1);
      expect(history.redoStack.length).toBe(0);
    });

    test('restoreFromHistory restores complete state', () => {
      const history: Session.ISerializedEditingHistoryEntity<Tasks.IRawTaskEntity> = {
        current: { ...baseTask, name: 'Restored' },
        original: baseTask,
        undoStack: [baseTask],
        redoStack: []
      };

      expect(EditedTask.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
        expect(wrapper.name).toBe('Restored');
        expect(wrapper.canUndo()).toBe(true);
        expect(wrapper.canRedo()).toBe(false);
      });
    });
  });

  describe('change detection', () => {
    test('hasChanges returns false for unchanged entity', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      expect(wrapper.hasChanges(baseTask)).toBe(false);
    });

    test('hasChanges returns true when name changed', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setName('Different');
      expect(wrapper.hasChanges(baseTask)).toBe(true);
    });

    test('getChanges reports specific field changes', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setName('Different');
      wrapper.setTemplate('New template');
      wrapper.setDefaultActiveTime(99 as Minutes);

      const changes = wrapper.getChanges(fullTask);
      expect(changes.nameChanged).toBe(true);
      expect(changes.templateChanged).toBe(true);
      expect(changes.defaultActiveTimeChanged).toBe(true);
      expect(changes.defaultWaitTimeChanged).toBe(false);
      expect(changes.defaultHoldTimeChanged).toBe(false);
      expect(changes.defaultTemperatureChanged).toBe(false);
      expect(changes.notesChanged).toBe(false);
      expect(changes.tagsChanged).toBe(false);
      expect(changes.defaultsChanged).toBe(false);
      expect(changes.hasChanges).toBe(true);
    });

    test('getChanges detects tags change', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setTags(['different']);
      expect(wrapper.getChanges(fullTask).tagsChanged).toBe(true);
    });

    test('getChanges detects notes change', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setNotes([{ category: 'user' as never, note: 'Different' }]);
      expect(wrapper.getChanges(fullTask).notesChanged).toBe(true);
    });

    test('getChanges detects defaults change', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setDefaults({ ingredient: 'white chocolate' });
      expect(wrapper.getChanges(fullTask).defaultsChanged).toBe(true);
    });

    test('getChanges detects defaults added where none existed', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setDefaults({ ingredient: 'sugar' });
      expect(wrapper.getChanges(baseTask).defaultsChanged).toBe(true);
    });

    test('getChanges detects defaults removed', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setDefaults(undefined);
      expect(wrapper.getChanges(fullTask).defaultsChanged).toBe(true);
    });

    test('getChanges detects tags removed where some existed', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setTags(undefined);
      expect(wrapper.getChanges(fullTask).tagsChanged).toBe(true);
    });

    test('getChanges detects notes removed where some existed', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setNotes(undefined);
      expect(wrapper.getChanges(fullTask).notesChanged).toBe(true);
    });

    test('getChanges detects notes length change', () => {
      const wrapper = EditedTask.create(fullTask).orThrow();
      wrapper.setNotes([
        { category: 'user' as never, note: 'Note 1' },
        { category: 'user' as never, note: 'Note 2' }
      ]);
      expect(wrapper.getChanges(fullTask).notesChanged).toBe(true);
    });

    test('getChanges detects tags added where none existed', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      wrapper.setTags(['new-tag']);
      expect(wrapper.getChanges(baseTask).tagsChanged).toBe(true);
    });
  });

  describe('undo stack overflow', () => {
    test('undo stack is bounded', () => {
      const wrapper = EditedTask.create(baseTask).orThrow();
      // Push more than MAX_HISTORY_SIZE (50) edits
      for (let i = 0; i < 55; i++) {
        wrapper.setName(`Name ${i}`);
      }
      // Should still be able to undo, but not all the way back
      let undoCount = 0;
      while (wrapper.canUndo()) {
        wrapper.undo();
        undoCount++;
      }
      // Should be capped at 50
      expect(undoCount).toBeLessThanOrEqual(50);
      expect(undoCount).toBeGreaterThan(0);
    });
  });
});
