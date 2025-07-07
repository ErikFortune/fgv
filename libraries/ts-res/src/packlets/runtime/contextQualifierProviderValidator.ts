/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { QualifierName, QualifierContextValue, QualifierIndex } from '../common';
import { IReadOnlyQualifierCollector } from '../qualifiers';
import { IContextQualifierProvider } from './contextQualifierProvider';

/**
 * A read-only interface exposing non-mutating methods of a {@link Runtime.ContextQualifierProviderValidator | ContextQualifierProviderValidator}.
 * @public
 */
export interface IReadOnlyContextQualifierProviderValidator {
  /**
   * {@inheritdoc Runtime.ContextQualifierProviderValidator.provider}
   */
  readonly provider: IContextQualifierProvider;

  /**
   * {@inheritdoc Runtime.ContextQualifierProviderValidator.qualifiers}
   */
  readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Gets a qualifier value by its string name, converting to strongly-typed QualifierName.
   * @param name - The string name to convert and look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  get(name: string): Result<QualifierContextValue>;

  /**
   * Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.
   * @param index - The number index to convert and look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  getByIndex(index: number): Result<QualifierContextValue>;

  /**
   * Gets a validated qualifier context value by its string name.
   * @param name - The string name to convert and look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  getValidated(name: string): Result<QualifierContextValue>;

  /**
   * Gets a validated qualifier context value by its number index.
   * @param index - The number index to convert and look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  getValidatedByIndex(index: number): Result<QualifierContextValue>;

  /**
   * Checks if a qualifier value exists with the given string name.
   * @param name - The string name to convert and check.
   * @returns `Success` with `true` if the qualifier value exists, `false` if it doesn't,
   * or `Failure` with an error message if an error occurs during the check.
   */
  has(name: string): Result<boolean>;

  /**
   * Sets a qualifier value using string inputs, converting to strongly-typed values.
   * @param name - The string name to convert.
   * @param value - The string value to convert.
   * @returns `Success` with the set {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  set(name: string, value: string): Result<QualifierContextValue>;

  /**
   * Removes a qualifier value using string input, converting to strongly-typed QualifierName.
   * @param name - The string name to convert.
   * @returns `Success` with the removed {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  remove(name: string): Result<QualifierContextValue>;
}

/**
 * Parameters for constructing a {@link Runtime.ContextQualifierProviderValidator | ContextQualifierProviderValidator}.
 * @public
 */
export interface IContextQualifierProviderValidatorCreateParams {
  provider: IContextQualifierProvider;
}

/**
 * A wrapper for {@link Runtime.IContextQualifierProvider | IContextQualifierProvider} that accepts
 * string inputs and converts them to strongly-typed values before calling the wrapped provider.
 * This eliminates the need for type casting in consumer code while maintaining type safety.
 * @public
 */
export class ContextQualifierProviderValidator implements IReadOnlyContextQualifierProviderValidator {
  /**
   * The wrapped context qualifier provider.
   */
  public readonly provider: IContextQualifierProvider;

  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
   */
  public get qualifiers(): IReadOnlyQualifierCollector {
    return this.provider.qualifiers;
  }

  /**
   * Constructs a new {@link Runtime.ContextQualifierProviderValidator | ContextQualifierProviderValidator}.
   * @param params - Required parameters for constructing the validator.
   */
  public constructor(params: IContextQualifierProviderValidatorCreateParams) {
    this.provider = params.provider;
  }

