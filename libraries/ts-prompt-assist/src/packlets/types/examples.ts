/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * One input/output pair within an {@link IPromptExampleSet}.
 * @public
 */
export interface IPromptExamplePair {
  readonly input: unknown;
  readonly output: unknown;
}

/**
 * A set of example pairs scoped to a particular qualifier context.
 * @public
 */
export interface IPromptExampleSet {
  readonly conditions: Readonly<Record<string, string>>;
  readonly pairs: ReadonlyArray<IPromptExamplePair>;
}
