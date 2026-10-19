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
 * Constraint and annotation keywords: the one place each is checked for coherence, enforced, and
 * emitted, so that the factory, `fromJson` and `toJson()` cannot disagree about any of them.
 *
 * Internal to the packlet — not re-exported from its barrel.
 */

import {
  Converter,
  Converters,
  Result,
  StringOneOf,
  Validator,
  Validators,
  captureResult,
  fail,
  mapResults,
  succeed
} from '@fgv/ts-utils';
import { jsonValue } from '../converters';
import { JsonObject, JsonValue } from '../json';
import {
  schemaAnnotationKeywords,
  schemaLengthConstraintKeywords,
  schemaNumberConstraintKeywords
} from './keywordAdaptation';
import {
  IHeldPattern,
  INumberSchemaOptions,
  IObjectSchemaOptions,
  ISchemaOptions,
  IStringSchemaOptions
} from './options';

/** A numeric constraint keyword. */
type NumberKeyword = StringOneOf<typeof schemaNumberConstraintKeywords>;

/** A number node's constraints. @internal */
export type NumberConstraints = Pick<INumberSchemaOptions, NumberKeyword>;

/** A string node's length constraints and format, as `stringConstraintsConverter` reads them. @internal */
export type StringLengthConstraints = Pick<
  IStringSchemaOptions,
  StringOneOf<typeof schemaLengthConstraintKeywords> | 'format'
>;

/** A string node's constraints and format: the lengths, the held pattern and `format`. @internal */
export type StringConstraints = StringLengthConstraints & { readonly pattern?: IHeldPattern };

/**
 * The options a `string` node is built from: `IStringSchemaOptions` with its `pattern` replaced by
 * the held pattern a check produced.
 * @internal
 */
export type StringNodeOptions = Omit<IStringSchemaOptions, 'pattern'> & { readonly pattern?: IHeldPattern };

/**
 * What `checkStringOptions` produces: the checked options as given (a `RegExp` pattern included),
 * and the node options built from them.
 * @internal
 */
export interface ICheckedStringOptions<T extends IStringSchemaOptions> {
  readonly options: T;
  readonly node: StringNodeOptions;
}

/** The annotation keywords every node kind carries: all but `format`, which only strings carry. */
type CommonAnnotationKeyword = Exclude<StringOneOf<typeof schemaAnnotationKeywords>, 'format'>;

/** The annotations every node carries, derived from the keyword list. */
export type SchemaAnnotations = Pick<ISchemaOptions, 'description' | CommonAnnotationKeyword>;

/**
 * Any JSON value, with the plain conversion context field converters use. The value it produces
 * is a fresh copy, so holding it cannot alias the caller's object.
 * @internal
 */
export const annotationJsonValue: Converter<JsonValue> = Converters.generic((from: unknown) =>
  jsonValue.convert(from)
);

/**
 * A copy of an already-validated JSON value, so a caller mutating what `toJson()` returned cannot
 * reach the node. `annotationJsonValue` cannot fail on a value it has already accepted.
 */
function _copyJson(value: JsonValue): JsonValue {
  return annotationJsonValue.convert(value).orDefault(value);
}

/**
 * The quotient tolerance `multipleOf` allows, as a multiple of the quotient's magnitude: 4ε
 * relative, the size of the rounding error one division and one product can carry.
 * Anything wider accepts genuinely wrong values once the quotient is large — a tolerance of `1e-9`
 * relative accepted `2000000000.5` as a multiple of `1`.
 */
const MULTIPLE_OF_ULPS: number = 4 * Number.EPSILON;

/** One end of a numeric range. */
interface IBound {
  readonly value: number;
  readonly exclusive: boolean;
  readonly keyword: NumberKeyword;
}

/** A bound's keyword and value, for a message. */
function _describe(bound: IBound): string {
  return `${bound.keyword} ${bound.value}`;
}

/**
 * The tighter of an inclusive and an exclusive bound on the same side — lower (`lower: true`) or
 * upper. On a tie the exclusive bound is the tighter.
 */
