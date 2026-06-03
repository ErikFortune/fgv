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
  fail
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

/**
 * Adapts the `Result<T>` returned by `Validator.validate()` to the `boolean | Failure<T>`
 * that `ValidatorFunc<T>` requires. Success maps to `true` (the caller's GenericValidator
 * will succeed with the original `from` value); Failure passes through.
 */
function _toValidatorReturn<T>(result: Result<T>): boolean | Failure<T> {
  return result.isSuccess() ? true : result;
}

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
  public constructor(opts?: ISchemaOptions) {
    super(
      'string',
      (from: unknown): boolean | Failure<string> => _toValidatorReturn(Validators.string.validate(from)),
      opts?.description
    );
  }

  public toJson(): JsonObject {
    return { type: 'string', ..._descriptionField(this) };
  }
}

/**
 * Number/integer schema validator.
 *
 * Strict mode (default): delegates to a Validator that only accepts genuine JSON numbers.
 * Non-strict mode: overrides validate() to use a Converter (which coerces numeric strings).
 * The Converter path is needed because Validators are in-place (validate(from) returns
 * succeed(from as T)), which would return '42' as number rather than the coerced 42.
 */
class NumberSchemaValidator extends SchemaValidatorBase<number> {
  public readonly strict: boolean;
  // Held for non-strict mode where coercion is needed (validate() is overridden below).
  private readonly _nonStrictConverter?: Converter<number>;

  public constructor(type: 'number' | 'integer', opts?: INumberSchemaOptions) {
    const strict = opts?.strict !== false;
    const isInteger = type === 'integer';

    if (strict) {
      const strictValidator = isInteger
        ? Validators.isA('integer', (v): v is number => typeof v === 'number' && Number.isInteger(v))
        : Validators.isA('number', (v): v is number => typeof v === 'number' && !Number.isNaN(v));
      super(
        type,
        (from: unknown): boolean | Failure<number> => _toValidatorReturn(strictValidator.validate(from)),
        opts?.description
      );
      this._nonStrictConverter = undefined;
    } else {
      // Non-strict: the ValidatorFunc is a placeholder — validate() is overridden below,
      // so this lambda is never invoked at runtime.
      /* c8 ignore next 1 - placeholder ValidatorFunc; validate() override always intercepts */
      super(type, (__from: unknown): boolean | Failure<number> => true, opts?.description);
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
    return super.validate(from);
  }

  public toJson(): JsonObject {
    return { type: this._type, ..._descriptionField(this) };
  }
}

class BooleanSchemaValidator extends SchemaValidatorBase<boolean> {
  public constructor(opts?: ISchemaOptions) {
    super(
      'boolean',
      (from: unknown): boolean | Failure<boolean> => _toValidatorReturn(Validators.boolean.validate(from)),
      opts?.description
    );
  }

  public toJson(): JsonObject {
    return { type: 'boolean', ..._descriptionField(this) };
  }
}

class EnumSchemaValidator<T extends string> extends SchemaValidatorBase<T> {
  public readonly enum: ReadonlyArray<T>;

  public constructor(values: ReadonlyArray<T>, opts?: ISchemaOptions) {
    const inner = Validators.enumeratedValue(values);
    super(
      'enum',
      (from: unknown): boolean | Failure<T> => _toValidatorReturn(inner.validate(from)),
      opts?.description
    );
    this.enum = values;
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
    super('optional', (from: unknown): boolean | Failure<Static<S> | undefined> => {
      if (from === undefined) {
        return true;
      }
      // Chain the inner validate result: success → true (in-place); failure → Failure<T>.
      // `Failure` carries only a message string — T is a phantom. The single `as` cast
      // narrows the phantom type parameter only (no structural change); this is materially
      // different from the double-cast anti-pattern (`result as unknown as T`).
      const result = inner.validate(from);
      if (result.isSuccess()) {
        return true;
      }
      return result as Failure<Static<S> | undefined>;
    });
    this._schema = inner;
  }

  public toJson(): JsonObject {
    // optionality is transparent at the JSON Schema level; the parent emits required/optional split.
    return this._schema.toJson();
  }
}

class ArraySchemaValidator<S extends ISchemaValidator<unknown>> extends SchemaValidatorBase<Static<S>[]> {
  public readonly _items: S;

  public constructor(items: S, opts?: ISchemaOptions) {
    // Validators.arrayOf accepts Validator<T>; ISchemaValidator<T> extends Validator<T>.
    // The cast bridges static-S to unknown, required for the dynamic construction.
    const inner = Validators.arrayOf(items as unknown as Validation.Validator<Static<S>>);
    super(
      'array',
      (from: unknown): boolean | Failure<Static<S>[]> => _toValidatorReturn(inner.validate(from)),
      opts?.description
    );
    this._items = items;
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
  private readonly _converter: Converter<ObjectStatic<P>>;

  public constructor(properties: P, opts?: IObjectSchemaOptions) {
    const additionalProperties = opts?.additionalProperties === true;
    const converter = _buildObjectConverter(properties, additionalProperties);
    // ValidatorFunc placeholder — validate() is overridden below to use the converter.
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() override always intercepts */
    super('object', (__from: unknown): boolean | Failure<ObjectStatic<P>> => true, opts?.description);
    this._properties = properties;
    this.additionalProperties = additionalProperties;
    this._converter = converter;
  }

  public override validate(from: unknown): Result<ObjectStatic<P>> {
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
 */
function _buildObjectConverter<P extends ILlmProperties>(
  properties: P,
  additionalProperties: boolean
): Converter<ObjectStatic<P>> {
  const fields: Record<string, Validation.Validator<unknown>> = {};
  const optionalKeys: string[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    // Each prop IS a Validator<unknown> (ISchemaValidator extends Validator).
    // The cast to Validator<unknown> is structurally correct: prop validates its specific T,
    // and we widen to unknown for the dynamic field-map construction.
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
