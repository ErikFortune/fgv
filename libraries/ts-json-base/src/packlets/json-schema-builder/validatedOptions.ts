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
 * Validated options: the only way a constraint keyword, `default` or `examples` reaches a factory.
 *
 * Each class is **nominal**. Its options live in an ES `#private` field, which neither an object
 * literal nor a spread can reproduce, so the type system accepts an instance only when it was
 * built by the class's own check, and a factory reads the options only from such an instance.
 *
 * Construction takes a module-private token, so a subclass declared elsewhere cannot hand its own
 * options to the base constructor: without the token, an instance holds no options at all.
 */

import { Result, Validators, captureResult, succeed } from '@fgv/ts-utils';
import {
  StringNodeOptions,
  VALIDATED_OPTIONS_MARKER,
  checkAnnotations,
  checkNumberOptions,
  checkStringOptions,
  describeEnumMember,
  withHeldPattern
} from './constraints';
import { IHeldPattern, INumberSchemaOptions, IObjectSchemaOptions, IStringSchemaOptions } from './options';

/**
 * Proves a construction came from this module. Never exported; the constructors type it as a plain
 * `symbol`, so no unexported type reaches the declarations.
 */
const CONSTRUCTION_TOKEN: unique symbol = Symbol('validated-options-construction');

/** Whether `value` is an object, the precondition of an ES private brand check. */
function _isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/** Freezes checked options — or, without the token, holds none — and marks the instance. */
function _hold<T extends object>(instance: object, kind: string, token: symbol, checked: T): Readonly<T> {
  Object.defineProperty(instance, VALIDATED_OPTIONS_MARKER, { value: kind, enumerable: false });
  // A construction without the token is a subclass declared outside this module: it gets no options.
  return Object.freeze(token === CONSTRUCTION_TOKEN ? checked : ({} as T));
}

/**
 * Options whose annotations `schemaOptions` has checked: `default`
 * and every member of `examples` are JSON values.
 *
 * @remarks
 * Accepted by every factory that takes plain options (`boolean`, `enumOf`, `array`, `object`,
 * `record`, `anyValue`). Constructed only by `schemaOptions`. The options are held privately as a
 * frozen copy, read through `options`; spreading an
 * instance copies only its `kind`, which no factory accepts.
 * @public
 */
export class ValidatedSchemaOptions<T extends IObjectSchemaOptions = IObjectSchemaOptions> {
  /** Discriminates validated options from plain ones, which declare `kind` as `never`. */
  public readonly kind: 'validated-schema-options' = 'validated-schema-options';
  readonly #options: Readonly<T>;

  private constructor(token: symbol, checked: T) {
    this.#options = _hold(this, this.kind, token, checked);
  }

  /** The validated options: a frozen copy of those `schemaOptions` was given. */
  public get options(): Readonly<T> {
    return this.#options;
  }

  /**
   * The options of a genuine instance — checked by an ES private brand, which neither a substituted
   * prototype nor a `Proxy` passes, and read from the private field rather than the getter — or
   * `undefined` for anything else.
   * @internal
   */
  public static _read(value: unknown): Readonly<IObjectSchemaOptions> | undefined {
    return _isObject(value) && #options in value ? (value as ValidatedSchemaOptions).#options : undefined;
  }

  /**
   * Checks the annotations. Called by `schemaOptions`.
   * @internal
   */
  public static _create<T extends IObjectSchemaOptions>(opts: T): Result<ValidatedSchemaOptions<T>> {
    return checkAnnotations(opts).onSuccess((checked) =>
      succeed(new ValidatedSchemaOptions<T>(CONSTRUCTION_TOKEN, checked))
    );
  }
}

/**
 * Options that `numberOptions` or
 * `integerOptions` has found coherent, which the `number`
 * factory accepts.
 *
 * @remarks
 * `ValidatedIntegerOptions` extends this class, so integer-validated options are
 * also number-validated: a range holding an integer holds a number. The converse does not hold, so
 * these are not accepted by the `integer` factory. The options are held privately as a frozen copy,
 * read through `options`.
 * @public
 */
export class ValidatedNumberOptions<T extends INumberSchemaOptions = INumberSchemaOptions> {
  /** Discriminates validated options from plain ones, which declare `kind` as `never`. */
  public readonly kind: 'validated-number-options' = 'validated-number-options';
  readonly #options: Readonly<T>;

  /**
   * Reachable only with this module's construction token; see `numberOptions`.
   * @internal
   */
  protected constructor(token: symbol, checked: T) {
    this.#options = _hold(this, this.kind, token, checked);
  }

  /** The validated options: a frozen copy of those the check was given. */
  public get options(): Readonly<T> {
    return this.#options;
  }

