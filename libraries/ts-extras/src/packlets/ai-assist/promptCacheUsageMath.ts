// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Cache-hit ratio arithmetic and cold/warm verdict classification shared by the two prompt-cache
 * measurement harnesses under `perf/` (`promptCacheObservability.js`,
 * `promptCacheRoutingAb.js`).
 *
 * @remarks
 * Extracted per design.md §8's addendum ("Preferred remedy: keep `perf/` placement, add the
 * seam") and `TESTING_GUIDELINES.md` § "Measurement Harnesses" — before this module existed,
 * both harnesses computed this math inline, disagreed with each other on how to treat missing or
 * zero-valued fields, and had no test of either version. See {@link computeCacheUsageRatio} and
 * {@link compareCacheHitRatios} for what each inline version did and what changed.
 * @packageDocumentation
 */

import { type IAiCompletionUsage } from './usageTypes';

/**
 * A cache-hit ratio derived from one completion's usage block.
 * @internal
 */
export interface ICacheUsageRatio {
  /** `cachedInputTokens + uncachedInputTokens`, when both are known. `0` is a valid value. */
  readonly totalInputTokens: number | undefined;
  /**
   * `cachedInputTokens / totalInputTokens`, in `[0, 1]`.
   *
   * @remarks
   * `undefined` whenever the ratio is not a meaningful number: the usage block itself is absent,
   * either token count is unreported, or the total is `0` (there is no input to have a ratio
   * over). Per design.md's governing rule R-c, unknown is reported as unknown, never defaulted to
   * a number.
   */
  readonly cachedRatio: number | undefined;
}

/**
 * Computes {@link ICacheUsageRatio} from a completion's usage block.
 *
 * @remarks
 * The two harnesses this was extracted from each computed this ratio independently, inline, and
 * disagreed with each other — and with this function — on edge cases that neither had a test for:
 *
 * - `promptCacheObservability.js`'s `summarizeUsage` divided by a `0` total without a guard,
 *   printing `NaN%` whenever a response reported `uncachedInputTokens: 0, cachedInputTokens: 0`.
 * - `promptCacheRoutingAb.js`'s inline `pct()` coalesced a missing `cachedInputTokens` **or**
 *   `uncachedInputTokens` to `0` (`(u.cachedInputTokens ?? 0) + (u.uncachedInputTokens ?? 0)`,
 *   `100 * (u.cachedInputTokens ?? 0) / total`) — and which field was missing decided the
 *   direction of the fabrication: a missing `cachedInputTokens` fabricated a false low ratio
 *   (feeding a false `MISSES`), while a missing `uncachedInputTokens` fabricated a false **100%**
 *   (feeding a false `CONFIRMS`) — this is not a one-directional bug.
 * - `promptCacheRoutingAb.js`'s `describeUsage` also special-cased a *genuinely reported*
 *   `cachedInputTokens: 0, uncachedInputTokens: 0` (both fields present) as `0.0%`, and the
 *   verdict's `pct()` scored that same input as a hard `0`, feeding `MISSES`. This function scores
 *   a real zero-input total as not computable, same as observability's zero-total case above —
 *   there were no bytes to have a ratio over, so `0.0%` claims more than the data supports.
 *
 * All three are fixed here rather than reproduced: this function returns `undefined` — never a
 * fabricated number — whenever the ratio cannot honestly be computed, matching the same
 * unknown-is-unknown rule the normalized {@link IAiCompletionUsage} type itself follows.
 * @internal
 */
