/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ResourceId, ScopeKey } from './ids';
import { SlotDirective } from './enums';
import { IQualifierContext } from './qualifiers';

/**
 * Literal slot binding — a fixed string value framed by a directive.
 * @public
 */
export interface ILiteralSlotBinding {
  /** Discriminator for the slot-binding union. */
  readonly kind: 'literal';
  readonly value: string;
  readonly directive: SlotDirective;
  /** When `true`, caller substitutions for this slot are ignored. */
  readonly enforced?: boolean;
}

/**
 * Resource slot binding — references another prompt id; the library resolves
 * it recursively and substitutes the rendered body into the parent slot.
 * @public
 */
export interface IResourceSlotBinding {
  /** Discriminator for the slot-binding union. */
  readonly kind: 'resource';
  readonly resourceId: ResourceId;
  readonly qualifiers?: IQualifierContext;
  readonly scopeOverride?: ReadonlyArray<ScopeKey>;
  /**
   * When supplied, replaces (does NOT layer over) the parent's
   * substitution map for the inner resolve. See OQ-2.
   */
  readonly substitutions?: PromptSubstitutions;
  readonly directive: SlotDirective;
  /** When `true`, caller substitutions for this slot are ignored. */
  readonly enforced?: boolean;
}

/**
 * Discriminated union over the slot-binding shapes.
 * @public
 */
export type SlotBinding = ILiteralSlotBinding | IResourceSlotBinding;

/**
 * Caller-supplied substitutions. A bare string is sugar for
 * `\{ kind: 'literal', value, directive: 'prose' \}`.
 * @public
 */
export type PromptSubstitutions = Readonly<Record<string, string | SlotBinding>>;
