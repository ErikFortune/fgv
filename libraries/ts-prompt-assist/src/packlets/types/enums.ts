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

import { Converters } from '@fgv/ts-utils';

/**
 * Discriminator for slot binding kinds.
 * @public
 */
export type SlotBindingKind = 'literal' | 'resource';

/**
 * All valid values for {@link SlotBindingKind}.
 * @public
 */
export const allSlotBindingKindValues: ReadonlyArray<SlotBindingKind> = ['literal', 'resource'];

/**
 * Converts an unknown value to a {@link SlotBindingKind}.
 * @public
 */
export const slotBindingKindConverter = Converters.enumeratedValue<SlotBindingKind>(allSlotBindingKindValues);

/**
 * Directive that describes how a slot binding should be interpreted.
 * @public
 */
export type SlotDirective = 'constraint' | 'hint' | 'prose';

/**
 * All valid values for {@link SlotDirective}.
 * @public
 */
export const allSlotDirectiveValues: ReadonlyArray<SlotDirective> = ['constraint', 'hint', 'prose'];

/**
 * Converts an unknown value to a {@link SlotDirective}.
 * @public
 */
export const slotDirectiveConverter = Converters.enumeratedValue<SlotDirective>(allSlotDirectiveValues);

/**
 * Controls which scopes may write a slot binding.
 * @public
 */
export type SlotWritability = 'any-scope' | 'schema-only' | 'system-only';

/**
 * All valid values for {@link SlotWritability}.
 * @public
 */
export const allSlotWritabilityValues: ReadonlyArray<SlotWritability> = [
  'any-scope',
  'schema-only',
  'system-only'
];

/**
 * Converts an unknown value to a {@link SlotWritability}.
 * @public
 */
export const slotWritabilityConverter = Converters.enumeratedValue<SlotWritability>(allSlotWritabilityValues);

/**
 * Discriminates prompt output kinds.
 * @public
 */
export type OutputContractKind = 'free-text' | 'json';

/**
 * All valid values for {@link OutputContractKind}.
 * @public
 */
export const allOutputContractKindValues: ReadonlyArray<OutputContractKind> = ['free-text', 'json'];

/**
 * Converts an unknown value to an {@link OutputContractKind}.
 * @public
 */
export const outputContractKindConverter =
  Converters.enumeratedValue<OutputContractKind>(allOutputContractKindValues);

/**
 * Substitution mode for resource bindings (trace-only per OQ-2).
 * @public
 */
export type ResourceSubstitutionMode = 'replace' | 'inherit';

/**
 * All valid values for {@link ResourceSubstitutionMode}.
 * @public
 */
export const allResourceSubstitutionModeValues: ReadonlyArray<ResourceSubstitutionMode> = [
  'replace',
  'inherit'
];

/**
 * Converts an unknown value to a {@link ResourceSubstitutionMode}.
 * @public
 */
export const resourceSubstitutionModeConverter = Converters.enumeratedValue<ResourceSubstitutionMode>(
  allResourceSubstitutionModeValues
);

/**
 * Disposition for suspicious-pattern safeguard findings.
 * @public
 */
export type SuspiciousDisposition = 'warn' | 'reject';

/**
 * All valid values for {@link SuspiciousDisposition}.
 * @public
 */
export const allSuspiciousDispositionValues: ReadonlyArray<SuspiciousDisposition> = ['warn', 'reject'];

/**
 * Event kinds emitted by a prompt store.
 * @public
 */
export type PromptStoreEventKind =
  | 'descriptor-changed'
  | 'descriptor-removed'
  | 'bindings-changed'
  | 'qualifier-axes-changed';

/**
 * All valid values for {@link PromptStoreEventKind}.
 * @public
 */
export const allPromptStoreEventKindValues: ReadonlyArray<PromptStoreEventKind> = [
  'descriptor-changed',
  'descriptor-removed',
  'bindings-changed',
  'qualifier-axes-changed'
];

/**
 * Converts an unknown value to a {@link PromptStoreEventKind}.
 * @public
 */
export const promptStoreEventKindConverter = Converters.enumeratedValue<PromptStoreEventKind>(
  allPromptStoreEventKindValues
);
