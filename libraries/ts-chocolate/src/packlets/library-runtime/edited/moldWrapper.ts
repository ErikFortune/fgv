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
 * EditedMold - mutable wrapper for editing mold entities with undo/redo
 * @packageDocumentation
 */

import { Result, succeed } from '@fgv/ts-utils';

import { Measurement, MoldFormat, MoldId, Model as CommonModel } from '../../common';
import { Molds, Session } from '../../entities';

/**
 * Maximum number of undo snapshots to retain
 */
const MAX_HISTORY_SIZE: number = 50;

/**
 * Structure describing what changed between two mold entities
 * @public
 */
export interface IMoldChanges {
  /** True if manufacturer changed */
  readonly manufacturerChanged: boolean;
  /** True if product number changed */
  readonly productNumberChanged: boolean;
  /** True if description changed */
  readonly descriptionChanged: boolean;
  /** True if cavities changed */
  readonly cavitiesChanged: boolean;
  /** True if format changed */
  readonly formatChanged: boolean;
  /** True if tags changed */
  readonly tagsChanged: boolean;
  /** True if related molds changed */
  readonly relatedChanged: boolean;
  /** True if notes changed */
  readonly notesChanged: boolean;
  /** True if urls changed */
  readonly urlsChanged: boolean;
  /** True if any changes were detected */
  readonly hasChanges: boolean;
}

/**
 * Mutable wrapper for IMoldEntity with undo/redo support.
 * Provides editing methods that maintain history for undo/redo operations.
 * @public
 */
export class EditedMold {
  private _current: Molds.IMoldEntity;
  private _undoStack: Molds.IMoldEntity[];
  private _redoStack: Molds.IMoldEntity[];

