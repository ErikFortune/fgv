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

import { BaseProcedureId, TaskId } from '../../../../packlets/common';
import { Procedures, Session } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { EditedProcedure } from '../../../../packlets/library-runtime/edited/procedureWrapper';

type IProcedureEntity = Procedures.IProcedureEntity;

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

  test('supports undo/redo', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    wrapper.setName('Changed');
    expect(wrapper.canUndo()).toBe(true);

    expect(wrapper.undo()).toSucceedWith(true);
    expect(wrapper.name).toBe('Tempering');
    expect(wrapper.redo()).toSucceedWith(true);
    expect(wrapper.name).toBe('Changed');
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

  test('detects changes', () => {
    const wrapper = EditedProcedure.create(baseProcedure).orThrow();
    expect(wrapper.hasChanges(baseProcedure)).toBe(false);

    wrapper.setName('Changed');
    const changes = wrapper.getChanges(baseProcedure);
    expect(changes.nameChanged).toBe(true);
    expect(changes.hasChanges).toBe(true);
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
});
