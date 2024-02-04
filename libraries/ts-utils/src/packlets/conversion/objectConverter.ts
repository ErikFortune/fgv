/*
 * Copyright (c) 2023 Erik Fortune
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

import { fail, isKeyOf, succeed } from '../base';
import { BaseConverter } from './baseConverter';
import { Converter } from './converter';
import { field, optionalField } from './converters';

/**
 * Options for an {@link Conversion.ObjectConverter | ObjectConverter}.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ObjectConverterOptions<T> {
  /**
   * If present, lists optional fields. Missing non-optional fields cause an error.
   */
  optionalFields?: (keyof T)[];
  /**
   * If true, unrecognized fields yield an error.  If false or undefined (default),
   * unrecognized fields are ignored.
   */
  strict?: boolean;
  /**
   * Optional description to be included in error messages.
   */
  description?: string;
}

/**
 * Per-property converters for each of the properties in type T.
 * @remarks
 * Used to construct a {@link Conversion.ObjectConverter | ObjectConverter}
 * @public
 */
export type FieldConverters<T, TC = unknown> = { [key in keyof T]: Converter<T[key], TC> };

/**
 * A {@link Converter} which converts an object of type `<T>` without changing shape, given
 * a {@link Conversion.FieldConverters | FieldConverters<T>} for the fields in the object.
 * @remarks
 * By default, if all of the required fields exist and can be converted, returns a new object with
 * the converted values under the original key names.  If any required fields do not exist or cannot
 * be converted, the entire conversion fails. See {@link Conversion.ObjectConverterOptions | ObjectConverterOptions}
 * for other conversion options.
 * @public
 */
export class ObjectConverter<T, TC = unknown> extends BaseConverter<T, TC> {
  /**
   * Fields converted by this {@link Conversion.ObjectConverter | ObjectConverter}.
   */
  public readonly fields: FieldConverters<T>;
  /**
   * Options used to initialize this {@link Conversion.ObjectConverter | ObjectConverter}.
   */
  public readonly options: ObjectConverterOptions<T>;

  /**
   * Constructs a new {@link Conversion.ObjectConverter | ObjectConverter<T>} using options
   * supplied in a {@link Conversion.ObjectConverterOptions | ObjectConverterOptions<T>}.
   * @param fields - A {@link Conversion.FieldConverters | FieldConverters<T>} containing
   * a {@link Converter} for each field
   * @param options - An optional @see ObjectConverterOptions to configure the conversion
   * {@label WITH_OPTIONS}
   */
  public constructor(fields: FieldConverters<T, TC>, options?: ObjectConverterOptions<T>);

  /**
   * Constructs a new {@link Conversion.ObjectConverter | ObjectConverter<T>} with optional
   * properties specified as an array of `keyof T`.
   * @param fields - A {@link Conversion.FieldConverters | FieldConverters<T>} containing
   * a {@link Converter} for each field.
   * @param optional - An array of `keyof T` listing fields that are not required.
   * {@label WITH_KEYS}
   */
  public constructor(fields: FieldConverters<T, TC>, optional?: (keyof T)[]);
  /**
   * Concrete implementation of {@link Converters.(ObjectConverter:constructor)}
   * @internal
   */
  public constructor(fields: FieldConverters<T, TC>, opt?: ObjectConverterOptions<T> | (keyof T)[]) {
    super((from: unknown, __self, context?: TC) => {
      // eslint bug thinks key is used before defined
      // eslint-disable-next-line no-use-before-define
      const converted = {} as { [key in keyof T]: T[key] };
      const errors: string[] = [];
      for (const key in fields) {
        if (fields[key]) {
          const isOptional = (fields[key].isOptional || this.options.optionalFields?.includes(key)) ?? false;
          const result = isOptional
            ? optionalField(key, fields[key]).convert(from, context)
            : field(key, fields[key]).convert(from, context);
          if (result.isSuccess() && result.value !== undefined) {
            converted[key] = result.value;
          } else if (result.isFailure()) {
            errors.push(result.message);
          }
        }
      }

      if (this.options.strict === true) {
        if (typeof from === 'object' && !Array.isArray(from)) {
          for (const key in from) {
            if (from.hasOwnProperty(key) && (!isKeyOf(key, fields) || fields[key] === undefined)) {
              errors.push(`${key}: unexpected property in source object`);
            }
          }
        } else {
          errors.push('source is not an object');
        }
      }
      return errors.length === 0
        ? succeed(converted)
        : fail(
            this.options.description ? `${this.options.description}: ${errors.join('\n')}` : errors.join('\n')
          );
    });

    this.fields = fields;
    if (Array.isArray(opt)) {
      this.options = { optionalFields: opt };
    } else {
      this.options = opt ?? {};
    }
  }

  /**
   * Creates a new {@link Conversion.ObjectConverter | ObjectConverter} derived from this one but with
   * new optional properties as specified by a supplied {@link Conversion.ObjectConverterOptions | ObjectConverterOptions<T>}.
   * @param options - The {@link Conversion.ObjectConverterOptions | options} to be applied to the new
   * converter.
   * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} with the additional optional source properties.
   * {@label WITH_OPTIONS}
   */
  public partial(options: ObjectConverterOptions<T>): ObjectConverter<Partial<T>, TC>;

  /**
   * Creates a new {@link Conversion.ObjectConverter | ObjectConverter} derived from this one but with
   * new optional properties as specified by a supplied array of `keyof T`.
   * @param optional - The keys of the source object properties to be made optional.
   * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} with the additional optional source
   * properties.
   * {@label WITH_KEYS}
   */
  public partial(optional?: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
  /**
   * Concrete implementation of
   * {@link Conversion.ObjectConverter.(partial:1) | ObjectConverter.partial(ObjectConverterOptions)} and
   * {@link Conversion.ObjectConverter.(partial:2) | ObjectConverter.partial((keyof T))[]}.
   * @internal
   */
  public partial(opt?: ObjectConverterOptions<T> | (keyof T)[]): ObjectConverter<Partial<T>, TC> {
    return new ObjectConverter<Partial<T>, TC>(
      this.fields as FieldConverters<Partial<T>, TC>,
      opt as ObjectConverterOptions<Partial<T>>
    )._with(this._traits());
  }

  /**
   * Creates a new {@link Conversion.ObjectConverter | ObjectConverter} derived from this one but with
   * new optional properties as specified by a supplied array of `keyof T`.
   * @param addOptionalProperties - The keys to be made optional.
   * @returns A new {@link Conversion.ObjectConverter | ObjectConverter} with the additional optional source
   * properties.
   */
  public addPartial(addOptionalProperties: (keyof T)[]): ObjectConverter<Partial<T>, TC> {
    return this.partial([...(this.options.optionalFields ?? []), ...addOptionalProperties])._with(
      this._traits()
    );
  }
}
