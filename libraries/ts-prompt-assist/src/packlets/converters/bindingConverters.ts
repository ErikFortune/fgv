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

// A holder for the late-bound slot-binding converter; populated below.
// Using indirection lets us thread the recursion through substitutions
// without triggering use-before-define on the converter constants.
const _slotBindingHolder: { converter?: Converter<SlotBinding> } = {};

function convertSlotBinding(from: unknown): Result<SlotBinding> {
  const c = _slotBindingHolder.converter;
  /* c8 ignore next 2 - module-init guarantees populated by first invocation */
  if (c === undefined) return fail('slot binding: converter not initialized');
  return c.convert(from);
}

const substitutionEntryConverter: Converter<string | SlotBinding> = Converters.oneOf<string | SlotBinding>([
  Converters.string,
  Converters.generic<SlotBinding>((from: unknown) => convertSlotBinding(from))
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
export const slotBindingConverter: Converter<SlotBinding> = Converters.generic<SlotBinding>(
  (from: unknown): Result<SlotBinding> => {
    if (typeof from !== 'object' || from === null) {
      return fail('slot binding: expected an object');
    }
    const kindValue = (from as { kind?: unknown }).kind;
    if (kindValue === 'literal') {
      return literalSlotBindingConverter.convert(from);
    }
    if (kindValue === 'resource') {
      return resourceSlotBindingConverter.convert(from);
    }
    return fail(`slot binding: unknown kind '${String(kindValue)}'`);
  }
);

_slotBindingHolder.converter = slotBindingConverter;

/**
 * Converter for the caller-supplied substitutions map (allows bare-string
 * sugar for `\{ kind: 'literal', value, directive: 'prose' \}`).
 *
 * @public
 */
export const promptSubstitutionsConverter: Converter<PromptSubstitutions> = substitutionsConverter;

/**
 * Lifts caller-supplied substitution entries (bare strings or `SlotBinding`s)
 * into a uniform `ReadonlyMap<SlotName, SlotBinding>`. Bare strings expand to
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
