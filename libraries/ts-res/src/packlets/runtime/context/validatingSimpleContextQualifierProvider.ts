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
import { QualifierContextValue } from '../../common';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import { SimpleContextQualifierProvider } from './simpleContextQualifierProvider';
import {
  ContextQualifierProviderValidator,
  IReadOnlyContextQualifierProviderValidator
} from './contextQualifierProviderValidator';

/**
 * Parameters for creating a {@link Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider}.
 * @public
 */
export interface IValidatingSimpleContextQualifierProviderCreateParams {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | readonly qualifier collector} that defines and validates qualifiers.
   */
  qualifiers: IReadOnlyQualifierCollector;

  /**
   * Optional record of initial qualifier name-value pairs to populate the provider.
   * Accepts string keys and values which will be converted to strongly-typed values.
   */
  qualifierValues?: Record<string, string>;
}

/**
 * A {@link Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider} with a
 * {@link Runtime.Context.ContextQualifierProviderValidator | validator} property that enables
 * validated use of the underlying provider with string keys and values.
 * This eliminates the need for type casting in consumer code.
 * @public
 */
export class ValidatingSimpleContextQualifierProvider extends SimpleContextQualifierProvider {
  /**
   * A {@link Runtime.Context.ContextQualifierProviderValidator | ContextQualifierProviderValidator} which validates
   * string inputs before passing them to this provider.
   */
  public readonly validating: IReadOnlyContextQualifierProviderValidator;

  /**
   * Constructor for a {@link Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider} object.
   * @param params - {@link Runtime.IValidatingSimpleContextQualifierProviderCreateParams | Parameters} used to create the provider.
   */
  protected constructor(params: IValidatingSimpleContextQualifierProviderCreateParams) {
    // Convert string values to QualifierContextValue for the base class
    const convertedValues: Record<string, QualifierContextValue> | undefined = params.qualifierValues
      ? Object.fromEntries(
          Object.entries(params.qualifierValues).map(([key, value]) => [key, value as QualifierContextValue])
        )
      : undefined;

    super({
      qualifiers: params.qualifiers,
      qualifierValues: convertedValues
    });

    this.validating = new ContextQualifierProviderValidator({ provider: this });
  }

  /**
   * Creates a new {@link Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider} object.
   * @param params - {@link Runtime.IValidatingSimpleContextQualifierProviderCreateParams | Parameters} used to create the provider.
   * @returns `Success` with the new {@link Runtime.ValidatingSimpleContextQualifierProvider | ValidatingSimpleContextQualifierProvider} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(
    params: IValidatingSimpleContextQualifierProviderCreateParams
  ): Result<ValidatingSimpleContextQualifierProvider> {
    return captureResult(() => new ValidatingSimpleContextQualifierProvider(params));
  }
}
