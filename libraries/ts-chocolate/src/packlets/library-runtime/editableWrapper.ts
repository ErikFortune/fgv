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
 * EditableWrapper - generic base class for mutable entity wrappers with undo/redo support.
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { Session } from '../entities';
import type { ISnapshotProvider } from '../editing';

/**
 * Maximum number of undo snapshots to retain.
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Generic base class for mutable entity wrappers with undo/redo support.
 *
 * Provides the common undo/redo stack, snapshot management, and serialization
 * infrastructure shared by all Edited* and Produced* wrappers. Subclasses
 * implement domain-specific editing methods and the `_deepCopy` strategy.
 *
 * @typeParam T - The entity type being wrapped
 * @public
 */
export abstract class EditableWrapper<T> implements ISnapshotProvider<T> {
  protected _current: T;
  private _undoStack: T[];
  private _redoStack: T[];

  /**
   * Creates an EditableWrapper.
   * Use static factory methods in subclasses instead of calling this directly.
   * @param initial - The initial entity state (should already be deep-copied by caller)
   * @internal
   */
  protected constructor(initial: T) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Restores undo/redo stacks from serialized history.
   * Call from subclass `restoreFromHistory` static factory after constructing the instance.
   * @param history - Serialized editing history
   * @internal
   */
  protected _restoreHistory(history: Session.ISerializedEditingHistoryEntity<T>): void {
    this._undoStack = [...history.undoStack];
    this._redoStack = [...history.redoStack];
  }

  // ============================================================================
  // Abstract
  // ============================================================================

  /**
   * Creates a deep copy of an entity.
   * Subclasses implement this to handle entity-specific nested structures.
   * @param entity - Entity to copy
   * @returns Deep copy of the entity
   * @internal
   */
  protected abstract _deepCopy(entity: T): T;

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Deep copy of current entity
   * @public
   */
  public createSnapshot(): T {
    return this._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success
   * @public
   */
  public restoreSnapshot(snapshot: T): Result<void> {
    this._pushUndo();
    this._current = this._deepCopy(snapshot);
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Serializes the complete editing history for persistence.
   * Includes current state, original state, and undo/redo stacks.
   * @param original - Original state when editing started (for change detection on restore)
   * @returns Serialized editing history
   * @public
   */
  public getSerializedHistory(original: T): Session.ISerializedEditingHistoryEntity<T> {
    return {
      current: this._deepCopy(this._current),
      original: this._deepCopy(original),
      undoStack: this._undoStack.map((state) => this._deepCopy(state)),
      redoStack: this._redoStack.map((state) => this._deepCopy(state))
    };
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  /**
   * Undoes the last change.
   * Pops from undo stack, pushes current to redo, and restores previous state.
   * @returns Success with true if undo succeeded, Success with false if no history
   * @public
   */
  public undo(): Result<boolean> {
    if (this._undoStack.length === 0) {
      return succeed(false);
    }

    const previous = this._undoStack.pop()!;
    this._redoStack.push(this._deepCopy(this._current));
    this._current = previous;
    return succeed(true);
  }

  /**
   * Redoes the last undone change.
   * Pops from redo stack, pushes current to undo, and restores future state.
   * @returns Success with true if redo succeeded, Success with false if no future
   * @public
   */
  public redo(): Result<boolean> {
    if (this._redoStack.length === 0) {
      return succeed(false);
    }

    const future = this._redoStack.pop()!;
    this._undoStack.push(this._deepCopy(this._current));
    this._current = future;
    return succeed(true);
  }

  /**
   * Checks if undo is available.
   * @returns True if undo stack is not empty
   * @public
   */
  public canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /**
   * Checks if redo is available.
   * @returns True if redo stack is not empty
   * @public
   */
  public canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the current state as an immutable snapshot.
   * @public
   */
  public get snapshot(): T {
    return this.createSnapshot();
  }

  /**
   * Gets the current entity (direct reference — callers should not mutate).
   * @public
   */
  public get current(): T {
    return this._current;
  }

  // ============================================================================
  // Protected Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack and clears the redo stack.
   * Call this at the start of every mutating method before modifying `_current`.
   * Clearing redo on any new edit is always correct — a new edit invalidates
   * the "future" history.
   * @internal
   */
  protected _pushUndo(): void {
    this._undoStack.push(this._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }

    this._redoStack = [];
  }
}
