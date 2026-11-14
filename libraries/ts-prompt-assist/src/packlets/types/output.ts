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

/**
 * Discriminator base for the consumer's response union type parameter
 * (`TResponse`). Every member of the consumer's `TResponse` union must
 * carry a string-literal `kind` field; the JSON output pipeline uses
 * that discriminator to dispatch the registered Converter and to narrow
 * each validator's `appliesTo`.
 *
 * @remarks
 * Declared as a named interface (rather than the inline `\{ kind: string \}`
 * lower bound that previously appeared at every parameterized signature)
 * so the discriminator role has a single TSDoc-attach point and so
 * `TResponse extends IPromptResponseBase` reads as a domain constraint
 * rather than an ad-hoc shape.
 *
 * Consumers extend it as a discriminated union, e.g.
 * `type MyResponses = \{ kind: 'classify'; label: string \} | \{ kind: 'extract'; data: Record<string, string> \}`.
 *
 * @public
 */
export interface IPromptResponseBase {
  /** String-literal discriminator that the JSON pipeline dispatches on. */
  readonly kind: string;
}

/**
 * Shape of the `appliesTo` field on an {@link IPromptOutputValidator} — the
 * discriminator value(s) the validator narrows by at runtime.
 *
 * @remarks
 * Single-kind validators set `appliesTo` to one of the consumer's
 * `TResponse['kind']` literals (e.g. `'cited'`); cross-kind validators set
 * it to a `ReadonlyArray` of literals (e.g. `['cited', 'classifier']`). The
 * output pipeline normalizes either form to an array at runtime and skips
 * validators whose set doesn't include `value.kind`.
 *
 * Extracted as a named type so the "one value or array of values" union has
 * a single TSDoc-attach point and consumers authoring validators can
 * reference the field shape directly. Parameterized by
 * `TResponse extends IPromptResponseBase` so the named alias preserves the
 * same narrowing the inline union provided.
 *
 * @public
 */
export type PromptOutputValidatorAppliesTo<TResponse extends IPromptResponseBase> =
  | TResponse['kind']
  | ReadonlyArray<TResponse['kind']>;
