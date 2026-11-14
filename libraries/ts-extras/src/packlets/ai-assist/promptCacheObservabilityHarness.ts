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
 * Pure logic and injectable transport for `perf/promptCacheObservability.js` — the C1 standing
 * assertion for design.md §8.
 *
 * @remarks
 * Extracted so the ratio arithmetic and the cold/warm verdict can be unit-tested against fixture
 * usage blocks without live traffic or an API key. Mirrors `samples/testbed`'s `xaiCacheProbe`
 * scenario, whose `IXaiCacheProbeDeps` seam this design.md §8's addendum names as the shape to
 * copy: only the network call is injected, everything else is a plain function.
 * @packageDocumentation
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { type IProviderCompletionParams } from './completionClient';
import { type IAiCompletionResponse, type IAiProviderDescriptor } from './model';
import {
  compareCacheHitRatios,
  computeCacheUsageRatio,
  formatCacheRatioPercent
} from './promptCacheUsageMath';
import { type IAiCompletionUsage } from './usageTypes';

/**
 * Injected transport. The harness's value is the arithmetic below; the network call is the only
 * part that needs a live key, so it is the only part injected.
 * @internal
 */
export interface IPromptCacheObservabilityDeps {
  readonly callCompletion: (params: IProviderCompletionParams) => Promise<Result<IAiCompletionResponse>>;
}

/**
 * Builds the stable system prefix both calls share. Ported verbatim from the harness's
 * `stablePrefix()` — repetition, not padding, so the text does not compress into something a
 * provider's tokenizer collapses, and large enough that a genuine cache hit is unmistakable
 * against design.md's recorded 128-token cold floor.
 * @internal
 */
export function buildObservabilityStablePrefix(): string {
  const lines: string[] = [];
  for (let i = 0; i < 400; i++) {
    lines.push(
      `Directive ${i}: when asked about topic ${i}, respond precisely and cite source ${i}-${i * 7}.`
    );
  }
  return `You are a careful assistant operating under the following fixed policy document.\n\n${lines.join(
    '\n'
  )}`;
}

/**
 * One line summarizing a call's usage block, e.g.
 * `cold call : reports=reads uncached=8684 cached=192 (2.2% of input) written=undefined output=20`.
 * Ported from `summarizeUsage`, now returning the line instead of printing it, and computing the
 * ratio via {@link computeCacheUsageRatio} instead of an unguarded division (see that function's
 * remarks for the `NaN%` this replaces).
 * @internal
 */
export function describeObservabilityUsage(label: string, usage: IAiCompletionUsage | undefined): string {
  if (usage === undefined) {
    return `${label}: usage absent from response`;
  }
  const { cachedRatio } = computeCacheUsageRatio(usage);
  return (
    `${label}: reports=${usage.reports} uncached=${usage.uncachedInputTokens} cached=${usage.cachedInputTokens} ` +
    `(${formatCacheRatioPercent(cachedRatio)} of input) written=${usage.cacheWriteTokens} output=${
      usage.outputTokens
    }`
  );
}

/**
 * Whether the standing assertion's prediction held: `usage.reports` should be `'reads'` on both
 * calls, and the warm call's cache-hit ratio should clear the cold call's by a wide margin.
 * @internal
 */
export type PromptCacheObservabilityVerdict = 'confirmed' | 'missed' | 'inconclusive';

/** The evaluated outcome of one cold/warm pair, per design.md §8's written-down prediction. @internal */
export interface IPromptCacheObservabilityResult {
  readonly cold: IAiCompletionUsage | undefined;
  readonly warm: IAiCompletionUsage | undefined;
  readonly coldRatio: number | undefined;
  readonly warmRatio: number | undefined;
  /** `true` only when both calls reported `usage.reports === 'reads'`, as design.md §8 predicts for xAI. */
  readonly reportsAsPredicted: boolean;
  readonly verdict: PromptCacheObservabilityVerdict;
  readonly detail: string;
}

/**
 * Evaluates the standing assertion's written-down prediction (design.md §8) against a cold/warm
 * pair of usage blocks.
 *
 * @remarks
 * This is new: the original harness printed both summaries and a static reminder for a human to
 * judge by eye ("prediction check: reports should read 'reads' on both calls…"). Formalizing that
 * judgement as a pure function is what makes it testable — and per `TESTING_GUIDELINES.md` §
 * "Measurement Harnesses", an unevaluated prediction is exactly the kind of thing a broken
 * harness never gets caught printing.
 * @internal
 */
export function evaluateObservabilityPrediction(
  cold: IAiCompletionUsage | undefined,
  warm: IAiCompletionUsage | undefined
): IPromptCacheObservabilityResult {
  const comparison = compareCacheHitRatios(cold, warm);

  // `cold`/`warm` undefined is a strict subset of `comparison.verdict === 'inconclusive'` (an
  // undefined usage block always yields an undefined ratio), but checking it explicitly is what
  // narrows both to defined below — `reports` is a required field, so once narrowed there is no
  // "usage present but reports absent" case left to guard against with `?.`/`?? 'absent'`.
  if (cold === undefined || warm === undefined || comparison.verdict === 'inconclusive') {
    return {
      cold,
      warm,
      coldRatio: comparison.baselineRatio,
      warmRatio: comparison.candidateRatio,
      reportsAsPredicted: false,
      verdict: 'inconclusive',
      detail: 'cache-hit ratio not computable for the cold call, the warm call, or both'
    };
  }

  const reportsAsPredicted = cold.reports === 'reads' && warm.reports === 'reads';
  const common = {
    cold,
    warm,
    coldRatio: comparison.baselineRatio,
    warmRatio: comparison.candidateRatio,
    reportsAsPredicted
  };

  if (!reportsAsPredicted) {
    return {
      ...common,
      verdict: 'missed',
      detail: `usage.reports was not 'reads' on both calls (cold=${cold.reports}, warm=${warm.reports})`
    };
  }
  if (comparison.verdict === 'confirms') {
    return {
      ...common,
      verdict: 'confirmed',
      detail:
        `warm cache-hit ratio (${formatCacheRatioPercent(comparison.candidateRatio)}) clears the ` +
        `cold floor (${formatCacheRatioPercent(comparison.baselineRatio)})`
    };
  }
  return {
    ...common,
    verdict: 'missed',
    detail:
      `warm cache-hit ratio (${formatCacheRatioPercent(comparison.candidateRatio)}) did not clear ` +
      `the cold floor (${formatCacheRatioPercent(comparison.baselineRatio)})`
  };
}

/**
 * Runs the standing assertion: a cold call, then a warm call sharing the same
 * {@link buildObservabilityStablePrefix} system prompt and differing only in the final user turn.
 * @internal
 */
export async function runPromptCacheObservabilityHarness(
  deps: IPromptCacheObservabilityDeps,
  descriptor: IAiProviderDescriptor,
  apiKey: string
): Promise<Result<IPromptCacheObservabilityResult>> {
  const system = buildObservabilityStablePrefix();

  const cold = await deps.callCompletion({
    descriptor,
    apiKey,
    system,
    messages: [{ role: 'user', content: 'In one sentence, what is directive 12 about?' }]
  });
  if (cold.isFailure()) {
    return fail(`cold call failed: ${cold.message}`);
  }

  const warm = await deps.callCompletion({
    descriptor,
    apiKey,
    system,
    messages: [{ role: 'user', content: 'In one sentence, what is directive 99 about?' }]
  });
  if (warm.isFailure()) {
    return fail(`warm call failed: ${warm.message}`);
  }

  return succeed(evaluateObservabilityPrediction(cold.value.usage, warm.value.usage));
}
