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

import type { SlotDirective } from './enums';
import type { ResourceId, ScopeKey, SlotName } from './ids';

/**
 * Qualifier context: a record of qualifier name → value.
 * @public
 */
export type IQualifierContext = Readonly<Record<string, string>>;

/**
 * Caller-supplied substitution value: a bare string is sugar for a literal prose binding.
 * @public
 */
export type PromptSubstitutions = Readonly<Record<string, string | SlotBinding>>;

/**
 * A literal value binding for a slot.
 * @public
 */
export interface ILiteralSlotBinding {
  /** Discriminator. */
  readonly kind: 'literal';
  /** The literal string value. */
  readonly value: string;
  /** How this binding should be interpreted. */
  readonly directive: SlotDirective;
  /** When true, caller substitutions for this slot are rejected. */
  readonly enforced?: boolean;
}

/**
 * A resource-reference binding for a slot.
 * @public
 */
export interface IResourceSlotBinding {
  /** Discriminator. */
  readonly kind: 'resource';
  /** The resource to resolve for the slot value. */
  readonly resourceId: ResourceId;
  /** Optional qualifier context override for the inner resolve. */
  readonly qualifiers?: IQualifierContext;
  /** Optional scope chain override for the inner resolve. */
  readonly scopeOverride?: ReadonlyArray<ScopeKey>;
  /**
   * When supplied, replaces (does NOT layer over) the parent's substitution map
   * for the inner resolve. See OQ-2 (strict replace).
   */
  readonly substitutions?: PromptSubstitutions;
  /** How this binding should be interpreted. */
  readonly directive: SlotDirective;
  /** When true, caller substitutions for this slot are rejected. */
  readonly enforced?: boolean;
}

/**
 * A slot binding: either a literal value or a resource reference.
 * @public
 */
export type SlotBinding = ILiteralSlotBinding | IResourceSlotBinding;

/**
 * A scope-level record of slot bindings.
 * @public
 */
export interface IScopeSlotBindingsRecord {
  /** The scope these bindings belong to. */
  readonly scope: ScopeKey;
  /** The bindings keyed by slot name. */
  readonly bindings: ReadonlyMap<SlotName, SlotBinding>;
}
