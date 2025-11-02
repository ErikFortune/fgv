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

import { Conversion, Converter, Converters } from '@fgv/ts-utils';
import * as JsonCompatible from './common';
import { JsonCompatibleType } from '../json';

/**
 * A helper function to create a {@link Converter | Converter} which converts a supplied `unknown` value to a valid
 * array of {@link JsonCompatibleType | JsonCompatibleType<T>}.
 * @param converter - {@link JsonCompatible.Converter | JSON-compatible Converter<T, TC>}
 * or {@link JsonCompatible.Validator | JSON-compatible Validator<T>} used for each item in the source array.
 * @param onError - The error handling option to use for the conversion.
 * @returns A {@link Converter | Converter} which returns `JsonCompatibleType<T>[]`.
 * @public
 */
export function arrayOf<T, TC = unknown>(
  converter: JsonCompatible.Converter<T, TC> | JsonCompatible.Validator<T, TC>,
  onError: Conversion.OnError = 'failOnError'
): Converter<JsonCompatibleType<T>[], TC> {
  return Converters.arrayOf(converter, onError);
}

/**
 * A helper function to create a {@link Converter | Converter} or which converts the `string`-keyed properties
 * using a supplied {@link JsonCompatible.Converter | JSON-compatible Converter<T, TC>} or
 * {@link JsonCompatible.Validator | JSON-compatible Validator<T>} to produce a
 * `Record<TK, JsonCompatibleType<T>>`.
 * @remarks
 * If present, the supplied {@link Converters.KeyedConverterOptions | options} can provide a strongly-typed
 * converter for keys and/or control the handling of elements that fail conversion.
 * @param converter - {@link JsonCompatible.Converter | JSON-compatible Converter<T, TC>}
 * or {@link JsonCompatible.Validator | JSON-compatible Validator<T>} used for each item in the source object.
 * @param options - Optional {@link Converters.KeyedConverterOptions | KeyedConverterOptions<TK, TC>} which
 * supplies a key converter and/or error-handling options.
 * @returns A {@link Converter | Converter} which returns `Record<TK, JsonCompatibleType<T>>`.
 * @public
 */
export function recordOf<T, TC = unknown, TK extends string = string>(
  converter: JsonCompatible.Converter<T, TC> | JsonCompatible.Validator<T, TC>,
  options?: Converters.KeyedConverterOptions<TK, TC>
): Converter<Record<TK, JsonCompatibleType<T>>, TC> {
  return Converters.recordOf(converter, options ?? { onError: 'fail' });
}

/**
 * A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @param properties - The properties to convert.
 * @param options - The options to use for the conversion.
 * @returns A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @public
 */
export function object<T, TC = unknown>(
  properties: Conversion.FieldConverters<JsonCompatibleType<T>, TC>,
  options?: Conversion.ObjectConverterOptions<JsonCompatibleType<T>>
): JsonCompatible.ObjectConverter<T, TC> {
  return new Conversion.ObjectConverter(properties, options);
}

/**
 * A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @param properties - The properties to convert.
 * @param options - The options to use for the conversion.
 * @returns A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @public
 */
export function strictObject<T, TC = unknown>(
  properties: Conversion.FieldConverters<JsonCompatibleType<T>, TC>,
  options?: Converters.StrictObjectConverterOptions<JsonCompatibleType<T>>
): JsonCompatible.ObjectConverter<T, TC> {
  const objectOptions = { ...options, strict: true };
  return new Conversion.ObjectConverter(properties, objectOptions);
}

/**
 * A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @param discriminatorProp - The name of the property used to discriminate types.
 * @param converters - The converters to use for the conversion.
 * @returns A converter which converts a supplied `unknown` value to a valid {@link JsonCompatibleType | JsonCompatibleType<T>} value.
 * @public
 */
export function discriminatedObject<T, TD extends string = string, TC = unknown>(
  discriminatorProp: string,
  converters: Converters.DiscriminatedObjectConverters<JsonCompatibleType<T>, TD, TC>
): JsonCompatible.Converter<T, TC> {
  return Converters.discriminatedObject(discriminatorProp, converters);
}