function _tighter(
  inclusive: IBound | undefined,
  exclusive: IBound | undefined,
  lower: boolean
): IBound | undefined {
  if (inclusive === undefined || exclusive === undefined) {
    return inclusive ?? exclusive;
  }
  if (inclusive.value === exclusive.value) {
    return exclusive;
  }
  return inclusive.value > exclusive.value === lower ? inclusive : exclusive;
}

/** A bound for `keyword`, or `undefined` when the option is absent. */
function _bound(opts: INumberSchemaOptions, keyword: NumberKeyword, exclusive: boolean): IBound | undefined {
  const value = opts[keyword];
  return value === undefined ? undefined : { value, exclusive, keyword };
}

/**
 * Whether the range from `lo` to `hi` holds no value (no integer, when `integer`).
 *
 * @remarks
 * The integer rounding is exact only while the rounded ends are safe integers; beyond 2^53,
 * `floor(b) + 1` can equal `b`. There the integer refinement is skipped and the number test
 * decides, which can only refuse less.
 */
function _isEmptyRange(lo: IBound, hi: IBound, integer: boolean): boolean {
  if (integer) {
    const first = lo.exclusive ? Math.floor(lo.value) + 1 : Math.ceil(lo.value);
    const last = hi.exclusive ? Math.ceil(hi.value) - 1 : Math.floor(hi.value);
    if (Number.isSafeInteger(first) && Number.isSafeInteger(last)) {
      return first > last;
    }
  }
  return lo.value > hi.value || (lo.value === hi.value && (lo.exclusive || hi.exclusive));
}

/**
 * Checks a `number` / `integer` node's options for coherence: every bound finite, `minimum` not
 * above `maximum`, the bounds together admitting at least one value, and `multipleOf` positive.
 * @param type - The node kind; an `integer` range must hold an integer.
 * @param opts - The options to check.
 * @returns A copy of the options (annotations copied deeply), or a `Failure` naming the keyword and
 * the value.
 * @internal
 */
export function checkNumberOptions<T extends INumberSchemaOptions>(
  type: 'number' | 'integer',
  opts: T
): Result<T> {
  return checkAnnotations(opts).onSuccess((checked) => {
    const nonFinite = schemaNumberConstraintKeywords.find(
      (k) => checked[k] !== undefined && !Number.isFinite(checked[k])
    );
    if (nonFinite !== undefined) {
      return fail(`${nonFinite} must be a finite number, got ${String(checked[nonFinite])}`);
    }
    if (checked.minimum !== undefined && checked.maximum !== undefined && checked.minimum > checked.maximum) {
      return fail(`minimum ${checked.minimum} is greater than maximum ${checked.maximum}`);
    }
    const lo = _tighter(_bound(checked, 'minimum', false), _bound(checked, 'exclusiveMinimum', true), true);
    const hi = _tighter(_bound(checked, 'maximum', false), _bound(checked, 'exclusiveMaximum', true), false);
    if (lo !== undefined && hi !== undefined && _isEmptyRange(lo, hi, type === 'integer')) {
      return fail(`${_describe(lo)} and ${_describe(hi)} leave no ${type} in range`);
    }
    if (checked.multipleOf !== undefined && checked.multipleOf <= 0) {
      return fail(`multipleOf must be greater than 0, got ${checked.multipleOf}`);
    }
    return succeed(checked);
  });
}

/** A host's `RegExp`: the only form a trusted pattern arrives in. */
const _regExpValidator: Validator<RegExp> = Validators.isA(
  'RegExp',
  (from: unknown): from is RegExp => from instanceof RegExp
);

/**
 * The built-in `RegExp.prototype.exec`, captured once: it runs a `RegExp`'s own compiled matcher,
 * whatever a subclass declares as `exec` or `test`.
 */
const _builtinExec: typeof RegExp.prototype.exec = RegExp.prototype.exec;

