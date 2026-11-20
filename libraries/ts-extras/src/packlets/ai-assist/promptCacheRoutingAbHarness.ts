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
 * Pure logic and injectable transport for `perf/promptCacheRoutingAb.js` — the A/B that measures
 * whether `IAiCacheRequest.cacheKey` actually improves the xAI cache-hit rate (design.md §2's
 * 2026-09-19 measurement note, and result.md's "gating defect in C3").
 *
 * @remarks
 * Extracted for the same reason as `promptCacheObservabilityHarness.ts`: the verdict this harness
 * prints (CONFIRMS / MISSES / AMBIGUOUS) "has already been used to justify a merge," per this
 * stream's follow-up task, and had no test checking it classifies correctly.
 * @packageDocumentation
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { type IAiCacheRequest } from './cacheRequest';
import { type IProviderCompletionParams } from './completionClient';
import { type IAiCompletionResponse, type IAiProviderDescriptor } from './model';
import {
  type CacheHitComparisonVerdict,
  compareCacheHitRatios,
  computeCacheUsageRatio,
  formatCacheRatioPercent
} from './promptCacheUsageMath';
import { type IAiCompletionUsage } from './usageTypes';

/** Injected transport — only the network call needs a live key. @internal */
export interface IPromptCacheRoutingAbDeps {
  readonly callCompletion: (params: IProviderCompletionParams) => Promise<Result<IAiCompletionResponse>>;
}

/**
 * Builds one arm's stable system prefix. Ported verbatim from the harness's `stablePrefix(arm)`.
 * `salt` and `arm` both feed the text so the two arms — and two separate runs — never warm each
 * other's cache.
 * @internal
 */
export function buildRoutingAbPrefix(salt: string, arm: string): string {
  const lines: string[] = [];
  for (let i = 0; i < 400; i++) {
    lines.push(
      `Directive ${salt}-${arm}-${i}: when asked about topic ${i}, respond precisely and cite source ${i}-${
        i * 7
      }.`
    );
  }
  return `You are a careful assistant operating under the following fixed policy document.\n\n${lines.join(
    '\n'
  )}`;
}

/**
 * One line describing a usage block. Ported from `describeUsage`, now computing the ratio via
 * {@link computeCacheUsageRatio} instead of an inline calculation that coalesced a missing
 * `cachedInputTokens` or `uncachedInputTokens` to `0` (see that function's remarks).
 * @internal
 */
export function describeRoutingAbUsage(usage: IAiCompletionUsage | undefined): string {
  if (usage === undefined) {
    return 'usage absent from response';
  }
  const { cachedInputTokens, uncachedInputTokens } = usage;
  const { totalInputTokens, cachedRatio } = computeCacheUsageRatio(usage);
  if (cachedRatio === undefined) {
    return `reports=${usage.reports} cached=${cachedInputTokens} uncached=${uncachedInputTokens} (ratio not computable)`;
  }
  return `reports=${
    usage.reports
  } cached=${cachedInputTokens} of ${totalInputTokens} input (${formatCacheRatioPercent(cachedRatio)})`;
}

/** One arm's cold-then-warm outcome. @internal */
export interface IPromptCacheRoutingAbArmResult {
  readonly label: string;
  readonly coldUsage: IAiCompletionUsage | undefined;
  readonly warmUsage: IAiCompletionUsage | undefined;
}

/**
 * Runs one arm: a cold call, then a warm call sharing the same {@link buildRoutingAbPrefix} system
 * prompt and differing only in the final user turn — optionally supplying `cacheKey`. Ported from
 * `runArm`, with the network call injected.
 * @internal
 */
export async function runPromptCacheRoutingAbArm(
  deps: IPromptCacheRoutingAbDeps,
  params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly apiKey: string;
    readonly label: string;
    readonly salt: string;
    readonly arm: string;
    readonly cacheKey?: string;
  }
): Promise<Result<IPromptCacheRoutingAbArmResult>> {
  const { descriptor, apiKey, label, salt, arm, cacheKey } = params;
  const system = buildRoutingAbPrefix(salt, arm);
  const cache: IAiCacheRequest | undefined = cacheKey !== undefined ? { cacheKey } : undefined;
  const call = (content: string): Promise<Result<IAiCompletionResponse>> =>
    deps.callCompletion({
      descriptor,
      apiKey,
      system,
      messages: [{ role: 'user', content }],
      cache
    });

  const cold = await call('In one sentence, what is directive 12 about?');
  if (cold.isFailure()) {
    return fail(`${label}: cold call failed: ${cold.message}`);
  }

  // Only the tail differs from the cold call — the prefix is byte-identical.
  const warm = await call('In one sentence, what is directive 99 about?');
  if (warm.isFailure()) {
    return fail(`${label}: warm call failed: ${warm.message}`);
  }

  return succeed({ label, coldUsage: cold.value.usage, warmUsage: warm.value.usage });
}

