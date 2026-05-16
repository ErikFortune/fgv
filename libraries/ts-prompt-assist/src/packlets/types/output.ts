/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ConverterId } from './ids';

/**
 * Free-text output contract; the prompt's output is treated as opaque text.
 * @public
 */
export interface ITextOutputContract {
  /** Discriminator for the output-contract union. */
  readonly kind: 'free-text';
}

/**
 * JSON output contract; the prompt's output is parsed and run through a
 * registered Converter (and the descriptor's `outputValidations` chain).
 * @public
 */
export interface IJsonOutputContract {
  /** Discriminator for the output-contract union. */
  readonly kind: 'json';
  /** Registered Converter id that types the parsed output. */
  readonly converterId: ConverterId;
}

/**
 * Discriminated union over output-contract shapes.
 * @public
 */
export type PromptOutputContract = ITextOutputContract | IJsonOutputContract;
