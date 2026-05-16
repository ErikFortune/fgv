/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IPromptCandidateRecord, IPromptJoinPolicy } from '../types';
import { IQualifierContext } from '../types';
import { ResourceJson } from '@fgv/ts-res';

/**
 * Outcome of candidate selection.
 *
 * @remarks
 * B-1 foundation uses a minimal in-record selector: a candidate matches when
 * every condition in its (normalized) condition set is exactly satisfied by
 * the supplied {@link IQualifierContext}, OR when its condition set is
 * empty. Specificity is computed as the count of conditions in the set
 * (more conditions = more specific). The full ts-res integration (with the
 * long-lived `ResourceManagerBuilder`, qualifier types, scoreAsDefault,
 * priority etc.) ships in a follow-up to this B-1 foundation as scoped in
 * `state.md`.
 *
 * @public
 */
export interface ICandidateSelectionResult {
  readonly selected: ReadonlyArray<{ readonly candidate: IPromptCandidateRecord; readonly index: number }>;
}

function normalizeConditions(
  conditions: ResourceJson.Json.ConditionSetDecl
): ReadonlyArray<{ readonly qualifier: string; readonly value: string }> {
  if (Array.isArray(conditions)) {
    return conditions.map((c) => ({ qualifier: c.qualifierName, value: c.value }));
  }
  return Object.entries(conditions).map(([name, decl]) => ({
    qualifier: name,
    value: typeof decl === 'string' ? decl : decl.value
  }));
}

function candidateMatches(
  candidate: IPromptCandidateRecord,
  context: IQualifierContext
): { readonly matches: boolean; readonly specificity: number } {
  const normalized = normalizeConditions(candidate.conditions);
  for (const cond of normalized) {
    if (context[cond.qualifier] !== cond.value) {
      return { matches: false, specificity: normalized.length };
    }
  }
  return { matches: true, specificity: normalized.length };
}

/**
 * Selects the matching candidates from a record's candidate array in
 * specificity-ascending order, stopping at (and including) the first
 * terminal (`isPartial !== true`) candidate per design §10.2.
 *
 * @public
 */
export function selectCandidates(
  candidates: ReadonlyArray<IPromptCandidateRecord>,
  context: IQualifierContext
): Result<ICandidateSelectionResult> {
  const matching: { candidate: IPromptCandidateRecord; index: number; specificity: number }[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const { matches, specificity } = candidateMatches(candidate, context);
    if (matches) {
      matching.push({ candidate, index: i, specificity });
    }
  }
  if (matching.length === 0) {
    return fail('no candidate matched the supplied qualifier context');
  }
  // Specificity-ascending: lowest specificity first.
  matching.sort((a, b) => a.specificity - b.specificity);

  // Collect until (and including) first terminal.
  const collected: { candidate: IPromptCandidateRecord; index: number }[] = [];
  for (const entry of matching) {
    collected.push({ candidate: entry.candidate, index: entry.index });
    if (entry.candidate.isPartial !== true) {
      break;
    }
  }
  return succeed({ selected: collected });
}

/**
 * Joins selected candidate bodies per the supplied join policy (or the
 * design-§10.2 defaults).
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
    .map(({ candidate }) => (trim ? candidate.body.replace(/[ \t]*\n+\s*$/, '') : candidate.body))
    .join(separator);
}
