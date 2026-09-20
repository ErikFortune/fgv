/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { fail, Result } from '@fgv/ts-utils';
import { IPromptComposition, PromptCacheStability } from '../types';
import { deriveCacheBreakpointOffsets } from './cacheStabilityAnalysis';

/**
 * Caller-supplied inputs to {@link toCacheRequest} beyond the composition itself.
 *
 * @remarks
 * Neither field has a home in `@fgv/ts-prompt-assist` — per design F1 the dependency direction is
 * one-way (`ai-assist` never learns this package exists), so a model-keyed write cap
 * (`AiAssist.IAiCacheCapability`, when it exists) and a cache-routing key are always the caller's
 * to supply, resolved against whatever provider/model the caller is about to send this request to.
 * @public
 */
export interface IToCacheRequestHints {
  /**
   * Cap on the number of breakpoints to emit, when the caller knows the target model's write
   * limit. Omitted means no cap is enforced here — validated (fail-loud, never a silent trim) by
   * `AiAssist.validateCacheBreakpoints` (from `@fgv/ts-extras`). See that function's remarks for
   * why an omitted cap is not a soundness gap: the three-level `PromptCacheStability` vocabulary
   * never yields more than two breakpoints (design.md §5.2).
   */
  readonly maxBreakpointWrites?: number;
  /** Passed straight through to `AiAssist.IAiCacheRequest.cacheKey` (from `@fgv/ts-extras`). */
  readonly cacheKey?: string;
}

/**
 * Builds an `AiAssist.IAiCacheRequest` (from `@fgv/ts-extras`) — a prompt-caching plan for
 * `ai-assist`'s completion adapters — from a resolved composition's per-section effective
 * stability.
 *
 * @remarks
 * **Dependency direction (design F1).** This function lives here, not in `ai-assist`, because the
 * cache-plan *type* (`AiAssist.IAiCacheRequest`) belongs in `ai-assist` — it is made of `number`
 * and `string`, and is usable by a caller with no `ts-prompt-assist` dependency at all — while
 * deriving *this* plan from a resolve's stability annotations is exactly the analysis
 * `ts-prompt-assist` already owns (`computeCacheStabilityAnalysis`, design.md §9). `ai-assist`
 * cannot depend the other way; the package graph makes that a build failure, not a discipline
 * problem (see design.md §0 F1).
 *
 * **Fails when `composition.unavailable` is set** — there is no section map to derive breakpoints
 * from, and returning an empty-but-valid plan would silently mask that the composition itself
 * failed to segment, rather than say so. A composition with zero sections but no `unavailable`
 * reason (a genuinely empty resolved body) is not an error: it yields a plan with no
 * `systemBreakpoints`, the same request body a caller omitting `cache` entirely would send.
 *
 * **Offsets are into `composition`'s own body**, i.e. `AiPrompt.system` / `IChatRequest.system`
 * when the caller sends the whole resolved body as the system prompt (design.md §6.1) — the same
 * currency `IPromptSection.start` already reports.
 *
 * @param composition - A composition from a resolve requested with `{ composition: {...} }`.
 * `IPromptSection.effectiveStability` must be present on its sections — always true for a
 * composition this package produced; a hand-built one lacking it is treated as `'per-request'`
 * per R-a (the default), never upgraded.
 * @param hints - Optional cap and cache-routing key; see {@link IToCacheRequestHints}.
 * @public
 */
export function toCacheRequest(
  composition: IPromptComposition,
  hints?: IToCacheRequestHints
): Result<AiAssist.IAiCacheRequest> {
  if (composition.unavailable !== undefined) {
    return fail(`cannot build a cache request: composition is unavailable: ${composition.unavailable}`);
  }

  const perSectionStability: ReadonlyArray<PromptCacheStability> = composition.sections.map(
    (section) => section.effectiveStability ?? 'per-request'
  );
  const offsets = deriveCacheBreakpointOffsets(composition.sections, perSectionStability);

  const cache: AiAssist.IAiCacheRequest = {
    ...(offsets.length > 0 ? { systemBreakpoints: offsets } : {}),
    ...(hints?.cacheKey !== undefined ? { cacheKey: hints.cacheKey } : {})
  };

  return AiAssist.validateCacheBreakpoints(composition.totalChars, cache, hints?.maxBreakpointWrites);
}
