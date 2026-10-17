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
  allSucceed,
  fail,
  mapResults,
  succeed
} from '@fgv/ts-utils';
import { jsonValue } from '../converters';
import { JsonObject, JsonValue, isJsonObject } from '../json';
import {
  ILlmProperties,
  ISchemaValidator,
  ObjectStatic,
  OpenObjectStatic,
  SchemaNodeType,
  Static
} from './types';
import {
  IAnySchemaOptions,
  INumberSchemaOptions,
  IObjectSchemaOptions,
  ISchemaOptions,
  IStringSchemaOptions
} from './options';
import {
  NonStringEnumType,
  NumberConstraints,
  SchemaAnnotations,
  StringConstraints,
  annotationFields,
  checkAnnotations,
  checkEnumValues,
  checkNumberOptions,
  describeEnumMember,
  checkStringOptions,
  enforceNumberConstraints,
  enforceStringConstraints,
  numberConstraintFields,
  pickAnnotations,
  pickNumberConstraints,
  pickStringConstraints,
  stringConstraintFields
} from './constraints';

/**
 * Returns the options a factory was given once they are known to be coherent, or throws.
 *
 * @remarks
 * Schemas are declared, not computed — a factory call is setup, typically a module-level
 * constant — so an incoherent option set (`minimum` above `maximum`, a negative `minLength`) is
 * an authoring error reported at the declaration, as `orThrow()` is for any other setup step.
 * A schema that arrives at run time goes through `fromJson`, which runs the same checks and
 * returns them as a `Failure` naming the path.
 */
function _coherent<T>(factory: string, checked: Result<T>): T {
  return checked.withErrorFormat((msg) => `JsonSchema.${factory}: ${msg}`).orThrow();
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
  /** Whether `null` is an accepted value — see {@link JsonSchema.ISchemaOptions.nullable}. */
  public readonly nullable: boolean;
  /** The annotations this node emits: `description`, `title`, `default`, `examples`. */
  private readonly _annotations: SchemaAnnotations;

  protected constructor(
    type: SchemaNodeType,
    validator: Validation.ValidatorFunc<T, unknown>,
    opts?: ISchemaOptions
  ) {
    super({ validator });
    this._type = type;
    this.nullable = opts?.nullable === true;
    if (opts?.description !== undefined) {
      this.description = opts.description;
    }
    // Copied — `default` and `examples` deeply — so a caller mutating its options object
    // afterwards cannot change the node.
    this._annotations = pickAnnotations(opts);
  }

  /** The wire fields for this node's annotations — see `annotationFields`. */
  protected _annotationFields(): JsonObject {
    return annotationFields(this._annotations);
  }

  public abstract toJson(): JsonObject;

  /**
   * Accepts `null` on a nullable node, and otherwise defers to the node's own check.
   *
   * @remarks
   * The **one** place nullability is honoured at validation time, so a node cannot
   * accept `null` in `validate` and reject it in `convert`, or vice versa. Each
   * concrete node wraps both of its methods in this rather than testing `nullable`
   * itself.
   *
   * The cast is where the runtime meets the types: `T` includes `null` exactly when
   * `nullable` is set, and it is the factory overloads — not this class — that
   * establish the correspondence.
   * @internal
   */
  protected _orNull<U>(from: unknown, check: () => Result<U>): Result<U> {
    if (this.nullable && from === null) {
      return succeed(null as unknown as U);
    }
    return check();
  }

  /**
   * The `type` field for this node's wire schema, widened to a union when nullable.
   *
   * @remarks
   * Emits draft-07's `type: [t, 'null']`, which is what OpenAI strict mode requires.
   * It deliberately does **not** emit OpenAPI's `nullable: true` keyword, which OpenAI
   * ignores; the Gemini adapter translates to that dialect at its own boundary.
   * @internal
   */
  protected _typeField(type: string): { type: string | [string, 'null'] } {
    return { type: this.nullable ? [type, 'null'] : type };
  }
}

// ---------------------------------------------------------------------------
// Concrete schema node classes
// ---------------------------------------------------------------------------

class StringSchemaValidator extends SchemaValidatorBase<string> {
  private readonly _inner: Validation.Validator<string>;
  /** The node's length constraints and format. */
  private readonly _constraints: StringConstraints;

