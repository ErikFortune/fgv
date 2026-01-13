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

import { Converter, Failure, Result, captureResult } from '@fgv/ts-utils';
import { IEditorContextValidator, IValidatingEditorContext } from './model';
import { EditableCollection } from './editableCollection';
import { EditorContext, IEditorContextParams } from './editorContext';
import { EditorContextValidator } from './editorContextValidator';

// ============================================================================
// Validating Editor Context Parameters
// ============================================================================

/**
 * Parameters for creating a validating editor context.
 * Extends base editor context params with converter configuration.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export interface IValidatingEditorContextParams<
  T,
  TBaseId extends string = string,
  TId extends string = string
> extends IEditorContextParams<T, TBaseId, TId> {
  /**
   * Converter for entity validation.
   * Handles type validation, required fields, and constraints.
   */
  readonly entityConverter: Converter<T>;

  /**
   * Converter for base ID validation.
   * Validates and converts string input to the base ID type.
   */
  readonly keyConverter: Converter<TBaseId>;
}

// ============================================================================
// Validating Editor Context Implementation
// ============================================================================

/**
 * Editor context with built-in validating wrapper.
 * Combines EditorContext with EditorContextValidator for convenient access to both
 * pre-validated (base) and raw input (validating) methods.
 * Follows the ValidatingResultMap pattern from ts-utils.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export class ValidatingEditorContext<T, TBaseId extends string = string, TId extends string = string>
  extends EditorContext<T, TBaseId, TId>
  implements IValidatingEditorContext<T, TBaseId, TId>
{
  private readonly _validator: EditorContextValidator<T, TBaseId, TId>;

  /**
   * Create a validating editor context.
   * @param params - Creation parameters including converters
   */
  protected constructor(params: IValidatingEditorContextParams<T, TBaseId, TId>) {
    super(params);
    this._validator = new EditorContextValidator<T, TBaseId, TId>({
      context: this,
      entityConverter: params.entityConverter,
      keyConverter: params.keyConverter
    });
  }

  /**
   * Create a new validating editor context.
   * @param params - Creation parameters including converters
   * @returns Result containing the validating editor context or failure
   */
  public static createValidating<T, TBaseId extends string = string, TId extends string = string>(
    params: IValidatingEditorContextParams<T, TBaseId, TId>
  ): Result<ValidatingEditorContext<T, TBaseId, TId>> {
    if (!params.collection) {
      return Failure.with('Collection is required');
    }

    if (!params.collection.isMutable) {
      return Failure.with(`Collection "${params.collection.collectionId}" is immutable and cannot be edited`);
    }

    return captureResult(() => new ValidatingEditorContext<T, TBaseId, TId>(params));
  }

  /**
   * Access validating methods that accept raw input.
   * Methods on this property validate using converters before delegating to base methods.
   *
   * Usage:
   * - context.create(baseId, entity) - base method, requires pre-validated TBaseId and T
   * - context.validating.create(rawId, rawEntity) - validates string and unknown, then delegates
   */
  public get validating(): IEditorContextValidator<T, TBaseId, TId> {
    return this._validator;
  }

  /**
   * Get the underlying mutable collection.
   * Useful for derived classes that need direct access.
   * @returns The mutable collection
   */
  /* c8 ignore next 3 - protected accessor tested through derived classes like IngredientEditorContext */
  protected override get collection(): EditableCollection<T, TBaseId, TId> {
    return super.collection;
  }
}
