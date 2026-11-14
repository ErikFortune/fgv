/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Per-field maxima applied by the value converters.
 *
 * @remarks
 * These bound one field at a time. They are independent of the whole-repository
 * capacity profile ({@link ITaskCapacityProfile}), and the individual maxima are not
 * required to fit simultaneously — that is what the aggregate byte dimensions are for.
 * Construction may lower these bounds; it may not raise them.
 * @public
 */
export interface ITaskFieldBounds {
  /** Maximum length of a task title. */
  readonly maxTitleLength: number;
  /** Maximum length of a task description. */
  readonly maxDescriptionLength: number;
  /** Maximum length of a reason, outcome or progress summary. */
  readonly maxSummaryLength: number;
  /** Maximum length of a short coded value — a reason code, a phase, a unit. */
  readonly maxCodeLength: number;
  /** Maximum number of attention or artifact references in one field. */
  readonly maxReferences: number;
  /** Maximum number of scopes on one task. */
  readonly maxScopes: number;
  /** Maximum length of an identifier, in UTF-8 bytes. */
  readonly maxIdLength: number;
}

/**
 * The default {@link ITaskFieldBounds}.
 * @public
 */
export const defaultTaskFieldBounds: ITaskFieldBounds = {
  maxTitleLength: 256,
  maxDescriptionLength: 4096,
  maxSummaryLength: 2048,
  maxCodeLength: 128,
  maxReferences: 32,
  maxScopes: 64,
  maxIdLength: 128
};