  public constructor(opts?: IStringSchemaOptions) {
    const inner = Validators.string;
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('string', (__from: unknown): boolean | Failure<string> => true, opts);
    this._inner = inner;
    this._constraints = pickStringConstraints(opts);
  }

  public override validate(from: unknown): Result<string> {
    return this._orNull(from, () => this._check(from));
  }

  public override convert(from: unknown): Result<string> {
    return this._orNull(from, () => this._check(from));
  }

  private _check(from: unknown): Result<string> {
    return this._inner.validate(from).onSuccess((s) => enforceStringConstraints(s, this._constraints));
  }

  public toJson(): JsonObject {
    return {
      ...this._typeField('string'),
      ...stringConstraintFields(this._constraints),
      ...this._annotationFields()
    };
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
  /** The node's numeric constraints. */
  private readonly _constraints: NumberConstraints;
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
      super(type, (__from: unknown): boolean | Failure<number> => true, opts);
      this._strictValidator = strictValidator;
      this._nonStrictConverter = undefined;
    } else {
      // Non-strict: the ValidatorFunc is a placeholder — validate() and convert() are both
      // overridden below to use the coercing Converter, so this lambda is never invoked.
      /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
      super(type, (__from: unknown): boolean | Failure<number> => true, opts);
      this._strictValidator = undefined;
      this._nonStrictConverter = isInteger
        ? Converters.number.withConstraint((n) => Number.isInteger(n) || fail(`${n}: not an integer`))
        : Converters.number;
    }

    this.strict = strict;
    this._constraints = pickNumberConstraints(opts);
  }

  public override validate(from: unknown): Result<number> {
    return this._orNull(from, () => this._check(from));
  }

  public override convert(from: unknown): Result<number> {
    // Symmetric with validate(): both paths route through the same underlying logic.
    // This ensures correctness when used as a field validator inside Converters.object
    // or Converters.arrayOf (which call convert(), not validate()).
    return this._orNull(from, () => this._check(from));
  }

  private _check(from: unknown): Result<number> {
    return this._checkType(from).onSuccess((n) => enforceNumberConstraints(n, this._constraints));
  }

  private _checkType(from: unknown): Result<number> {
    if (this._nonStrictConverter !== undefined) {
      // Non-strict path: delegate to the coercing Converter so that '42' -> 42.
      return this._nonStrictConverter.convert(from);
    }
    // Strict path: use the strict in-place validator.
    return this._strictValidator!.validate(from);
  }

  public toJson(): JsonObject {
    return {
      ...this._typeField(this._type),
      ...numberConstraintFields(this._constraints),
      ...this._annotationFields()
    };
  }
}

class BooleanSchemaValidator extends SchemaValidatorBase<boolean> {
  private readonly _inner: Validation.Validator<boolean>;

  public constructor(opts?: ISchemaOptions) {
    const inner = Validators.boolean;
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('boolean', (__from: unknown): boolean | Failure<boolean> => true, opts);
    this._inner = inner;
  }

  public override validate(from: unknown): Result<boolean> {
    return this._orNull(from, () => this._inner.validate(from));
  }

  public override convert(from: unknown): Result<boolean> {
    return this._orNull(from, () => this._inner.validate(from));
  }

  public toJson(): JsonObject {
    return { ...this._typeField('boolean'), ...this._annotationFields() };
  }
}

/**
 * A closed set of values sharing one JSON type: strings (`enumOf`), numbers or integers
 * (`numberEnumOf` / `integerEnumOf`), or booleans (`booleanEnumOf`).
 *
 * @remarks
 * The node kind is `'enum'` whatever the value type; `valueType` is what `toJson()` states as the
 * wire `type`, so a reader consulting either `type` or `enum` reaches the same answer.
 */
class EnumSchemaValidator<T extends string | number | boolean> extends SchemaValidatorBase<T> {
  public readonly enum: ReadonlyArray<T>;
  /** The JSON type every member shares, emitted as the wire `type`. */
  public readonly valueType: 'string' | NonStringEnumType;
  private readonly _inner: Validation.Validator<T>;