  /**
   * The options of a genuine instance (integer-validated ones included) — checked by an ES private
   * brand, which neither a substituted prototype nor a `Proxy` passes, and read from the private
   * field rather than the getter — or `undefined` for anything else.
   * @internal
   */
  public static _read(value: unknown): Readonly<INumberSchemaOptions> | undefined {
    return _isObject(value) && #options in value ? (value as ValidatedNumberOptions).#options : undefined;
  }

  /**
   * Checks number options. Called by `numberOptions`.
   * @internal
   */
  public static _create<T extends INumberSchemaOptions>(opts: T): Result<ValidatedNumberOptions<T>> {
    return checkNumberOptions('number', opts).onSuccess((checked) =>
      succeed(new ValidatedNumberOptions<T>(CONSTRUCTION_TOKEN, checked))
    );
  }
}

/**
 * Options that `integerOptions` has found coherent for an
 * integer node — in particular, its range holds at least one integer. Accepted by both the
 * `integer` and the `number` factory.
 * @public
 */
export class ValidatedIntegerOptions<
  T extends INumberSchemaOptions = INumberSchemaOptions
> extends ValidatedNumberOptions<T> {
  /**
   * What makes this class nominally distinct from its base, so number-validated options are not
   * accepted where an integer range is required.
   */
  readonly #integer: true = true;

  private constructor(token: symbol, checked: T) {
    super(token, checked);
  }

  /** Always `true`: the range holds at least one integer. */
  public get holdsInteger(): true {
    return this.#integer;
  }

  /**
   * The options of a genuine integer-validated instance — its own private brand, then the base
   * class's private field — or `undefined` for anything else.
   * @internal
   */
  public static _readInteger(value: unknown): Readonly<INumberSchemaOptions> | undefined {
    return _isObject(value) && #integer in value ? ValidatedNumberOptions._read(value) : undefined;
  }

  /**
   * Checks integer options. Called by `integerOptions`.
   * @internal
   */
  public static _createInteger<T extends INumberSchemaOptions>(opts: T): Result<ValidatedIntegerOptions<T>> {
    return checkNumberOptions('integer', opts).onSuccess((checked) =>
      succeed(new ValidatedIntegerOptions<T>(CONSTRUCTION_TOKEN, checked))
    );
  }
}

/**
 * Options that `stringOptions` has found coherent, which the
 * `string` factory accepts. The options are held privately as a frozen copy, read through
 * `options`.
 *
 * @remarks
 * A `pattern` is held separately as well, as the source and flags read when the options were
 * checked: what the node emits comes from that reading, and what it enforces is the same `RegExp`,
 * matched with the built-in `exec` and only while it still has that form.
 * @public
 */
export class ValidatedStringOptions<T extends IStringSchemaOptions = IStringSchemaOptions> {
  /** Discriminates validated options from plain ones, which declare `kind` as `never`. */
  public readonly kind: 'validated-string-options' = 'validated-string-options';
  readonly #options: Readonly<T>;
  /** What a node is built from: the options with the held pattern in place of the `RegExp`. */
  readonly #node: StringNodeOptions;

  private constructor(token: symbol, checked: T, node: StringNodeOptions) {
    this.#options = _hold(this, this.kind, token, checked);
    // The constructor is private, so `node` always comes from this class's own check.
    this.#node = Object.freeze(node);
  }

  /** The validated options: a frozen copy of those `stringOptions` was given. */
  public get options(): Readonly<T> {
    return this.#options;
  }

  /**
   * The options of a genuine instance — checked by an ES private brand, which neither a substituted
   * prototype nor a `Proxy` passes, and read from the private field rather than the getter — or
   * `undefined` for anything else.
   * @internal
   */
  public static _read(
    value: unknown
  ): Readonly<Omit<IStringSchemaOptions, 'pattern'> & { readonly pattern?: IHeldPattern }> | undefined {
    return _isObject(value) && #node in value ? (value as ValidatedStringOptions).#node : undefined;
  }

  /**
   * Checks string options. Called by `stringOptions`.
   * @internal
   */
  public static _create<T extends IStringSchemaOptions>(opts: T): Result<ValidatedStringOptions<T>> {
    return checkStringOptions(opts).onSuccess(({ options, node }) =>
      succeed(new ValidatedStringOptions<T>(CONSTRUCTION_TOKEN, options, node))
    );
  }

  /**
   * Checks string options without a `pattern` and attaches a pattern a caller compiled — the
   * source a schema stated and the predicate its `patternValidator` returned for it. Called by
   * `fromJson`, which never compiles a pattern itself.
   * @internal
   */
  public static _createWithMatcher<T extends IStringSchemaOptions & { readonly pattern?: never }>(
    opts: T,
    source: string,
    matches: (value: string) => boolean
  ): Result<ValidatedStringOptions<T>> {
    // The predicate is the caller's code: one that throws, or answers anything but a boolean,
    // fails the value rather than the validator.
    const held: IHeldPattern = Object.freeze({
      source,
      matches: (value: string): Result<boolean> =>
        captureResult(() => matches(value)).onSuccess((matched: unknown) =>
          Validators.boolean
            .validate(matched)
            .withErrorFormat(
              () =>
                `the pattern predicate for ${JSON.stringify(source)} returned ` +
                `${describeEnumMember(matched)}, not a boolean`
            )
        )
    });
    return checkStringOptions(opts).onSuccess(({ options, node }) =>
      succeed(new ValidatedStringOptions<T>(CONSTRUCTION_TOKEN, options, withHeldPattern(node, held)))
    );
  }
}

