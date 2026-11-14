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
 * Pure logic and injectable transport for `perf/promptCacheAnthropicBreakpoint.js` — the first
 * measurement of whether C3's Anthropic `cache_control` emission (`IAiCacheRequest.systemBreakpoints`)
 * actually produces a cache hit against a live provider.
 *
 * @remarks
 * Every prompt-cache measurement shipped by this stream so far (`promptCacheObservability.js`,
 * `promptCacheRoutingAb.js`) ran against xAI, whose caching is automatic — no request-side
 * directive is sent, so neither harness exercises C3's emit path at all. Anthropic's cache is the
 * sharp case: it is opt-in **per content block** via `cache_control`, with no automatic path, so a
 * breakpoint is the only thing that can produce a hit. This harness is an A/B rather than a single
 * standing assertion (unlike `promptCacheObservabilityHarness.ts`) precisely because Anthropic has
 * no automatic caching to fall back on: without a negative control that reliably shows no hit, a
 * hit in the positive arm could not be attributed to `systemBreakpoints` at all.
 *
 * Reuses {@link compareCacheHitRatios} / {@link computeCacheUsageRatio} /
 * {@link formatCacheRatioPercent} from `promptCacheUsageMath.ts` rather than re-deriving the
 * ratio/verdict arithmetic — see {@link withAnthropicZeroDefaults} for the one Anthropic-specific
 * wrinkle those shared functions need help with. Also reuses
 * {@link describeObservabilityUsage} from `promptCacheObservabilityHarness.ts` to print reads and
 * writes separately, rather than writing a third formatter for the same shape.
 * @packageDocumentation
 */

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { type IAiCacheRequest } from './cacheRequest';
import { type IProviderCompletionParams } from './completionClient';
import { type IAiCompletionResponse, type IAiProviderDescriptor } from './model';
import { describeObservabilityUsage } from './promptCacheObservabilityHarness';
import {
  type CacheHitComparisonVerdict,
  compareCacheHitRatios,
  formatCacheRatioPercent
} from './promptCacheUsageMath';
import { type IAiCompletionUsage } from './usageTypes';

/** Injected transport — only the network call needs a live key. @internal */
export interface IPromptCacheAnthropicBreakpointDeps {
  readonly callCompletion: (params: IProviderCompletionParams) => Promise<Result<IAiCompletionResponse>>;
}

/**
 * Builds one arm's stable system prefix. Same shape as `buildObservabilityStablePrefix` /
 * `buildRoutingAbPrefix` (~8,700 tokens measured for this exact 400-line generator against a
 * comparable provider in this stream's earlier runs) — comfortably above every
 * `minCacheablePrefixTokens` entry design.md §7 lists for Anthropic, including Haiku-class models'
 * 4,096-token floor, not just the 1,024-token floor this harness's target model (`claude-sonnet-5`,
 * the `'base'` tier this stream's other harnesses also default to) actually needs. `salt` and `arm`
 * both feed the text so the two arms — and two separate runs — never warm each other's cache.
 * @internal
 */