export function computeCacheUsageRatio(usage: IAiCompletionUsage | undefined): ICacheUsageRatio {
  if (usage === undefined) {
    return { totalInputTokens: undefined, cachedRatio: undefined };
  }
  const { cachedInputTokens, uncachedInputTokens } = usage;
  if (cachedInputTokens === undefined || uncachedInputTokens === undefined) {
    return { totalInputTokens: undefined, cachedRatio: undefined };
  }
  // A *present but out-of-range* component is not the same hazard as an absent one, and the
  // absent case above does not cover it. A token count cannot be negative or non-finite, so one
  // that is means the usage block is malformed — and computing anyway yields a ratio outside
  // [0, 1] that this function's own contract promises cannot happen. That ratio then reaches
  // `compareCacheHitRatios`, where a skewed baseline can fabricate a favourable verdict from an
  // unremarkable candidate. Reachable from real wire data, not just hand-built input:
  // `usageNormalization.ts` derives `uncachedInputTokens` as `promptTokens - cachedInputTokens`
  // on both the Chat Completions and Responses routes with no guard, so any provider reporting
  // `cached_tokens > prompt_tokens` produces exactly this shape.
  if (
    !Number.isFinite(cachedInputTokens) ||
    !Number.isFinite(uncachedInputTokens) ||
    cachedInputTokens < 0 ||
    uncachedInputTokens < 0
  ) {
    return { totalInputTokens: undefined, cachedRatio: undefined };
  }
  const totalInputTokens = cachedInputTokens + uncachedInputTokens;
  if (totalInputTokens <= 0) {
    return { totalInputTokens, cachedRatio: undefined };
  }
  return { totalInputTokens, cachedRatio: cachedInputTokens / totalInputTokens };
}

/**
 * Formats a cache-hit ratio as a percentage string, or `'n/a'` when {@link computeCacheUsageRatio}
 * could not compute one.
 * @internal
 */
export function formatCacheRatioPercent(ratio: number | undefined): string {
  return ratio === undefined ? 'n/a' : `${(ratio * 100).toFixed(1)}%`;
}

/**
 * Verdict for a baseline/candidate pair of cache-hit ratios.
 *
 * @remarks
 * `'inconclusive'` has no equivalent in the original inline logic — see {@link compareCacheHitRatios}.
 * @internal
 */
export type CacheHitComparisonVerdict = 'confirms' | 'misses' | 'ambiguous' | 'inconclusive';

/** A candidate ratio at or below this percentage cannot count as a cache hit. @internal */
export const CACHE_HIT_FLOOR_PERCENT: number = 50;

/**
 * The candidate ratio must clear the baseline ratio by at least this multiple to be attributed to
 * something other than routing luck.
 * @internal
 */
export const CACHE_HIT_MIN_IMPROVEMENT_FACTOR: number = 5;

/** The outcome of comparing a baseline usage block against a candidate one. @internal */
export interface ICacheHitComparison {
  readonly baselineRatio: number | undefined;
  readonly candidateRatio: number | undefined;
  readonly verdict: CacheHitComparisonVerdict;
}

/**
 * Classifies a baseline/candidate pair of usage blocks by their cache-hit ratio.
 *
 * @remarks
 * Ported from `promptCacheRoutingAb.js`'s inline verdict —
 * `if (b > 50 && b > a * 5) CONFIRMS; else if (b <= 50) MISSES; else AMBIGUOUS` — now driven off
 * {@link computeCacheUsageRatio} rather than a hand-rolled `pct()` that coalesced missing fields
 * to `0`. `'inconclusive'` is new: it is what an unclassifiable ratio (baseline or candidate
 * `undefined`) reports now, in place of the original's silent `0`, which could otherwise produce
 * a false `MISSES` verdict from data that never said "no cache hit" — it said nothing at all.
 *
 * The same classification also drives `promptCacheObservability.js`'s cold/warm comparison
 * (baseline = cold call, candidate = warm call), which previously had no computed verdict of any
 * kind — only two printed summaries and a static reminder for a human to judge by eye.
 * @internal
 */
export function compareCacheHitRatios(
  baseline: IAiCompletionUsage | undefined,
  candidate: IAiCompletionUsage | undefined
): ICacheHitComparison {
  const baselineRatio = computeCacheUsageRatio(baseline).cachedRatio;
  const candidateRatio = computeCacheUsageRatio(candidate).cachedRatio;
  if (baselineRatio === undefined || candidateRatio === undefined) {
    return { baselineRatio, candidateRatio, verdict: 'inconclusive' };
  }
  const baselinePercent = baselineRatio * 100;
  const candidatePercent = candidateRatio * 100;
  if (
    candidatePercent > CACHE_HIT_FLOOR_PERCENT &&
    candidatePercent > baselinePercent * CACHE_HIT_MIN_IMPROVEMENT_FACTOR
  ) {
    return { baselineRatio, candidateRatio, verdict: 'confirms' };
  }
  if (candidatePercent <= CACHE_HIT_FLOOR_PERCENT) {
    return { baselineRatio, candidateRatio, verdict: 'misses' };
  }
  return { baselineRatio, candidateRatio, verdict: 'ambiguous' };
}
