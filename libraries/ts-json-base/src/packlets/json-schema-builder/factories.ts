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
  Conversion,
  Converter,
  Converters,
  Failure,
  Result,
  Validation,
  Validators,
  fail,
  succeed
} from '@fgv/ts-utils';
import { JsonObject } from '../json';
import { ILlmProperties, ISchemaValidator, ObjectStatic, SchemaNodeType, Static } from './types';

/**
 * Common options accepted by every schema factory.
 * @public
 */
export interface ISchemaOptions {
  /**
   * Optional human-readable description emitted into the wire JSON Schema.
   */
  description?: string;
}

/**
 * Options for the `number` and `integer` factories.
 * @public
 */
export interface INumberSchemaOptions extends ISchemaOptions {
  /**
   * When `true` (default), the derived validator rejects numeric strings such as `'42'` and
   * accepts only genuine JSON numbers. Set `false` to opt into permissive coercion (numeric
   * strings are accepted and converted to their numeric value).
   */
  strict?: boolean;
}

/**
 * Options for the `object` factory.
 * @public
 */
export interface IObjectSchemaOptions extends ISchemaOptions {
  /**
   * When `false` (default), the validator rejects unrecognized properties and the emitted schema
   * sets `additionalProperties: false`. Set `true` to allow extra fields.
   */
  additionalProperties?: boolean;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Abstract base
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all schema validator nodes. Extends GenericValidator so
 * each schema value IS a `Validator<T>` and also carries `toJson()` and `_type`.
 * @internal
 */
abstract class SchemaValidatorBase<T>
  extends Validation.Base.GenericValidator<T>
  implements ISchemaValidator<T>
{
  public readonly __staticType?: T;
  public readonly _type: SchemaNodeType;
  public readonly description?: string;

  protected constructor(
    type: SchemaNodeType,
    validator: Validation.ValidatorFunc<T, unknown>,
    description?: string
  ) {
    super({ validator });
    this._type = type;
    if (description !== undefined) {
      this.description = description;
    }
  }

  public abstract toJson(): JsonObject;
}

// ---------------------------------------------------------------------------
// Concrete schema node classes
// ---------------------------------------------------------------------------

class StringSchemaValidator extends SchemaValidatorBase<string> {
  private readonly _inner: Validation.Validator<string>;

  public constructor(opts?: ISchemaOptions) {
    const inner = Validators.string;
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('string', (__from: unknown): boolean | Failure<string> => true, opts?.description);
    this._inner = inner;
  }

  public override validate(from: unknown): Result<string> {
    return this._inner.validate(from);
  }

  public override convert(from: unknown): Result<string> {
    return this._inner.validate(from);
  }

  public toJson(): JsonObject {
    return { type: 'string', ..._descriptionField(this) };
  }
}

/**
 * Number/integer schema validator.
 *
 * Strict mode (default): delegates to a Validator that only accepts genuine JSON numbers.
 * Non-strict mode: delegates to a Converter that coerces numeric strings (e.g. '42' -\> 42).
 * Both validate() and convert() route through the same underlying logic so that schema nodes
 * behave correctly when used as field validators inside Converters.object / Converters.arrayOf
 * (which call convert()) and when called directly as Validators (which call validate()).
 */
class NumberSchemaValidator extends SchemaValidatorBase<number> {
  public readonly strict: boolean;
  // Held for non-strict mode where coercion is needed.
  private readonly _nonStrictConverter?: Converter<number>;
  // Held for strict mode where in-place validation is the canonical operation.
  private readonly _strictValidator?: Validation.Validator<number>;

  public constructor(type: 'number' | 'integer', opts?: INumberSchemaOptions) {
    const strict = opts?.strict !== false;
    const isInteger = type === 'integer';

    if (strict) {
      const strictValidator = isInteger
        ? Validators.isA('integer', (v): v is number => typeof v === 'number' && Number.isInteger(v))
        : Validators.isA('number', (v): v is number => typeof v === 'number' && !Number.isNaN(v));
      /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
      super(type, (__from: unknown): boolean | Failure<number> => true, opts?.description);
      this._strictValidator = strictValidator;
      this._nonStrictConverter = undefined;
    } else {
      // Non-strict: the ValidatorFunc is a placeholder — validate() and convert() are both
      // overridden below to use the coercing Converter, so this lambda is never invoked.
      /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
      super(type, (__from: unknown): boolean | Failure<number> => true, opts?.description);
      this._strictValidator = undefined;
      this._nonStrictConverter = isInteger
        ? Converters.number.withConstraint((n) => Number.isInteger(n) || fail(`${n}: not an integer`))
        : Converters.number;
    }

    this.strict = strict;
  }

  public override validate(from: unknown): Result<number> {
    if (this._nonStrictConverter !== undefined) {
      // Non-strict path: delegate to the coercing Converter so that '42' -> 42.
      return this._nonStrictConverter.convert(from);
    }
    // Strict path: use the strict in-place validator.
    return this._strictValidator!.validate(from);
  }

