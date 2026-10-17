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

import { Converters, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { jsonValue } from '../converters';
import { JsonObject, JsonValue } from '../json';
import { INumberSchemaOptions, ISchemaOptions, IStringSchemaOptions } from './options';

/** The numeric keywords, in the order they are checked and emitted. */
const NUMBER_KEYWORDS: readonly NumberKeyword[] = [
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'multipleOf'
];

/** A numeric constraint keyword. */
type NumberKeyword = 'minimum' | 'maximum' | 'exclusiveMinimum' | 'exclusiveMaximum' | 'multipleOf';

/** The string-length keywords, in the order they are checked and emitted. */
const LENGTH_KEYWORDS: readonly LengthKeyword[] = ['minLength', 'maxLength'];

/** A string-length constraint keyword. */
type LengthKeyword = 'minLength' | 'maxLength';

/** The relative tolerance `multipleOf` allows on the quotient, for binary floating point. */
const MULTIPLE_OF_TOLERANCE: number = 1e-9;

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

/** Whether the range from `lo` to `hi` holds no value (no integer, when `integer`). */
function _isEmptyRange(lo: IBound, hi: IBound, integer: boolean): boolean {
  if (integer) {
    const first = lo.exclusive ? Math.floor(lo.value) + 1 : Math.ceil(lo.value);
    const last = hi.exclusive ? Math.ceil(hi.value) - 1 : Math.floor(hi.value);
    return first > last;
  }
  return lo.value > hi.value || (lo.value === hi.value && (lo.exclusive || hi.exclusive));
}

/**
 * Checks a `number` / `integer` node's options for coherence: every bound finite, `minimum` not
 * above `maximum`, the bounds together admitting at least one value, and `multipleOf` positive.
 * @param type - The node kind; an `integer` range must hold an integer.
 * @param opts - The options to check.
 * @returns The options, or a `Failure` naming the keyword and the value.
 * @internal
 */
export function checkNumberOptions(
  type: 'number' | 'integer',
  opts: INumberSchemaOptions | undefined
): Result<INumberSchemaOptions | undefined> {
  if (opts === undefined) {
    return succeed(opts);
  }
  return checkAnnotations(opts).onSuccess(() => {
    const nonFinite = NUMBER_KEYWORDS.find((k) => opts[k] !== undefined && !Number.isFinite(opts[k]));
    if (nonFinite !== undefined) {
      return fail(`${nonFinite} must be a finite number, got ${String(opts[nonFinite])}`);
    }
    if (opts.minimum !== undefined && opts.maximum !== undefined && opts.minimum > opts.maximum) {
      return fail(`minimum ${opts.minimum} is greater than maximum ${opts.maximum}`);
    }
    const lo = _tighter(_bound(opts, 'minimum', false), _bound(opts, 'exclusiveMinimum', true), true);
    const hi = _tighter(_bound(opts, 'maximum', false), _bound(opts, 'exclusiveMaximum', true), false);
    if (lo !== undefined && hi !== undefined && _isEmptyRange(lo, hi, type === 'integer')) {
      return fail(`${_describe(lo)} and ${_describe(hi)} leave no ${type} in range`);
    }
    if (opts.multipleOf !== undefined && opts.multipleOf <= 0) {
      return fail(`multipleOf must be greater than 0, got ${opts.multipleOf}`);
    }
    return succeed(opts);
  });
}

/**
 * Checks a `string` node's options for coherence: each length a non-negative integer, and
 * `minLength` not above `maxLength`.
 * @param opts - The options to check.
 * @returns The options, or a `Failure` naming the keyword and the value.
 * @internal
 */
export function checkStringOptions(
  opts: IStringSchemaOptions | undefined
): Result<IStringSchemaOptions | undefined> {
  if (opts === undefined) {
    return succeed(opts);
  }
  return checkAnnotations(opts).onSuccess(() => {
    const bad = LENGTH_KEYWORDS.find((k) => {
      const length = opts[k];
      return length !== undefined && !(Number.isInteger(length) && length >= 0);
    });
    if (bad !== undefined) {
      return fail(`${bad} must be a non-negative integer, got ${String(opts[bad])}`);
    }
    if (opts.minLength !== undefined && opts.maxLength !== undefined && opts.minLength > opts.maxLength) {
      return fail(`minLength ${opts.minLength} is greater than maxLength ${opts.maxLength}`);
    }
    return succeed(opts);
  });
}

/** A JSON value, refusing `undefined`, functions and other non-JSON values. */
const _annotationValue: (from: unknown) => Result<JsonValue> = (from) => jsonValue.convert(from);

/**
 * Checks the annotations every node accepts: `default` and each member of `examples` must be JSON
 * values, and `examples` an array. They are not checked against the node.
 * @param opts - The options to check.
 * @returns The options, or a `Failure` naming the keyword.
 * @internal
 */
export function checkAnnotations<T extends ISchemaOptions>(opts: T | undefined): Result<T | undefined> {
  if (opts === undefined) {
    return succeed(opts);
  }
  const checkDefault: Result<unknown> =
    opts.default === undefined
      ? succeed(undefined)
      : _annotationValue(opts.default).withErrorFormat((msg) => `default: ${msg}`);
  return checkDefault
    .onSuccess(() =>
      opts.examples === undefined
        ? succeed([])
        : Converters.arrayOf(Converters.generic(_annotationValue))
            .convert(opts.examples)
            .withErrorFormat((msg) => `examples: ${msg}`)
    )
    .onSuccess(() => succeed(opts));
}

/**
 * Checks a number against every numeric constraint in `opts`.
 * @param value - The (already type-checked) number.
 * @param opts - The node's options.
 * @returns The number, or a `Failure` naming the first violated keyword and its bound.
 * @internal
 */
export function enforceNumberConstraints(value: number, opts: INumberSchemaOptions): Result<number> {
  return mapResults(
    NUMBER_KEYWORDS.map((keyword) => _enforceNumberKeyword(value, keyword, opts[keyword]))
  ).onSuccess(() => succeed(value));
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
    case 'multipleOf': {
      const quotient = value / bound;
      return Math.abs(quotient - Math.round(quotient)) <=
        MULTIPLE_OF_TOLERANCE * Math.max(1, Math.abs(quotient))
        ? succeed(value)
        : fail(`expected a multiple of ${bound} (multipleOf), got ${value}`);
    }
  }
}

