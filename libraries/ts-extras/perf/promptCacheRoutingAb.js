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
 * The prefix builder, the ratio arithmetic, and the CONFIRMS/MISSES/AMBIGUOUS verdict below all
 * live in `src/packlets/ai-assist/promptCacheRoutingAbHarness.ts`, unit-tested against fixture
 * usage blocks in `src/test/unit/ai-assist/promptCacheRoutingAbHarness.test.ts` — this file is a
 * thin wrapper that supplies the live network transport and prints the result.
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
const {
  describeRoutingAbUsage,
  formatRoutingAbVerdict,
  runPromptCacheRoutingAbHarness
} = require('../lib/packlets/ai-assist/promptCacheRoutingAbHarness');

const API_KEY = process.env.XAI_API_KEY;
if (!API_KEY) {
  console.error('XAI_API_KEY is required. See the file header for usage.');
  process.exit(1);
}
const SALT = process.env.SALT ?? 'run1';

async function main() {
  console.log(`=== xAI prompt-cache routing A/B (salt=${SALT}) ===`);
  console.log('Both arms vary only the final user turn. They differ only in the routing key.');

  const descriptor = AiAssist.getProviderDescriptor('xai-grok').orThrow();

  const result = await runPromptCacheRoutingAbHarness(
    { callCompletion: AiAssist.callProviderCompletion },
    { descriptor, apiKey: API_KEY, salt: SALT }
  );
  if (result.isFailure()) {
    console.error(result.message);
    process.exit(1);
  }

  const { value } = result;
  console.log(`\n--- ${value.withoutKey.label} ---`);
  console.log(`  cold: ${describeRoutingAbUsage(value.withoutKey.coldUsage)}`);
  console.log(`  warm: ${describeRoutingAbUsage(value.withoutKey.warmUsage)}`);
  console.log(`\n--- ${value.withKey.label} ---`);
  console.log(`  cold: ${describeRoutingAbUsage(value.withKey.coldUsage)}`);
  console.log(`  warm: ${describeRoutingAbUsage(value.withKey.warmUsage)}`);

  console.log('\n--- verdict ---');
  console.log(formatRoutingAbVerdict(value));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