/**
 * Each flag and the built-in accessor reporting it. The accessors read the `RegExp`'s internal
 * flags, which a subclass cannot override; the `flags` accessor itself reads these through the
 * object, which it can.
 */
const _FLAG_ACCESSORS: ReadonlyArray<readonly [string, string]> = [
  ['d', 'hasIndices'],
  ['g', 'global'],
  ['i', 'ignoreCase'],
  ['m', 'multiline'],
  ['s', 'dotAll'],
  ['u', 'unicode'],
  ['v', 'unicodeSets'],
  ['y', 'sticky']
];

/** A `RegExp`'s compiled source and flags, read through the built-in accessors. Throws on a non-`RegExp`. */
function _compiledForm(re: RegExp): { readonly source: string; readonly flags: string } {
  const source: unknown = Reflect.get(RegExp.prototype, 'source', re);
  const flags = _FLAG_ACCESSORS
    .filter(([, accessor]) => Reflect.get(RegExp.prototype, accessor, re) === true)
    .map(([flag]) => flag)
    .join('');
  return { source: String(source), flags };
}

/**
 * Checks a host's trusted pattern and holds it.
 *
 * @remarks
 * The pattern must be a `RegExp` with exactly the `u` flag. JSON Schema patterns are built with
 * `u`, and the wire has no way to state any other flag, so this is the one form in which the
 * `RegExp` the host wrote means exactly what the wire states — which is why nothing is recompiled.
 *
 * Its source and flags are read through the built-in accessors, and it is matched with the
 * built-in `exec`, so a subclass overriding `source`, `test` or `exec` cannot make the wire and the
 * validator disagree. A `RegExp` re-initialised afterwards (`compile()`) no longer has the form that
 * was checked; every match then fails closed rather than enforcing something the wire does not
 * state.
 *
 * This package never constructs a `RegExp`: the host built this one, and `fromJson` never reaches
 * here.
 */
function _holdTrustedPattern(pattern: unknown): Result<IHeldPattern | undefined> {
  if (pattern === undefined) {
    return succeed(undefined);
  }
  return _regExpValidator
    .validate(pattern)
    .withErrorFormat(() => `pattern must be a RegExp, got ${describeEnumMember(pattern)}`)
    .onSuccess((re) =>
      captureResult(() => _compiledForm(re))
        .withErrorFormat((msg) => `pattern is not a readable RegExp: ${msg}`)
        .onSuccess(({ source, flags }) =>
          flags === 'u'
            ? succeed<IHeldPattern>(Object.freeze({ source, matches: _trustedMatcher(re, source) }))
            : fail(
                `pattern /${source}/${flags}: a JSON Schema pattern is built with exactly the 'u' flag ` +
                  `(write /${source}/u); the wire cannot state '${flags}'`
              )
        )
    );
}

/** Whether a `RegExp` still has the form that was checked. */
function _hasForm(re: RegExp, source: string): Result<true> {
  return captureResult(() => _compiledForm(re)).onSuccess((now) =>
    now.source === source && now.flags === 'u'
      ? succeed(true as const)
      : fail('the RegExp was re-initialised after stringOptions checked it')
  );
}

/**
 * Matches with a checked `RegExp`, failing closed once it no longer has the checked form.
 *
 * @remarks
 * The built-in `exec` reads `lastIndex` before it runs the matcher, and converting a non-number
 * `lastIndex` calls its `valueOf` — which could re-initialise the `RegExp` (`compile()`) between the
 * form check and the match. So `lastIndex` is first set to the primitive `0` (a data property, which
 * nothing can intercept), the match refuses to run unless it reads back as `0`, and the form is
 * checked again after the match.
 */
function _trustedMatcher(re: RegExp, source: string): (value: string) => Result<boolean> {
  return (value: string): Result<boolean> =>
    _hasForm(re, source)
      .onSuccess(() =>
        captureResult(() => Reflect.set(re, 'lastIndex', 0) && Reflect.get(re, 'lastIndex') === 0)
      )
      .onSuccess((reset) =>
        reset
          ? captureResult(() => _builtinExec.call(re, value) !== null)
          : fail<boolean>("the RegExp's lastIndex could not be reset to 0")
      )
      .onSuccess((matched) => _hasForm(re, source).onSuccess(() => succeed(matched)));
}

