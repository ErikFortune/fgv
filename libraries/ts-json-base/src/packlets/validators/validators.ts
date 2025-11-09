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

import { Failure, Validation, Validator, fail } from '@fgv/ts-utils';
import { JsonArray, JsonObject, JsonPrimitive, JsonValue, isJsonArray, isJsonObject } from '../json';

/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * Validation context for in-place JSON validators.
 * @public
 */
export interface IJsonValidatorContext {
  ignoreUndefinedProperties?: boolean;
}

/**
 * An in-place validator which validates that a supplied `unknown` value is
 * a valid {@link JsonPrimitive | JsonPrimitive}.
 * @public
 */
export const jsonPrimitive: Validator<JsonPrimitive, IJsonValidatorContext> =
  new Validation.Base.GenericValidator({
    validator: (
      from: unknown,
      ctx?: IJsonValidatorContext,
      self?: Validator<JsonPrimitive, IJsonValidatorContext>
    ): boolean | Failure<JsonPrimitive> => {
      if (from === null) {
        return true;
      }
      switch (typeof from) {
        case 'boolean':
        case 'string':
          return true;
        case 'number':
          if (!Number.isNaN(from)) {
            return true;
          }
          break;
      }
      if (from === undefined && ctx?.ignoreUndefinedProperties === true) {
        return true;
      }
      return fail(`"${String(from)}": invalid JSON primitive.`);
    }
  });

/**
 * An in-place validator which validates that a supplied `unknown` value is
 * a valid {@link JsonObject | JsonObject}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Validators.IJsonValidatorContext | context} at runtime.
 * @public
 */
export const jsonObject: Validator<JsonObject, IJsonValidatorContext> = new Validation.Base.GenericValidator({
  validator: (
    from: unknown,
    ctx?: IJsonValidatorContext,
    self?: Validator<JsonObject, IJsonValidatorContext>
  ) => {
    if (!isJsonObject(from)) {
      return fail('invalid JSON object.');
    }
    const errors: string[] = [];
    for (const [name, value] of Object.entries(from)) {
      jsonValue.validate(value, ctx).onFailure((m) => {
        errors.push(`${name}: ${m}`);
        return fail(m);
      });
    }
    if (errors.length > 0) {
      return fail(`invalid JSON object:\n${errors.join('\n')}`);
    }
    return true;
  }
});

/**
 * An in-place validator which validates that a supplied `unknown` value is
 * a valid {@link JsonArray | JsonArray}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Validators.IJsonValidatorContext | context} at runtime.
 * @public
 */
export const jsonArray: Validator<JsonArray, IJsonValidatorContext> = new Validation.Base.GenericValidator({
  validator: (
    from: unknown,
    ctx?: IJsonValidatorContext,
    self?: Validator<JsonArray, IJsonValidatorContext>
  ) => {
    if (!isJsonArray(from)) {
      return fail('not an array');
    }
    const errors: string[] = [];
    for (let i = 0; i < from.length; i++) {
      const value = from[i];
      jsonValue.validate(value, ctx).onFailure((m) => {
        errors.push(`${i}: ${m}`);
        return fail(m);
      });
    }
    if (errors.length > 0) {
      return fail(`array contains non-json elements:\n${errors.join('\n')}`);
    }
    return true;
  }
});

/**
 * An in-place validator which validates that a supplied `unknown` value is
 * a valid {@link JsonValue | JsonValue}. Fails by default if any properties or array elements
 * are `undefined` - this default behavior can be overridden by supplying an appropriate
 * {@link Validators.IJsonValidatorContext | context} at runtime.
 * @public
 */
export const jsonValue: Validator<JsonValue, IJsonValidatorContext> = new Validation.Base.GenericValidator<
  JsonValue,
  IJsonValidatorContext
>({
  validator: (
    from: unknown,
    ctx?: IJsonValidatorContext,
    self?: Validator<JsonValue, IJsonValidatorContext>
  ) => {
    if (isJsonArray(from)) {
      const result = jsonArray.validate(from, ctx);
      return result.success === true ? true : result;
    } else if (isJsonObject(from)) {
      const result = jsonObject.validate(from, ctx);
      return result.success === true ? true : result;
    }
    const result = jsonPrimitive.validate(from, ctx);
    return result.success === true ? true : result;
  }
});

/**
 * A {@link Validation.Classes.StringValidator | StringValidator} which validates a string in place.
 * Accepts {@link Validators.IJsonValidatorContext | IJsonValidatorContext} but ignores it.
 * @public
 */
export const string: Validation.Classes.StringValidator<string, IJsonValidatorContext> =
  new Validation.Classes.StringValidator<string, IJsonValidatorContext>();

/**
 * A {@link Validation.Classes.NumberValidator | NumberValidator} which validates a number in place.
 * Accepts {@link Validators.IJsonValidatorContext | IJsonValidatorContext} but ignores it.
 * @public
 */
export const number: Validator<number, IJsonValidatorContext> = new Validation.Classes.NumberValidator<
  number,
  IJsonValidatorContext
>();

/**
 * A {@link Validation.Classes.BooleanValidator | BooleanValidator} which validates a boolean in place.
 * Accepts {@link Validators.IJsonValidatorContext | IJsonValidatorContext} but ignores it.
 * @public
 */
export const boolean: Validator<boolean, IJsonValidatorContext> =
  new Validation.Classes.BooleanValidator<IJsonValidatorContext>();

/**
 * Helper to create a validator for a literal value.
 * Accepts {@link Validators.IJsonValidatorContext | IJsonValidatorContext} but ignores it.
 * Mirrors the behavior of `@fgv/ts-utils`.
 * @public
 */
export function literal<T>(value: T): Validator<T, IJsonValidatorContext> {
  return new Validation.Base.GenericValidator<T, IJsonValidatorContext>({
    validator: (from: unknown): boolean | Failure<T> => {
      return from === value ? true : fail(`Expected literal ${String(value)}, found ${JSON.stringify(from)}`);
    }
  });
}

/**
 * Helper function to create a {@link Validator | Validator} which validates `unknown` to one of a set of
 * supplied enumerated values. Anything else fails.
 *
 * @remarks
 * This JSON variant accepts an {@link Validators.IJsonValidatorContext | IJsonValidatorContext} OR
 * a `ReadonlyArray<T>` as its validation context. If the context is an array, it is used to override the
 * allowed values for that validation; otherwise, the original `values` supplied at creation time are used.
 *
 * @param values - Array of allowed values.
 * @param message - Optional custom failure message.
 * @returns A new {@link Validator | Validator} returning `<T>`.
 * @public
 */
export function enumeratedValue<T>(
  values: ReadonlyArray<T>,
  message?: string
): Validator<T, IJsonValidatorContext | ReadonlyArray<T>> {
  return new Validation.Base.GenericValidator<T, IJsonValidatorContext | ReadonlyArray<T>>({
    validator: (from: unknown, context?: IJsonValidatorContext | ReadonlyArray<T>): boolean | Failure<T> => {
      const effectiveValues = Array.isArray(context) ? (context as ReadonlyArray<T>) : values;
      const index = effectiveValues.indexOf(from as T);
      if (index >= 0) {
        return true;
      }
      return fail(message ?? `Invalid enumerated value ${JSON.stringify(from)}`);
    }
  });
}