  public override convert(from: unknown): Result<number> {
    // Symmetric with validate(): both paths route through the same underlying logic.
    // This ensures correctness when used as a field validator inside Converters.object
    // or Converters.arrayOf (which call convert(), not validate()).
    if (this._nonStrictConverter !== undefined) {
      return this._nonStrictConverter.convert(from);
    }
    return this._strictValidator!.validate(from);
  }

  public toJson(): JsonObject {
    return { type: this._type, ..._descriptionField(this) };
  }
}

class BooleanSchemaValidator extends SchemaValidatorBase<boolean> {
  private readonly _inner: Validation.Validator<boolean>;

  public constructor(opts?: ISchemaOptions) {
    const inner = Validators.boolean;
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('boolean', (__from: unknown): boolean | Failure<boolean> => true, opts?.description);
    this._inner = inner;
  }

  public override validate(from: unknown): Result<boolean> {
    return this._inner.validate(from);
  }

  public override convert(from: unknown): Result<boolean> {
    return this._inner.validate(from);
  }

  public toJson(): JsonObject {
    return { type: 'boolean', ..._descriptionField(this) };
  }
}

class EnumSchemaValidator<T extends string> extends SchemaValidatorBase<T> {
  public readonly enum: ReadonlyArray<T>;
  private readonly _inner: Validation.Validator<T>;

  public constructor(values: ReadonlyArray<T>, opts?: ISchemaOptions) {
    const inner = Validators.enumeratedValue(values);
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('enum', (__from: unknown): boolean | Failure<T> => true, opts?.description);
    this.enum = values;
    this._inner = inner;
  }

  public override validate(from: unknown): Result<T> {
    return this._inner.validate(from);
  }

  public override convert(from: unknown): Result<T> {
    return this._inner.validate(from);
  }

  public toJson(): JsonObject {
    return { type: 'string', enum: [...this.enum], ..._descriptionField(this) };
  }
}

class OptionalSchemaValidator<S extends ISchemaValidator<unknown>> extends SchemaValidatorBase<
  Static<S> | undefined
> {
  public readonly _schema: S;

  public constructor(inner: S) {
    // ValidatorFunc placeholder — validate() and convert() are both overridden below.
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('optional', (__from: unknown): boolean | Failure<Static<S> | undefined> => true);
    this._schema = inner;
  }

  public override validate(from: unknown): Result<Static<S> | undefined> {
    // Route through convert() so that inner transformations (e.g. non-strict number coercion,
    // object property stripping) are applied even when validate() is called directly.
    return this.convert(from);
  }

  public override convert(from: unknown): Result<Static<S> | undefined> {
    if (from === undefined) {
      return succeed(undefined);
    }
    // Delegate to inner.convert() so that coercions and transformations from the inner schema
    // propagate to callers (both Converters.object field evaluation and direct validate() calls).
    return this._schema.convert(from) as Result<Static<S> | undefined>;
  }

  public toJson(): JsonObject {
    // optionality is transparent at the JSON Schema level; the parent emits required/optional split.
    return this._schema.toJson();
  }
}

class ArraySchemaValidator<S extends ISchemaValidator<unknown>> extends SchemaValidatorBase<Static<S>[]> {
  public readonly _items: S;
  // Uses a Converter (not Validator) so that element convert() is called on each item,
  // propagating coercions from the item schema (e.g. non-strict number coercion).
  private readonly _converter: Converter<Static<S>[]>;

  public constructor(items: S, opts?: ISchemaOptions) {
    // Converters.arrayOf calls .convert() on each element, which routes through the item schema's
    // convert() override — correctly propagating coercions (e.g. '42' -> 42 for non-strict numbers).
    const converter = Converters.arrayOf(items as unknown as Converter<Static<S>>);
    // ValidatorFunc placeholder — validate() and convert() are both overridden below.
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('array', (__from: unknown): boolean | Failure<Static<S>[]> => true, opts?.description);
    this._items = items;
    this._converter = converter;
  }

  public override validate(from: unknown): Result<Static<S>[]> {
    // Route through convert() so that element coercions from the item schema propagate.
    return this._converter.convert(from);
  }

  public override convert(from: unknown): Result<Static<S>[]> {
    return this._converter.convert(from);
  }

  public toJson(): JsonObject {
    return { type: 'array', items: this._items.toJson(), ..._descriptionField(this) };
  }
}

class ObjectSchemaValidator<P extends ILlmProperties> extends SchemaValidatorBase<ObjectStatic<P>> {
  public readonly _properties: P;
  public readonly additionalProperties: boolean;
  // Uses a Converter (not Validator) so that extra properties are stripped from the result
  // (Validators are in-place and would return the full input object including unknown fields).
  // Both validate() and convert() route through this converter so that nested schema coercions
  // propagate correctly regardless of which method is called.
  private readonly _converter: Converter<ObjectStatic<P>>;

  public constructor(properties: P, opts?: IObjectSchemaOptions) {
    const additionalProperties = opts?.additionalProperties === true;
    const converter = _buildObjectConverter(properties, additionalProperties);
    // ValidatorFunc placeholder — validate() and convert() are both overridden below.
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('object', (__from: unknown): boolean | Failure<ObjectStatic<P>> => true, opts?.description);
    this._properties = properties;
    this.additionalProperties = additionalProperties;
    this._converter = converter;
  }