  public constructor(
    valueType: 'string' | NonStringEnumType,
    values: ReadonlyArray<T>,
    inner: Validation.Validator<T>,
    opts?: ISchemaOptions
  ) {
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('enum', (__from: unknown): boolean | Failure<T> => true, opts);
    this.enum = values;
    this.valueType = valueType;
    this._inner = inner;
  }

  public override validate(from: unknown): Result<T> {
    return this._orNull(from, () => this._inner.validate(from));
  }

  public override convert(from: unknown): Result<T> {
    return this._orNull(from, () => this._inner.validate(from));
  }

  public toJson(): JsonObject {
    // `null` has to join the value list as well as the type union: a validator reading
    // `enum` alone would otherwise reject the very value `type` says is allowed, and
    // the two halves of one node disagreeing is what this package exists to prevent.
    return {
      ...this._typeField(this.valueType),
      enum: this.nullable ? [...this.enum, null] : [...this.enum],
      ...this._annotationFields()
    };
  }
}

/**
 * Accepts exactly the listed numbers or booleans, compared with `===` — no coercion, so `'1'` is
 * not `1`.
 */
function _literalValues<T extends number | boolean>(values: ReadonlyArray<T>): Validation.Validator<T> {
  return new Validation.Base.GenericValidator<T>({
    validator: (from: unknown): boolean | Failure<T> =>
      values.some((value) => value === from) ||
      fail(
        `Invalid enumerated value ${describeEnumMember(from)} - expected: (${values
          .map((value) => String(value))
          .join(', ')})`
      )
  });
}

/**
 * A node that accepts any JSON value — JSON Schema's `{}`, pydantic's `Any`.
 *
 * @remarks
 * Validates through `jsonValue`, so the result is a fresh copy of the input and a value that is not
 * JSON (`undefined`, a function, a class instance) is refused. Its wire form states no `type`,
 * which is the point and also the hazard: a provider that requires a `type` on every schema cannot
 * be sent it, and the provider adapters in `@fgv/ts-extras` refuse the request rather than invent
 * one.
 */
class AnySchemaValidator extends SchemaValidatorBase<JsonValue> {
  public constructor(opts?: IAnySchemaOptions) {
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('any', (__from: unknown): boolean | Failure<JsonValue> => true, opts);
  }

  public override validate(from: unknown): Result<JsonValue> {
    return jsonValue.convert(from);
  }

  public override convert(from: unknown): Result<JsonValue> {
    return jsonValue.convert(from);
  }

  public toJson(): JsonObject {
    return this._annotationFields();
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
    super('array', (__from: unknown): boolean | Failure<Static<S>[]> => true, opts);
    this._items = items;
    this._converter = converter;
  }

  public override validate(from: unknown): Result<Static<S>[]> {
    // Route through convert() so that element coercions from the item schema propagate.
    return this._orNull(from, () => this._converter.convert(from));
  }

  public override convert(from: unknown): Result<Static<S>[]> {
    return this._orNull(from, () => this._converter.convert(from));
  }

  public toJson(): JsonObject {
    return { ...this._typeField('array'), items: this._items.toJson(), ...this._annotationFields() };
  }
}

class ObjectSchemaValidator<P extends ILlmProperties> extends SchemaValidatorBase<ObjectStatic<P>> {
  public readonly _properties: P;
  public readonly additionalProperties: boolean;
  /** The schema every undeclared property must match, for a record; absent otherwise. */
  public readonly _values?: ISchemaValidator<unknown>;
  // Uses a Converter (not Validator) so that the result is a new object built from converted
  // values (Validators are in-place and would return the input unchanged, skipping coercions).
  // Both validate() and convert() route through this converter so that nested schema coercions
  // propagate correctly regardless of which method is called.
  private readonly _converter: Converter<ObjectStatic<P>>;

  public constructor(properties: P, opts?: IObjectSchemaOptions, values?: ISchemaValidator<unknown>) {
    const additionalProperties = values !== undefined || opts?.additionalProperties === true;
    const converter = _buildObjectConverter(properties, additionalProperties, values);
    // ValidatorFunc placeholder — validate() and convert() are both overridden below.
    /* c8 ignore next 1 - placeholder ValidatorFunc; validate() and convert() overrides always intercept */
    super('object', (__from: unknown): boolean | Failure<ObjectStatic<P>> => true, opts);
    this._properties = properties;
    this.additionalProperties = additionalProperties;
    this._converter = converter;
    if (values !== undefined) {
      this._values = values;
    }
  }