export function buildAnthropicBreakpointPrefix(salt: string, arm: string): string {
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
 * Fills Anthropic's cache-usage fields with their design-mandated zero default when the wire
 * response omits them, before feeding a usage block to {@link compareCacheHitRatios}.
 *
 * @remarks
 * `normalizeAnthropicUsage` always reports `reports: 'reads-and-writes'` for this provider, and
 * design.md §8 states the semantics that follow from it explicitly: *"Under `'reads-and-writes'`,
 * an absent `cacheWriteTokens` genuinely means zero were written."* The same reasoning covers
 * `cachedInputTokens` and `uncachedInputTokens`. So for an Anthropic usage block specifically, an
 * absent field is a **known** zero, not an unknown value — applying the default here does not
 * violate design.md's R-c ("unknown is reported as unknown, never defaulted to a number"); it is
 * what R-c's own `reports` discriminator exists to allow. This is deliberately narrower than
 * {@link computeCacheUsageRatio}, which stays provider-agnostic (a `'reads'`-only provider's
 * absent field genuinely is ambiguous, per design.md §8's own OQ-1 discussion) — the default is
 * applied here, once, rather than widening the shared function's semantics for every caller.
 *
 * Display (`describeObservabilityUsage`) is untouched by this and keeps printing the raw wire
 * value, so a reader can still see whether a field was actually reported or defaulted.
 * @internal
 */
export function withAnthropicZeroDefaults(
  usage: IAiCompletionUsage | undefined
): IAiCompletionUsage | undefined {
  if (usage === undefined || usage.reports !== 'reads-and-writes') {
    return usage;
  }
  return {
    ...usage,
    cachedInputTokens: usage.cachedInputTokens ?? 0,
    uncachedInputTokens: usage.uncachedInputTokens ?? 0,
    cacheWriteTokens: usage.cacheWriteTokens ?? 0
  };
}

/** One arm's cold-then-warm outcome. @internal */
export interface IPromptCacheAnthropicBreakpointArmResult {
  readonly label: string;
  readonly coldUsage: IAiCompletionUsage | undefined;
  readonly warmUsage: IAiCompletionUsage | undefined;
}

/**
 * Runs one arm: a cold call, then a warm call sharing the same
 * {@link buildAnthropicBreakpointPrefix} system prompt and differing only in the final user turn —
 * optionally supplying `cache.systemBreakpoints`. A single breakpoint is placed one character short
 * of the end of `system`, marking essentially the whole fixed prefix as cacheable (design.md §6.1:
 * offsets must be strictly `< system.length`).
 * @internal
 */
export async function runPromptCacheAnthropicBreakpointArm(
  deps: IPromptCacheAnthropicBreakpointDeps,
  params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly apiKey: string;
    readonly label: string;
    readonly salt: string;
    readonly arm: string;
    readonly withBreakpoint: boolean;
  }
): Promise<Result<IPromptCacheAnthropicBreakpointArmResult>> {
  const { descriptor, apiKey, label, salt, arm, withBreakpoint } = params;
  const system = buildAnthropicBreakpointPrefix(salt, arm);
  const cache: IAiCacheRequest | undefined = withBreakpoint
    ? { systemBreakpoints: [system.length - 1] }
    : undefined;
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

  // Only the tail differs from the cold call — the system prefix is byte-identical.
  const warm = await call('In one sentence, what is directive 99 about?');
  if (warm.isFailure()) {
    return fail(`${label}: warm call failed: ${warm.message}`);
  }

  return succeed({ label, coldUsage: cold.value.usage, warmUsage: warm.value.usage });
}

/** The full A/B: both arms' results and the breakpoint verdict. @internal */
export interface IPromptCacheAnthropicBreakpointResult {
  readonly withoutBreakpoint: IPromptCacheAnthropicBreakpointArmResult;
  readonly withBreakpoint: IPromptCacheAnthropicBreakpointArmResult;
  /** Baseline = `withoutBreakpoint`'s warm call; candidate = `withBreakpoint`'s warm call. */
  readonly verdict: CacheHitComparisonVerdict;
  readonly withoutBreakpointWarmRatio: number | undefined;
  readonly withBreakpointWarmRatio: number | undefined;
}

/**
 * Runs both arms of the Anthropic breakpoint A/B and classifies the result.
 *
 * @remarks
 * Both warm usages are passed through {@link withAnthropicZeroDefaults} before comparison, so the
 * negative control (`withoutBreakpoint`) is correctly read as "no cache activity" even if
 * Anthropic's wire response omits the cache fields entirely on a request that sends no
 * `cache_control` — the expected shape for that arm — rather than being scored `'inconclusive'`
 * by {@link compareCacheHitRatios}'s provider-agnostic "absent field = unknown" default.
 * @internal
 */
export async function runPromptCacheAnthropicBreakpointHarness(
  deps: IPromptCacheAnthropicBreakpointDeps,
  params: {
    readonly descriptor: IAiProviderDescriptor;
    readonly apiKey: string;
    readonly salt: string;
  }
): Promise<Result<IPromptCacheAnthropicBreakpointResult>> {
  const { descriptor, apiKey, salt } = params;

  const withoutBreakpointResult = await runPromptCacheAnthropicBreakpointArm(deps, {
    descriptor,
    apiKey,
    label: 'arm 1: WITHOUT systemBreakpoints (negative control)',
    salt,
    arm: 'a',
    withBreakpoint: false
  });
  if (withoutBreakpointResult.isFailure()) {
    return fail(withoutBreakpointResult.message);
  }

  const withBreakpointResult = await runPromptCacheAnthropicBreakpointArm(deps, {
    descriptor,
    apiKey,
    label: 'arm 2: WITH systemBreakpoints (C3 emission under test)',
    salt,
    arm: 'b',
    withBreakpoint: true
  });
  if (withBreakpointResult.isFailure()) {
    return fail(withBreakpointResult.message);
  }

  const comparison = compareCacheHitRatios(
    withAnthropicZeroDefaults(withoutBreakpointResult.value.warmUsage),
    withAnthropicZeroDefaults(withBreakpointResult.value.warmUsage)
  );
  return succeed({
    withoutBreakpoint: withoutBreakpointResult.value,
    withBreakpoint: withBreakpointResult.value,
    verdict: comparison.verdict,
    withoutBreakpointWarmRatio: comparison.baselineRatio,
    withBreakpointWarmRatio: comparison.candidateRatio
  });
}

/**
 * One line per call, reusing `describeObservabilityUsage` so reads and writes are printed
 * separately (`uncached=… cached=… written=…`) rather than collapsed into a single ratio, per
 * this measurement's requirement to report Anthropic's `reads-and-writes` fields individually.
 * @internal
 */
export function describeAnthropicBreakpointUsage(
  label: string,
  usage: IAiCompletionUsage | undefined
): string {
  return describeObservabilityUsage(label, usage);
}

/**
 * Formats the A/B's closing verdict line(s).
 * @internal
 */
export function formatAnthropicBreakpointVerdict(result: IPromptCacheAnthropicBreakpointResult): string {
  const a = formatCacheRatioPercent(result.withoutBreakpointWarmRatio);
  const b = formatCacheRatioPercent(result.withBreakpointWarmRatio);
  switch (result.verdict) {
    case 'confirms':
      return (
        `arm 1 (no breakpoints) warm ${a} -> arm 2 (systemBreakpoints) warm ${b}\n` +
        'CONFIRMS the prediction: Anthropic cache_control breakpoints produce a cache hit that an ' +
        'otherwise-identical request with no cache directive does not.'
      );
    case 'misses':
      return (
        `arm 1 (no breakpoints) warm ${a} -> arm 2 (systemBreakpoints) warm ${b}\n` +
        "MISSES the prediction: arm 2 did not clear the floor. Either C3's Anthropic cache_control " +
        "emission is wrong, or this harness's model/threshold assumptions are — revise the design " +
        'or the code, do not re-run for a better number. (Re-run once with a fresh SALT first, to ' +
        'rule out a TTL-tainted reading.)'
      );
    case 'ambiguous':
      return (
        `arm 1 (no breakpoints) warm ${a} -> arm 2 (systemBreakpoints) warm ${b}\n` +
        'AMBIGUOUS: neither arm clearly separates. Re-run with a fresh SALT.'
      );
    case 'inconclusive':
      return 'inconclusive: cache-hit ratio not computable for at least one arm — a call may have failed.';
  }
}
