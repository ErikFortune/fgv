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

import { Brand, Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';

/**
 * Branded identifier for a prompt.
 * @public
 */
export type PromptId = Brand<string, 'PromptId'>;

/**
 * Branded identifier for a slot within a prompt.
 * @public
 */
export type SlotName = Brand<string, 'SlotName'>;

/**
 * Branded identifier for a resource referenced by a slot binding.
 * @public
 */
export type ResourceId = Brand<string, 'ResourceId'>;

/**
 * Branded identifier for a registered output Converter.
 * @public
 */
export type ConverterId = Brand<string, 'ConverterId'>;

/**
 * Branded identifier for a registered slot-kind serializer.
 * @public
 */
export type SerializerId = Brand<string, 'SerializerId'>;

/**
 * Branded identifier for a registered output validator.
 * @public
 */
export type ValidatorId = Brand<string, 'ValidatorId'>;

/**
 * Branded identifier for a ts-res qualifier axis.
 * @public
 */
export type AxisName = Brand<string, 'AxisName'>;

/**
 * Branded identifier for a scope in the prompt chain.
 * @public
 */
export type ScopeKey = Brand<string, 'ScopeKey'>;

/**
 * Maximum length of any branded identifier in the library. Picked to be
 * larger than any reasonable id authors would supply while still bounded
 * to defuse adversarial inputs (e.g. multi-megabyte ids used as cache
 * keys).
 */
const MAX_BRAND_LENGTH: number = 256;

/**
 * Mustache "name" production per the spec — `[A-Za-z_][A-Za-z0-9_]*`.
 * Slot names are used verbatim as Mustache substitution keys, so a name
 * like `'foo.bar'` would be tokenized as a section path `foo` → `bar`
 * rather than a flat key. `Convert.slotName` enforces the strict
 * production so substitution semantics match author intent.
 */
const MUSTACHE_NAME_RE: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface IBrandValidationOptions {
  /** When set, additionally rejects the supplied substring inside the
   *  candidate (e.g. `::` for `PromptId` to defuse the cache-key
   *  delimiter collision in `MustacheTemplateCache`). */
  readonly rejectSubstring?: string;
  /** When set, the candidate must match this regular expression. Used
   *  for `SlotName` to enforce the Mustache "name" production. */
  readonly mustMatch?: RegExp;
}

function brandedString<T extends string>(brand: string, options?: IBrandValidationOptions): Converter<T> {
  return Converters.string.map((from: string): Result<T> => {
    if (from.length === 0) {
      return fail(`${brand}: must be a non-empty string`);
    }
    if (from.length > MAX_BRAND_LENGTH) {
      return fail(`${brand}: exceeds maximum length ${MAX_BRAND_LENGTH} (got ${from.length})`);
    }
    if (from !== from.trim()) {
      return fail(`${brand}: must not have leading or trailing whitespace`);
    }
    if (options?.mustMatch !== undefined && !options.mustMatch.test(from)) {
      return fail(`${brand}: '${from}' is not a valid Mustache name (must match ${options.mustMatch})`);
    }
    if (options?.rejectSubstring !== undefined && from.includes(options.rejectSubstring)) {
      return fail(`${brand}: '${from}' must not contain '${options.rejectSubstring}'`);
    }
    return succeed(from as unknown as T);
  });
}

/**
 * Converters for branded identifier scalars.
 * @public
 */
export const Convert: {
  readonly promptId: Converter<PromptId>;
  readonly slotName: Converter<SlotName>;
  readonly resourceId: Converter<ResourceId>;
  readonly converterId: Converter<ConverterId>;
  readonly serializerId: Converter<SerializerId>;
  readonly validatorId: Converter<ValidatorId>;
  readonly axisName: Converter<AxisName>;
  readonly scopeKey: Converter<ScopeKey>;
} = {
  /** Validates an `unknown` value as a {@link PromptId}. Rejects ids
   *  that contain `::` so the `MustacheTemplateCache` key delimiter is
   *  collision-free. */
  promptId: brandedString<PromptId>('PromptId', { rejectSubstring: '::' }),
  /** Validates an `unknown` value as a {@link SlotName}. Tightens to
   *  the Mustache "name" production (`[A-Za-z_][A-Za-z0-9_]*`) so slot
   *  names are stable Mustache identifiers — `'foo.bar'` would
   *  otherwise be tokenized as a section path. */
  slotName: brandedString<SlotName>('SlotName', { mustMatch: MUSTACHE_NAME_RE }),
  /** Validates an `unknown` value as a {@link ResourceId}. */
  resourceId: brandedString<ResourceId>('ResourceId'),
  /** Validates an `unknown` value as a {@link ConverterId}. */
  converterId: brandedString<ConverterId>('ConverterId'),
  /** Validates an `unknown` value as a {@link SerializerId}. */
  serializerId: brandedString<SerializerId>('SerializerId'),
  /** Validates an `unknown` value as a {@link ValidatorId}. */
  validatorId: brandedString<ValidatorId>('ValidatorId'),
  /** Validates an `unknown` value as an {@link AxisName}. */
  axisName: brandedString<AxisName>('AxisName'),
  /** Validates an `unknown` value as a {@link ScopeKey}. */
  scopeKey: brandedString<ScopeKey>('ScopeKey')
} as const;
