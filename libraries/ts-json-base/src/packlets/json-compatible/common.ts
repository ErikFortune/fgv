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
  Converter as BaseConverter,
  ObjectConverter as BaseObjectConverter,
  Validation,
  Validator as BaseValidator
} from '@fgv/ts-utils';
import { JsonCompatibleType } from '../json';

/**
 * A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export type Converter<T, TC = unknown> = BaseConverter<JsonCompatibleType<T>, TC>;

/**
 * A validator which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export type Validator<T, TC = unknown> = BaseValidator<JsonCompatibleType<T>, TC>;

/**
 * A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export type ObjectConverter<T, TC = unknown> = BaseObjectConverter<JsonCompatibleType<T>, TC>;

/**
 * A validator which validates a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatible} value.
 * @public
 */
export type ObjectValidator<T, TC = unknown> = Validation.Classes.ObjectValidator<JsonCompatibleType<T>, TC>;

/**
 * A converter which converts a supplied `unknown` value to a valid array of {@link JsonCompatibleType | JsonCompatible} values.
 * @public
 */
export type ArrayConverter<T, TC = unknown> = BaseConverter<JsonCompatibleType<T>[], TC>;

/**
 * A validator which validates arrays of {@link JsonCompatibleType | JsonCompatible} values in place.
 * @public
 */
export type ArrayValidator<T, TC = unknown> = Validation.Classes.ArrayValidator<JsonCompatibleType<T>, TC>;

/**
 * A converter which converts a supplied `unknown` value to a valid record of {@link JsonCompatibleType | JsonCompatible} values.
 * @public
 */
export type RecordConverter<T, TC = unknown, TK extends string = string> = BaseConverter<
  Record<TK, JsonCompatibleType<T>>,
  TC
>;

/**
 * A validator which validates a record of {@link JsonCompatibleType | JsonCompatible} values.
 * @public
 */
export type RecordValidator<T, TC = unknown, TK extends string = string> = Validation.Validator<
  Record<TK, JsonCompatibleType<T>>,
  TC
>;