  public override validate(from: unknown): Result<ObjectStatic<P>> {
    return this._orNull(from, () => this._converter.convert(from));
  }

  public override convert(from: unknown): Result<ObjectStatic<P>> {
    return this._orNull(from, () => this._converter.convert(from));
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
      ...this._typeField('object'),
      properties,
      ...(required.length > 0 && { required }),
      // An absent keyword is JSON Schema's spelling of "open", which is what the open converter
      // honours. `true` is not emitted: Anthropic JSON outputs require `additionalProperties: false`
      // where the keyword is present, and an explicit `true` was not probed against them.
      ...(!this.additionalProperties && { additionalProperties: false }),
      // A record states the schema its undeclared properties must match, which is what its
      // converter enforces for each of them.
      ...(this._values !== undefined && { additionalProperties: this._values.toJson() }),
      ...this._annotationFields()
    };
  }
}

// ---------------------------------------------------------------------------
// Private builder helpers
// ---------------------------------------------------------------------------

/**
 * Builds a `Converter<ObjectStatic<P>>` for object nodes using `Converters.object`.
 * Each property's ISchemaValidator is used as the field converter — its convert() method
 * is called by ObjectConverter for each field, propagating nested coercions and transforms.
 * Optional properties are tracked and listed in `optionalFields`.
 *
 * A closed object (`additionalProperties: false`) is a strict `Converters.object`, which
 * rejects undeclared keys. An open object is the same declared-field conversion followed by
 * `_convertOpenObject`, because `Converters.object` builds its result from declared
 * fields only and would otherwise drop every key the open wire schema admits.
 *
 * The wire and the converter agree whichever branch is taken: the closed branch rejects what
 * `additionalProperties: false` forbids, and the open branch keeps what an open schema admits.
 */
function _buildObjectConverter<P extends ILlmProperties>(
  properties: P,
  additionalProperties: boolean,
  values: ISchemaValidator<unknown> | undefined
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

  const declared = Converters.object(fields as Conversion.FieldConverters<ObjectStatic<P>>, {
    optionalFields: optionalKeys as (keyof ObjectStatic<P>)[],
    strict: !additionalProperties
  });
  if (!additionalProperties) {
    return declared;
  }
  return Converters.generic<ObjectStatic<P>>((from: unknown) =>
    isJsonObject(from)
      ? _convertOpenObject(from, declared, properties, values ?? jsonValue)
      : fail(`open object: expected a JSON object, got ${_kindOf(from)}`)
  );
}

/** What an open object converts each undeclared value through: `jsonValue`, or a record's schema. */
interface IUndeclaredValueConverter {
  convert(from: unknown): Result<unknown>;
}

/**
 * Converts an open object: the declared fields through `declared`, and every undeclared key
 * through `_convertUndeclaredKeys`. The two sides are validated independently and their
 * failures aggregated, so a bad declared field does not hide bad undeclared values; the result is
 * built only when both succeed.
 */
function _convertOpenObject<T extends object>(
  from: JsonObject,
  declared: Converter<T>,
  properties: ILlmProperties,
  values: IUndeclaredValueConverter
): Result<T> {
  const converted = declared.convert(from);
  const extras = _convertUndeclaredKeys(from, properties, values);
  return allSucceed([converted, extras], from).onSuccess(() =>
    converted.onSuccess((c) =>
      extras.onSuccess((e) => {
        const entries: [string, unknown][] = [...Object.entries(c), ...e];
        // The result is `c` plus keys `T` leaves unconstrained, so it is still a `T`.
        return succeed(Object.fromEntries(entries) as T);
      })
    )
  );
}

/**
 * Converts every key of `from` that `properties` does not declare through `values` — `jsonValue`
 * for an open object, the value schema for a record — reporting every bad one.
 *
 * @remarks
 * An own `"__proto__"` key is dropped, matching `Converters.jsonObject`, which copies every
 * nested value: carrying it as data would hand a caller a key that `Object.assign` or a spread
 * turns into a prototype. The caller assembles the result with `Object.fromEntries` rather than
 * object spread, which compiled down-level becomes `Object.assign`.
 */
