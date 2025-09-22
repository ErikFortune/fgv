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

import { Result, captureResult } from '@fgv/ts-utils';
import { QualifierContextValue, Convert as CommonConverters } from '../../common';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import {
  IContextQualifierProvider,
  IReadOnlyContextQualifierProvider,
  IMutableContextQualifierProvider
} from './contextQualifierProvider';

/**
 * Base interface for shared operations between read-only and mutable context qualifier provider validators.
 * Contains common methods that don't depend on provider mutability.
 * @public
 */
export interface IContextQualifierProviderValidatorBase {
  /**
   * The wrapped context qualifier provider.
   */
  readonly provider: IContextQualifierProvider;

  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
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
}

/**
 * A read-only interface for validators wrapping read-only context qualifier providers.
 * Only exposes read operations, providing compile-time type safety by excluding mutation methods.
 * @public
 */
export interface IReadOnlyContextQualifierProviderValidator extends IContextQualifierProviderValidatorBase {
  /**
   * The wrapped read-only context qualifier provider.
   */
  readonly provider: IReadOnlyContextQualifierProvider;
}

/**
 * A mutable interface for validators wrapping mutable context qualifier providers.
 * Extends the base interface with mutation operations and provides compile-time type safety.
 * @public
 */
export interface IMutableContextQualifierProviderValidator extends IContextQualifierProviderValidatorBase {
  /**
   * The wrapped mutable context qualifier provider.
   */
  readonly provider: IMutableContextQualifierProvider;

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
 * Parameters for constructing a read-only context qualifier provider validator.
 * @public
 */
export interface IReadOnlyContextQualifierProviderValidatorCreateParams {
  provider: IReadOnlyContextQualifierProvider;
}

/**
 * Parameters for constructing a mutable context qualifier provider validator.
 * @public
 */
export interface IMutableContextQualifierProviderValidatorCreateParams {
  provider: IMutableContextQualifierProvider;
}

/**
 * Union type for validator constructor parameters.
 * @public
 */
export type IContextQualifierProviderValidatorCreateParams =
  | IReadOnlyContextQualifierProviderValidatorCreateParams
  | IMutableContextQualifierProviderValidatorCreateParams;

/**
 * Base implementation class containing shared validation logic for both read-only and mutable validators.
 * @internal
 */
abstract class BaseContextQualifierProviderValidator implements IContextQualifierProviderValidatorBase {
  /**
   * The wrapped context qualifier provider.
   */
  public abstract readonly provider: IContextQualifierProvider;

  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
   */
  public get qualifiers(): IReadOnlyQualifierCollector {
    return this.provider.qualifiers;
  }