/**
 * Checks the annotations every node carries and returns them as
 * `validated options` — the way to give a node a
 * `default` or `examples`.
 *
 * @remarks
 * `default` and each member of `examples` must be JSON values; neither is checked against the node.
 * The result is accepted by every factory that takes plain options (`boolean`, `enumOf`, `array`,
 * `object`, `record`, `anyValue`), and `additionalProperties` is carried for `object`. A key that
 * is not an option is a compile error, and `nullable: true` keeps its literal type, so the
 * factory's nullable overload still applies.
 * @example
 * ```ts
 * const flag = JsonSchema.boolean(JsonSchema.schemaOptions({ default: false }).shouldNotFail('flag default'));
 * ```
 * @param opts - The options to check.
 * @returns The validated options, or a `Failure` naming the keyword.
 * @public
 */
export function schemaOptions<T extends IObjectSchemaOptions>(
  opts: T & Record<Exclude<keyof T, keyof IObjectSchemaOptions>, never>
): Result<ValidatedSchemaOptions<T>> {
  return ValidatedSchemaOptions._create<T>(opts);
}

/**
 * Checks `number` options for coherence and returns them as
 * `validated options` — the only way range keywords reach
 * the `number` factory.
 *
 * @remarks
 * Refuses a non-finite bound, `minimum` above `maximum`, exclusive bounds leaving no value in
 * range, `multipleOf` not greater than zero, and a `default` or `examples` member that is not JSON.
 * An `integer` node needs `integerOptions`, whose check is
 * stricter; the result of this one is a compile error there.
 * @example
 * ```ts
 * const ratio = JsonSchema.number(JsonSchema.numberOptions({ minimum: 0, maximum: 1 }).shouldNotFail('ratio bounds'));
 * ```
 * @param opts - The options to check.
 * @returns The validated options, or a `Failure` naming the keyword and the value.
 * @public
 */
export function numberOptions<T extends INumberSchemaOptions>(
  opts: T & Record<Exclude<keyof T, keyof INumberSchemaOptions>, never>
): Result<ValidatedNumberOptions<T>> {
  return ValidatedNumberOptions._create<T>(opts);
}

/**
 * Checks `integer` options for coherence and returns them as
 * `validated options` — the only way range keywords
 * reach the `integer` factory.
 *
 * @remarks
 * Runs the `numberOptions` checks, except that the range must hold
 * an integer rather than merely a number: `exclusiveMinimum: 0, exclusiveMaximum: 1` is refused.
 * The result is also accepted by the `number` factory.
 * @example
 * ```ts
 * const age = JsonSchema.integer(JsonSchema.integerOptions({ minimum: 0 }).shouldNotFail('age bounds'));
 * ```
 * @param opts - The options to check.
 * @returns The validated options, or a `Failure` naming the keyword and the value.
 * @public
 */
export function integerOptions<T extends INumberSchemaOptions>(
  opts: T & Record<Exclude<keyof T, keyof INumberSchemaOptions>, never>
): Result<ValidatedIntegerOptions<T>> {
  return ValidatedIntegerOptions._createInteger<T>(opts);
}

/**
 * Checks `string` options for coherence and returns them as
 * `validated options` — the only way length keywords
 * reach the `string` factory.
 *
 * @remarks
 * Refuses a length that is not a non-negative integer, `minLength` above `maxLength`, a `pattern`
 * that is not a `RegExp` whose only flag is `u` (the flag JSON Schema patterns are built with), and
 * a `default` or `examples` member that is not JSON.
 *
 * A `pattern` is the host's own `RegExp` and is trusted: the node enforces it and emits its
 * `source`. See `IStringSchemaOptions.pattern` for the semantics and the wire.
 * @example
 * ```ts
 * const name = JsonSchema.string(JsonSchema.stringOptions({ minLength: 1 }).shouldNotFail('name length'));
 * const slug = JsonSchema.string(JsonSchema.stringOptions({ pattern: /^[a-z0-9-]+$/u }).shouldNotFail('slug'));
 * ```
 * @param opts - The options to check.
 * @returns The validated options, or a `Failure` naming the keyword and the value.
 * @public
 */
export function stringOptions<T extends IStringSchemaOptions>(
  opts: T & Record<Exclude<keyof T, keyof IStringSchemaOptions>, never>
): Result<ValidatedStringOptions<T>> {
  return ValidatedStringOptions._create<T>(opts);
}