function _convertUndeclaredKeys(
  from: JsonObject,
  properties: ILlmProperties,
  values: IUndeclaredValueConverter
): Result<[string, unknown][]> {
  const undeclared = Object.entries(from).filter(
    ([key]) => key !== '__proto__' && !Object.prototype.hasOwnProperty.call(properties, key)
  );
  return mapResults(
    undeclared.map(([key, value]) =>
      // An own key whose value is `undefined` is not JSON, so it is refused exactly as an open object
      // refuses it, whatever the record's value schema would accept (`optional(...)` accepts it).
      (value === undefined ? jsonValue : values)
        .convert(value)
        .withErrorFormat((msg) => `${key}: ${msg}`)
        .onSuccess((v) => succeed<[string, unknown]>([key, v]))
    )
  );
}

/** Names what a non-object input was, for the open-object refusal. */
function _kindOf(from: unknown): string {
  if (from === null) {
    return 'null';
  }
  return Array.isArray(from) ? 'array' : typeof from;
}

// ---------------------------------------------------------------------------
// Public option checkers
// ---------------------------------------------------------------------------

/**
 * Checks `number` / `integer` options for coherence without constructing a node — the
 * non-throwing path for bounds derived at run time.
 *
 * @remarks
 * Runs exactly the checks the `number` and `integer` factories run, which throw on failure: a
 * non-finite bound, `minimum` above `maximum`, exclusive bounds leaving no value (for `integer`, no
 * integer) in range, `multipleOf` not greater than zero, and a `default` or `examples` member that
 * is not JSON. Options it accepts never make the factory throw.
 *
 * @example
 * ```ts
 * const schema = JsonSchema.validateNumberOptions('integer', { minimum: lo, maximum: hi }).onSuccess((o) =>
 *   succeed(JsonSchema.integer(o))
 * );
 * ```
 * @param type - The node kind the options are for.
 * @param opts - The options to check.
 * @returns The options, or a `Failure` naming the keyword and the value.
 * @public
 */
export function validateNumberOptions(
  type: 'number' | 'integer',
  opts: INumberSchemaOptions | undefined
): Result<INumberSchemaOptions | undefined> {
  return checkNumberOptions(type, opts);
}

/**
 * Checks `string` options for coherence without constructing a node — the non-throwing path for
 * lengths derived at run time.
 *
 * @remarks
 * Runs exactly the checks the `string` factory runs, which throws on failure: a length that is not
 * a non-negative integer, `minLength` above `maxLength`, and a `default` or `examples` member that
 * is not JSON. Options it accepts never make the factory throw.
 * @param opts - The options to check.
 * @returns The options, or a `Failure` naming the keyword and the value.
 * @public
 */
export function validateStringOptions(
  opts: IStringSchemaOptions | undefined
): Result<IStringSchemaOptions | undefined> {
  return checkStringOptions(opts);
}

// ---------------------------------------------------------------------------
// Public factory functions
// ---------------------------------------------------------------------------

/**
 * Creates a schema node for a JSON `string`.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is `string`.
 * @throws Error when the options are incoherent — see `validateStringOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
// `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
// `JsonPrimitive` takes in this package's `json` packlet.
// eslint-disable-next-line @rushstack/no-new-null
export function string(opts: IStringSchemaOptions & { nullable: true }): ISchemaValidator<string | null>;
/**
 * Creates a schema node for a JSON `string`.
 * @param opts - Optional description and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is `string`.
 * @throws Error when the options are incoherent — see `validateStringOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
export function string(opts?: IStringSchemaOptions): ISchemaValidator<string>;
export function string(opts?: IStringSchemaOptions): ISchemaValidator<string> {
  return new StringSchemaValidator(_coherent('string', checkStringOptions(opts)));
}

/**
 * Creates a schema node for a JSON `number`.
 * @param opts - Optional description and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` whose `Static` type is `number`.
 * @throws Error when the options are incoherent — see `validateNumberOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
export function number(
  opts: INumberSchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<number | null>;
/**
 * Creates a schema node for a JSON `number`.
 * @param opts - Optional description, nullability and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` whose `Static` type is `number`.
 * @throws Error when the options are incoherent — see `validateNumberOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
export function number(opts?: INumberSchemaOptions): ISchemaValidator<number>;
export function number(opts?: INumberSchemaOptions): ISchemaValidator<number> {
  return new NumberSchemaValidator('number', _coherent('number', checkNumberOptions('number', opts)));
}

/**
 * Creates a schema node for a JSON `integer`.
 * @param opts - Optional description and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` (tagged `integer`) whose `Static` type is `number`.
 * @throws Error when the options are incoherent — see `validateNumberOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
export function integer(
  opts: INumberSchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<number | null>;
/**
 * Creates a schema node for a JSON `integer`.
 * @param opts - Optional description, nullability and strict mode (see `INumberSchemaOptions`).
 * @returns An `ISchemaValidator` (tagged `integer`) whose `Static` type is `number`.
 * @throws Error when the options are incoherent — see `validateNumberOptions`, the non-throwing check. A
 * schema is declared, so this is a setup-time error.
 * @public
 */
