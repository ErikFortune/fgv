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

import { Converters, Failure, Result, Success, captureResult } from '@fgv/ts-utils';
import type { Converter } from '@fgv/ts-utils';
import {
  Converters as CommonConverters,
  Helpers as CommonHelpers,
  Validation as CommonValidation,
  CollectionId
} from '../common';
import { IEditorContext, IValidationReport } from './model';
import { EditableCollection } from './editableCollection';
import { ValidationReportBuilder } from './validation';

// ============================================================================
// Editor Context Parameters
// ============================================================================

/**
 * Parameters for creating a base editor context.
 * The base context accepts pre-validated entities and base IDs.
 * For raw input handling, use ValidatingEditorContext.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export interface IEditorContextParams<T, TBaseId extends string = string, TId extends string = string> {
  /**
   * The mutable collection to edit.
   */
  readonly collection: EditableCollection<T, TBaseId>;

  /**
   * Optional semantic validator for cross-field and business rules.
   * Runs on pre-validated entities.
   * @param entity - Pre-validated entity to check
   * @returns Result<true> if valid, failure with message otherwise
   */
  readonly semanticValidator?: (entity: T) => Result<T>;

  /**
   * Converter used to create a composite ID from a `{ collectionId, itemId }` object.
   *
   * @remarks
   * Callers can typically pass the canonical ID converter for the entity type (e.g.
   * `CommonConverters.ingredientId`). The editor context will construct a composite-id
   * object and call this converter.
   */
  readonly createId: Converter<TId>;

  /**
   * Function to extract base ID from entity.
   * Required to support ID generation and uniqueness checking.
   * @param entity - Entity to extract base ID from
   * @returns Base ID or undefined if not set
   */
  readonly getBaseId: (entity: T) => TBaseId | undefined;

  /**
   * Function to extract name from entity.
   * Used for auto-generating base IDs from names.
   * @param entity - Entity to extract name from
   * @returns Entity name
   */
  readonly getName: (entity: T) => string;
}

// ============================================================================
// Editor Context Base Implementation
// ============================================================================