/** The full A/B: both arms' results and the routing-key verdict. @internal */
export interface IPromptCacheRoutingAbResult {
  readonly withoutKey: IPromptCacheRoutingAbArmResult;
  readonly withKey: IPromptCacheRoutingAbArmResult;
  /** Baseline = `withoutKey`'s warm call; candidate = `withKey`'s warm call. */
  readonly verdict: CacheHitComparisonVerdict;
  readonly withoutKeyWarmRatio: number | undefined;
  readonly withKeyWarmRatio: number | undefined;
}

/**
 * Runs both arms of the routing-key A/B and classifies the result.
 *
 * @remarks
 * The verdict compares each arm's **warm** call against the other's — not an arm's own cold vs.
 * warm call — because the question is whether the routing key changes the warm hit rate relative
 * to the no-key baseline, exactly as `promptCacheRoutingAb.js`'s original `main()` computed it
 * (`pct(withoutKey)` / `pct(withKey)`, both taken from each arm's warm response).
 * @internal
 */
export async function runPromptCacheRoutingAbHarness(
  deps: IPromptCacheRoutingAbDeps,
  params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly apiKey: string;
    readonly salt: string;
  }
): Promise<Result<IPromptCacheRoutingAbResult>> {
  const { descriptor, apiKey, salt } = params;

  const withoutKeyResult = await runPromptCacheRoutingAbArm(deps, {
    descriptor,
    apiKey,
    label: 'arm 1: WITHOUT cacheKey (behaviour before this change)',
    salt,
    arm: 'a'
  });
  if (withoutKeyResult.isFailure()) {
    return fail(withoutKeyResult.message);
  }

  const withKeyResult = await runPromptCacheRoutingAbArm(deps, {
    descriptor,
    apiKey,
    label: 'arm 2: WITH cacheKey (this change)',
    salt,
    arm: 'b',
    cacheKey: `routing-ab-${salt}`
  });
  if (withKeyResult.isFailure()) {
    return fail(withKeyResult.message);
  }

  const comparison = compareCacheHitRatios(withoutKeyResult.value.warmUsage, withKeyResult.value.warmUsage);
  return succeed({
    withoutKey: withoutKeyResult.value,
    withKey: withKeyResult.value,
    verdict: comparison.verdict,
    withoutKeyWarmRatio: comparison.baselineRatio,
    withKeyWarmRatio: comparison.candidateRatio
  });
}

/**
 * Formats the A/B's closing verdict line(s), matching the original harness's console output.
 * @internal
 */
export function formatRoutingAbVerdict(result: IPromptCacheRoutingAbResult): string {
  const a = formatCacheRatioPercent(result.withoutKeyWarmRatio);
  const b = formatCacheRatioPercent(result.withKeyWarmRatio);
  switch (result.verdict) {
    case 'confirms':
      return (
        `arm 1 warm ${a} -> arm 2 warm ${b}\n` +
        'CONFIRMS the prediction: the routing key materially improves the hit rate.'
      );
    case 'misses':
      return (
        `arm 1 warm ${a} -> arm 2 warm ${b}\n` +
        'MISSES the prediction: arm 2 did not jump. The routing key is not buying what this ' +
        'change claims — revise the change or the claim, do not re-run for a better number. ' +
        '(Re-run once with a fresh SALT first, to rule out a TTL-tainted reading.)'
      );
    case 'ambiguous':
      return (
        `arm 1 warm ${a} -> arm 2 warm ${b}\n` +
        'AMBIGUOUS: arm 1 may have hit by routing luck. Re-run with a fresh SALT.'
      );
    case 'inconclusive':
      return 'inconclusive: cache-hit ratio not computable for at least one arm.';
  }
}
