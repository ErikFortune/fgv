/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { Instant, TaskRevision } from '../types';

/**
 * The one instant spelling this library accepts: canonical UTC with exactly three
 * fractional digits.
 */
const INSTANT_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Safe identifier syntax: an alphanumeric first character, then alphanumerics and a
 * small closed set of separators. Deliberately excludes `/`, `\`, whitespace, `%` and
 * every control character, so an identifier can never be a path fragment.
 */
const IDENTIFIER_PATTERN: RegExp = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/**
 * Converts an unknown value to a canonical UTC {@link Instant}.
 *
 * @remarks
 * No general date parser and no date dependency: this is a shape check, an actual
 * platform parse, and an ISO round-trip. The round-trip is what rejects a
 * well-shaped but impossible date such as `2026-02-30T00:00:00.000Z`, which `Date`
 * would otherwise roll forward into March. Zone-free and offset-qualified spellings
 * fail the shape check; hosts normalize before this boundary.
 * @public
 */
export const instant: Converter<Instant> = Converters.string
  .withConstraint((value: string): Result<string> => {
    if (!INSTANT_PATTERN.test(value)) {
      return fail(`"${value}": not a canonical UTC instant (YYYY-MM-DDTHH:mm:ss.sssZ)`);
    }
    const parsed: number = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return fail(`"${value}": not a valid instant`);
    }
    if (new Date(parsed).toISOString() !== value) {
      return fail(`"${value}": not a valid instant`);
    }
    return succeed(value);
  })
  .withBrand('TaskInstant');

/**
 * Converts an unknown value to a positive safe integer.
 *
 * @remarks
 * Revisions and schema versions use this. A value beyond `Number.MAX_SAFE_INTEGER`
 * fails here — before a write — rather than silently losing ordering.
 * @public
 */
export const positiveSafeInteger: Converter<number> = Converters.number.withConstraint(
  (value: number): Result<number> => {
    if (!Number.isSafeInteger(value) || value < 1) {
      return fail(`${value}: expected a positive safe integer`);
    }
    return succeed(value);
  }
);

/**
 * The longest source cursor or checkpoint the library represents: 4 KiB. A capacity profile's
 * `maxSourceCursorBytes` may be lower but never higher, and every stored cursor is also checked
 * against the stored profile's byte bound.
 * @public
 */
export const maxSourceCursorLength: number = 4096;

/**
 * Converts an unknown value to a non-negative safe integer.
 * @public
 */
export const nonNegativeSafeInteger: Converter<number> = Converters.number.withConstraint(
  (value: number): Result<number> => {
    if (!Number.isSafeInteger(value) || value < 0) {
      return fail(`${value}: expected a non-negative safe integer`);
    }
    return succeed(value);
  }
);

/**
 * Converts an unknown value to a finite non-negative number.
 * @public
 */
export const nonNegativeAmount: Converter<number> = Converters.number.withConstraint(
  (value: number): Result<number> => {
    if (!Number.isFinite(value) || value < 0) {
      return fail(`${value}: expected a finite non-negative amount`);
    }
    return succeed(value);
  }
);

/**
 * Converts an unknown value to a monotonic {@link TaskRevision}.
 * @public
 */
export const taskRevision: Converter<TaskRevision> = positiveSafeInteger.withBrand('TaskRevision');

/**
 * Builds a converter for a bounded safe identifier.
 *
 * @param maxLength - maximum length. The accepted syntax is ASCII-only, so this is
 * equally a UTF-8 byte bound.
 * @param description - what the identifier names, for error messages.
 * @public
 */
export function boundedIdentifier(maxLength: number, description: string): Converter<string> {
  return Converters.string.withConstraint((value: string): Result<string> => {
    if (value.length > maxLength) {
      return fail(`${description}: ${value.length} characters exceeds the maximum of ${maxLength}`);
    }
    if (!IDENTIFIER_PATTERN.test(value)) {
      return fail(`"${value}": not a valid ${description}`);
    }
    return succeed(value);
  });
}

/**
 * Builds a converter for a bounded, non-empty single-line string — no line breaks and
 * no control characters.
 * @public
 */
export function boundedSingleLine(maxLength: number, description: string): Converter<string> {
  return Converters.string
    .singleLine({ maxLength })
    .withFormattedError((__value: unknown, message?: string) => `${description}: ${message}`);
}

/**
 * Builds a converter for a bounded, possibly multi-line, non-empty string.
 * @public
 */
export function boundedText(maxLength: number, description: string): Converter<string> {
  return Converters.string.withConstraint((value: string): Result<string> => {
    if (value.length < 1) {
      return fail(`${description}: may not be empty`);
    }
    if (value.length > maxLength) {
      return fail(`${description}: ${value.length} characters exceeds the maximum of ${maxLength}`);
    }
    return succeed(value);
  });
}

/**
 * Builds a converter for a bounded readonly array.
 *
 * @remarks
 * The length is checked **before** any element is converted. Checking it afterwards would
 * bound the result but not the work: an oversized array would be validated element by element
 * in full, and only then refused.
 * @public
 */
export function boundedArrayOf<T>(
  item: Converter<T>,
  maxItems: number,
  description: string
): Converter<ReadonlyArray<T>> {
  const elements: Converter<T[]> = Converters.arrayOf(item);
  return Converters.generic<ReadonlyArray<T>>(
    (from: unknown, __self: unknown, context?: unknown): Result<ReadonlyArray<T>> => {
      if (Array.isArray(from) && from.length > maxItems) {
        return fail(`${description}: ${from.length} entries exceeds the maximum of ${maxItems}`);
      }
      // Pass the conversion context through: a context-dependent element converter must see
      // exactly what it would have seen without the bound in front of it.
      return elements.convert(from, context);
    }
  );
}