  /**
   * Gets a qualifier value by its string name, converting to strongly-typed QualifierName.
   * @param name - The string name to convert and look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  public get(name: string): Result<QualifierContextValue> {
    return this._validateQualifierName(name).onSuccess((qualifierName) => {
      return this.provider.get(qualifierName);
    });
  }

  /**
   * Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.
   * @param index - The number index to convert and look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  public getByIndex(index: number): Result<QualifierContextValue> {
    return this._validateQualifierIndex(index).onSuccess((qualifierIndex) => {
      return this.provider.get(qualifierIndex);
    });
  }

  /**
   * Gets a validated qualifier context value by its string name.
   * @param name - The string name to convert and look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  public getValidated(name: string): Result<QualifierContextValue> {
    return this._validateQualifierName(name).onSuccess((qualifierName) => {
      return this.provider.getValidated(qualifierName);
    });
  }

  /**
   * Gets a validated qualifier context value by its number index.
   * @param index - The number index to convert and look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  public getValidatedByIndex(index: number): Result<QualifierContextValue> {
    return this._validateQualifierIndex(index).onSuccess((qualifierIndex) => {
      return this.provider.getValidated(qualifierIndex);
    });
  }

  /**
   * Checks if a qualifier value exists with the given string name.
   * @param name - The string name to convert and check.
   * @returns `Success` with `true` if the qualifier value exists, `false` if it doesn't,
   * or `Failure` with an error message if an error occurs during the check.
   */
  public has(name: string): Result<boolean> {
    return this._validateQualifierName(name).onSuccess((qualifierName) => {
      return this.provider.has(qualifierName);
    });
  }

  /**
   * Sets a qualifier value using string inputs, converting to strongly-typed values.
   * @param name - The string name to convert.
   * @param value - The string value to convert.
   * @returns `Success` with the set {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  public set(name: string, value: string): Result<QualifierContextValue> {
    return this._validateQualifierName(name)
      .onSuccess((qualifierName) => this._validateQualifierContextValue(value))
      .onSuccess((qualifierValue) => {
        // Check if the provider has a set method (only available on mutable providers)
        if ('set' in this.provider && typeof this.provider.set === 'function') {
          try {
            return (
              this.provider.set as (
                name: QualifierName,
                value: QualifierContextValue
              ) => Result<QualifierContextValue>
            )(name as QualifierName, qualifierValue);
          } catch {
            return fail(`Provider does not support setting values`);
          }
        }
        return fail(`Provider does not support setting values`);
      });
  }

  /**
   * Removes a qualifier value using string input, converting to strongly-typed QualifierName.
   * @param name - The string name to convert.
   * @returns `Success` with the removed {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  public remove(name: string): Result<QualifierContextValue> {
    return this._validateQualifierName(name).onSuccess((qualifierName) => {
      // Check if the provider has a remove method (only available on mutable providers)
      if ('remove' in this.provider && typeof this.provider.remove === 'function') {
        try {
          return (this.provider.remove as (name: QualifierName) => Result<QualifierContextValue>)(
            qualifierName
          );
        } catch {
          return fail(`Provider does not support removing values`);
        }
      }
      return fail(`Provider does not support removing values`);
    });
  }

  /**
   * Validates a string as a QualifierName.
   * @param name - The string to validate.
   * @returns `Success` with the strongly-typed QualifierName, or `Failure` if invalid.
   */
  private _validateQualifierName(name: string): Result<QualifierName> {
    if (typeof name !== 'string' || name.length === 0) {
      return fail(`Invalid qualifier name: "${name}"`);
    }
    return succeed(name as QualifierName);
  }

  /**
   * Validates a number as a QualifierIndex.
   * @param index - The number to validate.
   * @returns `Success` with the strongly-typed QualifierIndex, or `Failure` if invalid.
   */
  private _validateQualifierIndex(index: number): Result<QualifierIndex> {
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
      return fail(`Invalid qualifier index: ${index}`);
    }
    return succeed(index as QualifierIndex);
  }

  /**
   * Validates a string as a QualifierContextValue.
   * @param value - The string to validate.
   * @returns `Success` with the strongly-typed QualifierContextValue, or `Failure` if invalid.
   */
  private _validateQualifierContextValue(value: string): Result<QualifierContextValue> {
    if (typeof value !== 'string') {
      return fail(`Invalid qualifier context value: "${value}"`);
    }
    return succeed(value as QualifierContextValue);
  }
}
