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
 * Abstract interface for providing qualifier values in an optimized runtime context.
 * Acts as a property bag using the Result pattern for qualifier value lookups.
 * @public
 */
export interface IContextQualifierProvider {
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
 * Abstract base class for implementing context qualifier providers.
 * Provides common functionality and enforces the contract for derived classes.
 * @public
 */
export abstract class ContextQualifierProvider implements IContextQualifierProvider {
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
