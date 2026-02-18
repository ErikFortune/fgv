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

/**
 * EditedProcedure - mutable wrapper for editing procedure entities with undo/redo.
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { Model as CommonModel, ProcedureType } from '../../common';
import { Procedures, Session, Tasks } from '../../entities';
import { EditableWrapper } from '../editableWrapper';

type IProcedureEntity = Procedures.IProcedureEntity;
type IProcedureStepEntity = Procedures.IProcedureStepEntity;
type ITaskEntityInvocation = Tasks.ITaskEntityInvocation;

/**
 * Structure describing what changed between two procedure entities.
 * @public
 */
export interface IProcedureChanges {
  readonly nameChanged: boolean;
  readonly descriptionChanged: boolean;
  readonly categoryChanged: boolean;
  readonly stepsChanged: boolean;
  readonly notesChanged: boolean;
  readonly tagsChanged: boolean;
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IProcedureEntity with undo/redo support.
 * @public
 */
export class EditedProcedure extends EditableWrapper<IProcedureEntity> {
  private constructor(initial: IProcedureEntity) {
    super(initial);
  }

  public static create(initial: IProcedureEntity): Result<EditedProcedure> {
    return succeed(new EditedProcedure(EditedProcedure._copyEntity(initial)));
  }

  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IProcedureEntity>
  ): Result<EditedProcedure> {
    const instance = new EditedProcedure(history.current);
    instance._restoreHistory(history);
    return succeed(instance);
  }

  public setName(name: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    return succeed(undefined);
  }

