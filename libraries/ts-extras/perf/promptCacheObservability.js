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
 * ---------------------------------------------------------------------------
 * WHY xAI, NOT ANTHROPIC (corrected after a Copilot review-loop finding on
 * PR #668 — the first version of this harness targeted Anthropic and would
 * have failed for a reason that has nothing to do with C1):
 *
 * Anthropic's prompt cache is opt-in per content block via `cache_control` —
 * there is no automatic/implicit path. C1 sends no cache directive of any
 * kind (that is C3's job; see design.md §2's slice table — "C1: reads fields
 * off responses we already receive"). A plain `system` string through the
 * current Anthropic adapter therefore CANNOT produce a cache hit on a second
 * call, no matter how stable the prefix is — the harness would report a false
 * miss that validates nothing about this slice's normalization.
 *
 * xAI (and Gemini, and OpenAI's default mode) cache automatically with no
 * request-side opt-in — confirmed live against xAI in this same stream's
 * design phase (design.md §12, OQ-1, the `xai-cache-probe` testbed scenario).
 * A repeat request against xAI is therefore a valid test of whether C1's
 * *reading* of the usage block is correct, independent of anything C3 will
 * add later.
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

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error('XAI_API_KEY is required. See the file header for usage.');
  process.exit(1);
}

// A stable block, large enough that a genuine cache hit is unmistakable against the
// design's recorded 128-token cold floor. Repetition, not padding: incompressible
// enough that a provider genuinely has to see all of it.
function stablePrefix() {
  const lines = [];
  for (let i = 0; i < 400; i++) {
    lines.push(
      `Directive ${i}: when asked about topic ${i}, respond precisely and cite source ${i}-${i * 7}.`
    );
  }
  return `You are a careful assistant operating under the following fixed policy document.\n\n${lines.join(
    '\n'
  )}`;
}

function summarizeUsage(label, usage) {
  if (usage === undefined) {
    console.log(`${label}: usage absent from response`);
    return;
  }
  const total =
    usage.uncachedInputTokens !== undefined && usage.cachedInputTokens !== undefined
      ? usage.uncachedInputTokens + usage.cachedInputTokens
      : undefined;
  const ratio =
    total !== undefined && usage.cachedInputTokens !== undefined
      ? `${((100 * usage.cachedInputTokens) / total).toFixed(1)}%`
      : 'n/a';
  console.log(
    `${label}: reports=${usage.reports} uncached=${usage.uncachedInputTokens} cached=${usage.cachedInputTokens} ` +
      `(${ratio} of input) written=${usage.cacheWriteTokens} output=${usage.outputTokens}`
  );
}

async function main() {
  const descriptor = AiAssist.getProviderDescriptor('xai-grok').orThrow();
  const system = stablePrefix();

  const first = await AiAssist.callProviderCompletion({
    descriptor,
    apiKey: API_KEY,
    system,
    messages: [{ role: 'user', content: 'In one sentence, what is directive 12 about?' }]
  });
  if (first.isFailure()) {
    console.error(`First call failed: ${first.message}`);
    process.exit(1);
  }
  summarizeUsage('cold call ', first.value.usage);

  const second = await AiAssist.callProviderCompletion({
    descriptor,
    apiKey: API_KEY,
    system,
    messages: [{ role: 'user', content: 'In one sentence, what is directive 99 about?' }]
  });
  if (second.isFailure()) {
    console.error(`Second call failed: ${second.message}`);
    process.exit(1);
  }
  summarizeUsage('warm call ', second.value.usage);

  console.log(
    `\nprediction check: reports should read 'reads' on both calls, and the warm call's cache ` +
      `ratio should sit near 99% — well above the cold call's (the design's recorded 128-token floor).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