  /**
   * Creates an EditedMold.
   * Use static factory methods instead of calling this directly.
   * @internal
   */
  private constructor(initial: Molds.IMoldEntity) {
    this._current = initial;
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Factory method for creating an EditedMold from an existing entity.
   * @param initial - The initial mold entity state
   * @returns Success with EditedMold
   * @public
   */
  public static create(initial: Molds.IMoldEntity): Result<EditedMold> {
    return succeed(new EditedMold(EditedMold._deepCopy(initial)));
  }

  /**
   * Factory method for restoring an EditedMold from serialized history.
   * Restores the complete editing state including undo/redo stacks.
   * @param history - Serialized editing history
   * @returns Result containing EditedMold or error
   * @public
   */
  public static restoreFromHistory(
    history: Session.ISerializedEditingHistoryEntity<Molds.IMoldEntity>
  ): Result<EditedMold> {
    const instance = new EditedMold(history.current);
    instance._undoStack = [...history.undoStack];
    instance._redoStack = [...history.redoStack];
    return succeed(instance);
  }

  // ============================================================================
  // Snapshot Management
  // ============================================================================

  /**
   * Creates an immutable snapshot of the current state.
   * @returns Immutable copy of current mold entity
   * @public
   */
  public createSnapshot(): Molds.IMoldEntity {
    return EditedMold._deepCopy(this._current);
  }

  /**
   * Restores state from a snapshot.
   * Pushes current state to undo stack and clears redo stack.
   * @param snapshot - Snapshot to restore
   * @returns Success or failure
   * @public
   */
  public restoreSnapshot(snapshot: Molds.IMoldEntity): Result<void> {
    this._pushUndo();
    this._current = EditedMold._deepCopy(snapshot);
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
  public getSerializedHistory(
    original: Molds.IMoldEntity
  ): Session.ISerializedEditingHistoryEntity<Molds.IMoldEntity> {
    return {
      current: EditedMold._deepCopy(this._current),
      original: EditedMold._deepCopy(original),
      undoStack: this._undoStack.map((state) => EditedMold._deepCopy(state)),
      redoStack: this._redoStack.map((state) => EditedMold._deepCopy(state))
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
    this._redoStack.push(EditedMold._deepCopy(this._current));
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
    this._undoStack.push(EditedMold._deepCopy(this._current));
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
  // Editing Methods
  // ============================================================================

  /**
   * Sets the mold manufacturer.
   * @param manufacturer - New manufacturer name
   * @returns Success
   * @public
   */
  public setManufacturer(manufacturer: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, manufacturer };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the product number.
   * @param productNumber - New product number
   * @returns Success
   * @public
   */
  public setProductNumber(productNumber: string): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, productNumber };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the mold description.
   * @param description - New description, or undefined to clear
   * @returns Success
   * @public
   */
  public setDescription(description: string | undefined): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, description };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the cavities specification.
   * @param cavities - New cavities configuration
   * @returns Success
   * @public
   */
  public setCavities(cavities: Molds.ICavities): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, cavities: EditedMold._deepCopyCavities(cavities) };
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the mold format.
   * @param format - New mold format
   * @returns Success
   * @public
   */
  public setFormat(format: MoldFormat): Result<void> {
    this._pushUndo();
    this._current = { ...this._current, format };
    this._redoStack = [];
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
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the related molds list.
   * @param related - New related mold IDs array, or undefined to clear
   * @returns Success
   * @public
   */
  public setRelated(related: ReadonlyArray<MoldId> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      related: related ? [...related] : undefined
    };
    this._redoStack = [];
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
    this._redoStack = [];
    return succeed(undefined);
  }

  /**
   * Sets the URLs list.
   * @param urls - New URLs array, or undefined to clear
   * @returns Success
   * @public
   */
  public setUrls(urls: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined): Result<void> {
    this._pushUndo();
    this._current = {
      ...this._current,
      urls: urls ? urls.map((u) => ({ ...u })) : undefined
    };
    this._redoStack = [];
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
  public applyUpdate(update: Partial<Molds.IMoldEntity>): Result<void> {
    this._pushUndo();
    this._current = Object.assign({}, this._current, update);
    this._redoStack = [];
    return succeed(undefined);
  }

  // ============================================================================
  // Read-only Access
  // ============================================================================

  /**
   * Gets the current state as an immutable snapshot.
   * @public
   */
  public get snapshot(): Molds.IMoldEntity {
    return this.createSnapshot();
  }

  /**
   * Gets the current entity (direct reference — callers should not mutate).
   * @public
   */
  public get current(): Molds.IMoldEntity {
    return this._current;
  }

  /**
   * Gets the mold manufacturer.
   * @public
   */
  public get manufacturer(): string {
    return this._current.manufacturer;
  }

  /**
   * Gets the product number.
   * @public
   */
  public get productNumber(): string {
    return this._current.productNumber;
  }

  /**
   * Gets the mold format.
   * @public
   */
  public get format(): MoldFormat {
    return this._current.format;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Checks if current state differs from original.
   * @param original - Original mold entity to compare against
   * @returns True if changes were detected
   * @public
   */
  public hasChanges(original: Molds.IMoldEntity): boolean {
    return this.getChanges(original).hasChanges;
  }

  /**
   * Gets detailed changes between current state and original.
   * @param original - Original mold entity to compare against
   * @returns Structure describing what changed
   * @public
   */
  public getChanges(original: Molds.IMoldEntity): IMoldChanges {
    const manufacturerChanged = this._current.manufacturer !== original.manufacturer;
    const productNumberChanged = this._current.productNumber !== original.productNumber;
    const descriptionChanged = this._current.description !== original.description;
    const cavitiesChanged = !EditedMold._cavitiesEqual(this._current.cavities, original.cavities);
    const formatChanged = this._current.format !== original.format;
    const tagsChanged = !EditedMold._stringArrayEqual(this._current.tags, original.tags);
    const relatedChanged = !EditedMold._stringArrayEqual(this._current.related, original.related);
    const notesChanged = !EditedMold._notesEqual(this._current.notes, original.notes);
    const urlsChanged = !EditedMold._urlsEqual(this._current.urls, original.urls);

    return {
      manufacturerChanged,
      productNumberChanged,
      descriptionChanged,
      cavitiesChanged,
      formatChanged,
      tagsChanged,
      relatedChanged,
      notesChanged,
      urlsChanged,
      hasChanges:
        manufacturerChanged ||
        productNumberChanged ||
        descriptionChanged ||
        cavitiesChanged ||
        formatChanged ||
        tagsChanged ||
        relatedChanged ||
        notesChanged ||
        urlsChanged
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Pushes current state to undo stack, maintaining max size.
   */
  private _pushUndo(): void {
    this._undoStack.push(EditedMold._deepCopy(this._current));

    if (this._undoStack.length > MAX_HISTORY_SIZE) {
      this._undoStack.shift();
    }
  }

  /**
   * Creates a deep copy of a mold entity.
   */
  private static _deepCopy(entity: Molds.IMoldEntity): Molds.IMoldEntity {
    return {
      ...entity,
      cavities: EditedMold._deepCopyCavities(entity.cavities),
      tags: entity.tags ? [...entity.tags] : undefined,
      related: entity.related ? [...entity.related] : undefined,
      notes: entity.notes ? entity.notes.map((n) => ({ ...n })) : undefined,
      urls: entity.urls ? entity.urls.map((u) => ({ ...u })) : undefined
    };
  }

  /**
   * Deep copies a cavities specification.
   */
  private static _deepCopyCavities(cavities: Molds.ICavities): Molds.ICavities {
    if (cavities.kind === 'grid') {
      return {
        kind: 'grid',
        columns: cavities.columns,
        rows: cavities.rows,
        info: cavities.info ? EditedMold._deepCopyCavityInfo(cavities.info) : undefined
      };
    }
    return {
      kind: 'count',
      count: cavities.count,
      info: cavities.info ? EditedMold._deepCopyCavityInfo(cavities.info) : undefined
    };
  }

  /**
   * Deep copies cavity info.
   */
  private static _deepCopyCavityInfo(info: Molds.ICavityInfo): Molds.ICavityInfo {
    return {
      weight: info.weight,
      dimensions: info.dimensions ? { ...info.dimensions } : undefined
    };
  }

  /**
   * Compares two cavities specifications for equality.
   */
  private static _cavitiesEqual(a: Molds.ICavities, b: Molds.ICavities): boolean {
    if (a.kind === 'grid' && b.kind === 'grid') {
      return a.columns === b.columns && a.rows === b.rows && EditedMold._cavityInfoEqual(a.info, b.info);
    } else if (a.kind === 'count' && b.kind === 'count') {
      return a.count === b.count && EditedMold._cavityInfoEqual(a.info, b.info);
    }
    return false;
  }

  /**
   * Compares two cavity info objects for equality.
   */
  private static _cavityInfoEqual(
    a: Molds.ICavityInfo | undefined,
    b: Molds.ICavityInfo | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    return (
      EditedMold._measurementEqual(a.weight, b.weight) &&
      EditedMold._dimensionsEqual(a.dimensions, b.dimensions)
    );
  }

  /**
   * Compares two measurements for equality.
   */
  private static _measurementEqual(a: Measurement | undefined, b: Measurement | undefined): boolean {
    return a === b;
  }

  /**
   * Compares two cavity dimensions for equality.
   */
  private static _dimensionsEqual(
    a: Molds.ICavityDimensions | undefined,
    b: Molds.ICavityDimensions | undefined
  ): boolean {
    if (a === undefined && b === undefined) {
      return true;
    }
    if (a === undefined || b === undefined) {
      return false;
    }
    return a.width === b.width && a.length === b.length && a.depth === b.depth;
  }

  /**
   * Compares two string/branded-string arrays for equality (sorted).
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
    /* c8 ignore next 2 - coverage intermittently missed in full suite; tested by moldWrapper.test.ts notes equality tests */
    const sortedA = [...a].sort((x, y) => (x.category ?? '').localeCompare(y.category ?? ''));
    const sortedB = [...b].sort((x, y) => (x.category ?? '').localeCompare(y.category ?? ''));
    return sortedA.every((note, i) => note.note === sortedB[i].note && note.category === sortedB[i].category);
  }

  /**
   * Compares two URL arrays for equality.
   */
  private static _urlsEqual(
    a: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined,
    b: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined
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
    const sortedA = [...a].sort((x, y) => x.url.localeCompare(y.url));
    const sortedB = [...b].sort((x, y) => x.url.localeCompare(y.url));
    return sortedA.every((url, i) => url.url === sortedB[i].url && url.category === sortedB[i].category);
  }
}
