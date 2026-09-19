/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * A/B for the xAI prompt-cache ROUTING key (IAiCacheRequest.cacheKey).
 *
 * Sibling to promptCacheObservability.js, which measures whether C1 *reads* the usage block
 * correctly. This one measures whether the routing key actually *buys* anything — the claim
 * this branch ships and the one thing its request-shape tests cannot check.
 *
 *   XAI_API_KEY=... node perf/promptCacheRoutingAb.js
 *   SALT=run2 XAI_API_KEY=... node perf/promptCacheRoutingAb.js    # see "second trap" below
 *
 * Requires a built lib/ (`rushx build` first). Deliberately NOT a jest test: live traffic and a
 * bill do not belong behind CI's green (TESTING_GUIDELINES.md § Measurement Harnesses).
 *
 * ---------------------------------------------------------------------------
 * WHAT IT COMPARES
 *
 * Both arms send the same large system prefix twice and vary only the final user turn — which
 * is what a real caller does, and what the plain observability harness showed returns ~2%
 * cached. The arms differ in exactly one thing: whether a stable `cache.cacheKey` is supplied.
 *
 * xAI matches byte-for-byte from the start of the messages array, but its cache is PER-SERVER
 * and evictable, so two requests sharing a prefix can still miss when routed to different
 * boxes. The key (x-grok-conv-id on Chat Completions) pins them together.
 *
 * ---------------------------------------------------------------------------
 * THE PREDICTION, WRITTEN DOWN BEFORE THE FIRST RUN
 * (TESTING_GUIDELINES.md § "State the prediction before running it")
 *
 *   - arm 1 (no key)  — warm stays near the ~2% floor, matching the observability harness's
 *     measured 192-of-8876 on this exact shape.
 *   - arm 2 (key)     — warm jumps toward ~99%, matching what the OQ-1 probe gets from
 *     byte-identical requests.
 *
 * A miss means the routing key does not do what this branch claims. The response is to revise
 * the change or the claim — NOT to re-run until a favourable number appears.
 *
 * ---------------------------------------------------------------------------
 * TWO TRAPS THAT MAKE A SINGLE RUN MISLEADING
 *
 * 1. A hit in arm 1 is NOT a refutation. Without a routing key you can still land on the same
 *    server by luck — that non-determinism is the whole reason the key exists. The meaningful
 *    negative result is arm 2 FAILING to jump, not arm 1 happening to succeed.
 *
 * 2. Re-running within the cache TTL taints the cold reading, because the "cold" call hits a
 *    prefix the previous run already warmed. Pass a fresh SALT (or wait out the TTL) — each arm
 *    already gets its own salted prefix so the arms cannot warm each other, which is the
 *    mistake the OQ-1 probe had to fix in its own first version.
 * ---------------------------------------------------------------------------
 */

/* eslint-disable no-console */

const { AiAssist } = require('../lib/index');

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error('XAI_API_KEY is required. See the file header for usage.');
  process.exit(1);
}
const SALT = process.env.SALT ?? 'run1';

function stablePrefix(arm) {
  const lines = [];
  for (let i = 0; i < 400; i++) {
    lines.push(
      `Directive ${SALT}-${arm}-${i}: when asked about topic ${i}, respond precisely and cite source ${i}-${
        i * 7
      }.`
    );
  }
  return `You are a careful assistant operating under the following fixed policy document.\n\n${lines.join(
    '\n'
  )}`;
}

function describeUsage(usage) {
  if (usage === undefined) {
    return 'usage absent from response';
  }
  const { cachedInputTokens: cached, uncachedInputTokens: uncached } = usage;
  if (cached === undefined || uncached === undefined) {
    return `reports=${usage.reports} cached=${cached} uncached=${uncached} (ratio not computable)`;
  }
  const total = cached + uncached;
  const pct = total > 0 ? ((100 * cached) / total).toFixed(1) : '0.0';
  return `reports=${usage.reports} cached=${cached} of ${total} input (${pct}%)`;
}

async function runArm(label, arm, cacheKey) {
  const descriptor = AiAssist.getProviderDescriptor('xai-grok').orThrow();
  const system = stablePrefix(arm);
  const call = (content) =>
    AiAssist.callProviderCompletion({
      descriptor,
      apiKey: API_KEY,
      system,
      messages: [{ role: 'user', content }],
      ...(cacheKey !== undefined ? { cache: { cacheKey } } : {})
    });

  console.log(`\n--- ${label} ---`);
  const cold = await call('In one sentence, what is directive 12 about?');
  if (cold.isFailure()) {
    console.error(`  cold call failed: ${cold.message}`);
    return undefined;
  }
  console.log(`  cold: ${describeUsage(cold.value.usage)}`);

  // Only the tail differs from the cold call — the prefix is byte-identical.
  const warm = await call('In one sentence, what is directive 99 about?');
  if (warm.isFailure()) {
    console.error(`  warm call failed: ${warm.message}`);
    return undefined;
  }
  console.log(`  warm: ${describeUsage(warm.value.usage)}`);
  return warm.value.usage;
}

async function main() {
  console.log(`=== xAI prompt-cache routing A/B (salt=${SALT}) ===`);
  console.log('Both arms vary only the final user turn. They differ only in the routing key.');

  const withoutKey = await runArm('arm 1: WITHOUT cacheKey (behaviour before this change)', 'a', undefined);
  const withKey = await runArm('arm 2: WITH cacheKey (this change)', 'b', `routing-ab-${SALT}`);

  console.log('\n--- verdict ---');
  if (withoutKey === undefined || withKey === undefined) {
    console.log('inconclusive: at least one arm failed; see errors above.');
    return;
  }
  const pct = (u) => {
    const total = (u.cachedInputTokens ?? 0) + (u.uncachedInputTokens ?? 0);
    return total > 0 ? (100 * (u.cachedInputTokens ?? 0)) / total : 0;
  };
  const a = pct(withoutKey);
  const b = pct(withKey);
  console.log(`arm 1 warm ${a.toFixed(1)}% -> arm 2 warm ${b.toFixed(1)}%`);
  if (b > 50 && b > a * 5) {
    console.log('CONFIRMS the prediction: the routing key materially improves the hit rate.');
  } else if (b <= 50) {
    console.log(
      'MISSES the prediction: arm 2 did not jump. The routing key is not buying what this ' +
        'change claims — revise the change or the claim, do not re-run for a better number. ' +
        '(Re-run once with a fresh SALT first, to rule out a TTL-tainted reading.)'
    );
  } else {
    console.log('AMBIGUOUS: arm 1 may have hit by routing luck. Re-run with a fresh SALT.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