/**
 * Checks a `string` node's options for coherence: each length a non-negative integer, `minLength`
 * not above `maxLength`, and a `pattern` a `RegExp` whose only flag is `u`.
 * @param opts - The options to check.
 * @returns A copy of the options (annotations copied deeply) and the node options built from it, or
 * a `Failure` naming the keyword and the value.
 * @internal
 */
export function checkStringOptions<T extends IStringSchemaOptions>(
  opts: T
): Result<ICheckedStringOptions<T>> {
  return checkAnnotations(opts).onSuccess((checked) => {
    const bad = schemaLengthConstraintKeywords.find((k) => {
      const length = checked[k];
      return length !== undefined && !(Number.isInteger(length) && length >= 0);
    });
    if (bad !== undefined) {
      return fail(`${bad} must be a non-negative integer, got ${String(checked[bad])}`);
    }
    if (
      checked.minLength !== undefined &&
      checked.maxLength !== undefined &&
      checked.minLength > checked.maxLength
    ) {
      return fail(`minLength ${checked.minLength} is greater than maxLength ${checked.maxLength}`);
    }
    return _holdTrustedPattern(checked.pattern).onSuccess((pattern) =>
      succeed({ options: checked, node: withHeldPattern(checked, pattern) })
    );
  });
}

/**
 * String options with their `pattern` replaced by a held one — or removed, when there is none.
 * @internal
 */
export function withHeldPattern(
  opts: Omit<IStringSchemaOptions, 'pattern'> & { readonly pattern?: unknown },
  pattern: IHeldPattern | undefined
): StringNodeOptions {
  // A spread copies own keys as data, so an own `__proto__` key cannot become a prototype.
  const rest: { -readonly [K in keyof typeof opts]?: (typeof opts)[K] } = { ...opts };
  delete rest.pattern;
  const unpatterned: Omit<IStringSchemaOptions, 'pattern'> = rest;
  return { ...unpatterned, ...(pattern !== undefined && { pattern }) };
}

