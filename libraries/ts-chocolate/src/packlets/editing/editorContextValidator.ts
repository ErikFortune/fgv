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

import { Converter, Result, Success } from '@fgv/ts-utils';
import { IEditorContextValidator, IValidationReport } from './model';
import { EditorContext } from './editorContext';
import { ValidationReportBuilder } from './validation';

// ============================================================================
// Editor Context Validator Parameters
// ============================================================================

/**
 * Parameters for creating an editor context validator.
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export interface IEditorContextValidatorParams<
  T,
  TBaseId extends string = string,
  TId extends string = string
> {
  /**
   * The editor context to wrap with validation.
   */
  readonly context: EditorContext<T, TBaseId, TId>;

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
// Editor Context Validator Implementation
// ============================================================================

/**
 * Validating wrapper for EditorContext.
 * Provides methods that accept raw (unknown) input, validate using converters,
 * and delegate to the base editor context.
 * Follows the ResultMapValidator pattern from ts-utils.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export class EditorContextValidator<T, TBaseId extends string = string, TId extends string = string>
  implements IEditorContextValidator<T, TBaseId, TId>
{
  private readonly _context: EditorContext<T, TBaseId, TId>;
  private readonly _entityConverter: Converter<T>;
  private readonly _keyConverter: Converter<TBaseId>;

  /**
   * Create an editor context validator.
   * @param params - Validator parameters
   */
  public constructor(params: IEditorContextValidatorParams<T, TBaseId, TId>) {
    this._context = params.context;
    this._entityConverter = params.entityConverter;
    this._keyConverter = params.keyConverter;
  }

  /**
   * Create new entity with validation.
   * Validates the raw entity using the converter, then delegates to the base context.
   * @param baseId - Raw base identifier string, or empty string to auto-generate from entity name
   * @param rawEntity - Raw entity data to validate and create
   * @returns Result containing the generated entity ID or failure
   */
  public create(baseId: string, rawEntity: unknown): Result<TId> {
    return this._entityConverter
      .convert(rawEntity)
      .withErrorFormat((msg) => `Validation failed: ${msg}`)
      .onSuccess((entity) => {
        // Handle empty string as undefined for auto-generation
        if (baseId.trim().length === 0) {
          return this._context.create(undefined, entity);
        }

        // Validate the base ID
        return this._keyConverter
          .convert(baseId)
          .withErrorFormat((msg) => `Invalid base ID: ${msg}`)
          .onSuccess((validBaseId) => this._context.create(validBaseId, entity));
      });
  }

  /**
   * Update existing entity with validation.
   * Validates the raw entity using the converter, then delegates to the base context.
   * @param id - Entity ID
   * @param rawEntity - Raw updated entity data to validate
   * @returns Result indicating success or failure
   */
  public update(id: TId, rawEntity: unknown): Result<T> {
    return this._entityConverter
      .convert(rawEntity)
      .withErrorFormat((msg) => `Validation failed: ${msg}`)
      .onSuccess((entity) => this._context.update(id, entity));
  }

  /**
   * Validate raw entity data using converter and semantic validator.
   * @param rawEntity - Raw entity data to validate
   * @returns Result containing validation report or failure
   */
  public validate(rawEntity: unknown): Result<IValidationReport> {
    const builder = new ValidationReportBuilder();

    // Step 1: Converter validation (type, format, constraints)
    const converterResult = this._entityConverter.convert(rawEntity);
    if (converterResult.isFailure()) {
      builder.addGeneralError(converterResult.message);
      return Success.with(builder.build());
    }

    // Step 2: Delegate to base context for semantic validation
    return this._context.validate(converterResult.value);
  }
}
