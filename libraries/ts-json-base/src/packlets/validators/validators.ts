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

/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */

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
      return fail(`"${String(from)}": not a valid JSON primitive.`);
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
      return fail('not a valid JSON object.');
    }
    const errors: string[] = [];
    for (const [name, value] of Object.entries(from)) {
      jsonValue.validate(value, ctx).onFailure((m) => {
        errors.push(`${name}: ${m}`);
        return fail(m);
      });
    }
    if (errors.length > 0) {
      return fail(`not a valid JSON object:\n${errors.join('\n')}`);
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
