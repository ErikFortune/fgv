// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { RE2JS } from 're2js';
import { translateEcmaPattern } from './ecmaPattern';

/**
 * Limits on what a pattern validator from {@link createRe2PatternValidator} will compile.
 * @public
 */
export interface IRe2PatternValidatorOptions {
  /**
   * The longest pattern source admitted, in UTF-16 code units. Longer sources are refused before
   * they are read. Defaults to {@link DEFAULT_RE2_PATTERN_LIMITS}.
   */
  readonly maxSourceLength?: number;
  /**
   * The largest compiled RE2 program admitted, as re2js's `programSize()` counts it — roughly one
   * instruction per character matched, so `a{1000}` is about 1000. Matching costs time linear in
   * the input **times** this size, so it bounds the per-character cost of every predicate call.
   * Defaults to {@link DEFAULT_RE2_PATTERN_LIMITS}.
   */
  readonly maxProgramSize?: number;
}

/**
 * The limits {@link re2PatternValidator} applies, and {@link createRe2PatternValidator} applies when
 * an option is omitted.
 * @public
 */
export const DEFAULT_RE2_PATTERN_LIMITS: Readonly<Required<IRe2PatternValidatorOptions>> = {
  maxSourceLength: 1024,
  maxProgramSize: 10000
};

function _limit(name: string, value: number | undefined, fallback: number): Result<number> {
  if (value === undefined) {
    return succeed(fallback);
  }
  return Number.isSafeInteger(value) && value > 0
    ? succeed(value)
    : fail(`${name} must be a positive integer, not ${String(value)}`);
}

/** A predicate over a compiled program that never throws and answers `true` only for a match. */
function _predicate(re: RE2JS): JsonSchema.SchemaPatternPredicate {
  return (value: string): boolean =>
    typeof value === 'string' && captureResult(() => re.test(value)).orDefault(false) === true;
}

function _compile(
  source: string,
  limits: Readonly<Required<IRe2PatternValidatorOptions>>
): Result<JsonSchema.SchemaPatternPredicate> {
  if (typeof source !== 'string') {
    return fail(`a pattern source must be a string, not ${typeof source}`);
  }
  if (source.length > limits.maxSourceLength) {
    return fail(`the pattern is ${source.length} characters, over the limit of ${limits.maxSourceLength}`);
  }
  return translateEcmaPattern(source)
    .withErrorFormat((msg) => `RE2 cannot read it as ECMA-262 does: ${msg}`)
    .onSuccess((translated) =>
      captureResult(() => RE2JS.compile(translated)).withErrorFormat((msg) => `RE2 cannot compile it: ${msg}`)
    )
    .onSuccess((re) =>
      captureResult(() => re.programSize()).onSuccess((size) =>
        size > limits.maxProgramSize
          ? fail(`its RE2 program size ${size} is over the limit of ${limits.maxProgramSize}`)
          : succeed(_predicate(re))
      )
    );
}

/**
 * Creates a `JsonSchema.SchemaPatternValidator` that compiles each pattern with RE2 (via re2js),
 * under the given limits.
 *
 * @remarks
 * Use {@link re2PatternValidator} for the defaults. This exists to tighten (or loosen) the limits.
 * @param options - Limits; each omitted one takes its {@link DEFAULT_RE2_PATTERN_LIMITS} value.
 * @returns The validator, or a failure if a limit is not a positive integer.
 * @public
 */
export function createRe2PatternValidator(
  options?: IRe2PatternValidatorOptions
): Result<JsonSchema.SchemaPatternValidator> {
  return _limit('maxSourceLength', options?.maxSourceLength, DEFAULT_RE2_PATTERN_LIMITS.maxSourceLength)
    .onSuccess((maxSourceLength) =>
      _limit('maxProgramSize', options?.maxProgramSize, DEFAULT_RE2_PATTERN_LIMITS.maxProgramSize).onSuccess(
        (maxProgramSize) => succeed({ maxSourceLength, maxProgramSize })
      )
    )
    .onSuccess((limits) => succeed((source: string) => _compile(source, limits)));
}

/**
 * A `JsonSchema.SchemaPatternValidator` for patterns from an untrusted source — pass it as
 * `fromJson(json, { patternValidator: re2PatternValidator })` or
 * `adaptMcpTools(session, { patternValidator: re2PatternValidator })`.
 *
 * @remarks
 * Each pattern is compiled with RE2 (re2js), whose matching is linear in the input, so no pattern
 * can backtrack catastrophically. The predicate searches, as JSON Schema `pattern` does: `abc`
 * matches `xxabcxx`, and only `^…$` anchors it.
 *
 * The source is read as the ECMA-262 `u`-mode pattern the schema states, then rewritten into RE2
 * syntax with the same meaning. What RE2 cannot express, or would read differently, is refused:
 * lookahead, lookbehind, backreferences, binary Unicode properties, `Script_Extensions`, non-ASCII
 * group names and any non-`u` (Annex B) syntax. `.`, `\s` and `\S` are rewritten to ECMA-262's sets,
 * which differ from RE2's own.
 *
 * Limits: {@link DEFAULT_RE2_PATTERN_LIMITS}. A refusal is a `Failure` naming the construct; the
 * validator and its predicates never throw, and a predicate answers `false` if matching fails.
 * @public
 */
export const re2PatternValidator: JsonSchema.SchemaPatternValidator = (source: string) =>
  _compile(source, DEFAULT_RE2_PATTERN_LIMITS);
