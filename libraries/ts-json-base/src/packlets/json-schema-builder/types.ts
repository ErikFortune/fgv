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

import { Validator } from '@fgv/ts-utils';
import { JsonObject } from '../json';

/**
 * Discriminant tag carried by every {@link ISchemaValidator | schema node}.
 * @public
 */
export type SchemaNodeType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'optional'
  | 'array'
  | 'object';

/**
 * A typed JSON Schema node for the LLM-tool subset. Every value returned by the
 * schema factories implements this interface — it IS a {@link Validator} and also
 * carries a {@link toJson} method for wire-format emission.
 *
 * @remarks
 * The `__staticType` property is a phantom: it exists only in the type system to carry
 * the derived static type `T` and is never assigned at runtime (declared optional so
 * factory return values need not populate it). {@link Static} reads this slot to recover
 * `T` from a schema value without requiring a user-supplied type assertion. A plain
 * optional property is used rather than a module-private `unique symbol` because this is
 * a published package surface — a private-symbol-keyed property cannot be named in the
 * emitted `.d.ts` (TypeBox issue #679), which would break declaration emission and API
 * Extractor for downstream consumers.
 *
 * Consumers call `schema.validate(input)` directly; no separate adapter step is required.
 * @public
 */
export interface ISchemaValidator<T> extends Validator<T> {
  /**
   * Phantom type carrier — type-level only, never present at runtime.
   */
  readonly __staticType?: T;
  /**
   * Runtime discriminant. Identifies the schema node kind.
   */
  readonly _type: SchemaNodeType;
  /**
   * Optional human-readable description emitted into the wire JSON Schema.
   */
  readonly description?: string;
  /**
   * Emits the standard JSON Schema (draft-07 LLM-tool subset) wire form for this schema.
   * @returns The JSON Schema object describing this schema node.
   */
  toJson(): JsonObject;
}

/**
 * Recover the derived static type `T` from a {@link ISchemaValidator | schema value}.
 *
 * @remarks
 * `Static<typeof MySchema>` resolves to the TypeScript type that `schema.validate()` produces
 * and that `schema.toJson()` describes — derived, never asserted. No user-supplied `T` is ever
 * required.
 * @public
 */
export type Static<S extends ISchemaValidator<unknown>> = S extends ISchemaValidator<infer T> ? T : never;

/**
 * A record of property schemas, as accepted by {@link object}.
 * @public
 */
export type ILlmProperties = Record<string, ISchemaValidator<unknown>>;

/**
 * The keys of `P` whose schemas are optional (wrapped with {@link optional}).
 * @public
 */
export type OptionalKeys<P extends ILlmProperties> = {
  [K in keyof P]: P[K] extends ISchemaValidator<infer U> ? (undefined extends U ? K : never) : never;
}[keyof P];

/**
 * The keys of `P` whose schemas are required (i.e. not optional).
 * @public
 */
export type RequiredKeys<P extends ILlmProperties> = Exclude<keyof P, OptionalKeys<P>>;

/**
 * The static value type carried by an optional property (the inner schema's static type,
 * without the `| undefined` that optionality adds — the `?` modifier conveys that separately).
 * @public
 */
export type OptionalPropertyStatic<V> = V extends ISchemaValidator<infer U> ? Exclude<U, undefined> : never;

/**
 * Flattens an intersection of object types into a single object type for readable derived types.
 * @public
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * The derived static type for an object built from properties `P`: required keys carry their
 * static type directly, optional keys carry theirs under a `?` modifier.
 * @public
 */
export type ObjectStatic<P extends ILlmProperties> = Simplify<
  { [K in RequiredKeys<P>]: Static<P[K]> } & { [K in OptionalKeys<P>]?: OptionalPropertyStatic<P[K]> }
>;

// ---------------------------------------------------------------------------
// Legacy type aliases kept for backwards compatibility with the first-pass API.
// These names were in the original public surface; the canonical interface is
// now ISchemaValidator<T>. New code should use ISchemaValidator<T> directly.
// ---------------------------------------------------------------------------

/**
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmSchema<T> = ISchemaValidator<T>;

/**
 * Schema node for a JSON `string`.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmStringSchema = ISchemaValidator<string>;

/**
 * Schema node for a JSON `number` or `integer`.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmNumberSchema = ISchemaValidator<number>;

/**
 * Schema node for a JSON `boolean`.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmBooleanSchema = ISchemaValidator<boolean>;

/**
 * Schema node for a closed set of string literals (`enum`).
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmEnumSchema<T extends string> = ISchemaValidator<T>;

/**
 * Wrapper marking a property as optional within an object schema.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmOptional<S extends ISchemaValidator<unknown>> = ISchemaValidator<Static<S> | undefined>;

/**
 * Schema node for a JSON `array`.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmArraySchema<S extends ISchemaValidator<unknown>> = ISchemaValidator<Static<S>[]>;

/**
 * Schema node for a JSON `object`.
 * @deprecated Use {@link ISchemaValidator} instead.
 * @public
 */
export type ILlmObjectSchema<P extends ILlmProperties> = ISchemaValidator<ObjectStatic<P>>;
