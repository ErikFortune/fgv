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

/**
 * Discriminator for slot binding shapes.
 * @public
 */
export type SlotBindingKind = 'literal' | 'resource';

/**
 * All valid {@link SlotBindingKind} values.
 * @public
 */
export const allSlotBindingKindValues: ReadonlyArray<SlotBindingKind> = ['literal', 'resource'];

/**
 * Directive carried by a slot binding to inform LLM framing.
 * @public
 */
export type SlotDirective = 'constraint' | 'hint' | 'prose';

/**
 * All valid {@link SlotDirective} values.
 * @public
 */
export const allSlotDirectiveValues: ReadonlyArray<SlotDirective> = ['constraint', 'hint', 'prose'];

/**
 * Tier governing who may write to a slot's binding.
 * @public
 */
export type SlotWritability = 'any-scope' | 'schema-only' | 'system-only';

/**
 * All valid {@link SlotWritability} values.
 * @public
 */
export const allSlotWritabilityValues: ReadonlyArray<SlotWritability> = [
  'any-scope',
  'schema-only',
  'system-only'
];

/**
 * Discriminator for the prompt output contract.
 * @public
 */
export type OutputContractKind = 'free-text' | 'json';

/**
 * All valid {@link OutputContractKind} values.
 * @public
 */
export const allOutputContractKindValues: ReadonlyArray<OutputContractKind> = ['free-text', 'json'];

/**
 * Trace-only label distinguishing whether a resource-binding inner resolve
 * inherited the parent's substitutions or replaced them (OQ-2).
 * @public
 */
export type ResourceSubstitutionMode = 'replace' | 'inherit';

/**
 * All valid {@link ResourceSubstitutionMode} values.
 * @public
 */
export const allResourceSubstitutionModeValues: ReadonlyArray<ResourceSubstitutionMode> = [
  'replace',
  'inherit'
];

/**
 * Kind of a {@link IPromptStoreEvent}. Pinned per OQ-3.
 * @public
 */
export type PromptStoreEventKind =
  | 'descriptor-changed'
  | 'descriptor-removed'
  | 'bindings-changed'
  | 'qualifier-axes-changed';

/**
 * All valid {@link PromptStoreEventKind} values.
 * @public
 */
export const allPromptStoreEventKindValues: ReadonlyArray<PromptStoreEventKind> = [
  'descriptor-changed',
  'descriptor-removed',
  'bindings-changed',
  'qualifier-axes-changed'
];

/**
 * Converters for closed string-union types.
 * @public
 */
export const EnumConvert: {
  readonly slotBindingKind: Converter<SlotBindingKind, ReadonlyArray<SlotBindingKind>>;
  readonly slotDirective: Converter<SlotDirective, ReadonlyArray<SlotDirective>>;
  readonly slotWritability: Converter<SlotWritability, ReadonlyArray<SlotWritability>>;
  readonly outputContractKind: Converter<OutputContractKind, ReadonlyArray<OutputContractKind>>;
  readonly resourceSubstitutionMode: Converter<
    ResourceSubstitutionMode,
    ReadonlyArray<ResourceSubstitutionMode>
  >;
  readonly promptStoreEventKind: Converter<PromptStoreEventKind, ReadonlyArray<PromptStoreEventKind>>;
} = {
  slotBindingKind: Converters.enumeratedValue<SlotBindingKind>(allSlotBindingKindValues),
  slotDirective: Converters.enumeratedValue<SlotDirective>(allSlotDirectiveValues),
  slotWritability: Converters.enumeratedValue<SlotWritability>(allSlotWritabilityValues),
  outputContractKind: Converters.enumeratedValue<OutputContractKind>(allOutputContractKindValues),
  resourceSubstitutionMode: Converters.enumeratedValue<ResourceSubstitutionMode>(
    allResourceSubstitutionModeValues
  ),
  promptStoreEventKind: Converters.enumeratedValue<PromptStoreEventKind>(allPromptStoreEventKindValues)
} as const;
