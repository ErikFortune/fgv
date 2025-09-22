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

import {
  Result,
  ResultMap,
  captureResult,
  succeed,
  fail,
  succeedWithDetail,
  Validators
} from '@fgv/ts-utils';
import {
  QualifierName,
  QualifierContextValue,
  QualifierIndex,
  Validate,
  Convert as CommonConverters
} from '../../common';
import { IReadOnlyQualifierCollector, Qualifier } from '../../qualifiers';
import { ContextQualifierProvider, IMutableContextQualifierProvider } from './contextQualifierProvider';

/**
 * Parameters for creating a {@link Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider}.
 * @public
 */
export interface ISimpleContextQualifierProviderCreateParams {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | readonly qualifier collector} that defines and validates qualifiers.
   */
  qualifiers: IReadOnlyQualifierCollector;

  /**
   * Optional record of initial qualifier name-value pairs to populate the provider.
   */
  qualifierValues?: Record<string, QualifierContextValue>;
}

/**
 * Simple concrete implementation of {@link Runtime.Context.IContextQualifierProvider | IContextQualifierProvider}
 * using a `ResultMap` for qualifier value storage.
 * @public
 */
export class SimpleContextQualifierProvider
  extends ContextQualifierProvider
  implements IMutableContextQualifierProvider
{
  /**
   * Explicit mutability marker for compile-time type discrimination.
   * Always `true` for mutable providers.
   */
  public readonly mutable: true = true as const;

  /**
   * The readonly qualifier collector that defines and validates the qualifiers for this context.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Internal storage for qualifier values using a ResultMap.
   */
  private readonly _qualifierValues: ResultMap<QualifierName, QualifierContextValue>;

  /**
   * Constructor for a {@link Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider} object.
   * @param params - {@link Runtime.ISimpleContextQualifierProviderCreateParams | Parameters} used to create the provider.
   */
  protected constructor(params: ISimpleContextQualifierProviderCreateParams) {
    super();
    this.qualifiers = params.qualifiers;
    this._qualifierValues = new ResultMap<QualifierName, QualifierContextValue>();

    if (params.qualifierValues) {
      for (const [name, value] of Object.entries(params.qualifierValues)) {
        const qualifierName = Validate.toQualifierName(name).orThrow();
        this._qualifierValues.set(qualifierName, value);
      }
    }
  }

  /**
   * Creates a new {@link Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider} object.
   * @param params - {@link Runtime.ISimpleContextQualifierProviderCreateParams | Parameters} used to create the provider.
   * @returns `Success` with the new {@link Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(
    params: ISimpleContextQualifierProviderCreateParams
  ): Result<SimpleContextQualifierProvider> {
    return captureResult(() => new SimpleContextQualifierProvider(params));
  }

  /**
   * Gets a qualifier value by its name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found or an error occurs.
   */
  public get(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierContextValue> {
    return this._resolveQualifierName(nameOrIndexOrQualifier).onSuccess((qualifierName) => {
      return this._qualifierValues.get(qualifierName);
    });
  }

  /**
   * Gets a validated qualifier context value by its name, index, or qualifier object.
   * TODO: Implement validation logic using qualifier collectors.
   * @param nameOrIndexOrQualifier - The {@link QualifierName | qualifier name}, {@link QualifierIndex | index}, or {@link Qualifiers.Qualifier | qualifier object} to look up.
   * @returns `Success` with the validated {@link QualifierContextValue | qualifier context value} if found,
   * or `Failure` with an error message if not found, invalid, or an error occurs.
   */
  public getValidated(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierContextValue> {
    return this._resolveQualifierName(nameOrIndexOrQualifier).onSuccess((qualifierName) => {
      return fail(`getValidated not yet implemented for qualifier "${qualifierName}"`);
    });
  }

  /**
   * Checks if a qualifier value exists with the given name.
   * @param name - The {@link QualifierName | qualifier name} to check.
   * @returns `Success` with `true` if the qualifier value exists, `false` if it doesn't,
   * or `Failure` with an error message if an error occurs during the check.
   */
  public has(name: QualifierName): Result<boolean> {
    return succeed(this._qualifierValues.has(name));
  }

  /**
   * Gets all available qualifier names in this context.
   * @returns `Success` with an array of all {@link QualifierName | qualifier names},
   * or `Failure` with an error message if an error occurs.
   */
  public getNames(): Result<ReadonlyArray<QualifierName>> {
    return succeed(Array.from(this._qualifierValues.keys()));
  }

  /**
   * Sets a qualifier value in this provider.
   * @param name - The {@link QualifierName | qualifier name} to set.
   * @param value - The {@link QualifierContextValue | qualifier context value} to set.
   * @returns `Success` with the set {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public set(name: QualifierName, value: QualifierContextValue): Result<QualifierContextValue> {
    this._qualifierValues.set(name, value);
    return succeed(value);
  }

  /**
   * Removes a qualifier value from this provider.
   * @param name - The {@link QualifierName | qualifier name} to remove.
   * @returns `Success` with the removed {@link QualifierContextValue | qualifier context value} if successful,
   * or `Failure` with an error message if not found or an error occurs.
   * @public
   */
  public remove(name: QualifierName): Result<QualifierContextValue> {
    return this._qualifierValues.get(name).onSuccess((value) => {
      this._qualifierValues.delete(name);
      return succeedWithDetail(value, 'success');
    });
  }

  /**
   * Gets the number of qualifier values in this provider.
   * @returns The count of qualifier values.
   * @public
   */
  public get size(): number {
    return this._qualifierValues.size;
  }

  /**
   * Clears all qualifier values from this provider.
   * @public
   */
  public clear(): void {
    this._qualifierValues.clear();
  }

  /**
   * Resolves a qualifier name from a name, index, or qualifier object.
   * @param nameOrIndexOrQualifier - The input to resolve.
   * @returns `Success` with the {@link QualifierName | qualifier name} if successful,
   * or `Failure` with an error message if not found or invalid.
   * @internal
   */
  private _resolveQualifierName(
    nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier
  ): Result<QualifierName> {
    // Try as string (QualifierName)
    const nameResult = CommonConverters.qualifierName.convert(nameOrIndexOrQualifier);
    if (nameResult.isSuccess()) {
      return nameResult;
    }

    // Try as number (QualifierIndex)
    const indexResult = CommonConverters.qualifierIndex.convert(nameOrIndexOrQualifier);
    if (indexResult.isSuccess()) {
      return this.qualifiers.getAt(indexResult.value).onSuccess((qualifier) => succeed(qualifier.name));
    }

    // Try as Qualifier-like object (duck typing for objects with name property)
    const qualifierLikeValidator = Validators.isA(
      'Qualifier-like object',
      (v): v is { name: QualifierName } =>
        typeof v === 'object' &&
        v !== null &&
        'name' in v &&
        typeof (v as Record<string, unknown>).name === 'string'
    );
    const qualifierLikeResult = qualifierLikeValidator.validate(nameOrIndexOrQualifier);
    if (qualifierLikeResult.isSuccess()) {
      return succeed(qualifierLikeResult.value.name);
    }

    return fail(`Invalid qualifier parameter: ${nameOrIndexOrQualifier}`);
  }
}