/**
 * Checks a string's length, in code points, against `minLength` and `maxLength`.
 * @param value - The (already type-checked) string.
 * @param opts - The node's options.
 * @returns The string, or a `Failure` naming the violated keyword and its bound.
 * @internal
 */
export function enforceStringConstraints(value: string, opts: IStringSchemaOptions): Result<string> {
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
 * The wire fields for the annotations every node carries, in a fixed order: `description`,
 * `title`, `default`, `examples`.
 * @internal
 */
export function annotationFields(opts: ISchemaOptions): JsonObject {
  return {
    ...(opts.description !== undefined && { description: opts.description }),
    ...(opts.title !== undefined && { title: opts.title }),
    ...(opts.default !== undefined && { default: opts.default }),
    ...(opts.examples !== undefined && { examples: [...opts.examples] })
  };
}

/** The wire fields for a number node's constraints, in a fixed order. @internal */
export function numberConstraintFields(opts: INumberSchemaOptions): JsonObject {
  const out: JsonObject = {};
  for (const keyword of NUMBER_KEYWORDS) {
    const value = opts[keyword];
    if (value !== undefined) {
      out[keyword] = value;
    }
  }
  return out;
}

/** The wire fields for a string node's constraints and format, in a fixed order. @internal */
export function stringConstraintFields(opts: IStringSchemaOptions): JsonObject {
  return {
    ...(opts.minLength !== undefined && { minLength: opts.minLength }),
    ...(opts.maxLength !== undefined && { maxLength: opts.maxLength }),
    ...(opts.format !== undefined && { format: opts.format })
  };
}