/**
 * Base implementation of IEditorContext.
 * Provides CRUD operations and semantic validation for pre-validated entities.
 * For raw input handling with converter validation, use ValidatingEditorContext.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export class EditorContext<T, TBaseId extends string = string, TId extends string = string>
  implements IEditorContext<T, TBaseId, TId>
{
  private static readonly _parsedEntityId: Converter<{ collectionId: CollectionId; itemId: string }> =
    Converters.compositeId(CommonConverters.collectionId, '.', Converters.string);

  private readonly _collection: EditableCollection<T, TBaseId>;
  private readonly _semanticValidator?: (entity: T) => Result<T>;
  private readonly _createId: Converter<TId>;
  private readonly _getName: (entity: T) => string;
  private _hasUnsavedChanges: boolean = false;

  /**
   * Create an editor context.
   * @param params - Creation parameters
   */
  protected constructor(params: IEditorContextParams<T, TBaseId, TId>) {
    this._collection = params.collection;
    this._semanticValidator = params.semanticValidator;
    this._createId = params.createId;
    this._getName = params.getName;
  }

  /**
   * Create a new editor context.
   * @param params - Creation parameters
   * @returns Result containing the editor context or failure
   */
  public static create<T, TBaseId extends string = string, TId extends string = string>(
    params: IEditorContextParams<T, TBaseId, TId>
  ): Result<EditorContext<T, TBaseId, TId>> {
    if (!params.collection) {
      return Failure.with('Collection is required');
    }

    if (!params.createId) {
      return Failure.with('createId converter is required');
    }

    if (!params.collection.isMutable) {
      return Failure.with(`Collection "${params.collection.collectionId}" is immutable and cannot be edited`);
    }

    return captureResult(() => new EditorContext<T, TBaseId, TId>(params));
  }

  /**
   * Get entity by ID.
   * @param id - Entity ID (composite: collectionId.baseId)
   * @returns Result containing the entity or failure
   */
  public get(id: TId): Result<T> {
    return this._extractBaseId(id).onSuccess((baseId) => this._collection.get(baseId));
  }

  /**
   * Get all entities in the collection.
   * @returns Array of [id, entity] tuples
   */
  public getAll(): ReadonlyArray<[TId, T]> {
    const entries = Array.from(this._collection.entries());
    return entries.map(([baseId, entity]) => [this._createIdFromBaseId(baseId).orThrow(), entity]);
  }

  /**
   * Create new entity with specified base ID.
   * @param baseId - Pre-validated base identifier, or undefined to auto-generate from entity name
   * @param entity - Pre-validated entity data
   * @returns Result containing the generated entity ID or failure
   */
  public create(baseId: TBaseId | undefined, entity: T): Result<TId> {
    const existingKeys = Array.from(this._collection.keys());

    // Run semantic validation if configured
    const semanticResult = this._runSemanticValidation(entity);
    if (semanticResult.isFailure()) {
      return Failure.with(semanticResult.message);
    }

    // Auto-generate base ID if not provided
    return (
      baseId === undefined
        ? CommonHelpers.generateUniqueBaseIdFromName(this._getName(entity), existingKeys).onSuccess(
            (generated: string) => Success.with(generated as TBaseId)
          )
        : Success.with(baseId)
    )
      .onSuccess((finalBaseId: TBaseId) => {
        // Validate base ID is unique
        return CommonValidation.validateUniqueBaseId(finalBaseId, existingKeys).onSuccess(() =>
          Success.with(finalBaseId)
        );
      })
      .onSuccess((finalBaseId: TBaseId) => {
        // Add to collection
        return this._collection.set(finalBaseId, entity).asResult.onSuccess(() => {
          this._hasUnsavedChanges = true;
          return this._createIdFromBaseId(finalBaseId);
        });
      });
  }

  /**
   * Update existing entity.
   * @param id - Entity ID
   * @param entity - Pre-validated updated entity data
   * @returns Result indicating success or failure
   */
  public update(id: TId, entity: T): Result<T> {
    return this._extractBaseId(id).onSuccess((baseId) => {
      // Check entity exists
      if (!this._collection.has(baseId)) {
        return Failure.with(`Entity "${id}" not found in collection "${this._collection.collectionId}"`);
      }

      // Run semantic validation if configured
      const semanticResult = this._runSemanticValidation(entity);
      if (semanticResult.isFailure()) {
        return Failure.with(semanticResult.message);
      }

      // Update in collection
      return this._collection.set(baseId, entity).asResult.onSuccess((updatedEntity) => {
        this._hasUnsavedChanges = true;
        return Success.with(updatedEntity);
      });
    });
  }

  /**
   * Delete entity from collection.
   * @param id - Entity ID
   * @returns Result indicating success or failure
   */
  public delete(id: TId): Result<T> {
    return this._extractBaseId(id).onSuccess((baseId) =>
      this._collection.delete(baseId).asResult.onSuccess((entity) => {
        this._hasUnsavedChanges = true;
        return Success.with(entity);
      })
    );
  }

  /**
   * Copy entity to another collection.
   * This method must be overridden by derived classes that need copy functionality.
   * @param id - Source entity ID
   * @param targetCollectionId - Target collection ID
   * @returns Result containing the new entity ID in target collection or failure
   */
  public copyTo(id: TId, targetCollectionId: CollectionId): Result<TId> {
    return Failure.with('Copy operation not implemented for this entity type');
  }

  /**
   * Check if entity exists in collection.
   * @param id - Entity ID
   * @returns True if entity exists
   */
  public exists(id: TId): boolean {
    const baseId = this._extractBaseId(id);
    return baseId.isSuccess() && this._collection.has(baseId.value);
  }

  /**
   * Validate pre-validated entity using semantic validator.
   * For full validation including converter, use validating.validate().
   * @param entity - Pre-validated entity to check semantic rules
   * @returns Result containing validation report or failure
   */
  public validate(entity: T): Result<IValidationReport> {
    const builder = new ValidationReportBuilder();

    // Run semantic validation (cross-field, business rules)
    if (this._semanticValidator) {
      const semanticResult = this._semanticValidator(entity);
      if (semanticResult.isFailure()) {
        builder.addGeneralError(semanticResult.message);
      }
    }

    return Success.with(builder.build());
  }

  /**
   * Check if there are unsaved changes.
   * @returns True if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return this._hasUnsavedChanges;
  }

  /**
   * Clear the unsaved changes flag.
   */
  public clearUnsavedChanges(): void {
    this._hasUnsavedChanges = false;
  }

  /**
   * Get the underlying mutable collection.
   * Useful for derived classes that need direct access.
   * @returns The mutable collection
   */
  /* c8 ignore next 3 - accessor tested through derived classes */
  protected get collection(): EditableCollection<T, TBaseId> {
    return this._collection;
  }

  /**
   * Extract base ID from composite entity ID.
   * Assumes format: collectionId.baseId
   * @param id - Composite entity ID
   * @returns Base ID
   */
  private _extractBaseId(id: TId): Result<TBaseId> {
    return EditorContext._parsedEntityId.convert(id).onSuccess((parsed) => {
      return Success.with(parsed.itemId as TBaseId);
    });
  }

  private _createIdFromBaseId(baseId: TBaseId): Result<TId> {
    return this._createId
      .convert({ collectionId: this._collection.collectionId, itemId: baseId })
      .withErrorFormat((msg) => `Failed to create entity id: ${msg}`);
  }

  /**
   * Run semantic validation on a pre-validated entity.
   * @param entity - Pre-validated entity to check
   * @returns Result<void> if valid, failure with message otherwise
   */
  private _runSemanticValidation(entity: T): Result<T> {
    if (this._semanticValidator) {
      return this._semanticValidator(entity).withErrorFormat((msg) => `Semantic validation failed: ${msg}`);
    }
    return Success.with(entity);
  }
}
