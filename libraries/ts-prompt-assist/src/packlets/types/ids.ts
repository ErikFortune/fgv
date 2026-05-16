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

import { Brand, Converter, Converters, succeed } from '@fgv/ts-utils';

/**
 * Branded type for prompt identifiers.
 * @public
 */
export type PromptId = Brand<string, 'PromptId'>;

/**
 * Branded type for slot names.
 * @public
 */
export type SlotName = Brand<string, 'SlotName'>;

/**
 * Branded type for resource identifiers used in resource bindings.
 * @public
 */
export type ResourceId = Brand<string, 'ResourceId'>;

/**
 * Branded type for output converter identifiers.
 * @public
 */
export type ConverterId = Brand<string, 'ConverterId'>;

/**
 * Branded type for slot serializer identifiers.
 * @public
 */
export type SerializerId = Brand<string, 'SerializerId'>;

/**
 * Branded type for output validator identifiers.
 * @public
 */
export type ValidatorId = Brand<string, 'ValidatorId'>;

/**
 * Branded type for qualifier axis names.
 * @public
 */
export type AxisName = Brand<string, 'AxisName'>;

/**
 * Branded type for scope keys used in the scope chain.
 * @public
 */
export type ScopeKey = Brand<string, 'ScopeKey'>;

/**
 * Converters for branded scalar types.
 * @public
 */
export const Convert: {
  promptId: Converter<PromptId>;
  slotName: Converter<SlotName>;
  resourceId: Converter<ResourceId>;
  converterId: Converter<ConverterId>;
  serializerId: Converter<SerializerId>;
  validatorId: Converter<ValidatorId>;
  axisName: Converter<AxisName>;
  scopeKey: Converter<ScopeKey>;
} = {
  /** Converts an unknown value to a {@link PromptId}. */
  promptId: Converters.string.map((s) => succeed(s as PromptId)) as Converter<PromptId>,
  /** Converts an unknown value to a {@link SlotName}. */
  slotName: Converters.string.map((s) => succeed(s as SlotName)) as Converter<SlotName>,
  /** Converts an unknown value to a {@link ResourceId}. */
  resourceId: Converters.string.map((s) => succeed(s as ResourceId)) as Converter<ResourceId>,
  /** Converts an unknown value to a {@link ConverterId}. */
  converterId: Converters.string.map((s) => succeed(s as ConverterId)) as Converter<ConverterId>,
  /** Converts an unknown value to a {@link SerializerId}. */
  serializerId: Converters.string.map((s) => succeed(s as SerializerId)) as Converter<SerializerId>,
  /** Converts an unknown value to a {@link ValidatorId}. */
  validatorId: Converters.string.map((s) => succeed(s as ValidatorId)) as Converter<ValidatorId>,
  /** Converts an unknown value to an {@link AxisName}. */
  axisName: Converters.string.map((s) => succeed(s as AxisName)) as Converter<AxisName>,
  /** Converts an unknown value to a {@link ScopeKey}. */
  scopeKey: Converters.string.map((s) => succeed(s as ScopeKey)) as Converter<ScopeKey>
};
