/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import {
  IBindingTraceEntry,
  IPromptDescriptor,
  IPromptSafetyPolicy,
  IScreener,
  IScreenerContext,
  ISafeguardFinding,
  SlotName
} from '../types';

/**
 * Outcome of running the per-resolve safeguard pipeline. Findings collected
 * here are appended to the trace's `safeguardFindings`. A `reject`-disposition
 * finding (or a screener returning `fail()`) bubbles up as an overall
 * `Result.fail` from {@link applySafeguards} so the resolve never returns a
 * body that violates a hard policy.
 *
 * @internal
 */
export interface ISafeguardResult {
  readonly findings: ReadonlyArray<ISafeguardFinding>;
}

/**
 * Applies the per-slot length cap then runs the policy's screeners against the
 * merged binding map AFTER substitution context is built and BEFORE the
 * Mustache render.
 *
 * @remarks
 * - Length cap precedence: slot.maxLength → descriptor.safeguards.defaultMaxLength →
 *   policy.defaultMaxLength → none. Length-cap violations always reject.
 * - `descriptor.safeguards.skipInjectionScreening: true` skips all screeners
 *   for the descriptor, emitting a `'screening-skipped'` info finding per slot
 *   that declares a `source`. Source-aware skipping for a single screener is
 *   the screener's own concern (see {@link createPatternScreener}).
 * - Screeners run sequentially in declaration order. The first finding with
 *   `disposition: 'reject'` short-circuits the remaining screeners (and the
 *   rest of the slots) and fails the resolve. A screener returning `fail()`
 *   (an operational failure, not a finding) likewise fails the resolve with
 *   context.
 * - `'warn'` / `'info'` findings accumulate and surface in the trace.
 *
 * @internal
 */
export async function applySafeguards(
  descriptor: IPromptDescriptor,
  merged: ReadonlyMap<SlotName, IBindingTraceEntry>,
  policy: IPromptSafetyPolicy | undefined
): Promise<Result<ISafeguardResult>> {
  const findings: ISafeguardFinding[] = [];
  const descriptorDefaultMaxLength = descriptor.safeguards?.defaultMaxLength;
  const skipScreening = descriptor.safeguards?.skipInjectionScreening === true;
  const policyDefaultMaxLength = policy?.defaultMaxLength;
  const screeners = policy?.screeners ?? [];

  for (const slot of descriptor.slots) {
    const entry = merged.get(slot.name);
    if (entry === undefined || entry.source === 'empty') {
      // Skip the empty fallback (no binding / default / caller substitution).
      // A merged value that is an empty *string* is still screened — a screener
      // may legitimately want to flag blank content — matching prior behavior.
      continue;
    }
    const value = entry.value;

    const lengthCap = slot.maxLength ?? descriptorDefaultMaxLength ?? policyDefaultMaxLength;
    if (lengthCap !== undefined && !isFiniteNonNegativeInteger(lengthCap)) {
      // Length caps are plain `number`, so `NaN` and negative values are
      // syntactically valid but semantically incoherent (`value.length > NaN`
      // is `false` — silently disables the cap; negative caps reject every
      // non-empty value). Reject loudly so the misconfiguration surfaces with
      // the prompt id and slot name attached.
      return fail(
        `prompt '${descriptor.id}': slot '${slot.name}': maxLength must be a finite non-negative integer (got ${lengthCap})`
      );
    }
    if (lengthCap !== undefined && value.length > lengthCap) {
      return fail(
        `prompt '${descriptor.id}': slot '${slot.name}' exceeds maxLength ${lengthCap} (got ${value.length})`
      );
    }

    if (skipScreening) {
      if (slot.source !== undefined) {
        findings.push({
          slot: slot.name,
          kind: 'screening-skipped',
          disposition: 'info',
          detail: `slot '${slot.name}': screening skipped (descriptor.safeguards.skipInjectionScreening)`
        });
      }
      continue;
    }

    const ctx: IScreenerContext = { slot, source: slot.source, promptId: descriptor.id, value };
    const rejection = await runScreeners(screeners, ctx, descriptor.id, findings);
    if (rejection !== undefined) {
      return fail(rejection);
    }
  }

  return succeed({ findings });
}

/**
 * Runs the screeners sequentially for one slot value, appending warn/info
 * findings to `findings`. Returns a rejection message (to fail the resolve) on
 * the first reject-disposition finding or screener `fail()`, or `undefined`
 * when all screeners pass.
 */
async function runScreeners(
  screeners: ReadonlyArray<IScreener>,
  ctx: IScreenerContext,
  promptId: PromptIdLike,
  findings: ISafeguardFinding[]
): Promise<string | undefined> {
  for (const screener of screeners) {
    // Sequential by design: deterministic traces and reject short-circuit.
    // `screen` is consumer-implemented, so a thrown error or rejected promise
    // is captured here and folded into the same failure path as an explicit
    // `fail()` (the trailing `.onSuccess` flattens the captured nested Result).
    const result = await captureAsyncResult(() => screener.screen(ctx)).onSuccess((inner) => inner);
    if (result.isFailure()) {
      return `prompt '${promptId}': screener '${screener.name}' failed on slot '${ctx.slot.name}': ${result.message}`;
    }
    const emitted = result.value.map((f) => ({ ...f, screener: f.screener ?? screener.name }));
    const rejects = emitted.filter((f) => f.disposition === 'reject');
    if (rejects.length > 0) {
      // The slot name is omitted from this prefix: built-in finding details
      // (e.g. createPatternScreener) already carry `slot '<name>': ...`, so
      // re-adding it here would read redundantly. The screener name + each
      // finding's detail provide the attribution.
      return `prompt '${promptId}': screener '${screener.name}' rejected: ${rejects
        .map((f) => f.detail)
        .join('; ')}`;
    }
    findings.push(...emitted);
  }
  return undefined;
}

type PromptIdLike = IPromptDescriptor['id'];

function isFiniteNonNegativeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}
