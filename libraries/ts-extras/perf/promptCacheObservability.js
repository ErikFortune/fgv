/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Standing assertion for C1 of `ai-assist-prompt-caching` (design.md §8).
 *
 * Deliberately NOT a jest test. It is a live-traffic measurement, not a behavior —
 * putting it in the suite would put CI's runtime and its green/red behind a network
 * call and a bill (see TESTING_GUIDELINES.md § "Measurement Harnesses"). It lives
 * here so it can be run on demand and its output pasted into the stream's
 * `result.md`.
 *
 *   XAI_API_KEY=... node perf/promptCacheObservability.js
 *
 * Requires a built `lib/` (`rushx build` first).
 *
 * The ratio arithmetic, the cold/warm comparison, and the prediction verdict below all live in
 * `src/packlets/ai-assist/promptCacheObservabilityHarness.ts`, unit-tested against fixture usage
 * blocks in `src/test/unit/ai-assist/promptCacheObservabilityHarness.test.ts` — this file is a
 * thin wrapper that supplies the live network transport and prints the result.
 *
 * ---------------------------------------------------------------------------
 * WHY xAI, NOT ANTHROPIC (corrected 2026-09-19 — the previous version of this note argued from a
 * premise C3 has since retired; see below for what changed):
 *
 * xAI (and Gemini, and OpenAI's default mode) cache automatically with no request-side opt-in —
 * confirmed live against xAI in this stream's design phase (design.md §12, OQ-1, the
 * `xai-cache-probe` testbed scenario). A repeat request against xAI is therefore a valid test of
 * whether C1's *reading* of the usage block is correct, on a provider whose cache needs no
 * cooperation from the request this harness sends.
 *
 * Anthropic's prompt cache, by contrast, is opt-in per content block via `cache_control`, and
 * this harness sends no cache directive of any kind — it calls `AiAssist.callProviderCompletion`
 * with a plain `system` string and no `cache` field. That is no longer because "C1 sends no cache
 * directive" (the reason this note originally gave): **C3 shipped and does emit `cache_control`
 * when a caller supplies `IAiCacheRequest.systemBreakpoints`** — this harness simply doesn't pass
 * one. So an Anthropic leg is possible now, in a way it structurally was not when this note was
 * first written; it would need `IAiCacheRequest.systemBreakpoints` set on the request. It has
 * never been run and is out of scope for this change — see design.md §8's addendum for what is
 * and is not claimed here.
 * ---------------------------------------------------------------------------
 *
 * THE PREDICTION, WRITTEN DOWN BEFORE THE FIRST RUN (per TESTING_GUIDELINES.md
 * § "State the prediction before running it"), calibrated to the live numbers
 * design.md §12 already recorded for this exact provider:
 *
 *   Two back-to-back requests share one large, byte-identical system-prompt
 *   prefix and differ only in their final user turn.
 *
 *   - `usage.reports` should be `'reads'` on both calls — xAI never reports
 *     cache writes on either of its routes (design.md §12, OQ-1).
 *   - The FIRST (cold) call may still show a small nonzero
 *     `usage.cachedInputTokens` — design.md §12 recorded a **128-token floor**
 *     on a genuinely cold call against a prefix xAI had never seen, most
 *     plausibly fixed chat-template scaffolding. A nonzero cold figure is
 *     therefore NOT itself evidence of a bug; judge by the ratio, not the raw
 *     count (design.md §9's explicit warning).
 *   - The SECOND (warm) call should show `usage.cachedInputTokens` at
 *     roughly **99%** of `usage.uncachedInputTokens + usage.cachedInputTokens`
 *     for that call — design.md §12 measured 99.5% (Chat Completions) and
 *     99.2% (Responses) on the same prefix-caching mechanism this harness
 *     exercises.
 *
 *   A miss (cold and warm ratios roughly equal, or `reports` not `'reads'`)
 *   means the C1 normalization is not doing what the design claims — the
 *   response is to revise the design or the code, not to lower a threshold
 *   until this harness goes green.
 * ---------------------------------------------------------------------------
 */

/* eslint-disable no-console */

const { AiAssist } = require('../lib/index');
const {
  describeObservabilityUsage,
  runPromptCacheObservabilityHarness
} = require('../lib/packlets/ai-assist/promptCacheObservabilityHarness');

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error('XAI_API_KEY is required. See the file header for usage.');
  process.exit(1);
}

async function main() {
  const descriptor = AiAssist.getProviderDescriptor('xai-grok').orThrow();

  const result = await runPromptCacheObservabilityHarness(
    { callCompletion: AiAssist.callProviderCompletion },
    descriptor,
    API_KEY
  );
  if (result.isFailure()) {
    console.error(result.message);
    process.exit(1);
  }

  const { value } = result;
  console.log(describeObservabilityUsage('cold call ', value.cold));
  console.log(describeObservabilityUsage('warm call ', value.warm));
  console.log(`\nverdict: ${value.verdict.toUpperCase()} — ${value.detail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
