/* c8 ignore start - This file contains only type definitions with no executable code */
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
import { Collections, Result, ValidatingResultMap } from '@fgv/ts-utils';
import { ICollectionSourceFile, ICollectionSourceMetadata } from '../library-data';
import { CollectionId } from '../common';

// ============================================================================
// Core Editing Interfaces
// ============================================================================

/**
 * Generic editor context for entity collections.
 * Provides CRUD operations and validation for pre-validated entities in a collection.
 * For raw input handling, use {@link Editing.IValidatingEditorContext}.
 *
 * @typeParam T - Entity type (Ingredient, IFillingRecipe, etc.)
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export interface IEditorContext<T, TBaseId extends string = string, TId extends string = string> {
  /**
   * Get entity by ID.
   * @param id - Entity ID
   * @returns Result containing the entity or failure
   */
  readonly get: (id: TId) => Result<T>;

  /**
   * Get all entities in the collection.
   * @returns Array of [id, entity] tuples
   */
  readonly getAll: () => ReadonlyArray<[TId, T]>;

  /**
   * Create new entity with specified base ID.
   * @param baseId - Pre-validated base identifier, or undefined to auto-generate from entity name
   * @param entity - Pre-validated entity data
   * @returns Result containing the generated entity ID or failure
   */
  readonly create: (baseId: TBaseId | undefined, entity: T) => Result<TId>;

  /**
   * Update existing entity.
   * @param id - Entity ID
   * @param entity - Pre-validated updated entity data
   * @returns Result indicating success or failure
   */
  readonly update: (id: TId, entity: T) => Result<T>;

  /**
   * Delete entity from collection.
   * @param id - Entity ID
   * @returns Result indicating success or failure
   */
  readonly delete: (id: TId) => Result<T>;

  /**
   * Copy entity to another collection.
   * @param id - Source entity ID
   * @param targetCollectionId - Target collection ID
   * @returns Result containing the new entity ID in target collection or failure
   */
  readonly copyTo: (id: TId, targetCollectionId: CollectionId) => Result<TId>;

  /**
   * Check if entity exists in collection.
   * @param id - Entity ID
   * @returns True if entity exists
   */
  readonly exists: (id: TId) => boolean;

  /**
   * Validate pre-validated entity using semantic validator.
   * @param entity - Pre-validated entity to check semantic rules
   * @returns Result containing validation report or failure
   */
  readonly validate: (entity: T) => Result<IValidationReport>;

  /**
   * Check if there are unsaved changes.
   * @returns True if there are unsaved changes
   */
  readonly hasUnsavedChanges: () => boolean;

  /**
   * Clear the unsaved changes flag.
   * Typically called after successful export or when user discards changes.
   */
  readonly clearUnsavedChanges: () => void;
}

/**
 * Validating wrapper interface for editor context.
 * Provides methods that accept raw (unknown) input, validate using converters,
 * and delegate to the base editor context.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId) - used for type consistency with implementation
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TBaseId kept for type consistency with implementation class
export interface IEditorContextValidator<T, TBaseId extends string = string, TId extends string = string> {
  /**
   * Create new entity with validation.
   * @param baseId - Raw base identifier string, or empty string to auto-generate from entity name
   * @param rawEntity - Raw entity data to validate and create
   * @returns Result containing the generated entity ID or failure
   */
  readonly create: (baseId: string, rawEntity: unknown) => Result<TId>;

  /**
   * Update existing entity with validation.
   * @param id - Entity ID
   * @param rawEntity - Raw updated entity data to validate
   * @returns Result indicating success or failure
   */
  readonly update: (id: TId, rawEntity: unknown) => Result<T>;

  /**
   * Validate raw entity data using converter and semantic validator.
   * @param rawEntity - Raw entity data to validate
   * @returns Result containing validation report or failure
   */
  readonly validate: (rawEntity: unknown) => Result<IValidationReport>;
}

/**
 * Editor context with validating wrapper access.
 * Combines base editor context with a validating property for raw input handling.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export interface IValidatingEditorContext<T, TBaseId extends string = string, TId extends string = string>
  extends IEditorContext<T, TBaseId, TId> {
  /**
   * Access validating methods that accept raw input.
   * Methods on this property validate using converters before delegating to base methods.
   */
  readonly validating: IEditorContextValidator<T, TBaseId, TId>;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation report with detailed field-level errors.
 * Provides comprehensive validation feedback for entity data.
 * @public
 */
export interface IValidationReport {
  /**
   * Overall validation result.
   * True if all validations passed, false if any failed.
   */
  readonly isValid: boolean;