  /**
   * Gets a qualifier value by its string name, converting to strongly-typed QualifierName.
   * @param name - The string name to convert and look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  public get(name: string): Result<QualifierContextValue> {
    return CommonConverters.qualifierName.convert(name).onSuccess((qualifierName) => {
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
    return CommonConverters.qualifierIndex.convert(index).onSuccess((qualifierIndex) => {
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
    return CommonConverters.qualifierName.convert(name).onSuccess((qualifierName) => {
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
    return CommonConverters.qualifierIndex.convert(index).onSuccess((qualifierIndex) => {
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
    return CommonConverters.qualifierName.convert(name).onSuccess((qualifierName) => {
      return this.provider.has(qualifierName);
    });
  }
}

/**
 * A validator for read-only context qualifier providers that accepts string inputs
 * and converts them to strongly-typed values before calling the wrapped provider.
 * Only provides read operations for compile-time type safety.
 * @public
 */
export class ReadOnlyContextQualifierProviderValidator
  extends BaseContextQualifierProviderValidator
  implements IReadOnlyContextQualifierProviderValidator
{
  /**
   * The wrapped read-only context qualifier provider.
   */
  public readonly provider: IReadOnlyContextQualifierProvider;

  /**
   * Constructs a new {@link Runtime.Context.ReadOnlyContextQualifierProviderValidator | ReadOnlyContextQualifierProviderValidator}.
   * @param params - Required parameters for constructing the validator.
   */
  public constructor(params: IReadOnlyContextQualifierProviderValidatorCreateParams) {
    super();
    this.provider = params.provider;
  }
}

/**
 * A validator for mutable context qualifier providers that accepts string inputs
 * and converts them to strongly-typed values before calling the wrapped provider.
 * Provides both read and mutation operations.
 * @public
 */
export class MutableContextQualifierProviderValidator
  extends BaseContextQualifierProviderValidator
  implements IMutableContextQualifierProviderValidator
{
  /**
   * The wrapped mutable context qualifier provider.
   */
  public readonly provider: IMutableContextQualifierProvider;

  /**
   * Constructs a new {@link Runtime.Context.MutableContextQualifierProviderValidator | MutableContextQualifierProviderValidator}.
   * @param params - Required parameters for constructing the validator.
   */
  public constructor(params: IMutableContextQualifierProviderValidatorCreateParams) {
    super();
    this.provider = params.provider;
  }

  /**
   * Sets a qualifier value using string inputs, converting to strongly-typed values.
   * @param name - The string name to convert.
   * @param value - The string value to convert.
   * @returns `Success` with the set {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  public set(name: string, value: string): Result<QualifierContextValue> {
    return CommonConverters.qualifierName.convert(name).onSuccess((qualifierName) =>
      CommonConverters.qualifierContextValue.convert(value).onSuccess((qualifierValue) => {
        return captureResult(() => this.provider.set(qualifierName, qualifierValue)).onSuccess(
          (result) => result
        );
      })
    );
  }

  /**
   * Removes a qualifier value using string input, converting to strongly-typed QualifierName.
   * @param name - The string name to convert.
   * @returns `Success` with the removed {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if an error occurs.
   */
  public remove(name: string): Result<QualifierContextValue> {
    return CommonConverters.qualifierName.convert(name).onSuccess((qualifierName) => {
      return captureResult(() => this.provider.remove(qualifierName)).onSuccess((result) => result);
    });
  }
}

/**
 * Factory class for creating appropriate validator types based on provider mutability.
 * Provides type-safe factory methods with compile-time type discrimination.
 * @public
 */
export class ContextQualifierProviderValidators {
  /**
   * Creates the appropriate validator type based on the provider's mutability.
   * @param provider - The context qualifier provider to wrap.
   * @returns A read-only validator for read-only providers, or a mutable validator for mutable providers.
   */
  public static create<T extends IContextQualifierProvider>(
    provider: T
  ): T extends IMutableContextQualifierProvider
    ? MutableContextQualifierProviderValidator
    : ReadOnlyContextQualifierProviderValidator {
    if (provider.mutable) {
      return new MutableContextQualifierProviderValidator({
        provider: provider as IMutableContextQualifierProvider
      }) as T extends IMutableContextQualifierProvider
        ? MutableContextQualifierProviderValidator
        : ReadOnlyContextQualifierProviderValidator;
    } else {
      return new ReadOnlyContextQualifierProviderValidator({
        provider: provider as IReadOnlyContextQualifierProvider
      }) as T extends IMutableContextQualifierProvider
        ? MutableContextQualifierProviderValidator
        : ReadOnlyContextQualifierProviderValidator;
    }
  }

  /**
   * Creates a read-only validator for a read-only provider.
   * @param provider - The read-only context qualifier provider to wrap.
   * @returns A read-only validator.
   */
  public static createReadOnly(
    provider: IReadOnlyContextQualifierProvider
  ): ReadOnlyContextQualifierProviderValidator {
    return new ReadOnlyContextQualifierProviderValidator({ provider });
  }

  /**
   * Creates a mutable validator for a mutable provider.
   * @param provider - The mutable context qualifier provider to wrap.
   * @returns A mutable validator.
   */
  public static createMutable(
    provider: IMutableContextQualifierProvider
  ): MutableContextQualifierProviderValidator {
    return new MutableContextQualifierProviderValidator({ provider });
  }
}