  public override validate(from: unknown): Result<ObjectStatic<P>> {
    return this._converter.convert(from);
  }

  public override convert(from: unknown): Result<ObjectStatic<P>> {
    return this._converter.convert(from);
  }

  public toJson(): JsonObject {
    const properties: JsonObject = {};
    const required: string[] = [];

    for (const [key, prop] of Object.entries(this._properties)) {
      // OptionalSchemaValidator.toJson() delegates to the inner schema, so optionality is
      // transparent at the wire level and managed via the `required` array.
      properties[key] = prop.toJson();
      if (prop._type !== 'optional') {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
      ...(!this.additionalProperties && { additionalProperties: false }),
      ..._descriptionField(this)
    };
  }
}

// ---------------------------------------------------------------------------
// Private builder helpers
// ---------------------------------------------------------------------------

/**
 * Builds a `Converter<ObjectStatic<P>>` for object nodes using `Converters.object`.
 * Uses a Converter (not Validator) so that extra properties are stripped from the result —
 * Validators are in-place and would pass unrecognized fields through unchanged.
 * Optional properties are tracked and listed in `optionalFields`.
 * Each property's ISchemaValidator is used as the field converter — its convert() method
 * is called by ObjectConverter for each field, propagating nested coercions and transforms.
 */
function _buildObjectConverter<P extends ILlmProperties>(
  properties: P,
  additionalProperties: boolean
): Converter<ObjectStatic<P>> {
  const fields: Record<string, Converter<unknown> | Validation.Validator<unknown>> = {};
  const optionalKeys: string[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    // Each prop IS both a Validator<unknown> and a Converter<unknown> (ISchemaValidator extends both,
    // and all schema classes override convert()). We cast to Validator<unknown> for the field-map
    // construction; ObjectConverter calls .convert() on each field, which routes through the schema's
    // convert() override and propagates nested coercions correctly.
    fields[key] = prop as unknown as Validation.Validator<unknown>;
    if (prop._type === 'optional') {
      optionalKeys.push(key);
    }
  }

  return Converters.object(fields as Conversion.FieldConverters<ObjectStatic<P>>, {
    optionalFields: optionalKeys as (keyof ObjectStatic<P>)[],
    strict: !additionalProperties
  });
}

function _descriptionField(schema: ISchemaValidator<unknown>): { description?: string } {
  return schema.description !== undefined ? { description: schema.description } : {};
}

// ---------------------------------------------------------------------------
// Public factory functions
// ---------------------------------------------------------------------------

/**
 * Creates a schema node for a JSON `string`.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is `string`.
 * @public
 */
export function string(opts?: ISchemaOptions): ISchemaValidator<string> {
  return new StringSchemaValidator(opts);
}

/**
 * Creates a schema node for a JSON `number`.
 * @param opts - Optional description and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` whose `Static` type is `number`.
 * @public
 */
export function number(opts?: INumberSchemaOptions): ISchemaValidator<number> {
  return new NumberSchemaValidator('number', opts);
}

/**
 * Creates a schema node for a JSON `integer`.
 * @param opts - Optional description and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` (tagged `integer`) whose `Static` type is `number`.
 * @public
 */
export function integer(opts?: INumberSchemaOptions): ISchemaValidator<number> {
  return new NumberSchemaValidator('integer', opts);
}

/**
 * Creates a schema node for a JSON `boolean`.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is `boolean`.
 * @public
 */
export function boolean(opts?: ISchemaOptions): ISchemaValidator<boolean> {
  return new BooleanSchemaValidator(opts);
}

/**
 * Creates a schema node for a closed set of string literals.
 * @param values - The allowed string values.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @public
 */
export function enumOf<T extends string>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T> {
  return new EnumSchemaValidator(values, opts);
}

/**
 * Marks a property schema as optional within an `object` schema.
 * @param schema - The inner schema to make optional.
 * @returns An `ISchemaValidator` whose `Static` type is `Static<S> | undefined`.
 * @public
 */
export function optional<S extends ISchemaValidator<unknown>>(
  schema: S
): ISchemaValidator<Static<S> | undefined> {
  return new OptionalSchemaValidator(schema);
}

/**
 * Creates a schema node for a JSON `array` whose elements all match `items`.
 * @param items - The schema applied to every element.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is `Array<Static<S>>`.
 * @public
 */
export function array<S extends ISchemaValidator<unknown>>(
  items: S,
  opts?: ISchemaOptions
): ISchemaValidator<Static<S>[]> {
  return new ArraySchemaValidator(items, opts);
}

/**
 * Creates a schema node for a JSON `object` with a fixed set of typed properties.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * `optional` to make it optional.
 * @param opts - Optional description and `additionalProperties` flag.
 * @returns An `ISchemaValidator` whose `Static` type derives the required/optional split.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts?: IObjectSchemaOptions
): ISchemaValidator<ObjectStatic<P>> {
  return new ObjectSchemaValidator(properties, opts);
}
