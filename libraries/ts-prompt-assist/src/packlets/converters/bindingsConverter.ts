/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { Convert, ScopeKey, SlotName } from '../types';
import { IScopeSlotBindingsRecord } from '../types';
import { SlotBinding } from '../types';
import { slotBindingConverter } from './bindingConverters';

/**
 * Shape of the YAML body of a `_bindings.yaml` file. The scope key is
 * reconstructed by the store from the file's directory path, so the file
 * body itself only carries the slot -\> binding map.
 * @public
 */
export interface IBindingsFileContents {
  /** Map from slot name to its bound value (literal or resource). */
  readonly bindings: ReadonlyMap<SlotName, SlotBinding>;
}

/**
 * Converter for the raw YAML body of a `_bindings.yaml` file. Accepts a
 * shape like `\{ bindings: \{ <slot>: SlotBinding, ... \} \}`.
 * @public
 */
export const bindingsFileConverter: Converter<IBindingsFileContents> =
  Converters.generic<IBindingsFileContents>((from: unknown): Result<IBindingsFileContents> => {
    if (typeof from !== 'object' || from === null) {
      return fail('bindings file: expected an object');
    }
    const raw = from as { readonly bindings?: unknown };
    if (typeof raw.bindings !== 'object' || raw.bindings === null) {
      return fail("bindings file: expected an object under key 'bindings'");
    }
    const entries = Object.entries(raw.bindings as Record<string, unknown>);
    const map = new Map<SlotName, SlotBinding>();
    for (const [rawSlot, rawBinding] of entries) {
      const nameResult = Convert.slotName.convert(rawSlot);
      if (nameResult.isFailure()) {
        return fail(`bindings file: invalid slot name '${rawSlot}': ${nameResult.message}`);
      }
      const bindingResult = slotBindingConverter.convert(rawBinding);
      if (bindingResult.isFailure()) {
        return fail(`bindings file: slot '${rawSlot}': ${bindingResult.message}`);
      }
      map.set(nameResult.value, bindingResult.value);
    }
    return succeed({ bindings: map });
  });

/**
 * Builds the typed scope-level bindings record from a parsed bindings file
 * and the scope key derived from the directory path.
 * @public
 */
export function buildBindingsRecord(
  scope: ScopeKey,
  contents: IBindingsFileContents
): IScopeSlotBindingsRecord {
  return { scope, bindings: contents.bindings };
}
