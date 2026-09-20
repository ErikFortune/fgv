/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * A/B for whether C3's Anthropic prompt-cache breakpoint emission (IAiCacheRequest.systemBreakpoints
 * -> `cache_control`) actually produces a cache hit against a live provider.
 *
 * Every prompt-cache measurement shipped by this stream so far (promptCacheObservability.js,
 * promptCacheRoutingAb.js) ran against xAI, whose caching is automatic — no directive is sent, so
 * neither harness exercises C3's emit path at all. Anthropic is the sharp case: its cache is
 * EXPLICIT OPT-IN PER CONTENT BLOCK. There is no automatic path, so a breakpoint is the only thing
 * that can produce a hit. If C3's Anthropic emission is wrong, nothing else in the repo would show
 * it — this is the first live exercise of that code path.
 *
 *   ANTHROPIC_API_KEY=... node perf/promptCacheAnthropicBreakpoint.js
 *   SALT=run2 ANTHROPIC_API_KEY=... node perf/promptCacheAnthropicBreakpoint.js   # see "traps" below
 *
 * Requires a built lib/ (`rushx build` first). Deliberately NOT a jest test: live traffic and a
 * bill do not belong behind CI's green (TESTING_GUIDELINES.md § Measurement Harnesses).
 *
 * The prefix builder, the ratio arithmetic, and the CONFIRMS/MISSES/AMBIGUOUS/inconclusive verdict
 * below all live in `src/packlets/ai-assist/promptCacheAnthropicBreakpointHarness.ts`, reusing
 * `promptCacheUsageMath.ts`'s shared comparison rather than re-deriving it, and unit-tested against
 * fixture usage blocks in `src/test/unit/ai-assist/promptCacheAnthropicBreakpointHarness.test.ts` —
 * this file is a thin wrapper that supplies the live network transport and prints the result.
 *
 * ---------------------------------------------------------------------------
 * TARGET MODEL AND FIXTURE SIZING
 *
 * Target: `claude-sonnet-5` — this provider's default `'base'` tier (registry.ts), the same tier
 * this stream's other harnesses default to. design.md §7's verified-minimum table gives Sonnet-class
 * models (including claude-sonnet-5) a 1,024-token minimum cacheable prefix. Anthropic's minimum is
 * non-monotonic across the model family (Haiku-class models need 4,096), so this harness's fixture
 * is sized well above BOTH floors rather than just the one this model needs: the 400-line generator
 * this file shares with promptCacheObservability.js / promptCacheRoutingAb.js measured ~8,700 tokens
 * for a comparable prefix earlier in this stream. A fixture below the minimum would produce a real
 * miss that means nothing about C3 — this one is not close to that line.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT COMPARES
 *
 * Both arms send the same large system prefix twice (cold, then warm) and vary only the final user
 * turn — what a real caller does. The arms differ in exactly one thing: whether `cache.systemBreakpoints`
 * is supplied, marking almost the entire prefix as a single cacheable block.
 *
 *   - arm 1 (WITHOUT systemBreakpoints) — the negative control. Anthropic caching is opt-in per
 *     block; with no `cache_control` sent, nothing should be written or read, on either call.
 *   - arm 2 (WITH systemBreakpoints)    — the cold call should show a cache WRITE
 *     (`cacheWriteTokens` > 0, `cachedInputTokens` ~ 0); the warm call should show a cache READ
 *     (`cachedInputTokens` clearing roughly the size of the cached prefix).
 *
 * `usage.reports` should be `'reads-and-writes'` on every call here — unlike xAI, which this
 * stream's other harnesses measured as `'reads'`-only on both of its routes. Anthropic's normalizer
 * (`normalizeAnthropicUsage`) reports both fields unconditionally.
 *
 * ---------------------------------------------------------------------------
 * THE PREDICTION, WRITTEN DOWN BEFORE THE FIRST RUN
 * (TESTING_GUIDELINES.md § "State the prediction before running it")
 *
 *   - arm 1 cold and warm — `cachedInputTokens` and `cacheWriteTokens` both absent or 0 on both
 *     calls. No directive was sent, so nothing should be written or read.
 *   - arm 2 cold          — `cacheWriteTokens` > 0 (writing the ~8,700-token prefix into the
 *     cache), `cachedInputTokens` near 0 (nothing to read yet on a first-ever write).
 *   - arm 2 warm           — `cachedInputTokens` clears roughly the prefix size — high, not a small
 *     fixed floor the way xAI's automatic cache showed a ~192-token floor even on a cold call in
 *     this stream's earlier runs. Anthropic's cache is explicit, so there is no equivalent
 *     scaffolding-cost floor predicted here.
 *
 * A miss means C3's Anthropic emission is wrong, or this design's model of Anthropic caching is
 * wrong. The response is to revise the design or the code — NOT to lower a threshold or re-run
 * until a favourable number appears.
 *
 * ---------------------------------------------------------------------------
 * TRAPS THAT MAKE A SINGLE RUN MISLEADING (carried over from promptCacheRoutingAb.js, and still
 * live even though Anthropic's cache mechanism differs from xAI's per-server routing)
 *
 * 1. Re-running within the cache TTL taints the cold reading, because the "cold" call would hit a
 *    prefix a previous run already wrote. Pass a fresh SALT (or wait out the TTL, ~5 minutes on
 *    Anthropic's default ephemeral cache) — each run's prefix is salted so re-runs cannot warm a
 *    prior run's cache, and the two arms are independently salted so they cannot warm each other.
 *
 * 2. A failed call must not print a ratio. If either arm's cold or warm call fails outright, the
 *    verdict reports 'inconclusive' rather than fabricating a 0% or 100% from missing data — see
 *    `runPromptCacheAnthropicBreakpointHarness`'s propagated failures and
 *    `compareCacheHitRatios`'s `undefined` handling in `promptCacheUsageMath.ts`.
 * ---------------------------------------------------------------------------
 */

/* eslint-disable no-console */

const { AiAssist } = require('../lib/index');
const {
  describeAnthropicBreakpointUsage,
  formatAnthropicBreakpointVerdict,
  runPromptCacheAnthropicBreakpointHarness
} = require('../lib/packlets/ai-assist/promptCacheAnthropicBreakpointHarness');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is required. See the file header for usage.');
  process.exit(1);
}
const SALT = process.env.SALT ?? 'run1';

async function main() {
  console.log(`=== Anthropic prompt-cache breakpoint A/B (salt=${SALT}) ===`);
  console.log('Both arms vary only the final user turn. They differ only in cache.systemBreakpoints.');

  const descriptor = AiAssist.getProviderDescriptor('anthropic').orThrow();

  const result = await runPromptCacheAnthropicBreakpointHarness(
    { callCompletion: AiAssist.callProviderCompletion },
    { descriptor, apiKey: API_KEY, salt: SALT }
  );
  if (result.isFailure()) {
    console.error(result.message);
    process.exit(1);
  }

  const { value } = result;
  console.log(`\n--- ${value.withoutBreakpoint.label} ---`);
  console.log(describeAnthropicBreakpointUsage('  cold', value.withoutBreakpoint.coldUsage));
  console.log(describeAnthropicBreakpointUsage('  warm', value.withoutBreakpoint.warmUsage));
  console.log(`\n--- ${value.withBreakpoint.label} ---`);
  console.log(describeAnthropicBreakpointUsage('  cold', value.withBreakpoint.coldUsage));
  console.log(describeAnthropicBreakpointUsage('  warm', value.withBreakpoint.warmUsage));

  console.log('\n--- verdict ---');
  console.log(formatAnthropicBreakpointVerdict(value));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
