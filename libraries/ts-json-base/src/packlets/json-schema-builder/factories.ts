/*
 * Copyright (c) 2026 Erik Fortune
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
  ILlmArraySchema,
  ILlmBooleanSchema,
  ILlmEnumSchema,
  ILlmNumberSchema,
  ILlmObjectSchema,
  ILlmOptional,
  ILlmProperties,
  ILlmSchema,
  ILlmStringSchema
} from './types';

/**
 * Common options accepted by every schema factory.
 * @public
 */
export interface ISchemaOptions {
  /**
   * Optional human-readable description emitted into the wire JSON Schema and used in
   * field-level error messages.
   */
  description?: string;
}

/**
 * Options for the {@link number} and {@link integer} factories.
 * @public
 */
export interface INumberSchemaOptions extends ISchemaOptions {
  /**
   * When `true` (default), the derived converter rejects numeric strings such as `'42'` and
   * accepts only genuine JSON numbers. Set `false` to opt into the permissive `Converters.number`
   * coercion (numeric strings are accepted and converted).
   */
  strict?: boolean;
}

/**
 * Options for the {@link object} factory.
 * @public
 */
export interface IObjectSchemaOptions extends ISchemaOptions {
  /**
   * When `false` (default), the derived converter rejects unrecognized properties (`strictObject`)
   * and the emitted schema sets `additionalProperties: false`. Set `true` to allow extra fields.
   */
  additionalProperties?: boolean;
}

/**
 * Creates a schema node for a JSON `string`.
 * @param opts - Optional {@link ISchemaOptions | description}.
 * @returns A {@link ILlmStringSchema} whose {@link Static} type is `string`.
 * @public
 */
export function string(opts?: ISchemaOptions): ILlmStringSchema {
  return { _type: 'string', ...withDescription(opts) };
}

/**
 * Creates a schema node for a JSON `number`.
 * @param opts - Optional {@link INumberSchemaOptions | description and strict mode}.
 * @returns A {@link ILlmNumberSchema} whose {@link Static} type is `number`.
 * @public
 */
export function number(opts?: INumberSchemaOptions): ILlmNumberSchema {
  return { _type: 'number', strict: opts?.strict !== false, ...withDescription(opts) };
}

/**
 * Creates a schema node for a JSON `integer`.
 * @param opts - Optional {@link INumberSchemaOptions | description and strict mode}.
 * @returns A {@link ILlmNumberSchema} (tagged `integer`) whose {@link Static} type is `number`.
 * @public
 */
export function integer(opts?: INumberSchemaOptions): ILlmNumberSchema {
  return { _type: 'integer', strict: opts?.strict !== false, ...withDescription(opts) };
}

/**
 * Creates a schema node for a JSON `boolean`.
 * @param opts - Optional {@link ISchemaOptions | description}.
 * @returns A {@link ILlmBooleanSchema} whose {@link Static} type is `boolean`.
 * @public
 */
export function boolean(opts?: ISchemaOptions): ILlmBooleanSchema {
  return { _type: 'boolean', ...withDescription(opts) };
}

/**
 * Creates a schema node for a closed set of string literals.
 * @param values - The allowed string values.
 * @param opts - Optional {@link ISchemaOptions | description}.
 * @returns A {@link ILlmEnumSchema} whose {@link Static} type is the union of `values`.
 * @public
 */
export function enumOf<T extends string>(values: readonly T[], opts?: ISchemaOptions): ILlmEnumSchema<T> {
  return { _type: 'enum', enum: values, ...withDescription(opts) };
}

/**
 * Marks a property schema as optional within an {@link object} schema.
 * @param schema - The inner schema to make optional.
 * @returns An {@link ILlmOptional} wrapper whose {@link Static} type is `Static<S> | undefined`.
 * @public
 */
export function optional<S extends ILlmSchema<unknown>>(schema: S): ILlmOptional<S> {
  return { _type: 'optional', _schema: schema };
}

/**
 * Creates a schema node for a JSON `array` whose elements all match `items`.
 * @param items - The schema applied to every element.
 * @param opts - Optional {@link ISchemaOptions | description}.
 * @returns An {@link ILlmArraySchema} whose {@link Static} type is `Array<Static<S>>`.
 * @public
 */
export function array<S extends ILlmSchema<unknown>>(items: S, opts?: ISchemaOptions): ILlmArraySchema<S> {
  return { _type: 'array', _items: items, ...withDescription(opts) };
}

/**
 * Creates a schema node for a JSON `object` with a fixed set of typed properties.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * {@link optional} to make it optional.
 * @param opts - Optional {@link IObjectSchemaOptions | description and additionalProperties}.
 * @returns An {@link ILlmObjectSchema} whose {@link Static} type derives the required/optional split.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts?: IObjectSchemaOptions
): ILlmObjectSchema<P> {
  return {
    _type: 'object',
    _properties: properties,
    additionalProperties: opts?.additionalProperties === true,
    ...withDescription(opts)
  };
}

function withDescription(opts?: ISchemaOptions): { description?: string } {
  return opts?.description !== undefined ? { description: opts.description } : {};
}
