/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { IPromptCandidateRecord, IPromptJoinPolicy } from '../types';

/**
 * Joins selected candidate bodies per the supplied join policy (or the
 * design-§10.2 defaults).
 *
 * @remarks
 * `trimTrailingWhitespace: true` strips all trailing whitespace (the
 * `\s+$` form) — including bare trailing spaces, not just YAML-block-
 * scalar trailing newlines. This matches the option's name; consumers
 * who need to preserve trailing whitespace (e.g. trailing newlines)
 * pass `trimTrailingWhitespace: false`.
 *
 * @public
 */
export function joinBodies(
  selected: ReadonlyArray<{ readonly candidate: IPromptCandidateRecord }>,
  policy: IPromptJoinPolicy | undefined
): string {
  const separator = policy?.separator ?? '\n\n';
  const order = policy?.order ?? 'specificity-ascending';
  const trim = policy?.trimTrailingWhitespace ?? true;

  const ordered = order === 'specificity-descending' ? [...selected].reverse() : selected;

  return ordered
    .map(({ candidate }) => (trim ? candidate.body.replace(/\s+$/, '') : candidate.body))
    .join(separator);
}