export function integer(opts?: INumberSchemaOptions): ISchemaValidator<number>;
export function integer(opts?: INumberSchemaOptions): ISchemaValidator<number> {
  return new NumberSchemaValidator('integer', _coherent('integer', checkNumberOptions('integer', opts)));
}

/**
 * Creates a schema node for a JSON `boolean`.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is `boolean`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
// `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
// `JsonPrimitive` takes in this package's `json` packlet.
// eslint-disable-next-line @rushstack/no-new-null
export function boolean(opts: ISchemaOptions & { nullable: true }): ISchemaValidator<boolean | null>;
/**
 * Creates a schema node for a JSON `boolean`.
 * @param opts - Optional description and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is `boolean`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function boolean(opts?: ISchemaOptions): ISchemaValidator<boolean>;
export function boolean(opts?: ISchemaOptions): ISchemaValidator<boolean> {
  return new BooleanSchemaValidator(_coherent('boolean', checkAnnotations(opts)));
}

/**
 * Creates a schema node for a closed set of string literals.
 * @param values - The allowed string values.
 * @param opts - Optional description.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function enumOf<T extends string>(
  values: readonly T[],
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<T | null>;
/**
 * Creates a schema node for a closed set of string literals.
 * @param values - The allowed string values.
 * @param opts - Optional description and nullability. A nullable enum also carries `null` in
 * its emitted `enum` list, so the two halves of the node cannot disagree.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function enumOf<T extends string>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T>;
export function enumOf<T extends string>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T> {
  return new EnumSchemaValidator(
    'string',
    values,
    Validators.enumeratedValue(values),
    _coherent('enumOf', checkAnnotations(opts))
  );
}

/** Builds a numeric or boolean enum node once its members and options are known coherent. */
function _nonStringEnum<T extends number | boolean>(
  factory: string,
  type: NonStringEnumType,
  values: ReadonlyArray<T>,
  opts: ISchemaOptions | undefined
): ISchemaValidator<T> {
  const checked = _coherent(
    factory,
    checkEnumValues(type, values).onSuccess(() => checkAnnotations(opts))
  );
  // Copied, so a caller mutating its array afterwards cannot change the node.
  const members: ReadonlyArray<T> = [...values];
  return new EnumSchemaValidator(type, members, _literalValues(members), checked);
}