  public setDescription(description: string | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, description };
    return succeed(undefined);
  }

  public setCategory(category: ProcedureType | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, category };
    return succeed(undefined);
  }

  public setTags(tags: ReadonlyArray<string> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      tags: tags ? [...tags] : undefined
    };
    return succeed(undefined);
  }

  public setNotes(notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };
    return succeed(undefined);
  }

  public setSteps(steps: ReadonlyArray<IProcedureStepEntity>): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      steps: EditedProcedure._normalizeStepOrder(EditedProcedure._copySteps(steps))
    };
    return succeed(undefined);
  }

  public addStep(step: Omit<IProcedureStepEntity, 'order'>): Result<void> {
    this._pushUndo();
    const nextStep: IProcedureStepEntity = {
      ...EditedProcedure._copyStep(step as IProcedureStepEntity),
      order: this._current.steps.length + 1
    };
    this._current = {
      ...this._current,
      steps: [...this._current.steps, nextStep]
    };
    return succeed(undefined);
  }

  public updateStep(order: number, update: Partial<IProcedureStepEntity>): Result<void> {
    this._pushUndo();
    const updated = this._current.steps.map((step) => {
      if (step.order !== order) {
        return step;
      }
      const mergedTask: ITaskEntityInvocation =
        update.task === undefined ? step.task : EditedProcedure._copyInvocation(update.task);
      const merged: IProcedureStepEntity = {
        ...step,
        ...update,
        order: step.order,
        task: mergedTask
      };
      return EditedProcedure._copyStep(merged);
    });
    this._current = {
      ...this._current,
      steps: EditedProcedure._normalizeStepOrder(updated)
    };
    return succeed(undefined);
  }

  public removeStep(order: number): Result<void> {
    this._pushUndo();
    const remaining = this._current.steps.filter((step) => step.order !== order);
    this._current = {
      ...this._current,
      steps: EditedProcedure._normalizeStepOrder(remaining)
    };
    return succeed(undefined);
  }

  public moveStep(order: number, newIndex: number): Result<void> {
    this._pushUndo();
    const steps = [...this._current.steps];
    const currentIndex = steps.findIndex((step) => step.order === order);
    if (currentIndex < 0) {
      return succeed(undefined);
    }
    const boundedNewIndex = Math.max(0, Math.min(newIndex, steps.length - 1));
    const [step] = steps.splice(currentIndex, 1);
    /* c8 ignore next 3 - defensive: splice after successful findIndex cannot return undefined */
    if (step === undefined) {
      return succeed(undefined);
    }
    steps.splice(boundedNewIndex, 0, step);
    this._current = {
      ...this._current,
      steps: EditedProcedure._normalizeStepOrder(steps)
    };
    return succeed(undefined);
  }

  public applyUpdate(update: Partial<IProcedureEntity>): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      ...update,
      steps: update.steps
        ? EditedProcedure._normalizeStepOrder(EditedProcedure._copySteps(update.steps))
        : this._current.steps,
      notes: update.notes ? update.notes.map((note) => ({ ...note })) : update.notes,
      tags: update.tags ? [...update.tags] : update.tags
    };
    return succeed(undefined);
  }

  public get name(): string {
    return this._current.name;
  }

  public hasChanges(original: IProcedureEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  public getChanges(original: IProcedureEntity): IProcedureChanges {
    const nameChanged = this._current.name !== original.name;
    const descriptionChanged = this._current.description !== original.description;
    const categoryChanged = this._current.category !== original.category;
    const stepsChanged = !EditedProcedure._stepsEqual(this._current.steps, original.steps);
    const notesChanged = !EditedProcedure._notesEqual(this._current.notes, original.notes);
    const tagsChanged = !EditedProcedure._stringArrayEqual(this._current.tags, original.tags);

    return {
      nameChanged,
      descriptionChanged,
      categoryChanged,
      stepsChanged,
      notesChanged,
      tagsChanged,
      hasChanges:
        nameChanged || descriptionChanged || categoryChanged || stepsChanged || notesChanged || tagsChanged
    };
  }

  protected _deepCopy(entity: IProcedureEntity): IProcedureEntity {
    return EditedProcedure._copyEntity(entity);
  }

  private static _copyEntity(entity: IProcedureEntity): IProcedureEntity {
    return {
      ...entity,
      steps: EditedProcedure._copySteps(entity.steps),
      tags: entity.tags ? [...entity.tags] : undefined,
      notes: entity.notes ? entity.notes.map((n) => ({ ...n })) : undefined
    };
  }

  private static _copySteps(steps: ReadonlyArray<IProcedureStepEntity>): ReadonlyArray<IProcedureStepEntity> {
    return steps.map((step) => EditedProcedure._copyStep(step));
  }

  private static _copyStep(step: IProcedureStepEntity): IProcedureStepEntity {
    return {
      ...step,
      task: EditedProcedure._copyInvocation(step.task),
      notes: step.notes ? step.notes.map((n) => ({ ...n })) : undefined
    };
  }

  private static _copyInvocation(task: ITaskEntityInvocation): ITaskEntityInvocation {
    if (Tasks.isTaskRefEntity(task)) {
      return {
        taskId: task.taskId,
        params: { ...task.params }
      };
    }

    return {
      task: {
        ...task.task,
        notes: task.task.notes ? task.task.notes.map((n) => ({ ...n })) : undefined,
        tags: task.task.tags ? [...task.task.tags] : undefined,
        defaults: task.task.defaults ? { ...task.task.defaults } : undefined
      },
      params: { ...task.params }
    };
  }

  private static _normalizeStepOrder(
    steps: ReadonlyArray<IProcedureStepEntity>
  ): ReadonlyArray<IProcedureStepEntity> {
    return steps.map((step, index) => ({ ...step, order: index + 1 }));
  }

  private static _stringArrayEqual(
    a: ReadonlyArray<string> | undefined,
    b: ReadonlyArray<string> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, i) => val === sortedB[i]);
  }

  private static _notesEqual(
    a: ReadonlyArray<CommonModel.ICategorizedNote> | undefined,
    b: ReadonlyArray<CommonModel.ICategorizedNote> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    const sortedA = [...a].sort((x, y) => (x.category ?? '').localeCompare(y.category ?? ''));
    const sortedB = [...b].sort((x, y) => (x.category ?? '').localeCompare(y.category ?? ''));
    return sortedA.every((note, i) => note.note === sortedB[i].note && note.category === sortedB[i].category);
  }

  private static _stepsEqual(
    a: ReadonlyArray<IProcedureStepEntity>,
    b: ReadonlyArray<IProcedureStepEntity>
  ): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i += 1) {
      const left = a[i];
      const right = b[i];
      if (
        left.order !== right.order ||
        left.activeTime !== right.activeTime ||
        left.waitTime !== right.waitTime ||
        left.holdTime !== right.holdTime ||
        left.temperature !== right.temperature
      ) {
        return false;
      }
      if (!EditedProcedure._notesEqual(left.notes, right.notes)) {
        return false;
      }
      if (JSON.stringify(left.task) !== JSON.stringify(right.task)) {
        return false;
      }
    }

    return true;
  }
}
