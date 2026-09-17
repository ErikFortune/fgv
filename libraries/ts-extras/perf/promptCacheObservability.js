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
 *   ANTHROPIC_API_KEY=... node --experimental-vm-modules perf/promptCacheObservability.js
 *
 * Requires a built `lib/` (`rushx build` first).
 *
 * ---------------------------------------------------------------------------
 * THE PREDICTION, WRITTEN DOWN BEFORE THE FIRST RUN (per TESTING_GUIDELINES.md
 * § "State the prediction before running it"):
 *
 *   Two back-to-back requests share one large, byte-identical system-prompt
 *   prefix (a synthetic block well above Claude Sonnet 5's verified 1024-token
 *   minimum, per design.md §7) and differ only in their final user turn.
 *
 *   - The FIRST request should show `usage.cachedInputTokens` absent-or-small
 *     (nothing to read from yet) and `usage.cacheWriteTokens` roughly equal to
 *     the stable prefix's token count (the write that seeds the cache).
 *   - The SECOND request, made immediately after, should show
 *     `usage.cachedInputTokens` approximately equal to that same stable-prefix
 *     token count, and `usage.uncachedInputTokens` should fall by roughly that
 *     same amount relative to the first request.
 *   - `usage.reports` should be `'reads-and-writes'` on both calls (Anthropic
 *     Messages, per design.md §8's table).
 *
 *   A miss means the C1 normalization (or the cache itself) is not doing what
 *   the design claims — the response is to revise the design, not to lower a
 *   threshold until this harness goes green.
 * ---------------------------------------------------------------------------
 */

/* eslint-disable no-console */

const { AiAssist } = require('../lib/index');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is required. See the file header for usage.');
  process.exit(1);
}

// A stable block well above the 1024-token minimum for claude-sonnet-5 (design.md
// §7). Repetition, not padding: incompressible-enough that a provider genuinely
// has to see all of it, while staying cheap to generate.
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
  console.log(
    `${label}: reports=${usage.reports} uncached=${usage.uncachedInputTokens} cached=${usage.cachedInputTokens} ` +
      `written=${usage.cacheWriteTokens} output=${usage.outputTokens} total=${usage.totalInputTokens}`
  );
}

async function main() {
  const descriptor = AiAssist.getProviderDescriptor('anthropic').orThrow();
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

  const warmCached = second.value.usage?.cachedInputTokens;
  const coldUncached = first.value.usage?.uncachedInputTokens;
  const warmUncached = second.value.usage?.uncachedInputTokens;
  if (warmCached !== undefined && coldUncached !== undefined && warmUncached !== undefined) {
    const drop = coldUncached - warmUncached;
    console.log(
      `\nwarm cachedInputTokens=${warmCached} vs. uncached-token drop=${drop} ` +
        `(ratio ${(warmCached / Math.max(1, coldUncached)).toFixed(3)} of the cold call's uncached total)`
    );
  } else {
    console.log(
      '\nOne or more usage fields were absent — see the raw blocks above; prediction not evaluable.'
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
