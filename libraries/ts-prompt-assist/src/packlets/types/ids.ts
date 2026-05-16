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

function brandedString<T extends string>(brand: string): Converter<T> {
  return Converters.string.map((from: string): Result<T> => {
    if (from.length === 0) {
      return fail(`${brand}: must be a non-empty string`);
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
  /** Validates an `unknown` value as a {@link PromptId}. */
  promptId: brandedString<PromptId>('PromptId'),
  /** Validates an `unknown` value as a {@link SlotName}. */
  slotName: brandedString<SlotName>('SlotName'),
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
