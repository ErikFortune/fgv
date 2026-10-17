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

import { Converter, Converters, Result, StringOneOf, fail, mapResults, succeed } from '@fgv/ts-utils';
import { jsonValue } from '../converters';
import { JsonObject, JsonValue } from '../json';
import { schemaLengthConstraintKeywords, schemaNumberConstraintKeywords } from './keywordAdaptation';
import { INumberSchemaOptions, ISchemaOptions, IStringSchemaOptions } from './options';

/** A numeric constraint keyword. */
type NumberKeyword = StringOneOf<typeof schemaNumberConstraintKeywords>;

/** A number node's constraints. @internal */
export type NumberConstraints = Pick<INumberSchemaOptions, NumberKeyword>;

/** A string node's constraints and format. @internal */
export type StringConstraints = Pick<
  IStringSchemaOptions,
  StringOneOf<typeof schemaLengthConstraintKeywords> | 'format'
>;

/** The annotations every node carries. */
export type SchemaAnnotations = Pick<ISchemaOptions, 'description' | 'title' | 'default' | 'examples'>;

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
 * The quotient tolerance `multipleOf` allows, as a multiple of the quotient's magnitude: four
 * units in the last place, the size of the rounding error one division and one product can carry.
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
 * @returns The options (annotations copied), or a `Failure` naming the keyword and the value.
 * @internal
 */
export function checkNumberOptions(
  type: 'number' | 'integer',
  opts: INumberSchemaOptions | undefined
): Result<INumberSchemaOptions | undefined> {
  return checkAnnotations(opts).onSuccess((checked) => {
    if (checked === undefined) {
      return succeed(checked);
    }
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

/**
 * Checks a `string` node's options for coherence: each length a non-negative integer, and
 * `minLength` not above `maxLength`.
 * @param opts - The options to check.
 * @returns The options (annotations copied), or a `Failure` naming the keyword and the value.
 * @internal
 */
export function checkStringOptions(
  opts: IStringSchemaOptions | undefined
): Result<IStringSchemaOptions | undefined> {
  return checkAnnotations(opts).onSuccess((checked) => {
    if (checked === undefined) {
      return succeed(checked);
    }
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
    return succeed(checked);
  });
}

/**
 * Checks the annotations every node accepts: `default` and each member of `examples` must be JSON
 * values, and `examples` an array. They are not checked against the node.
 * @param opts - The options to check.
 * @returns The options with `default` and `examples` replaced by fresh copies, so the node never
 * aliases the caller's objects; or a `Failure` naming the keyword.
 * @internal
 */
export function checkAnnotations<T extends ISchemaOptions>(opts: T | undefined): Result<T | undefined> {
  if (opts === undefined) {
    return succeed(opts);
  }
  const defaultResult: Result<JsonValue | undefined> =
    opts.default === undefined
      ? succeed(undefined)
      : annotationJsonValue.convert(opts.default).withErrorFormat((msg) => `default: ${msg}`);
  return defaultResult.onSuccess((copiedDefault) =>
    (opts.examples === undefined
      ? succeed(undefined)
      : Converters.arrayOf(annotationJsonValue)
          .convert(opts.examples)
          .withErrorFormat((msg) => `examples: ${msg}`)
    ).onSuccess((copiedExamples) =>
      succeed({
        ...opts,
        ...(copiedDefault !== undefined && { default: copiedDefault }),
        ...(copiedExamples !== undefined && { examples: copiedExamples })
      })
    )
  );
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

/** The annotations in `opts`, copied, without the absent ones. @internal */
export function pickAnnotations(opts: ISchemaOptions | undefined): SchemaAnnotations {
  return {
    ...(opts?.description !== undefined && { description: opts.description }),
    ...(opts?.title !== undefined && { title: opts.title }),
    ...(opts?.default !== undefined && { default: _copyJson(opts.default) }),
    ...(opts?.examples !== undefined && { examples: opts.examples.map(_copyJson) })
  };
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

/** The length constraints and `format` in `opts`, copied through the keyword list. @internal */
export function pickStringConstraints(opts: IStringSchemaOptions | undefined): StringConstraints {
  const out: { -readonly [K in keyof StringConstraints]?: StringConstraints[K] } = {};
  for (const keyword of schemaLengthConstraintKeywords) {
    const value = opts?.[keyword];
    if (value !== undefined) {
      out[keyword] = value;
    }
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

/** The wire fields for a string node's constraints and format, in a fixed order. @internal */
export function stringConstraintFields(opts: StringConstraints): JsonObject {
  return { ...pickStringConstraints(opts) };
}
