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

interface IBrandedIdOptions {
  /** Optional substring the value must NOT contain. Per-brand specific —
   *  e.g. `PromptId` rejects `'::'` to defuse the `MustacheTemplateCache`
   *  key-delimiter collision. */
  readonly rejectSubstring?: string;
  /** Optional pattern the value must match. Per-brand specific — e.g.
   *  `SlotName` requires the Mustache "name" production so slot keys
   *  index a flat render context cleanly. The error message takes the
   *  shape "&lt;brand&gt;: '&lt;value&gt;' &lt;patternDescription&gt;",
   *  so describe the constraint inline (e.g. "is not a valid Mustache
   *  name"). */
  readonly mustMatch?: { readonly pattern: RegExp; readonly patternDescription: string };
}

/**
 * Builds a `Converter` for one of the branded id types in this library.
 * All brands share the per-brand hygiene: non-empty, length-capped,
 * whitespace-trimmed; each brand may layer on additional constraints
 * (e.g. `SlotName`'s Mustache-name regex; `PromptId`'s no-`::` rule)
 * via the options bag.
 *
 * Not exported — the per-brand `Convert.<brand>` constants are the
 * public surface.
 */
function brandedIdConverter<T extends string>(brand: string, options?: IBrandedIdOptions): Converter<T> {
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
    if (options?.mustMatch !== undefined && !options.mustMatch.pattern.test(from)) {
      return fail(`${brand}: '${from}' ${options.mustMatch.patternDescription}`);
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
  promptId: brandedIdConverter<PromptId>('PromptId', { rejectSubstring: '::' }),
  /** Validates an `unknown` value as a {@link SlotName}. Tightens to
   *  the Mustache "name" production (`[A-Za-z_][A-Za-z0-9_]*`) so slot
   *  names are stable Mustache identifiers — `'foo.bar'` would
   *  otherwise be tokenized as a section path. */
  slotName: brandedIdConverter<SlotName>('SlotName', {
    mustMatch: {
      pattern: MUSTACHE_NAME_RE,
      patternDescription: `is not a valid Mustache name (must match ${MUSTACHE_NAME_RE})`
    }
  }),
  /** Validates an `unknown` value as a {@link ResourceId}. */
  resourceId: brandedIdConverter<ResourceId>('ResourceId'),
  /** Validates an `unknown` value as a {@link ConverterId}. */
  converterId: brandedIdConverter<ConverterId>('ConverterId'),
  /** Validates an `unknown` value as a {@link SerializerId}. */
  serializerId: brandedIdConverter<SerializerId>('SerializerId'),
  /** Validates an `unknown` value as a {@link ValidatorId}. */
  validatorId: brandedIdConverter<ValidatorId>('ValidatorId'),
  /** Validates an `unknown` value as an {@link AxisName}. */
  axisName: brandedIdConverter<AxisName>('AxisName'),
  /** Validates an `unknown` value as a {@link ScopeKey}. */
  scopeKey: brandedIdConverter<ScopeKey>('ScopeKey')
} as const;
