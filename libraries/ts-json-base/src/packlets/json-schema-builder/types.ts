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

/**
 * Discriminant tag carried by every {@link ILlmSchema | schema node}. The adapter
 * ({@link toConverter}) and wire emitter ({@link toJson}) switch on this value at runtime.
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
 * Base shape for every typed JSON Schema node in the LLM-tool subset.
 *
 * @remarks
 * The `__staticType` property is a phantom: it exists only in the type system to carry the
 * derived static type `T` and is never assigned at runtime (it is declared optional so factory
 * return values need not — and do not — populate it). {@link Static} reads this slot to recover
 * `T` from a schema value. A plain optional property is used rather than a module-private
 * `unique symbol` because this is a published package surface — a private-symbol-keyed property
 * cannot be named in the emitted `.d.ts` (TypeBox issue #679), which would break declaration
 * emission and API Extractor for downstream consumers.
 *
 * The `_type` discriminant is a real runtime field and is the structural gate that distinguishes
 * a schema node from an arbitrary value.
 * @public
 */
export interface ILlmSchema<T> {
  /**
   * Phantom type carrier — type-level only, never present at runtime.
   */
  readonly __staticType?: T;
  /**
   * Runtime discriminant used by {@link toConverter} and {@link toJson}.
   */
  readonly _type: SchemaNodeType;
  /**
   * Optional human-readable description emitted into the wire JSON Schema.
   */
  readonly description?: string;
}

/**
 * Recover the derived static type `T` from a {@link ILlmSchema | schema value}.
 *
 * @remarks
 * `Static<typeof MySchema>` resolves to the TypeScript type that {@link toConverter | the derived
 * converter} produces and that {@link toJson | the emitted JSON Schema} describes — derived, never
 * asserted. No user-supplied `T` is ever required.
 * @public
 */
export type Static<S extends ILlmSchema<unknown>> = S extends ILlmSchema<infer T> ? T : never;

/**
 * Schema node for a JSON `string`.
 * @public
 */
export interface ILlmStringSchema extends ILlmSchema<string> {
  readonly _type: 'string';
}

/**
 * Schema node for a JSON `number` or `integer`.
 *
 * @remarks
 * `strict` controls whether the {@link toConverter | derived converter} rejects numeric strings
 * (`'42'`). When `true` (the default for {@link number} / {@link integer}) only genuine JSON
 * numbers are accepted; when `false` the permissive `Converters.number` coercion is used.
 * @public
 */
export interface ILlmNumberSchema extends ILlmSchema<number> {
  readonly _type: 'number' | 'integer';
  readonly strict: boolean;
}

/**
 * Schema node for a JSON `boolean`.
 * @public
 */
export interface ILlmBooleanSchema extends ILlmSchema<boolean> {
  readonly _type: 'boolean';
}

/**
 * Schema node for a closed set of string literals (`enum`).
 * @public
 */
export interface ILlmEnumSchema<T extends string> extends ILlmSchema<T> {
  readonly _type: 'enum';
  readonly enum: ReadonlyArray<T>;
}

/**
 * Wrapper marking a property as optional within an {@link ILlmObjectSchema | object schema}.
 *
 * @remarks
 * `_schema` is a real runtime field — the adapter and emitter recurse into it. Optionality is a
 * property-level concern in JSON Schema, so an `optional` wrapper never produces a node in the
 * emitted schema; it instead omits its key from the parent object's `required` array.
 * @public
 */
export interface ILlmOptional<S extends ILlmSchema<unknown>> extends ILlmSchema<Static<S> | undefined> {
  readonly _type: 'optional';
  readonly _schema: S;
}

/**
 * Schema node for a JSON `array` whose elements all match `_items`.
 * @public
 */
export interface ILlmArraySchema<S extends ILlmSchema<unknown>> extends ILlmSchema<Array<Static<S>>> {
  readonly _type: 'array';
  readonly _items: S;
}

/**
 * A record of property schemas, as accepted by {@link object}.
 * @public
 */
export type ILlmProperties = Record<string, ILlmSchema<unknown>>;

/**
 * The keys of `P` whose schemas are {@link ILlmOptional | optional}.
 * @public
 */
export type OptionalKeys<P extends ILlmProperties> = {
  [K in keyof P]: P[K] extends ILlmOptional<ILlmSchema<unknown>> ? K : never;
}[keyof P];

/**
 * The keys of `P` whose schemas are required (i.e. not {@link ILlmOptional | optional}).
 * @public
 */
export type RequiredKeys<P extends ILlmProperties> = Exclude<keyof P, OptionalKeys<P>>;

/**
 * Flattens an intersection of object types into a single object type for readable derived types.
 * @public
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * The static value type carried by an optional property (the inner schema's static type, without
 * the wrapper's `| undefined`, which the `?` modifier already conveys).
 * @public
 */
export type OptionalPropertyStatic<O> = O extends ILlmOptional<infer S> ? Static<S> : never;

/**
 * The derived static type for an object built from properties `P`: required keys carry their
 * static type, optional keys carry theirs under a `?` modifier.
 * @public
 */
export type ObjectStatic<P extends ILlmProperties> = Simplify<
  { [K in RequiredKeys<P>]: Static<P[K]> } & { [K in OptionalKeys<P>]?: OptionalPropertyStatic<P[K]> }
>;

/**
 * Schema node for a JSON `object` with a fixed set of typed properties.
 *
 * @remarks
 * `_properties` is a real runtime field. `additionalProperties` defaults to `false`
 * (the LLM-tool convention — reject unrecognized fields); set it `true` via {@link object}'s
 * options to allow extra fields.
 * @public
 */
export interface ILlmObjectSchema<P extends ILlmProperties> extends ILlmSchema<ObjectStatic<P>> {
  readonly _type: 'object';
  readonly _properties: P;
  readonly additionalProperties: boolean;
}