/** Freezes a copied JSON value and everything inside it. */
function _deepFreeze(value: JsonValue): JsonValue {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((child) => _deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}

/** The keys every option set may carry beside its constraints, each of its declared type. */
interface ITypedKeys {
  readonly description?: string;
  readonly title?: string;
  readonly nullable?: boolean;
  readonly strict?: boolean;
  readonly format?: string;
  readonly additionalProperties?: boolean;
  readonly default?: JsonValue;
  readonly examples?: ReadonlyArray<JsonValue>;
}

/**
 * Reads {@link ITypedKeys}, refusing a present key of the wrong type. Declared with `var`-free
 * hoisting in mind: it is referenced only from functions, after module evaluation.
 */
const _typedKeysConverter: Converter<ITypedKeys> = Converters.object<ITypedKeys>({
  description: Converters.string.optional('failOnError'),
  title: Converters.string.optional('failOnError'),
  nullable: Converters.boolean.optional('failOnError'),
  strict: Converters.boolean.optional('failOnError'),
  format: Converters.string.optional('failOnError'),
  additionalProperties: Converters.boolean.optional('failOnError'),
  default: Converters.generic((from: unknown) => jsonValue.convert(from)).optional('failOnError'),
  examples: Converters.arrayOf(Converters.generic((from: unknown) => jsonValue.convert(from))).optional(
    'failOnError'
  )
});

/**
 * Checks the keys every node accepts, as every validated-options path does: `description`, `title`
 * and `format` strings; `nullable`, `strict` and `additionalProperties` booleans; `default` and each
 * member of `examples` JSON values, and `examples` an array. The annotations are not checked against
 * the node.
 * @param opts - The options to check.
 * @returns The options with `default` and `examples` replaced by fresh, deeply frozen copies, so
 * the node never aliases the caller's objects; or a `Failure` naming the keyword.
 * @internal
 */
export function checkAnnotations<T extends ISchemaOptions>(opts: T): Result<T> {
  // Each key is read exactly once, into the snapshot; everything after works from the snapshot and
  // the converted values, so an accessor cannot answer the check one value and the node another.
  return captureResult((): T => ({ ...opts })).onSuccess((snapshot) =>
    _typedKeysConverter.convert(snapshot).onSuccess((typed) =>
      succeed({
        ...snapshot,
        ...(typed.default !== undefined && { default: _deepFreeze(typed.default) }),
        ...(typed.examples !== undefined && {
          examples: Object.freeze(typed.examples.map((example) => _deepFreeze(example)))
        })
      })
    )
  );
}

/**
 * The JSON type the members of a non-string enum share: `number` or `integer` for a numeric enum,
 * `boolean` for a boolean one.
 * @internal
 */
export type NonStringEnumType = 'number' | 'integer' | 'boolean';

/**
 * Checks the members of a numeric or boolean enum: there must be at least one, each must be of
 * `type` — a finite number, an integer for `integer`, or a boolean — and none may be `null`
 * (nullability is the `nullable` option, as for every other node).
 * @param type - The JSON type the members share.
 * @param values - The members.
 * @returns The members, or a `Failure` naming the first one that does not fit.
 * @internal
 */
export function checkEnumValues<T extends number | boolean>(
  type: NonStringEnumType,
  values: ReadonlyArray<T>
): Result<ReadonlyArray<T>> {
  if (values.length === 0) {
    return fail(`enum must list at least one value`);
  }
  for (const value of values) {
    const fits =
      type === 'boolean'
        ? typeof value === 'boolean'
        : typeof value === 'number' &&
          Number.isFinite(value) &&
          (type === 'number' || Number.isInteger(value));
    if (!fits) {
      return fail(
        `enum value ${describeEnumMember(value)} is not ${type === 'integer' ? 'an' : 'a'} ${type}`
      );
    }
  }
  return succeed(values);
}

/**
 * An enum member, or any value checked against one, as it reads in an error message — without
 * serializing anything non-primitive.
 * @internal
 */
export function describeEnumMember(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
}

/**
 * Checks a number against every numeric constraint in `opts`.
 * @param value - The (already type-checked) number.
 * @param opts - The node's constraints.
 * @returns The number, or a `Failure` naming **every** violated keyword and its bound, one per
 * line.
 * @internal
 */
export function enforceNumberConstraints(value: number, opts: NumberConstraints): Result<number> {
  return mapResults(
    schemaNumberConstraintKeywords.map((keyword) => _enforceNumberKeyword(value, keyword, opts[keyword]))
  ).onSuccess(() => succeed(value));
}

/** Whether `value` is a multiple of `step`, within float rounding of the quotient. */
function _isMultipleOf(value: number, step: number): boolean {
  const quotient = value / step;
  return Math.abs(quotient - Math.round(quotient)) <= MULTIPLE_OF_ULPS * Math.max(1, Math.abs(quotient));
}

/** One numeric keyword's check; succeeds when the keyword is absent. */
function _enforceNumberKeyword(
  value: number,
  keyword: NumberKeyword,
  bound: number | undefined
): Result<number> {
  if (bound === undefined) {
    return succeed(value);
  }
  switch (keyword) {
    case 'minimum':
      return value >= bound ? succeed(value) : fail(`expected a value >= ${bound} (minimum), got ${value}`);
    case 'exclusiveMinimum':
      return value > bound
        ? succeed(value)
        : fail(`expected a value > ${bound} (exclusiveMinimum), got ${value}`);
    case 'maximum':
      return value <= bound ? succeed(value) : fail(`expected a value <= ${bound} (maximum), got ${value}`);
    case 'exclusiveMaximum':
      return value < bound
        ? succeed(value)
        : fail(`expected a value < ${bound} (exclusiveMaximum), got ${value}`);
    case 'multipleOf':
      return _isMultipleOf(value, bound)
        ? succeed(value)
        : fail(`expected a multiple of ${bound} (multipleOf), got ${value}`);
  }
}

/**
 * Checks a string's length, in code points, against `minLength` and `maxLength`.
 * @param value - The (already type-checked) string.
 * @param opts - The node's constraints.
 * @returns The string, or a `Failure` naming the violated keyword and its bound.
 * @internal
 */
export function enforceStringConstraints(value: string, opts: StringConstraints): Result<string> {
  if (opts.minLength === undefined && opts.maxLength === undefined) {
    return succeed(value);
  }
  const length = Array.from(value).length;
  if (opts.minLength !== undefined && length < opts.minLength) {
    return fail(`expected a string of at least ${opts.minLength} characters (minLength), got ${length}`);
  }
  if (opts.maxLength !== undefined && length > opts.maxLength) {
    return fail(`expected a string of at most ${opts.maxLength} characters (maxLength), got ${length}`);
  }
  return succeed(value);
}

/**
 * Checks a string against a node's held pattern.
 *
 * @remarks
 * A match that cannot be made — a caller's predicate that throws, or a host `RegExp` changed since
 * it was checked — fails the value rather than escaping the validator, and only a result of exactly
 * `true` is a match.
 * @param value - The (already type-checked) string.
 * @param pattern - The node's held pattern, if any.
 * @returns The string, or a `Failure` naming the pattern.
 * @internal
 */
export function enforceStringPattern(value: string, pattern: IHeldPattern | undefined): Result<string> {
  if (pattern === undefined) {
    return succeed(value);
  }
  return pattern
    .matches(value)
    .withErrorFormat(
      (msg) => `could not check the string against pattern ${JSON.stringify(pattern.source)}: ${msg}`
    )
    .onSuccess((matched) =>
      matched === true
        ? succeed(value)
        : fail(`expected a string matching ${JSON.stringify(pattern.source)} (pattern)`)
    );
}

/** The common annotations, in emission order. */
const COMMON_ANNOTATION_KEYWORDS: ReadonlyArray<CommonAnnotationKeyword> = schemaAnnotationKeywords.filter(
  (keyword): keyword is CommonAnnotationKeyword => keyword !== 'format'
);

/** Copies one annotation from `from` into `to` when present — JSON values deeply. */
function _copyAnnotation(
  from: ISchemaOptions | undefined,
  keyword: CommonAnnotationKeyword,
  to: { -readonly [K in keyof SchemaAnnotations]: SchemaAnnotations[K] }
): void {
  switch (keyword) {
    case 'title':
      if (from?.title !== undefined) {
        to.title = from.title;
      }
      return;
    case 'default':
      if (from?.default !== undefined) {
        to.default = _copyJson(from.default);
      }
      return;
    case 'examples':
      if (from?.examples !== undefined) {
        to.examples = from.examples.map(_copyJson);
      }
      return;
  }
}

/** The annotations in `opts`, copied, without the absent ones. @internal */
export function pickAnnotations(opts: ISchemaOptions | undefined): SchemaAnnotations {
  const out: { -readonly [K in keyof SchemaAnnotations]: SchemaAnnotations[K] } = {};
  if (opts?.description !== undefined) {
    out.description = opts.description;
  }
  for (const keyword of COMMON_ANNOTATION_KEYWORDS) {
    _copyAnnotation(opts, keyword, out);
  }
  return out;
}

/** The numeric constraints in `opts`, copied through the keyword list. @internal */
export function pickNumberConstraints(opts: INumberSchemaOptions | undefined): NumberConstraints {
  const out: { -readonly [K in NumberKeyword]?: number } = {};
  for (const keyword of schemaNumberConstraintKeywords) {
    const value = opts?.[keyword];
    if (value !== undefined) {
      out[keyword] = value;
    }
  }
  return out;
}

/**
 * The length constraints, held pattern and `format` in `opts`, copied through the keyword list.
 * @internal
 */
export function pickStringConstraints(opts: StringNodeOptions | undefined): StringConstraints {
  const out: { -readonly [K in keyof StringConstraints]?: StringConstraints[K] } = {};
  for (const keyword of schemaLengthConstraintKeywords) {
    const value = opts?.[keyword];
    if (value !== undefined) {
      out[keyword] = value;
    }
  }
  if (opts?.pattern !== undefined) {
    out.pattern = opts.pattern;
  }
  if (opts?.format !== undefined) {
    out.format = opts.format;
  }
  return out;
}

/**
 * The wire fields for a node's annotations, in a fixed order — `description`, `title`, `default`,
 * `examples` — with `default` and `examples` as fresh copies, so a caller mutating what `toJson()`
 * returned cannot reach the node.
 * @internal
 */
export function annotationFields(annotations: SchemaAnnotations): JsonObject {
  const { examples, ...rest } = pickAnnotations(annotations);
  return { ...rest, ...(examples !== undefined && { examples: [...examples] }) };
}

/** The wire fields for a number node's constraints, in a fixed order. @internal */
export function numberConstraintFields(opts: NumberConstraints): JsonObject {
  return { ...pickNumberConstraints(opts) };
}

/**
 * The wire fields for a string node's constraints and format, in a fixed order — the lengths, then
 * `pattern` as its source, then `format`.
 * @internal
 */
export function stringConstraintFields(opts: StringConstraints): JsonObject {
  const { pattern, format, ...lengths } = pickStringConstraints(opts);
  return {
    ...lengths,
    ...(pattern !== undefined && { pattern: pattern.source }),
    ...(format !== undefined && { format })
  };
}

// ---------------------------------------------------------------------------
// Reading options from an unknown value
// ---------------------------------------------------------------------------

/**
 * One optional JSON-number field per keyword, keyed from the keyword list itself so the parser
 * cannot know a different set of keywords than the factories and the emitter.
 */
function _numericFields<K extends string>(keywords: readonly K[]): Record<K, Validator<number | undefined>> {
  const fields: Partial<Record<K, Validator<number | undefined>>> = {};
  for (const keyword of keywords) {
    fields[keyword] = Validators.number.optional();
  }
  // Total: the loop above assigned every member of `keywords`, which is all of `K`.
  return fields as Record<K, Validator<number | undefined>>;
}

/**
 * Extracts the annotations every node carries — `description`, `title`, `default` and `examples`.
 * Each is optional; a present one of the wrong shape (a non-string `description` or `title`, a
 * non-array `examples`, a value that is not JSON) is refused rather than dropped, since dropping
 * it would state less than the source. `default` and `examples` are not checked against the node.
 * @internal
 */
export const annotationsConverter: Converter<SchemaAnnotations> = Converters.object<SchemaAnnotations>({
  description: Converters.string.optional('failOnError'),
  title: Converters.string.optional('failOnError'),
  default: annotationJsonValue.optional('failOnError'),
  examples: Converters.arrayOf(annotationJsonValue).optional('failOnError')
});

/**
 * Extracts a number node's constraint keywords. Each must be a JSON number when present — a numeric
 * string is refused, not coerced; coherence is checked afterwards by `checkNumberOptions`.
 * @internal
 */
export const numberConstraintsConverter: Converter<NumberConstraints> = Converters.object<NumberConstraints>(
  _numericFields(schemaNumberConstraintKeywords)
);

/**
 * Extracts a string node's `minLength`, `maxLength` and `format`. The lengths must be JSON numbers
 * and `format` a string; `checkStringOptions` then requires non-negative integers in order.
 * @internal
 */
export const stringConstraintsConverter: Converter<StringLengthConstraints> =
  Converters.object<StringLengthConstraints>({
    ..._numericFields(schemaLengthConstraintKeywords),
    format: Converters.string.optional('failOnError')
  });

/**
 * The option keys that cannot be incoherent, each read as its declared type. A key of the wrong
 * type is ignored rather than refused: this is the reading of last resort, used when options did
 * not come through a validated-options factory.
 * @internal
 */
export interface IPlainKeys {
  readonly description?: string;
  readonly title?: string;
  readonly nullable?: boolean;
  readonly strict?: boolean;
  readonly format?: string;
  readonly additionalProperties?: boolean;
}

const _plainKeysConverter: Converter<IPlainKeys> = Converters.object<IPlainKeys>({
  description: Converters.string.optional('ignoreErrors'),
  title: Converters.string.optional('ignoreErrors'),
  nullable: Converters.boolean.optional('ignoreErrors'),
  strict: Converters.boolean.optional('ignoreErrors'),
  format: Converters.string.optional('ignoreErrors'),
  additionalProperties: Converters.boolean.optional('ignoreErrors')
});

/**
 * Only the plain keys of `from`, each of its declared type — every other key, constraint or
 * annotation, is ignored, so nothing unchecked can reach a node.
 * @internal
 */
export function plainKeysOf(from: unknown): IPlainKeys {
  // A hostile accessor may throw; that reads as no plain keys rather than escaping a factory.
  return captureResult(() => _plainKeysConverter.convert(from))
    .onSuccess((converted) => converted)
    .orDefault({});
}

/**
 * Re-checks a value claiming to be validated `number` / `integer` options: its range keywords read
 * as numbers, then exactly the check `numberOptions` / `integerOptions` runs.
 * @internal
 */
export function revalidateNumberOptions(
  type: 'number' | 'integer',
  from: unknown
): Result<INumberSchemaOptions> {
  return _typedKeysConverter
    .convert(from)
    .onSuccess((typed) =>
      numberConstraintsConverter
        .convert(from)
        .onSuccess((constraints) => checkNumberOptions(type, { ...typed, ...constraints }))
    );
}

/** Reads a `pattern` key as a `RegExp`, refusing a present one of another type. */
const _patternKeyConverter: Converter<{ readonly pattern?: RegExp }> = Converters.object<{
  readonly pattern?: RegExp;
}>({
  pattern: _regExpValidator.optional()
});

/**
 * Re-checks a value claiming to be validated `string` options: its lengths read as numbers and its
 * pattern as a `RegExp`, then exactly the check `stringOptions` runs.
 * @internal
 */
export function revalidateStringOptions(from: unknown): Result<StringNodeOptions> {
  return _typedKeysConverter.convert(from).onSuccess((typed) =>
    stringConstraintsConverter.convert(from).onSuccess((constraints) =>
      _patternKeyConverter
        .convert(from)
        .onSuccess(({ pattern }) =>
          checkStringOptions({ ...typed, ...constraints, ...(pattern !== undefined && { pattern }) })
        )
        .onSuccess(({ node }) => succeed(node))
    )
  );
}

/**
 * Re-checks a value claiming to be validated schema options: exactly the check `schemaOptions`
 * runs.
 * @internal
 */
export function revalidateSchemaOptions(from: unknown): Result<IObjectSchemaOptions> {
  return _typedKeysConverter
    .convert(from)
    .onSuccess((typed) => checkAnnotations<IObjectSchemaOptions>(typed));
}

/**
 * The cross-copy marker every validated-options instance carries as a non-enumerable own property,
 * holding its `kind`. Registered with `Symbol.for`, so every installed copy of the package derives
 * the same symbol and nothing needs to export it.
 *
 * @remarks
 * `instanceof` and private brands fail across two installed copies of this package, so a factory
 * also recognises an instance by this symbol and then **re-validates** its options rather than
 * trusting them. The marker is a runtime convenience for that case, **not a security boundary**:
 * anyone can set it, which is why nothing marked is used unchecked.
 * @internal
 */
export const VALIDATED_OPTIONS_MARKER: unique symbol = Symbol.for('@fgv/ts-json-base.validated-options');
