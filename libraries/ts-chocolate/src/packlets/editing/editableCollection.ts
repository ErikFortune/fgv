// Copyright (c) 2024 Erik Fortune
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

import {
  Collections,
  Converter,
  DetailedFailure,
  DetailedResult,
  Failure,
  Result,
  Success,
  ValidatingResultMap
} from '@fgv/ts-utils';
import { SourceId } from '../common';
import { ICollectionSourceFile, ICollectionSourceMetadata } from '../library-data';

// ============================================================================
// Parameters for Creating Editable Collections
// ============================================================================

/**
 * Parameters for creating an editable collection.
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @public
 */
export interface IEditableCollectionParams<T, TBaseId extends string = string> {
  /**
   * Collection identifier.
   */
  readonly collectionId: SourceId;

  /**
   * Collection metadata (name, description, etc.).
   */
  readonly metadata: ICollectionSourceMetadata;

  /**
   * Whether this collection is mutable.
   * If false, all mutation operations will fail.
   */
  readonly isMutable: boolean;

  /**
   * Initial items in the collection.
   * Map of base ID to entity.
   */
  readonly initialItems: ReadonlyMap<TBaseId, T>;

  /**
   * Converter for validating base ID keys.
   */
  readonly keyConverter: Converter<TBaseId, unknown>;

  /**
   * Converter for validating values.
   */
  readonly valueConverter: Converter<T, unknown>;
}

// ============================================================================
// Editable Collection Implementation
// ============================================================================

/**
 * An extension of ValidatingResultMap that adds collection metadata,
 * mutability control, and export functionality for entity editing workflows.
 *
 * Inherits all ValidatingResultMap functionality but gates mutation
 * operations behind an isMutable check.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class EditableCollection<
  T,
  TBaseId extends string = string,
  TId extends string = string
> extends ValidatingResultMap<TBaseId, T> {
  /**
   * Collection identifier.
   */
  public readonly collectionId: SourceId;

  /**
   * Whether collection is mutable.
   */
  public readonly isMutable: boolean;

  private _metadata: ICollectionSourceMetadata;

  /**
   * Create an editable collection.
   * Use the static `createEditable` method for proper initialization.
   */
  private constructor(
    collectionId: SourceId,
    isMutable: boolean,
    metadata: ICollectionSourceMetadata,
    params: Collections.IValidatingResultMapConstructorParams<TBaseId, T>
  ) {
    super(params);
    this.collectionId = collectionId;
    this.isMutable = isMutable;
    this._metadata = { ...metadata };
  }

  /**
   * Create a new editable collection.
   * @param params - Creation parameters
   * @returns Result containing the editable collection or failure
   */
  public static createEditable<T, TBaseId extends string = string, TId extends string = string>(
    params: IEditableCollectionParams<T, TBaseId>
  ): Result<EditableCollection<T, TBaseId, TId>> {
    if (!params.collectionId) {
      return Failure.with('Collection ID is required');
    }

    // Create key-value converters
    const converters = new Collections.KeyValueConverters<TBaseId, T>({
      key: params.keyConverter,
      value: params.valueConverter
    });

    // Convert initial items to entries
    const entries = Array.from(params.initialItems.entries());

    return Success.with(
      new EditableCollection<T, TBaseId, TId>(params.collectionId, params.isMutable, params.metadata, {
        entries,
        converters
      })
    );
  }

  // ==========================================================================
  // Metadata and Export (new functionality)
  // ==========================================================================

  /**
   * Collection metadata.
   */
  public get metadata(): ICollectionSourceMetadata {
    return { ...this._metadata };
  }

  /**
   * Update collection metadata.
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  public updateMetadata(metadata: Partial<ICollectionSourceMetadata>): Result<void> {
    if (!this.isMutable) {
      return Failure.with(`Collection "${this.collectionId}" is immutable and cannot be modified`);
    }

    this._metadata = {
      ...this._metadata,
      ...metadata
    };
    return Success.with(undefined);
  }

  /**
   * Export collection to ICollectionSourceFile format.
   * @returns Result containing collection source file or failure
   */
  public export(): Result<ICollectionSourceFile<T>> {
    // Convert Map to Record for export
    const itemsRecord: Record<TBaseId, T> = {} as Record<TBaseId, T>;
    for (const [baseId, item] of this.entries()) {
      itemsRecord[baseId] = item;
    }

    const sourceFile: ICollectionSourceFile<T> = {
      metadata: this.metadata,
      items: itemsRecord
    };

    return Success.with(sourceFile);
  }

  // ==========================================================================
  // Override mutation methods to check isMutable
  // ==========================================================================

  /**
   * Helper to verify mutability before performing operation.
   * @param op - Operation to perform if mutable
   * @returns
   */
  private _applyIfMutable<T>(
    op: () => DetailedResult<T, Collections.ResultMapResultDetail>
  ): DetailedResult<T, Collections.ResultMapResultDetail> {
    if (!this.isMutable) {
      return DetailedFailure.with<T, Collections.ResultMapResultDetail>(
        `Collection "${this.collectionId}" is immutable and cannot be modified`
      );
    }
    return op();
  }

  /**
   * Add or update item in collection.
   * Fails if collection is immutable.
   */
  public override set(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.set(key, value));
  }

  /**
   * Add item only if key doesn't exist.
   * Fails if collection is immutable.
   */
  public override add(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.add(key, value));
  }

  /**
   * Update item only if key exists.
   * Fails if collection is immutable.
   */
  public override update(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.update(key, value));
  }

  /**
   * Delete item from collection.
   * Fails if collection is immutable.
   */
  public override delete(key: TBaseId): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.delete(key));
  }

  /**
   * Clear all items from collection.
   * Fails if collection is immutable.
   */
  public override clear(): Result<boolean> {
    return this._applyIfMutable(() => {
      super.clear();
      return Success.with(true).withDetail('success');
    });
  }
}
