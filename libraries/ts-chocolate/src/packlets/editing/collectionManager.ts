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
import { CollectionId, Helpers as CommonHelpers } from '../common';
import {
  ICollectionFileMetadata,
  ICollectionSourceFile,
  ICollectionRuntimeMetadata,
  SubLibraryBase
} from '../library-data';
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
const validatedMetadataConverter: Converter<ICollectionFileMetadata> =
  Converters.object<ICollectionFileMetadata>({
    name: trimmedNonEmptyString(200, 'Collection name').optional(),
    description: maxLengthString(2000, 'Collection description').optional(),
    secretName: trimmedNonEmptyString(100, 'Secret name').optional(),
    variation: Converters.string.optional(),
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
  public getAll(): ReadonlyArray<CollectionId> {
    return Array.from(this._library.collections.keys());
  }

  /**
   * Get metadata for a specific collection by ID.
   */
  public get(collectionId: CollectionId): Result<ICollectionRuntimeMetadata> {
    return this._library.collections
      .get(collectionId)
      .asResult.onFailure(() => fail(`Collection "${collectionId}" not found`))
      .onSuccess((collection) => {
        if (collection.metadata === undefined) {
          return fail(`Collection "${collectionId}" has no metadata`);
        }
        return succeed(collection.metadata);
      });
  }

  /**
   * Create a new mutable collection.
   */
  public create(
    collectionId: CollectionId,
    metadata: ICollectionFileMetadata
  ): Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>> {
    // Check if collection already exists
    if (this._library.collections.has(collectionId)) {
      return fail(`Collection "${collectionId}" already exists`);
    }

    // Validate metadata and inject sourceName from the library's mutable source
    return this._validateMetadata(metadata).onSuccess((validatedMetadata) => {
      const runtimeMetadata: ICollectionRuntimeMetadata = {
        ...validatedMetadata,
        /* c8 ignore next 1 - both branches tested independently; c8 tracks ?? branches per-line */
        sourceName: this._library.mutableSourceName ?? 'unknown'
      };
      return this._library.addCollectionEntry({
        id: collectionId,
        isMutable: true,
        items: {},
        metadata: runtimeMetadata
      });
    });
  }

  /**
   * Create a new mutable collection with a backing YAML file on disk.
   *
   * Creates both the in-memory collection and a YAML file in the library's
   * mutable data directory, enabling `EditableCollection.save()` to work.
   *
   * @param collectionId - ID for the new collection
   * @param metadata - Collection metadata (name, description, etc.)
   * @returns Success with the collection entry, or Failure if creation fails
   */
  public createWithFile(
    collectionId: CollectionId,
    metadata: ICollectionFileMetadata
  ): Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>> {
    // Create the in-memory collection first
    return this.create(collectionId, metadata).onSuccess((entry) => {
      // Build initial YAML content: file metadata (no sourceName) + empty items
      const sourceFile: ICollectionSourceFile = {
        metadata,
        items: {}
      };
      return CommonHelpers.serializeToYaml(sourceFile)
        .withErrorFormat((msg) => `Failed to serialize collection: ${msg}`)
        .onSuccess((yamlContent) =>
          this._library.createCollectionFile(collectionId, yamlContent).onSuccess(() => succeed(entry))
        )
        .onFailure((msg) => {
          // Roll back the in-memory collection on file creation failure
          this._library.removeCollection(collectionId);
          return fail(msg);
        });
    });
  }

  /**
   * Delete a mutable collection.
   */
  public delete(
    collectionId: CollectionId
  ): Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>> {
    // Delegate to public method
    return this._library.removeCollection(collectionId);
  }

  /**
   * Update collection metadata.
   */
  public updateMetadata(
    collectionId: CollectionId,
    metadata: Partial<ICollectionRuntimeMetadata>
  ): Result<ICollectionRuntimeMetadata> {
    // Delegate to public method
    return this._library.updateCollectionMetadata(collectionId, metadata);
  }

  /**
   * Check if a collection exists.
   */
  public exists(collectionId: CollectionId): boolean {
    return this._library.collections.has(collectionId);
  }

  /**
   * Check if a collection is mutable.
   */
  public isMutable(collectionId: CollectionId): Result<boolean> {
    return this._library.collections
      .get(collectionId)
      .asResult.onFailure(() => fail(`Collection "${collectionId}" not found`))
      .onSuccess((collection) => succeed(collection.isMutable));
  }

  /**
   * Delete an entity from its owning collection.
   * @param compositeId - Composite entity ID (collectionId.baseId)
   * @returns Result containing the deleted entity or failure
   */
  public deleteEntity(compositeId: string): Result<unknown> {
    return this._splitCompositeId(compositeId).onSuccess(({ collectionId, baseId }) =>
      this._library.collections
        .get(collectionId)
        .asResult.withErrorFormat((msg) => `Collection "${collectionId}" not found: ${msg}`)
        .onSuccess((collection) => {
          if (!collection.isMutable) {
            return fail(`Cannot delete from immutable collection "${collectionId}"`);
          }
          return collection.items
            .delete(baseId as TBaseId)
            .asResult.withErrorFormat((msg: string) => `Failed to delete "${compositeId}": ${msg}`);
        })
    );
  }

  /**
   * Copy an entity to another collection.
   * @param compositeId - Source composite entity ID (collectionId.baseId)
   * @param targetCollectionId - Target collection ID
   * @param newBaseId - Optional new base ID; defaults to source base ID
   * @returns Result containing the new composite ID or failure
   */
  public copyEntity(
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ): Result<string> {
    return this._splitCompositeId(compositeId).onSuccess(({ collectionId, baseId }) =>
      this._library.collections
        .get(collectionId)
        .asResult.withErrorFormat((msg) => `Source collection "${collectionId}" not found: ${msg}`)
        .onSuccess((sourceCollection) =>
          sourceCollection.items.get(baseId as TBaseId).asResult.onSuccess((entity: TItem) =>
            this._library.collections
              .get(targetCollectionId)
              .asResult.withErrorFormat(
                (msg) => `Target collection "${targetCollectionId}" not found: ${msg}`
              )
              .onSuccess((targetCollection) => {
                if (!targetCollection.isMutable) {
                  return fail(`Cannot copy to immutable collection "${targetCollectionId}"`);
                }
                const destBaseId = (newBaseId ?? baseId) as TBaseId;
                if (targetCollection.items.has(destBaseId)) {
                  return fail(`Entity "${destBaseId}" already exists in collection "${targetCollectionId}"`);
                }
                return targetCollection.items
                  .set(destBaseId, entity)
                  .asResult.onSuccess(() => succeed(`${targetCollectionId}.${destBaseId}`));
              })
          )
        )
    );
  }

  /**
   * Move an entity to another collection (copy + delete).
   * Does NOT update cross-entity references — callers must handle that separately.
   * @param compositeId - Source composite entity ID (collectionId.baseId)
   * @param targetCollectionId - Target collection ID
   * @param newBaseId - Optional new base ID; defaults to source base ID
   * @returns Result containing the new composite ID or failure
   */
  public moveEntity(
    compositeId: string,
    targetCollectionId: CollectionId,
    newBaseId?: string
  ): Result<string> {
    return this.copyEntity(compositeId, targetCollectionId, newBaseId).onSuccess((newCompositeId) =>
      this.deleteEntity(compositeId).onSuccess(() => succeed(newCompositeId))
    );
  }

  /**
   * Validate collection metadata for creation.
   */
  private _validateMetadata(metadata: ICollectionFileMetadata): Result<ICollectionFileMetadata> {
    return validatedMetadataConverter.convert(metadata).onFailure((msg) => fail(`Invalid metadata: ${msg}`));
  }

  /**
   * Split a composite ID into collectionId and baseId parts.
   */
  private _splitCompositeId(compositeId: string): Result<{ collectionId: CollectionId; baseId: string }> {
    const dotIndex = compositeId.indexOf('.');
    if (dotIndex < 1 || dotIndex === compositeId.length - 1) {
      return fail(`Invalid composite ID "${compositeId}": expected "collectionId.baseId" format`);
    }
    const collectionId = compositeId.slice(0, dotIndex) as CollectionId;
    const baseId = compositeId.slice(dotIndex + 1);
    return succeed({ collectionId, baseId });
  }
}
