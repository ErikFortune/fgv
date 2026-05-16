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

import { Brand, Converters, succeed } from '@fgv/ts-utils';

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
export namespace Convert {
  /** Converts an unknown value to a {@link PromptId}. */
  export const promptId = Converters.string.map((s) => succeed(s as PromptId));
  /** Converts an unknown value to a {@link SlotName}. */
  export const slotName = Converters.string.map((s) => succeed(s as SlotName));
  /** Converts an unknown value to a {@link ResourceId}. */
  export const resourceId = Converters.string.map((s) => succeed(s as ResourceId));
  /** Converts an unknown value to a {@link ConverterId}. */
  export const converterId = Converters.string.map((s) => succeed(s as ConverterId));
  /** Converts an unknown value to a {@link SerializerId}. */
  export const serializerId = Converters.string.map((s) => succeed(s as SerializerId));
  /** Converts an unknown value to a {@link ValidatorId}. */
  export const validatorId = Converters.string.map((s) => succeed(s as ValidatorId));
  /** Converts an unknown value to an {@link AxisName}. */
  export const axisName = Converters.string.map((s) => succeed(s as AxisName));
  /** Converts an unknown value to a {@link ScopeKey}. */
  export const scopeKey = Converters.string.map((s) => succeed(s as ScopeKey));
}
