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

import { Result } from '@fgv/ts-utils';
import { QualifierName, QualifierContextValue, QualifierIndex } from '../../common';
import { IReadOnlyQualifierCollector, Qualifier } from '../../qualifiers';

/**
 * Base interface for providing qualifier values in an optimized runtime context.
 * Contains common read-only operations shared by both mutable and immutable providers.
 * Acts as a property bag using the Result pattern for qualifier value lookups.
 * @public
 */
export interface IContextQualifierProviderBase {
  /**
   * Gets a qualifier value by its name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  get(nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier): Result<QualifierContextValue>;

  /**
   * Gets a validated qualifier context value by its name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  getValidated(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierContextValue>;

  /**
   * Checks if a qualifier value exists with the given name.
   * @param name - The {@link QualifierName | qualifier name} to check.
   * @returns `Success` with `true` if the qualifier value exists, `false` if it doesn't,
   * or `Failure` with an error message if an error occurs during the check.
   */
  has(name: QualifierName): Result<boolean>;

  /**
   * Gets all available qualifier names in this context.
   * @returns `Success` with an array of all {@link QualifierName | qualifier names},
   * or `Failure` with an error message if an error occurs.
   */
  getNames(): Result<ReadonlyArray<QualifierName>>;

  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
   */
  readonly qualifiers: IReadOnlyQualifierCollector;
}

/**
 * Read-only interface for providing qualifier values in an optimized runtime context.
 * Explicitly marked as immutable with compile-time type discrimination.
 * @public
 */
export interface IReadOnlyContextQualifierProvider extends IContextQualifierProviderBase {
  /**
   * Explicit mutability marker for compile-time type discrimination.
   * Always `false` for read-only providers.
   */
  readonly mutable: false;
}

/**
 * Mutable interface for providing qualifier values in an optimized runtime context.
 * Extends the base interface with mutation operations and explicit mutability marker.
 * @public
 */
export interface IMutableContextQualifierProvider extends IContextQualifierProviderBase {
  /**
   * Explicit mutability marker for compile-time type discrimination.
   * Always `true` for mutable providers.
   */
  readonly mutable: true;
  /**
   * Sets a qualifier value in this provider.
   * @param name - The {@link QualifierName | qualifier name} to set.
   * @param value - The {@link QualifierContextValue | qualifier context value} to set.
   * @returns `Success` with the set {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if not.
   */
  set(name: QualifierName, value: QualifierContextValue): Result<QualifierContextValue>;

  /**
   * Removes a qualifier value from this provider.
   * @param name - The {@link QualifierName | qualifier name} to remove.
   * @returns `Success` with the removed {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if not found or an error occurs.
   */
  remove(name: QualifierName): Result<QualifierContextValue>;

  /**
   * Clears all qualifier values from this provider.
   */
  clear(): void;
}

/**
 * Union type for context qualifier providers that can be either read-only or mutable.
 * Provides compile-time type discrimination via the `mutable` property.
 * @public
 */
export type IContextQualifierProvider = IReadOnlyContextQualifierProvider | IMutableContextQualifierProvider;

/**
 * Abstract base class for implementing context qualifier providers.
 * Provides common functionality and enforces the contract for derived classes.
 * @public
 */
export abstract class ContextQualifierProvider implements IContextQualifierProviderBase {
  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
   */
  public abstract readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Gets a qualifier value by its name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  public abstract get(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierContextValue>;

  /**
   * Gets a validated qualifier context value by its name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  public abstract getValidated(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierContextValue>;

  /**
   * Checks if a qualifier value exists with the given name.
   * @param name - The {@link QualifierName | qualifier name} to check.
   * @returns `Success` with `true` if the qualifier value exists, `false` if it doesn't,
   * or `Failure` with an error message if an error occurs during the check.
   */
  public abstract has(name: QualifierName): Result<boolean>;

  /**
   * Gets all available qualifier names in this context.
   * @returns `Success` with an array of all {@link QualifierName | qualifier names},
   * or `Failure` with an error message if an error occurs.
   */
  public abstract getNames(): Result<ReadonlyArray<QualifierName>>;
}
