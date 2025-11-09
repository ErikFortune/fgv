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

import { JsonCompatibleType } from '../json';
import * as JsonCompatible from './common';
import { Validation, Validators } from '@fgv/ts-utils';

/**
 * A helper function to create a {@link JsonCompatible.ArrayValidator | JSON-compatible ArrayValidator<T, TC>} which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @param validateElement - The element validator to use.
 * @param params - The parameters to use for the validation.
 * @returns A {@link JsonCompatible.ArrayValidator | JSON-compatible ArrayValidator<T, TC>} which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export function arrayOf<T, TC = unknown>(
  validateElement: JsonCompatible.Validator<T, TC>,
  params?: Omit<
    Validation.Classes.ArrayValidatorConstructorParams<JsonCompatibleType<T>, TC>,
    'validateElement'
  >
): JsonCompatible.ArrayValidator<T, TC> {
  return Validators.arrayOf(validateElement, params ?? {});
}

/**
 * A helper function to create a {@link JsonCompatible.RecordValidator | JSON-compatible RecordValidator<T, TC, TK>} which validates a supplied `unknown` value
 * to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @param validateElement - The element validator to use.
 * @param options - The options to use for the validation.
 * @returns A `Validation.Validator<Record<TK, JsonCompatibleType<T>>, TC>` which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  validateElement: JsonCompatible.Validator<T, TC>,
  options?: Validators.IRecordOfValidatorOptions<TK, TC>
): JsonCompatible.RecordValidator<T, TC, TK> {
  return Validators.recordOf(validateElement, options ?? {});
}

/**
 * A helper function to create a {@link JsonCompatible.ObjectValidator | JSON-compatible ObjectValidator<T, TC>} which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @param properties - The properties to validate.
 * @param params - The parameters to use for the validation.
 * @returns A {@link JsonCompatible.ObjectValidator | JSON-compatible ObjectValidator<T, TC>} which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export function object<T, TC = unknown>(
  properties: Validation.Classes.FieldValidators<JsonCompatibleType<T>, TC>,
  params?: Omit<Validation.Classes.ObjectValidatorConstructorParams<JsonCompatibleType<T>, TC>, 'fields'>
): JsonCompatible.ObjectValidator<T, TC> {
  return Validators.object(properties, params ?? {});
}
