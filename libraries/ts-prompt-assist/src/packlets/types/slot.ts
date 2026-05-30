/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { SerializerId, SlotName } from './ids';
import { SlotDirective, SlotWritability } from './enums';
import { SlotBinding } from './bindings';

/**
 * Declaration of a prompt slot.
 * @public
 */
export interface IPromptSlot {
  readonly name: SlotName;
  readonly description: string;
  /** Default `true`. */
  readonly required?: boolean;
  readonly defaultBinding?: SlotBinding;
  /** Open string narrowed by the consumer's descriptor Converter. Default `'string'`. */
  readonly kind?: string;
  readonly serializerId?: SerializerId;
  /** Default: any directive permitted. */
  readonly allowedDirectives?: ReadonlyArray<SlotDirective>;
  /** Default `'any-scope'`. */
  readonly writableBy?: SlotWritability;
  readonly maxLength?: number;
  /** Open string narrowed by the consumer's descriptor Converter. */
  readonly source?: string;
}