/**
 * Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`, or `null`.
 * @throws Error when `values` is empty or holds a member that is not a finite number, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function numberEnumOf<T extends number>(
  values: readonly T[],
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<T | null>;
/**
 * Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).
 *
 * @remarks
 * Emits `{ type: 'number', enum: [...] }`. The validator accepts exactly the listed values,
 * compared with `===`, and coerces nothing — `'1'` is not `1`. A nullable node also carries `null`
 * in its emitted `enum`, as `enumOf` does.
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @throws Error when `values` is empty or holds a member that is not a finite number, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function numberEnumOf<T extends number>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T>;
export function numberEnumOf<T extends number>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T> {
  return _nonStringEnum('numberEnumOf', 'number', values, opts);
}

/**
 * Creates a schema node for a closed set of integers (pydantic `Literal[1, 2]`).
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`, or `null`.
 * @throws Error when `values` is empty or holds a member that is not an integer, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function integerEnumOf<T extends number>(
  values: readonly T[],
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<T | null>;
/**
 * Creates a schema node for a closed set of integers (pydantic `Literal[1, 2]`).
 *
 * @remarks
 * Emits `{ type: 'integer', enum: [...] }`. The validator accepts exactly the listed values,
 * compared with `===`, and coerces nothing — `'1'` is not `1`. A nullable node also carries `null`
 * in its emitted `enum`, as `enumOf` does.
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @throws Error when `values` is empty or holds a member that is not an integer, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function integerEnumOf<T extends number>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T>;
export function integerEnumOf<T extends number>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T> {
  return _nonStringEnum('integerEnumOf', 'integer', values, opts);
}

/**
 * Creates a schema node for a closed set of booleans (a boolean `const`).
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`, or `null`.
 * @throws Error when `values` is empty or holds a member that is not a boolean, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function booleanEnumOf<T extends boolean>(
  values: readonly T[],
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<T | null>;
/**
 * Creates a schema node for a closed set of booleans (a boolean `const`).
 *
 * @remarks
 * Emits `{ type: 'boolean', enum: [...] }`. The validator accepts exactly the listed values,
 * compared with `===`, and coerces nothing — `'1'` is not `1`. A nullable node also carries `null`
 * in its emitted `enum`, as `enumOf` does.
 * @param values - The allowed values.
 * @param opts - Optional annotations and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is the union of `values`.
 * @throws Error when `values` is empty or holds a member that is not a boolean, or when
 * `default` or a member of `examples` is not a JSON value — a setup-time error, since a schema is
 * declared.
 * @public
 */
export function booleanEnumOf<T extends boolean>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T>;
export function booleanEnumOf<T extends boolean>(values: readonly T[], opts?: ISchemaOptions): ISchemaValidator<T> {
  return _nonStringEnum('booleanEnumOf', 'boolean', values, opts);
}

/**
 * Creates a schema node that accepts any JSON value — JSON Schema's `{}`, pydantic's `Any`.
 *
 * @remarks
 * Emits `{}` plus any annotations. The validator accepts any `JsonValue`, `null` included, and
 * returns a copy; a value that is not JSON (`undefined`, a function, a class instance) is refused.
 *
 * Its wire form has no `type`, and some providers require one on every schema (Gemini; OpenAI
 * strict mode). The provider adapters in `@fgv/ts-extras` refuse a request that would send it to
 * such a provider, naming the tool and the path, rather than substitute a type — which would narrow
 * what the model may send below what the validator accepts.
 * @param opts - Optional annotations.
 * @returns An `ISchemaValidator` whose `Static` type is `JsonValue`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error,
 * since a schema is declared.
 * @public
 */
