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
 * EditedTask - mutable wrapper for editing raw task entities with undo/redo
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { Celsius, Minutes, Model as CommonModel } from '../../common';
import { Tasks, Session } from '../../entities';
import { EditableWrapper } from '../editableWrapper';

type IRawTaskEntity = Tasks.IRawTaskEntity;

/**
 * Structure describing what changed between two raw task entities
 * @public
 */
export interface ITaskChanges {
  /** True if name changed */
  readonly nameChanged: boolean;
  /** True if template changed */
  readonly templateChanged: boolean;
  /** True if defaultActiveTime changed */
  readonly defaultActiveTimeChanged: boolean;
  /** True if defaultWaitTime changed */
  readonly defaultWaitTimeChanged: boolean;
  /** True if defaultHoldTime changed */
  readonly defaultHoldTimeChanged: boolean;
  /** True if defaultTemperature changed */
  readonly defaultTemperatureChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if tags changed */
  readonly tagsChanged: boolean;
  /** True if defaults changed */
  readonly defaultsChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IRawTaskEntity with undo/redo support.
 * Provides editing methods that maintain history for undo/redo operations.
 * @public
 */
export class EditedTask extends EditableWrapper<IRawTaskEntity> {
  /**
   * Creates an EditedTask.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: IRawTaskEntity) {
    super(initial);
  }

  /**
   * Factory method for creating an EditedTask from an existing entity.
   * @param initial - The initial raw task entity state
   * @returns Success with EditedTask
   * @public
   */
  public static create(initial: IRawTaskEntity): Result<EditedTask> {
    return succeed(new EditedTask(EditedTask._copyEntity(initial)));
  }

  /**
   * Factory method for restoring an EditedTask from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedTask or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<IRawTaskEntity>
  ): Result<EditedTask> {
    const instance = new EditedTask(history.current);
    instance._restoreHistory(history);
    return succeed(instance);
  }

  // ============================================================================
  // Editing Methods
  // ============================================================================

  /**
   * Sets the task name.
   * @param name - New task name
   * @returns Success
   * @public
   */
  public setName(name: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, name };
    return succeed(undefined);
  }

  /**
   * Sets the Mustache template string.
   * @param template - New template string
   * @returns Success
   * @public
   */
  public setTemplate(template: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, template };
    return succeed(undefined);
  }

  /**
   * Sets the default active time.
   * @param defaultActiveTime - New default active time, or undefined to clear
   * @returns Success
   * @public
   */
  public setDefaultActiveTime(defaultActiveTime: Minutes | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, defaultActiveTime };
    return succeed(undefined);
  }

  /**
   * Sets the default wait time.
   * @param defaultWaitTime - New default wait time, or undefined to clear
   * @returns Success
   * @public
   */
  public setDefaultWaitTime(defaultWaitTime: Minutes | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, defaultWaitTime };
    return succeed(undefined);
  }

  /**
   * Sets the default hold time.
   * @param defaultHoldTime - New default hold time, or undefined to clear
   * @returns Success
   * @public
   */
  public setDefaultHoldTime(defaultHoldTime: Minutes | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, defaultHoldTime };
    return succeed(undefined);
  }

  /**
   * Sets the default temperature.
   * @param defaultTemperature - New default temperature, or undefined to clear
   * @returns Success
   * @public
   */
  public setDefaultTemperature(defaultTemperature: Celsius | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, defaultTemperature };
    return succeed(undefined);
  }

  /**
   * Sets the notes list.
   * @param notes - New notes array, or undefined to clear
   * @returns Success
   * @public
   */
  public setNotes(notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      notes: notes ? notes.map((n) => ({ ...n })) : undefined
    };
    return succeed(undefined);
  }

  /**
   * Sets the tags list.
   * @param tags - New tags array, or undefined to clear
   * @returns Success
   * @public
   */
  public setTags(tags: ReadonlyArray<string> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      tags: tags ? [...tags] : undefined
    };
    return succeed(undefined);
  }

  /**
   * Sets the default values for template placeholders.
   * @param defaults - New defaults record, or undefined to clear
   * @returns Success
   * @public
   */
  public setDefaults(defaults: Readonly<Record<string, unknown>> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      defaults: defaults ? { ...defaults } : undefined
    };
    return succeed(undefined);
  }

  /**
   * Applies a partial update to the current entity.
   * This is useful for bulk field updates.
   * Pushes current state to undo before change, clears redo.
   * @param update - Partial entity fields to merge
   * @returns Success
   * @public
   */
  public applyUpdate(update: Partial<IRawTaskEntity>): Result<void> {
    this._pushUndo();
    this._current = Object.assign({}, this._current, update);
    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the task name.
   * @public
   */
  public get name(): string {
    return this._current.name;
  }

  /**
   * Gets the template string.
   * @public
   */
  public get template(): string {
    return this._current.template;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original raw task entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: IRawTaskEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original raw task entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: IRawTaskEntity): ITaskChanges {
    const nameChanged = this._current.name !== original.name;
    const templateChanged = this._current.template !== original.template;
    const defaultActiveTimeChanged = this._current.defaultActiveTime !== original.defaultActiveTime;
    const defaultWaitTimeChanged = this._current.defaultWaitTime !== original.defaultWaitTime;
    const defaultHoldTimeChanged = this._current.defaultHoldTime !== original.defaultHoldTime;
    const defaultTemperatureChanged = this._current.defaultTemperature !== original.defaultTemperature;
    const notesChanged = !EditedTask._notesEqual(this._current.notes, original.notes);
    const tagsChanged = !EditedTask._stringArrayEqual(this._current.tags, original.tags);
    const defaultsChanged = !EditedTask._defaultsEqual(this._current.defaults, original.defaults);

    return {
      nameChanged,
      templateChanged,
      defaultActiveTimeChanged,
      defaultWaitTimeChanged,
      defaultHoldTimeChanged,
      defaultTemperatureChanged,
      notesChanged,
      tagsChanged,
      defaultsChanged,
      hasChanges:
        nameChanged ||
        templateChanged ||
        defaultActiveTimeChanged ||
        defaultWaitTimeChanged ||
        defaultHoldTimeChanged ||
        defaultTemperatureChanged ||
        notesChanged ||
        tagsChanged ||
        defaultsChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  protected _deepCopy(entity: IRawTaskEntity): IRawTaskEntity {
    return EditedTask._copyEntity(entity);
  }

  private static _copyEntity(entity: IRawTaskEntity): IRawTaskEntity {
    return {
      ...entity,
      notes: entity.notes ? entity.notes.map((n) => ({ ...n })) : undefined,
      tags: entity.tags ? [...entity.tags] : undefined,
      defaults: entity.defaults ? { ...entity.defaults } : undefined
    };
  }

  /**
   * Compares two string arrays for equality (sorted).
   */
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

  /**
   * Compares two notes arrays for equality.
   */
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

  /**
   * Compares two defaults records for equality.
   */
  private static _defaultsEqual(
    a: Readonly<Record<string, unknown>> | undefined,
    b: Readonly<Record<string, unknown>> | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every((key, i) => key === keysB[i] && a[key] === b[key]);
  }
}
