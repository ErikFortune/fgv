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

import { Converter, Converters } from '@fgv/ts-utils';
import type { ILiteralSlotBinding, IResourceSlotBinding, SlotBinding } from '../types';
import { Convert, slotDirectiveConverter } from '../types';

/**
 * Converter for literal slot bindings.
 * @public
 */
export const literalSlotBindingConverter: Converter<ILiteralSlotBinding> =
  Converters.object<ILiteralSlotBinding>({
    kind: Converters.literal<'literal'>('literal'),
    value: Converters.string,
    directive: slotDirectiveConverter,
    enforced: Converters.boolean.optional()
  });

/**
 * Converter for resource slot bindings.
 * @public
 */
export const resourceSlotBindingConverter: Converter<IResourceSlotBinding> =
  Converters.object<IResourceSlotBinding>({
    kind: Converters.literal<'resource'>('resource'),
    resourceId: Convert.resourceId,
    qualifiers: Converters.recordOf(Converters.string).optional(),
    scopeOverride: Converters.arrayOf(Convert.scopeKey).optional(),
    substitutions: Converters.recordOf(Converters.string).optional(),
    directive: slotDirectiveConverter,
    enforced: Converters.boolean.optional()
  });

/**
 * Converter for a slot binding (discriminated union of literal and resource).
 * @public
 */
export const slotBindingConverter: Converter<SlotBinding> = Converters.discriminatedObject<
  SlotBinding,
  'literal' | 'resource'
>('kind', {
  literal: literalSlotBindingConverter,
  resource: resourceSlotBindingConverter
});