export function anyValue(opts?: IAnySchemaOptions): ISchemaValidator<JsonValue> {
  return new AnySchemaValidator(_coherent('anyValue', checkAnnotations(opts)));
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
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function array<S extends ISchemaValidator<unknown>>(
  items: S,
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<Static<S>[] | null>;
/**
 * Creates a schema node for a JSON `array` whose elements all match `items`.
 * @param items - The schema applied to every element.
 * @param opts - Optional description and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is `Array<Static<S>>`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function array<S extends ISchemaValidator<unknown>>(
  items: S,
  opts?: ISchemaOptions
): ISchemaValidator<Static<S>[]>;
export function array<S extends ISchemaValidator<unknown>>(
  items: S,
  opts?: ISchemaOptions
): ISchemaValidator<Static<S>[]> {
  return new ArraySchemaValidator(items, _coherent('array', checkAnnotations(opts)));
}

/**
 * Creates a schema node for an **open** JSON `object`: typed declared properties, plus any
 * undeclared properties, which are carried through as `JsonValue`.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * `optional` to make it optional.
 * @param opts - Options including `additionalProperties: true` and `nullable: true`.
 * @returns An `ISchemaValidator` whose `Static` type is `OpenObjectStatic<P> | null`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts: IObjectSchemaOptions & { additionalProperties: true; nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<OpenObjectStatic<P> | null>;
/**
 * Creates a schema node for an **open** JSON `object`: typed declared properties, plus any
 * undeclared properties, which are carried through as `JsonValue`.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * `optional` to make it optional.
 * @param opts - Options including `additionalProperties: true`.
 * @returns An `ISchemaValidator` whose `Static` type is `OpenObjectStatic<P>`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts: IObjectSchemaOptions & { additionalProperties: true }
): ISchemaValidator<OpenObjectStatic<P>>;
/**
 * Creates a schema node for a JSON `object` with a fixed set of typed properties.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * `optional` to make it optional.
 * @param opts - Optional description and `additionalProperties` flag.
 * @returns An `ISchemaValidator` whose `Static` type derives the required/optional split.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts: IObjectSchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<ObjectStatic<P> | null>;
/**
 * Creates a schema node for a JSON `object` with a fixed set of typed properties.
 * @param properties - A record mapping property names to their schemas. Wrap a property with
 * `optional` to make it optional, or author it `nullable` when the provider requires every
 * property to be required.
 * @param opts - Optional description, nullability and `additionalProperties` flag.
 * @returns An `ISchemaValidator` whose `Static` type derives the required/optional split.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function object<P extends ILlmProperties>(
  properties: P,
  opts?: IObjectSchemaOptions
): ISchemaValidator<ObjectStatic<P>>;
export function object<P extends ILlmProperties>(
  properties: P,
  opts?: IObjectSchemaOptions
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<ObjectStatic<P>> | ISchemaValidator<OpenObjectStatic<P> | null> {
  return new ObjectSchemaValidator(properties, _coherent('object', checkAnnotations(opts)));
}

/**
 * Creates a schema node for a JSON object used as a map: any keys, each value matching `values`
 * (pydantic `dict[str, T]`, zod `z.record(T)`).
 *
 * @remarks
 * Emits `{ type: 'object', properties: {}, additionalProperties: <values> }`, and the validator
 * converts every property through `values`, reporting each one that fails. A value that is not a
 * JSON object is refused. As for an open object, an own `"__proto__"` key is dropped — without
 * being validated — rather than carried.
 *
 * Providers whose strict structured-output mode requires `additionalProperties: false` (OpenAI
 * strict, Anthropic JSON outputs) cannot accept a record there, exactly as they cannot accept an
 * open object; it is suited to tool parameters.
 * A value schema whose static type admits `undefined` (such as `optional(...)`) is refused at
 * compile time, and an own property whose value is `undefined` is refused at run time either way:
 * `undefined` is not JSON, and the emitted `additionalProperties` schema does not admit it.
 * @param values - The schema every property value must match.
 * @param opts - Optional description and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is `Record<string, Static<S>> | null`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function record<S extends ISchemaValidator<unknown>>(
  values: S & (undefined extends Static<S> ? never : unknown),
  opts: ISchemaOptions & { nullable: true }
  // `null` is the JSON value being modelled, not a JS sentinel — the same carve-out
  // `JsonPrimitive` takes in this package's `json` packlet.
  // eslint-disable-next-line @rushstack/no-new-null
): ISchemaValidator<Record<string, Static<S>> | null>;
/**
 * Creates a schema node for a JSON object used as a map: any keys, each value matching `values`
 * (pydantic `dict[str, T]`, zod `z.record(T)`).
 * @param values - The schema every property value must match.
 * @param opts - Optional description and nullability.
 * @returns An `ISchemaValidator` whose `Static` type is `Record<string, Static<S>>`.
 * @throws Error when `default` or a member of `examples` is not a JSON value — a setup-time error, since a
 * schema is declared.
 * @public
 */
export function record<S extends ISchemaValidator<unknown>>(
  values: S & (undefined extends Static<S> ? never : unknown),
  opts?: ISchemaOptions
): ISchemaValidator<Record<string, Static<S>>>;
export function record<S extends ISchemaValidator<unknown>>(
  values: S,
  opts?: ISchemaOptions
): ISchemaValidator<Record<string, Static<S>>> {
  // The node is an object with no declared properties, so its class-level static type is
  // `ObjectStatic<{}>`; what it converts to is the map, which only this factory can state.
  return new ObjectSchemaValidator(
    {},
    _coherent('record', checkAnnotations(opts)),
    values
  ) as unknown as ISchemaValidator<Record<string, Static<S>>>;
}
