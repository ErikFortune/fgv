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

import { Converter, Converters, fail, succeed } from '@fgv/ts-utils';
import type { IScopeSlotBindingsRecord, SlotBinding, ScopeKey, SlotName } from '../types';
import { slotBindingConverter } from './slotBindingConverter';

/**
 * Creates a converter for `_bindings.yaml` scope-level binding records.
 * @param scope - The scope key to assign to the resulting record.
 * @public
 */
export function scopeSlotBindingsRecordConverter(scope: ScopeKey): Converter<IScopeSlotBindingsRecord> {
  return Converters.generic<IScopeSlotBindingsRecord>((from: unknown) => {
    const baseResult = Converters.object({ bindings: Converters.recordOf(slotBindingConverter) }).convert(
      from
    );
    if (baseResult.isFailure()) {
      return fail(`scope bindings: ${baseResult.message}`);
    }
    const bindingsObj = baseResult.value.bindings;
    const bindingsMap = new Map<SlotName, SlotBinding>();
    for (const [key, value] of Object.entries(bindingsObj)) {
      bindingsMap.set(key as SlotName, value);
    }
    return succeed({ scope, bindings: bindingsMap });
  });
}
