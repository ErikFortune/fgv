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
  BaseProcedureId,
  BaseTaskId,
  Model as CommonModel,
  NoteCategory,
  TaskId
} from '../../../../packlets/common';
import { Procedures, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedProcedure } from '../../../../packlets/library-runtime/edited/procedureWrapper';

type IProcedureEntity = Procedures.IProcedureEntity;
type IProcedureStepEntity = Procedures.IProcedureStepEntity;

const baseProcedure: IProcedureEntity = {
  baseId: 'temper' as BaseProcedureId,
  name: 'Tempering',
  steps: [
    {
      order: 1,
      task: {
        taskId: 'common.melt' as TaskId,
        params: { temp: 45 }
      }
    }
  ]
};

describe('EditedProcedure', () => {
  test('creates from an entity', () => {
    expect(EditedProcedure.create(baseProcedure)).toSucceedAndSatisfy((wrapper) => {
      expect(wrapper.current.name).toBe('Tempering');
      expect(wrapper.current.steps).toHaveLength(1);
    });
  });

  test('supports basic field edits', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.setName('Updated Procedure')).toSucceed();
    expect(wrapper.setDescription('Description')).toSucceed();
    expect(wrapper.name).toBe('Updated Procedure');
    expect(wrapper.current.description).toBe('Description');
  });

  test('supports setCategory', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.setCategory('other')).toSucceed();
    expect(wrapper.current.category).toBe('other');

    expect(wrapper.setCategory(undefined)).toSucceed();
    expect(wrapper.current.category).toBeUndefined();
  });

  test('supports setTags', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.setTags(['chocolate', 'tempering'])).toSucceed();
    expect(wrapper.current.tags).toEqual(['chocolate', 'tempering']);

    expect(wrapper.setTags(undefined)).toSucceed();
    expect(wrapper.current.tags).toBeUndefined();
  });

  test('supports setNotes', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    const notes: CommonModel.ICategorizedNote[] = [
      { note: 'Important note', category: 'safety' as unknown as NoteCategory },
      { note: 'General note', category: 'general' as unknown as NoteCategory }
    ];

    expect(wrapper.setNotes(notes)).toSucceed();
    expect(wrapper.current.notes).toHaveLength(2);
    expect(wrapper.current.notes?.[0]?.note).toBe('Important note');

    expect(wrapper.setNotes(undefined)).toSucceed();
    expect(wrapper.current.notes).toBeUndefined();
  });

  test('supports setSteps', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    const newSteps: IProcedureStepEntity[] = [
      {
        order: 1,
        task: { taskId: 'common.cool' as TaskId, params: { temp: 30 } }
      },
      {
        order: 2,
        task: { taskId: 'common.rest' as TaskId, params: { time: 10 } }
      }
    ];

    expect(wrapper.setSteps(newSteps)).toSucceed();
    expect(wrapper.current.steps).toHaveLength(2);
    expect(wrapper.current.steps[0]?.task).toEqual({ taskId: 'common.cool', params: { temp: 30 } });
  });

  test('supports step add/update/remove', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    expect(
      wrapper.addStep({
        task: {
          taskId: 'common.cool' as TaskId,
          params: { temp: 30 }
        }
      })
    ).toSucceed();
    expect(wrapper.current.steps).toHaveLength(2);
    expect(wrapper.current.steps[1]?.order).toBe(2);

    expect(
      wrapper.updateStep(2, {
        waitTime: 20 as never
      })
    ).toSucceed();
    expect(wrapper.current.steps[1]?.waitTime).toBe(20);

    expect(wrapper.removeStep(1)).toSucceed();
    expect(wrapper.current.steps).toHaveLength(1);
    expect(wrapper.current.steps[0]?.order).toBe(1);
  });

  test('supports moveStep reordering', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.addStep({
      task: {
        taskId: 'common.cool' as TaskId,
        params: { temp: 30 }
      }
    });

    expect(wrapper.moveStep(2, 0)).toSucceed();
    expect(wrapper.current.steps[0]?.task).toEqual({ taskId: 'common.cool', params: { temp: 30 } });
    expect(wrapper.current.steps[0]?.order).toBe(1);
    expect(wrapper.current.steps[1]?.order).toBe(2);
  });

  test('moveStep with non-existent order returns success without modification', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    const originalSteps = wrapper.current.steps;

    expect(wrapper.moveStep(999, 0)).toSucceed();
    expect(wrapper.current.steps).toEqual(originalSteps);
  });

  test('supports undo/redo', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setName('Changed');
    expect(wrapper.canUndo()).toBe(true);

    expect(wrapper.undo()).toSucceedWith(true);
    expect(wrapper.name).toBe('Tempering');
    expect(wrapper.redo()).toSucceedWith(true);
    expect(wrapper.name).toBe('Changed');
  });

  test('undo on empty stack returns false', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.canUndo()).toBe(false);
    expect(wrapper.undo()).toSucceedWith(false);
  });

  test('redo on empty stack returns false', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.canRedo()).toBe(false);
    expect(wrapper.redo()).toSucceedWith(false);
  });

  test('createSnapshot and snapshot getter', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setName('Modified');

    const snapshot1 = wrapper.createSnapshot();
    const snapshot2 = wrapper.snapshot;

    expect(snapshot1.name).toBe('Modified');
    expect(snapshot2.name).toBe('Modified');
    expect(snapshot1).toEqual(snapshot2);

    // Verify it's a deep copy - modifying wrapper shouldn't affect snapshot
    wrapper.setName('Further Modified');
    expect(snapshot1.name).toBe('Modified');
  });

  test('restoreSnapshot', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setName('First Change');

    const snapshot = wrapper.createSnapshot();
    wrapper.setName('Second Change');

    expect(wrapper.restoreSnapshot(snapshot)).toSucceed();
    expect(wrapper.name).toBe('First Change');
    expect(wrapper.canUndo()).toBe(true);
    expect(wrapper.canRedo()).toBe(false);
  });

  test('serializes and restores history', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setName('Changed');
    const history = wrapper.getSerializedHistory(baseProcedure);

    expect(EditedProcedure.restoreFromHistory(history)).toSucceedAndSatisfy((restored) => {
      expect(restored.name).toBe('Changed');
      expect(restored.canUndo()).toBe(true);
    });
  });

  test('restoreFromHistory restores complete state', () => {
    const history: Session.ISerializedEditingHistoryEntity<IProcedureEntity> = {
      current: { ...baseProcedure, name: 'Restored' },
      original: baseProcedure,
      undoStack: [baseProcedure],
      redoStack: []
    };

    expect(EditedProcedure.restoreFromHistory(history)).toSucceedAndSatisfy((wrapper) => {
      expect(wrapper.name).toBe('Restored');
      expect(wrapper.canUndo()).toBe(true);
      expect(wrapper.canRedo()).toBe(false);
    });
  });

  test('applyUpdate with partial update', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    const update: Partial<IProcedureEntity> = {
      name: 'Updated via applyUpdate',
      description: 'New description',
      tags: ['tag1', 'tag2'],
      notes: [{ note: 'Applied note', category: 'info' as unknown as NoteCategory }]
    };

    expect(wrapper.applyUpdate(update)).toSucceed();
    expect(wrapper.name).toBe('Updated via applyUpdate');
    expect(wrapper.current.description).toBe('New description');
    expect(wrapper.current.tags).toEqual(['tag1', 'tag2']);
    expect(wrapper.current.notes).toHaveLength(1);
    expect(wrapper.current.notes?.[0]?.note).toBe('Applied note');
  });

  test('applyUpdate with steps', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    const newSteps: IProcedureStepEntity[] = [
      {
        order: 1,
        task: { taskId: 'common.mix' as TaskId, params: { speed: 'medium' } }
      }
    ];

    expect(wrapper.applyUpdate({ steps: newSteps })).toSucceed();
    expect(wrapper.current.steps).toHaveLength(1);
    expect(wrapper.current.steps[0]?.task).toEqual({ taskId: 'common.mix', params: { speed: 'medium' } });
  });

  test('history truncation at >50 changes', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    // Push 52 changes (exceeding MAX_HISTORY_SIZE of 50)
    for (let i = 0; i < 52; i++) {
      wrapper.setName(`Change ${i}`);
    }

    // Should only be able to undo 50 times (not 52)
    let undoCount = 0;
    while (wrapper.undo().value === true) {
      undoCount++;
    }

    expect(undoCount).toBe(50);
  });

  test('inline task invocation (not taskRef)', () => {
    const inlineTaskStep: IProcedureStepEntity = {
      order: 1,
      task: {
        task: {
          baseId: 'inline-task' as BaseTaskId,
          name: 'Inline Task',
          template: 'Do something at {{temp}}°C',
          notes: [{ note: 'Inline note', category: 'warning' as unknown as NoteCategory }],
          tags: ['inline'],
          defaults: { temp: 40 }
        },
        params: { temp: 50 }
      }
    };

    const procedureWithInline: IProcedureEntity = {
      ...baseProcedure,
      steps: [inlineTaskStep]
    };

    const wrapper = EditedProcedure.create(procedureWithInline).orThrow();

    // Verify inline task is preserved
    expect(wrapper.current.steps[0]?.task).toHaveProperty('task');
    const task = wrapper.current.steps[0]?.task;
    if ('task' in task) {
      expect(task.task.baseId).toBe('inline-task');
      expect(task.task.notes).toHaveLength(1);
      expect(task.task.tags).toEqual(['inline']);
      expect(task.task.defaults).toEqual({ temp: 40 });
    }

    // Verify changes trigger copy
    wrapper.setName('Modified');
    const snapshot = wrapper.createSnapshot();
    const snapshotTask = snapshot.steps[0]?.task;
    if (snapshotTask && 'task' in snapshotTask) {
      expect(snapshotTask.task.baseId).toBe('inline-task');
    }
  });

  test('detects changes', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.hasChanges(baseProcedure)).toBe(false);

    wrapper.setName('Changed');
    const changes = wrapper.getChanges(baseProcedure);
    expect(changes.nameChanged).toBe(true);
    expect(changes.hasChanges).toBe(true);
  });

  test('detects tag changes', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    wrapper.setTags(['new-tag']);
    expect(wrapper.getChanges(baseProcedure).tagsChanged).toBe(true);

    // Different tags
    const procedureWithTags: IProcedureEntity = { ...baseProcedure, tags: ['original-tag'] };
    const wrapper2 = EditedProcedure.create(procedureWithTags).orThrow();
    wrapper2.setTags(['different-tag']);
    expect(wrapper2.getChanges(procedureWithTags).tagsChanged).toBe(true);

    // One undefined, one not
    const wrapper3 = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper3.getChanges(procedureWithTags).tagsChanged).toBe(true);
  });

  test('detects notes changes', () => {
    const notes1: CommonModel.ICategorizedNote[] = [
      { note: 'Note 1', category: 'info' as unknown as NoteCategory }
    ];
    const notes2: CommonModel.ICategorizedNote[] = [
      { note: 'Note 2', category: 'warning' as unknown as NoteCategory }
    ];

    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setNotes(notes1);
    expect(wrapper.getChanges(baseProcedure).notesChanged).toBe(true);

    // Different notes
    const procedureWithNotes: IProcedureEntity = { ...baseProcedure, notes: notes1 };
    const wrapper2 = EditedProcedure.create(procedureWithNotes).orThrow();
    wrapper2.setNotes(notes2);
    expect(wrapper2.getChanges(procedureWithNotes).notesChanged).toBe(true);

    // One undefined, one not
    const wrapper3 = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper3.getChanges(procedureWithNotes).notesChanged).toBe(true);

    // Different length
    const notes3: CommonModel.ICategorizedNote[] = [
      { note: 'Note 1', category: 'info' as unknown as NoteCategory },
      { note: 'Note 2', category: 'warning' as unknown as NoteCategory }
    ];
    wrapper3.setNotes(notes3);
    expect(wrapper3.getChanges(procedureWithNotes).notesChanged).toBe(true);
  });

  test('detects steps changes - different length', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    wrapper.addStep({
      task: { taskId: 'common.cool' as TaskId, params: { temp: 30 } }
    });

    expect(wrapper.getChanges(baseProcedure).stepsChanged).toBe(true);
  });

  test('detects steps changes - different properties', () => {
    const step1: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } },
      activeTime: 10 as never
    };

    const step2: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } },
      activeTime: 20 as never
    };

    const procedure1: IProcedureEntity = { ...baseProcedure, steps: [step1] };
    const procedure2: IProcedureEntity = { ...baseProcedure, steps: [step2] };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).stepsChanged).toBe(true);

    // Test other properties: order, waitTime, holdTime, temperature
    const step3: IProcedureStepEntity = {
      order: 2,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } }
    };
    const procedure3: IProcedureEntity = { ...baseProcedure, steps: [step3] };
    expect(wrapper.getChanges(procedure3).stepsChanged).toBe(true);
  });

  test('detects steps changes - different notes', () => {
    const step1: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } },
      notes: [{ note: 'Note 1', category: 'general' as unknown as NoteCategory }]
    };

    const step2: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } },
      notes: [{ note: 'Note 2', category: 'general' as unknown as NoteCategory }]
    };

    const procedure1: IProcedureEntity = { ...baseProcedure, steps: [step1] };
    const procedure2: IProcedureEntity = { ...baseProcedure, steps: [step2] };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).stepsChanged).toBe(true);
  });

  test('detects steps changes - different task JSON', () => {
    const step1: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 45 } }
    };

    const step2: IProcedureStepEntity = {
      order: 1,
      task: { taskId: 'common.melt' as TaskId, params: { temp: 50 } }
    };

    const procedure1: IProcedureEntity = { ...baseProcedure, steps: [step1] };
    const procedure2: IProcedureEntity = { ...baseProcedure, steps: [step2] };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).stepsChanged).toBe(true);
  });

  test('_stringArrayEqual handles different values', () => {
    const procedure1: IProcedureEntity = { ...baseProcedure, tags: ['tag1', 'tag2'] };
    const procedure2: IProcedureEntity = { ...baseProcedure, tags: ['tag1', 'tag3'] };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).tagsChanged).toBe(true);
  });

  test('_stringArrayEqual handles different lengths', () => {
    const procedure1: IProcedureEntity = { ...baseProcedure, tags: ['tag1'] };
    const procedure2: IProcedureEntity = { ...baseProcedure, tags: ['tag1', 'tag2'] };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).tagsChanged).toBe(true);
  });

  test('_notesEqual handles different values', () => {
    const notes1: CommonModel.ICategorizedNote[] = [
      { note: 'Note A', category: 'info' as unknown as NoteCategory }
    ];
    const notes2: CommonModel.ICategorizedNote[] = [
      { note: 'Note B', category: 'info' as unknown as NoteCategory }
    ];

    const procedure1: IProcedureEntity = { ...baseProcedure, notes: notes1 };
    const procedure2: IProcedureEntity = { ...baseProcedure, notes: notes2 };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).notesChanged).toBe(true);
  });

  test('_notesEqual detects different categories with same note text', () => {
    const notes1: CommonModel.ICategorizedNote[] = [
      { note: 'Same text', category: 'info' as unknown as NoteCategory }
    ];
    const notes2: CommonModel.ICategorizedNote[] = [
      { note: 'Same text', category: 'warning' as unknown as NoteCategory }
    ];

    const procedure1: IProcedureEntity = { ...baseProcedure, notes: notes1 };
    const procedure2: IProcedureEntity = { ...baseProcedure, notes: notes2 };

    const wrapper = EditedProcedure.create(procedure1).orThrow();
    expect(wrapper.getChanges(procedure2).notesChanged).toBe(true);
  });

  test('updateStep with task replacement exercises task copy', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();

    const newTask = {
      taskId: 'common.cool' as TaskId,
      params: { temp: 30 }
    };

    expect(wrapper.updateStep(1, { task: newTask })).toSucceed();
    expect(wrapper.current.steps[0]?.task).toEqual(newTask);
  });

  test('inline task with missing optional fields exercises copy logic', () => {
    const minimalInlineTask: IProcedureStepEntity = {
      order: 1,
      task: {
        task: {
          baseId: 'minimal-inline' as BaseTaskId,
          name: 'Minimal Task',
          template: 'Do something'
          // No notes, tags, or defaults
        },
        params: {}
      }
    };

    const procedureWithMinimal: IProcedureEntity = {
      ...baseProcedure,
      steps: [minimalInlineTask]
    };

    const wrapper = EditedProcedure.create(procedureWithMinimal).orThrow();

    // Trigger copy through snapshot
    const snapshot = wrapper.createSnapshot();
    const task = snapshot.steps[0]?.task;
    if (task && 'task' in task) {
      expect(task.task.notes).toBeUndefined();
      expect(task.task.tags).toBeUndefined();
      expect(task.task.defaults).toBeUndefined();
    }
  });

  // Note: Lines 108-109, 122-123, and 247-248 are defensive checks that are unreachable
  // due to the preceding length check. These would require c8 ignore directives in the source.
  // They cannot be meaningfully tested as they represent impossible states.
});
