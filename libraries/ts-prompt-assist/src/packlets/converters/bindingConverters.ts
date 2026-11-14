/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail } from '@fgv/ts-utils';
import { Convert } from '../types';
import { EnumConvert } from '../types';
import { ILiteralSlotBinding, IResourceSlotBinding, PromptSubstitutions, SlotBinding } from '../types';

const literalSlotBindingConverter: Converter<ILiteralSlotBinding> = Converters.object<ILiteralSlotBinding>(
  {
    kind: Converters.literal<'literal'>('literal'),
    value: Converters.string,
    directive: EnumConvert.slotDirective,
    enforced: Converters.boolean.optional()
  },
  { optionalFields: ['enforced'] }
);

// The slot-binding Converter is mutually recursive with the
// substitution-entry Converter (a resource binding may carry nested
// substitutions, each of which may itself be a slot binding). A direct
// closure-thunk reference to `slotBindingConverter` would trip
// `@typescript-eslint/no-use-before-define` because the const it
// references is declared later in the file. We resolve the cycle via a
// tiny holder that's populated the moment `slotBindingConverter` is
// assigned, below — module evaluation order guarantees the holder is
// populated before any convert call runs. The holder's mutation is
// internal to this module; it is never reassigned and never observed
// before initialization.
const _bindingDispatch: { resolve: (from: unknown) => Result<SlotBinding> } = {
  /* c8 ignore next 2 - module-init guarantees this is overwritten before any call */
  resolve: (): Result<SlotBinding> => fail('slot binding: converter not initialized')
};

const substitutionEntryConverter: Converter<string | SlotBinding> = Converters.oneOf<string | SlotBinding>([
  Converters.string,
  Converters.generic<SlotBinding>((from: unknown) => _bindingDispatch.resolve(from))
]);

const substitutionsConverter: Converter<PromptSubstitutions> = Converters.recordOf<string | SlotBinding>(
  substitutionEntryConverter
);

const resourceSlotBindingConverter: Converter<IResourceSlotBinding> = Converters.object<IResourceSlotBinding>(
  {
    kind: Converters.literal<'resource'>('resource'),
    resourceId: Convert.resourceId,
    qualifiers: Converters.recordOf(Converters.string).optional(),
    scopeOverride: Converters.arrayOf(Convert.scopeKey).optional(),
    substitutions: substitutionsConverter.optional(),
    directive: EnumConvert.slotDirective,
    enforced: Converters.boolean.optional()
  },
  { optionalFields: ['qualifiers', 'scopeOverride', 'substitutions', 'enforced'] }
);

/**
 * Converter routing on the `kind` discriminator over the {@link SlotBinding}
 * union. Fails when `kind` is missing or unrecognized.
 *
 * @public
 */
export const slotBindingConverter: Converter<SlotBinding> = Converters.discriminatedObject<SlotBinding>(
  'kind',
  {
    literal: literalSlotBindingConverter,
    resource: resourceSlotBindingConverter
  }
);

// Wire the dispatch holder. After this line, `_bindingDispatch.resolve`
// forwards every convert call to the full slot-binding Converter.
_bindingDispatch.resolve = (from: unknown): Result<SlotBinding> => slotBindingConverter.convert(from);

/**
 * Converter for the caller-supplied substitutions map (allows bare-string
 * sugar for `\{ kind: 'literal', value, directive: 'prose' \}`).
 *
 * @public
 */
export const promptSubstitutionsConverter: Converter<PromptSubstitutions> = substitutionsConverter;

/**
 * Normalizes a single caller-supplied substitution entry (bare string or
 * `SlotBinding`) into a `SlotBinding`. Bare strings expand to
 * `\{ kind: 'literal', value, directive: 'prose' \}` per design §3.6.
 *
 * @public
 */
export function normalizeSubstitutionEntry(entry: string | SlotBinding): SlotBinding {
  if (typeof entry === 'string') {
    return { kind: 'literal', value: entry, directive: 'prose' };
  }
  return entry;
}

/**
 * Re-export for callers that want to convert a single substitution entry.
 * @public
 */
export const substitutionEntry: Converter<string | SlotBinding> = substitutionEntryConverter;
