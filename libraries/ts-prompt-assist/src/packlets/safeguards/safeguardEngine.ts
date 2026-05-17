/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IBindingTraceEntry,
  IPromptDescriptor,
  IPromptSafetyPolicy,
  IPromptSlot,
  ISafeguardFinding,
  SlotName
} from '../types';

/**
 * Outcome of running the per-resolve safeguard pipeline. Findings collected
 * here are appended to the trace's `safeguardFindings`. A `reject`-disposition
 * finding bubbles up as an overall `Result.fail` from
 * {@link applySafeguards} so the resolve never returns a body that violates
 * a hard policy.
 *
 * @internal
 */
export interface ISafeguardResult {
  readonly findings: ReadonlyArray<ISafeguardFinding>;
}

/**
 * Applies per-slot length cap, regex screen, and source-aware skipping per
 * design §9. Runs against the merged binding map AFTER substitution context
 * is built and BEFORE the Mustache render.
 *
 * @remarks
 * - Length cap precedence: slot.maxLength → descriptor.safeguards.defaultMaxLength →
 *   policy.defaultMaxLength → none.
 * - Regex screen: each pattern's `lastIndex` is reset to 0 before every
 *   `.test()` so stateful (`g` / `y`) flag regexes don't leak state across
 *   slots (PR #359 retrospective bug).
 * - Source-aware skipping: a slot whose `source` is declared but is NOT in
 *   `policy.screenedSources` (or whose descriptor sets
 *   `safeguards.skipInjectionScreening: true`) is skipped with a
 *   `'screening-skipped'` info finding. Slots with no `source` declared are
 *   silently not screened (no finding — there is nothing to skip).
 * - Length-cap violations always reject the resolve.
 * - Regex-screen matches honor the policy's `onSuspicious` (default `'warn'`).
 *
 * @internal
 */
export function applySafeguards(
  descriptor: IPromptDescriptor,
  merged: ReadonlyMap<SlotName, IBindingTraceEntry>,
  policy: IPromptSafetyPolicy | undefined
): Result<ISafeguardResult> {
  const findings: ISafeguardFinding[] = [];
  const descriptorDefaultMaxLength = descriptor.safeguards?.defaultMaxLength;
  const skipScreening = descriptor.safeguards?.skipInjectionScreening === true;
  const policyDefaultMaxLength = policy?.defaultMaxLength;
  const screenedSources = policy?.screenedSources ?? [];
  const patterns = policy?.suspiciousPatterns ?? [];
  const onSuspicious = policy?.onSuspicious ?? 'warn';

  for (const slot of descriptor.slots) {
    const entry = merged.get(slot.name);
    if (entry === undefined || entry.source === 'empty') {
      continue;
    }
    const value = entry.value;

    const lengthCap = slot.maxLength ?? descriptorDefaultMaxLength ?? policyDefaultMaxLength;
    if (lengthCap !== undefined && !isFiniteNonNegativeInteger(lengthCap)) {
      // Length caps are plain `number` on `IPromptSlot.maxLength`,
      // `IPromptSafeguardOverrides.defaultMaxLength`, and
      // `IPromptSafetyPolicy.defaultMaxLength`, so `NaN` and negative
      // values are syntactically valid but semantically incoherent
      // (`value.length > NaN` is `false` — silently disables the cap;
      // negative caps reject every non-empty value). Reject loudly at
      // apply time so the misconfiguration surfaces with the prompt id
      // and slot name attached (Copilot review on PR #369).
      return fail(
        `prompt '${descriptor.id}': slot '${slot.name}': maxLength must be a finite non-negative integer (got ${lengthCap})`
      );
    }
    if (lengthCap !== undefined && value.length > lengthCap) {
      const finding: ISafeguardFinding = {
        slot: slot.name,
        kind: 'max-length',
        disposition: 'reject',
        detail: `slot '${slot.name}' exceeds maxLength ${lengthCap} (got ${value.length})`
      };
      findings.push(finding);
      return fail(
        `prompt '${descriptor.id}': slot '${slot.name}' exceeds maxLength ${lengthCap} (got ${value.length})`
      );
    }

    const screenResult = screenSlotValue({
      slot,
      value,
      patterns,
      screenedSources,
      skipScreening,
      onSuspicious,
      promptId: descriptor.id
    });
    findings.push(...screenResult.findings);
    if (screenResult.rejection !== undefined) {
      return fail(screenResult.rejection);
    }
  }

  return succeed({ findings });
}

interface IScreenInput {
  readonly slot: IPromptSlot;
  readonly value: string;
  readonly patterns: ReadonlyArray<RegExp>;
  readonly screenedSources: ReadonlyArray<string>;
  readonly skipScreening: boolean;
  readonly onSuspicious: 'warn' | 'reject';
  readonly promptId: IPromptDescriptor['id'];
}

interface IScreenOutcome {
  readonly findings: ReadonlyArray<ISafeguardFinding>;
  readonly rejection?: string;
}

function isFiniteNonNegativeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function screenSlotValue(input: IScreenInput): IScreenOutcome {
  const { slot, value, patterns, screenedSources, skipScreening, onSuspicious, promptId } = input;

  if (slot.source === undefined) {
    return { findings: [] };
  }

  // Descriptor-level override takes priority over policy-level source
  // gating: a descriptor that opts out via `skipInjectionScreening`
  // bypasses screening regardless of whether the slot's source is in
  // `policy.screenedSources`. The two branches each emit a
  // `'screening-skipped'` info finding with a distinguishable `detail`
  // string so consumers can tell which gate fired.
  if (skipScreening) {
    return {
      findings: [
        {
          slot: slot.name,
          kind: 'screening-skipped',
          disposition: 'info',
          detail: `slot '${slot.name}': screening skipped (descriptor.safeguards.skipInjectionScreening)`
        }
      ]
    };
  }

  if (!screenedSources.includes(slot.source)) {
    return {
      findings: [
        {
          slot: slot.name,
          kind: 'screening-skipped',
          disposition: 'info',
          detail: `slot '${slot.name}': source '${slot.source}' is not in safetyPolicy.screenedSources`
        }
      ]
    };
  }

  if (patterns.length === 0) {
    return { findings: [] };
  }

  const matches: string[] = [];
  for (const pattern of patterns) {
    // Reset `lastIndex` so stateful (`g` / `y`) flag regexes don't carry
    // state from a previous slot's value. This was a real bug in the
    // PR #359 retrospective.
    pattern.lastIndex = 0;
    if (pattern.test(value)) {
      matches.push(pattern.toString());
    }
  }

  if (matches.length === 0) {
    return { findings: [] };
  }

  const finding: ISafeguardFinding = {
    slot: slot.name,
    kind: 'suspicious-pattern',
    disposition: onSuspicious === 'reject' ? 'reject' : 'warn',
    detail: `slot '${slot.name}': matched suspicious pattern(s): ${matches.join(', ')}`
  };

  if (onSuspicious === 'reject') {
    return {
      findings: [finding],
      rejection: `prompt '${promptId}': slot '${slot.name}' matched suspicious pattern(s): ${matches.join(
        ', '
      )}`
    };
  }
  return { findings: [finding] };
}