  /**
   * Field-level validation errors.
   * Map of field path to error message.
   */
  readonly fieldErrors: ReadonlyMap<string, string>;

  /**
   * General validation errors not specific to a single field.
   * Used for cross-field validations and collection-level constraints.
   */
  readonly generalErrors: ReadonlyArray<string>;
}

// ============================================================================
// Editable Collection Interface
// ============================================================================

/**
 * Editable collection wrapper.
 * Wraps a ValidatingResultMap with metadata and export functionality
 * for entity editing workflows.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId, for type compatibility)
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IEditableCollection<T, TBaseId extends string = string, TId extends string = string>
  extends ValidatingResultMap<TBaseId, T> {
  /**
   * Collection identifier.
   */
  readonly collectionId: CollectionId;

  /**
   * Collection metadata (name, description, etc.).
   */
  readonly metadata: ICollectionSourceMetadata;

  /**
   * Whether this collection is mutable.
   * Immutable collections cannot be modified.
   */
  readonly isMutable: boolean;

  /**
   * All items in the collection.
   * Map of base ID to entity.
   */
  readonly items: ReadonlyMap<TBaseId, T>;

  /**
   * Remove item from collection.
   * @param baseId - Base identifier of item to remove
   * @returns Result indicating success or failure
   */
  readonly remove: (baseId: TBaseId) => Result<T>;

  /**
   * Update collection metadata.
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  readonly updateMetadata: (metadata: Partial<ICollectionSourceMetadata>) => Result<void>;

  /**
   * Export collection to ICollectionSourceFile format.
   * @returns Result containing collection source file or failure
   */
  readonly export: () => Result<ICollectionSourceFile<T>>;
}

// ============================================================================
// Collection Manager Interface
// ============================================================================

/**
 * Manager for collection-level CRUD operations.
 * Provides operations to create, delete, and rename collections within a sub-library.
 * @public
 */
export interface ICollectionManager<TBaseId extends string = string, TItem = unknown> {
  /**
   * Get all collection IDs in the library.
   * @returns Array of collection IDs
   */
  readonly getAll: () => ReadonlyArray<CollectionId>;

  /**
   * Get metadata for a specific collection by ID.
   * @param collectionId - Collection identifier
   * @returns Result containing the collection metadata or failure
   */
  readonly get: (collectionId: CollectionId) => Result<ICollectionSourceMetadata>;

  /**
   * Create a new mutable collection.
   * @param collectionId - Unique identifier for the new collection
   * @param metadata - Collection metadata (name, description)
   * @returns Result indicating success or failure
   */
  readonly create: (
    collectionId: CollectionId,
    metadata: ICollectionSourceMetadata
  ) => Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem>>;

  /**
   * Delete a mutable collection.
   * @param collectionId - Collection to delete
   * @returns Result indicating success or failure
   */
  readonly delete: (
    collectionId: CollectionId
  ) => Result<Collections.AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionSourceMetadata>>;

  /**
   * Update collection metadata.
   * @param collectionId - Collection to update
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  readonly updateMetadata: (
    collectionId: CollectionId,
    metadata: Partial<ICollectionSourceMetadata>
  ) => Result<ICollectionSourceMetadata>;

  /**
   * Check if a collection exists.
   * @param collectionId - Collection identifier
   * @returns True if collection exists
   */
  readonly exists: (collectionId: CollectionId) => boolean;

  /**
   * Check if a collection is mutable.
   * @param collectionId - Collection identifier
   * @returns Result containing true if mutable, failure if not found
   */
  readonly isMutable: (collectionId: CollectionId) => Result<boolean>;
}

// ============================================================================
// Export/Import Options
// ============================================================================

/**
 * Options for exporting collections.
 * @public
 */
export interface IExportOptions {
  /**
   * Output format for export.
   */
  readonly format: 'yaml' | 'json';

  /**
   * Whether to pretty-print the output.
   * Defaults to true for better readability.
   */
  readonly prettyPrint?: boolean;
}

/**
 * Options for importing collections.
 * @public
 */
export interface IImportOptions {
  /**
   * How to handle existing collection with same ID.
   * - 'replace': Replace existing collection
   * - 'create-new': Create new collection with different ID
   * - 'fail': Fail if collection exists
   */
  readonly onCollisionMode: 'replace' | 'create-new' | 'fail';

  /**
   * New collection ID when using 'create-new' mode.
   * Required if onCollisionMode is 'create-new'.
   */
  readonly newCollectionId?: CollectionId;
}
