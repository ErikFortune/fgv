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
 * Collection manager implementation for collection-level CRUD operations
 * @packageDocumentation
 */

import { Collections, Converter, Converters, fail, Result, succeed } from '@fgv/ts-utils';
import { SourceId } from '../common';
import { ICollectionSourceMetadata, SubLibraryBase } from '../library-data';
import { ICollectionManager } from './model';

/**
 * Validates that a string is non-empty after trimming and has no leading/trailing whitespace.
 * @param maxLength - Maximum allowed length for the string
 * @param fieldName - Name of the field for error messages
 * @returns A converter that validates the string
 */
function trimmedNonEmptyString(maxLength: number, fieldName: string): Converter<string> {
  return Converters.generic<string>((from: unknown): Result<string> => {
    return Converters.string.convert(from).onSuccess((str) => {
      const trimmed = str.trim();
      if (trimmed === '') {
        return fail(`${fieldName} cannot be empty`);
      }
      if (str !== trimmed) {
        return fail(`${fieldName} cannot have leading or trailing whitespace`);
      }
      if (str.length > maxLength) {
        return fail(`${fieldName} exceeds ${maxLength} characters`);
      }
      return succeed(str);
    });
  });
}

/**
 * Validates that a string does not exceed a maximum length.
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns A converter that validates the string length
 */
function maxLengthString(maxLength: number, fieldName: string): Converter<string> {
  return Converters.generic<string>((from: unknown): Result<string> => {
    return Converters.string.convert(from).onSuccess((str) => {
      if (str.length > maxLength) {
        return fail(`${fieldName} exceeds ${maxLength} characters`);
      }
      return succeed(str);
    });
  });
}

/**
 * Converter for validating collection metadata with business rules:
 * - name: required, trimmed, non-empty, max 200 characters, no leading/trailing whitespace
 * - description: optional, max 2000 characters
 * - secretName: optional, trimmed, non-empty if provided, max 100 characters
 * - version: optional string
 * - tags: optional array of strings
 */
const validatedMetadataConverter: Converter<ICollectionSourceMetadata> =
  Converters.object<ICollectionSourceMetadata>({
    name: trimmedNonEmptyString(200, 'Collection name').optional(),
    description: maxLengthString(2000, 'Collection description').optional(),
    secretName: trimmedNonEmptyString(100, 'Secret name').optional(),
    version: Converters.string.optional(),
    tags: Converters.arrayOf(Converters.string).optional()
  });

/**
 * Implementation of collection management operations.
 * Wraps a SubLibraryBase instance to provide collection-level CRUD.
 *
 * @typeParam TCompositeId - Composite ID type (e.g., IngredientId)
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TItem - Item type (e.g., Ingredient)
 * @public
 */
export class CollectionManager<TCompositeId extends string, TBaseId extends string, TItem>
  implements ICollectionManager
{
  /**
   * The underlying sub-library being managed.
   */
  private readonly _library: SubLibraryBase<TCompositeId, TBaseId, TItem>;

  /**
   * Creates a new CollectionManager.
   * @param library - The sub-library to manage
   */
  public constructor(library: SubLibraryBase<TCompositeId, TBaseId, TItem>) {
    this._library = library;
  }

  /**
   * Get all collection IDs in the library.
   */
  public getAll(): ReadonlyArray<SourceId> {
    return Array.from(this._library.collections.keys());
  }

  /**
   * Get metadata for a specific collection by ID.
   */
  public get(collectionId: SourceId): Result<ICollectionSourceMetadata> {
    return this._library.collections
      .get(collectionId)
      .asResult.onFailure(() => fail(`Collection "${collectionId}" not found`))
      .onSuccess((collection) => {
        // Return actual metadata from the collection entry, or empty object if not set
        return succeed(collection.metadata ?? {});
      });
  }

  /**
   * Create a new mutable collection.
   */
  public create(
    collectionId: SourceId,
    metadata: ICollectionSourceMetadata
  ): Result<Collections.AggregatedResultMapEntry<SourceId, TBaseId, TItem, ICollectionSourceMetadata>> {
    // Check if collection already exists
    if (this._library.collections.has(collectionId)) {
      return fail(`Collection "${collectionId}" already exists`);
    }

    // Validate metadata
    return this._validateMetadata(metadata).onSuccess((validatedMetadata) => {
      // Create empty collection entry with metadata
      return this._library.addCollectionEntry({
        id: collectionId,
        isMutable: true,
        items: {},
        metadata: validatedMetadata
      });
    });
  }

  /**
   * Delete a mutable collection.
   */
  public delete(
    collectionId: SourceId
  ): Result<Collections.AggregatedResultMapEntry<SourceId, TBaseId, TItem, ICollectionSourceMetadata>> {
    // Delegate to public method
    return this._library.removeCollection(collectionId);
  }

  /**
   * Update collection metadata.
   */
  public updateMetadata(
    collectionId: SourceId,
    metadata: Partial<ICollectionSourceMetadata>
  ): Result<ICollectionSourceMetadata> {
    // Delegate to public method
    return this._library.updateCollectionMetadata(collectionId, metadata);
  }

  /**
   * Check if a collection exists.
   */
  public exists(collectionId: SourceId): boolean {
    return this._library.collections.has(collectionId);
  }

  /**
   * Check if a collection is mutable.
   */
  public isMutable(collectionId: SourceId): Result<boolean> {
    return this._library.collections
      .get(collectionId)
      .asResult.onFailure(() => fail(`Collection "${collectionId}" not found`))
      .onSuccess((collection) => succeed(collection.isMutable));
  }

  /**
   * Validate collection metadata for creation.
   */
  private _validateMetadata(metadata: ICollectionSourceMetadata): Result<ICollectionSourceMetadata> {
    return validatedMetadataConverter.convert(metadata).onFailure((msg) => fail(`Invalid metadata: ${msg}`));
  }
}
