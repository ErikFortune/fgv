# Result — testbed-model-probes

**Shipped:** the model-tier canaries now probe live the thinking-off, temperature and max-output
behaviours that #765 and #767 inferred from provider docs. Every new row states its expected outcome,
and the rows expected to be refused locally are shown to send nothing.

Package: `@fgv/testbed` (`samples/testbed`, private). `@fgv/ts-extras` is untouched: no defect was
found. No change file is needed (`rush change --verify` reports none).

## 1. What changed

**Canary (`src/scenarios/modelTiers/canary.ts`).**
- Three new outcomes. Each passes when the probe expected it: `refused-locally` (ai-assist refused the
  request before building it), `expected-reject` (the provider returned the 400 the probe expected),
  and `no-recorded-limit` (a max-output probe on a model with no `maxOutputTokens` entry: no call).
  Report tags are `[REFUSED-LOCALLY]`, `[EXPECTED-REJECT]` and `[NO-RECORDED-LIMIT]`.
- Thinking and strict-none probes now run on extra models (`modelOverride`) as well as on tiers.
- New `temperatureProbes` (each with a stated `expect`, optional `effort`, optional `models` filter)
  and `maxOutputProbe` (`maxTokens = AiAssist.resolveMaxOutputTokens(descriptor, modelOverride, tier)`).
- `classifyExpectedProbe` and `isLocalRefusal` classify a row against its stated expectation.
  `classifyMaxOutputProbe` turns a refusal that names the token cap into `FAIL(param)`, with the
  recorded limit in the detail.
- Strict-none rows moved onto the new tags (state.md D3).
- Keyless rows carry `(expect …)` details.
- A temperature probe that names a model no target resolves to is a `FAIL` row, so an alias
  rotation cannot silently drop a probe.

**Scenarios (`src/scenarios/modelTiers/index.ts`).**
- `buildCanaryCompletionParams` is new: a pure, exported, tested builder of the exact
  `callProviderCompletion` params. The live seam is now one chained call, and its `c8 ignore` is
  gone: the keyed stubbed-`fetch` runs cover it (review round 1, state.md A4). No `c8 ignore` was
  added.
- `rawNoneBlock` replaces the `RAW_NONE_BLOCKS` map and adds Anthropic:
  `{ provider: 'other', models: [concrete], config: { thinking: { type: 'disabled' } } }` (state.md
  D1).
- Anthropic opts into `thinkingEfforts: ['none','low']`, `strictNoneProbe`, temperature probes and
  max output. OpenAI opts into temperature probes and max output. Gemini opts into max output.
  Descriptions and TSDoc are updated.

**Elsewhere.** The `anthropicClientTools` comment now says that `'low'` is sent as adaptive thinking
with `output_config.effort: 'low'` on the Claude 5 family. Only older models convert it to a budget.
`samples/testbed/README.md` has a new *Model-tier canaries* section.

## 2. How refused-locally is proven

1. **Classification.** A row is `refused-locally` only when the failure matches one of ai-assist's
   pre-wire refusals (`thinking effort 'none' is not supported by`, `does not accept (a non-default)
   temperature`, `thinking mode is not compatible with temperature`) **and** carries no
   `returned <status>`. All provider failures from the HTTP layer carry one.
2. **No network call, through the real library** (`modelTiersRequests.test.ts`). `globalThis.fetch`
   is replaced by a recording mock. The exact params `buildCanaryCompletionParams` produces for six
   refused-locally cases go through the real `AiAssist.callProviderCompletion`: Anthropic
   temp 0.3 on sonnet and haiku, `none+fail` on opus and fable, and OpenAI temp 0.3 on sol and astra.
   The test asserts **zero** recorded requests.
3. **End to end.** The real `anthropic-model-tiers` and `openai-model-tiers` scenarios run keyed with
   a dummy key against fake providers that apply the documented rejections. Every new row lands on
   its expected tag and the verdict is `LIVE-VERIFIED`. The recorded wire shows:
   - no body ever carries `temperature: 0.3`;
   - exactly 10 Anthropic bodies carry `temperature: 1`;
   - haiku's two `'none'` requests send `thinking: {type: 'disabled'}`;
   - sonnet `'none'` goes out as `thinking: {type: 'adaptive'}` with `output_config: {effort: 'low'}`;
   - 5 Anthropic bodies carry `max_tokens: 128000` and 3 OpenAI bodies carry
     `max_completion_tokens: 128000`;
   - only the two `gpt-6-luna` rows carry a temperature;
   - and, after review round 1, a keyed Gemini run: all four Gemini targets send
     `generationConfig.maxOutputTokens: 65536`, the raw row on Pro is an expected reject, and the
     image seam answers.

## 3. Keyless runs

`node bin/testbed.js --scenario <id>` with no keys. Each exits 0 with the STOP-FLAG verdict. The new
rows only:

```
=== anthropic model-tier canary ===
Thinking probes (tier + effort):
  [PENDING] base effort=none             claude-sonnet-5-5  (expect degraded to 'low' (thinking-required))
  [PENDING] base effort=low              claude-sonnet-5-5
  [PENDING] advanced effort=none         claude-opus-5-5  (expect degraded to 'low' (thinking-required))
  [PENDING] advanced effort=low          claude-opus-5-5
  [PENDING] frontier effort=none         claude-opus-5-5  (expect degraded to 'low' (thinking-required))
  [PENDING] frontier effort=low          claude-opus-5-5
  [PENDING] @anthropic:fable effort=none claude-fable-5-1  (expect degraded to 'low' (thinking-required))
  [PENDING] @anthropic:fable effort=low  claude-fable-5-1
  [PENDING] @anthropic:haiku effort=none claude-haiku-5-5  (expect sent with thinking off)
  [PENDING] @anthropic:haiku effort=low  claude-haiku-5-5
Strict-none probes (effort none, onUnsupported 'fail'):
  [PENDING] base none+fail               claude-sonnet-5-5  (expect refused-locally)
  [PENDING] base none raw                claude-sonnet-5-5  (expect expected-reject)
  [PENDING] advanced none+fail           claude-opus-5-5  (expect refused-locally)
  [PENDING] advanced none raw            claude-opus-5-5  (expect expected-reject)
  [PENDING] frontier none+fail           claude-opus-5-5  (expect refused-locally)
  [PENDING] frontier none raw            claude-opus-5-5  (expect expected-reject)
  [PENDING] @anthropic:fable none+fail   claude-fable-5-1  (expect refused-locally)
  [PENDING] @anthropic:fable none raw    claude-fable-5-1  (expect expected-reject)
  [PENDING] @anthropic:haiku none+fail   claude-haiku-5-5  (expect accepted)
Temperature probes (each row states its expected outcome):
  [PENDING] base temp=1                  claude-sonnet-5-5  (expect accepted)
  … (advanced, frontier, @anthropic:fable, @anthropic:haiku likewise)
  [PENDING] base temp=1+effort=low       claude-sonnet-5-5  (expect accepted)
  … (likewise)
  [PENDING] base temp=0.3                claude-sonnet-5-5  (expect refused-locally)
  … (likewise, all five targets)
Max-output probes (maxTokens = recorded output limit):
  [PENDING] base max=128000              claude-sonnet-5-5  (expect accepted)
  [PENDING] advanced max=128000          claude-opus-5-5  (expect accepted)
  [PENDING] frontier max=128000          claude-opus-5-5  (expect accepted)
  [PENDING] @anthropic:fable max=128000  claude-fable-5-1  (expect accepted)
  [PENDING] @anthropic:haiku max=128000  claude-haiku-5-5  (expect accepted)
Verdict: RESOLVER-VERIFIED; LIVE CANARY PENDING (STOP-FLAG: set the provider API key to run the keyed gate)

=== openai model-tier canary ===
Temperature probes (each row states its expected outcome):
  [PENDING] base temp=0.3+effort=none    gpt-6-luna  (expect accepted)
  [PENDING] base temp=0.3                gpt-6-luna  (expect expected-reject)
  [PENDING] advanced temp=0.3            gpt-6.1-sol  (expect refused-locally)
  [PENDING] frontier temp=0.3            gpt-6-astra  (expect refused-locally)
Max-output probes (maxTokens = recorded output limit):
  [PENDING] base max=128000              gpt-6-luna  (expect accepted)
  [PENDING] advanced max=128000          gpt-6.1-sol  (expect accepted)
  [PENDING] frontier max=128000          gpt-6-astra  (expect accepted)
  (strict-none rows now read "(expect refused-locally)" / "(expect expected-reject)")
Verdict: RESOLVER-VERIFIED; LIVE CANARY PENDING (STOP-FLAG: …)

=== google-gemini model-tier canary ===
  [PENDING] @google-gemini:flash-lite effort=none gemini-3.5-flash-lite  (expect sent with thinking off)
  [PENDING] @google-gemini:flash-lite effort=low gemini-3.5-flash-lite
  [PENDING] @google-gemini:flash-lite none+fail gemini-3.5-flash-lite  (expect accepted)
Max-output probes (maxTokens = recorded output limit):
  [PENDING] base max=65536               gemini-3.8-flash  (expect accepted)
  [PENDING] advanced max=65536           gemini-3.1-pro-preview  (expect accepted)
  [PENDING] frontier max=65536           gemini-3.1-pro-preview  (expect accepted)
  [PENDING] @google-gemini:flash-lite max=65536 gemini-3.5-flash-lite  (expect accepted)
Verdict: RESOLVER-VERIFIED; LIVE CANARY PENDING (STOP-FLAG: …)
```

Full outputs: `keyless-anthropic.txt`, `keyless-openai.txt` and `keyless-google-gemini.txt` in the
log directory.

## 4. Run sheet

```bash
cd samples/testbed && rushx build
ANTHROPIC_API_KEY=… node bin/testbed.js --scenario anthropic-model-tiers
OPENAI_API_KEY=…    node bin/testbed.js --scenario openai-model-tiers
GEMINI_API_KEY=…    node bin/testbed.js --scenario google-gemini-model-tiers
```

**`REFUSED-LOCALLY` rows prove ai-assist's gate, not the provider.** Nothing is sent for them, so
they show the library still refuses the value; they say nothing about whether the provider would
still reject it. Only the `EXPECTED-REJECT` rows ask the provider.

An `EXPECTED-REJECT` row passes only when the provider's text matches the stated reason (thinking for
the raw rows, temperature for luna); the row prints the stated reason followed by the provider's own
text.

A clean run ends `Verdict: LIVE-VERIFIED`. If a row is access-gated, it ends `LIVE BLOCKED`. Any
`FAIL` row exits non-zero, and the report goes to stderr.

| scenario | row | expected | a deviation means |
|---|---|---|---|
| anthropic | `@anthropic:haiku effort=none` | `PASS (sent with thinking off)` | `FAIL(param)`: haiku-5-5 rejects `thinking: {type:'disabled'}`. Add it to `thinkingRequiredModelPrefixes` |
| anthropic | `base` / `advanced` / `frontier` / `@anthropic:fable effort=none` | `PASS (degraded to 'low')` | `FAIL(param)`: the adaptive `'low'` wire is rejected on that model |
| anthropic | `… effort=low` (all five) | `PASS` | `FAIL(param)`: the adaptive effort wire is wrong for that model |
| anthropic | `base` / `advanced` / `frontier` / `@anthropic:fable none+fail` | `REFUSED-LOCALLY (as listed)` | `FAIL … went through`: the model is no longer matched by `thinkingRequiredModelPrefixes` |
| anthropic | `… none raw` (same four) | `EXPECTED-REJECT (… as listed: <provider text>)` | `FAIL … the provider accepted none`: the model now accepts `disabled`. The listing is stale; drop it so `'none'` turns thinking off. `FAIL … not for the expected reason`: a 400 that does not mention thinking (a usage limit, say) — read the provider text |
| anthropic | `base none raw` (sonnet-5-5), provider text | expected to read like "To turn thinking off on this model, send "thinking": {"type": "between_tools"} instead…" | that wording means Sonnet 5.5 can turn up-front thinking off via `between_tools`. This is a pending ai-assist question, not a defect in this run |
| anthropic | `@anthropic:haiku none+fail` | `PASS` | `FAIL(param)`: as for haiku `effort=none` |
| anthropic | `… temp=1` (all five) | `PASS` | `FAIL(param)`: the default temperature is rejected too (the 2026-10-21 API-version rule now applies at the pinned version). Unset `samplingParamsAcceptedTemperature` |
| anthropic | `… temp=1+effort=low` (all five) | `PASS` | as above, or temperature + adaptive thinking conflict on that model |
| anthropic | `… temp=0.3` (all five) | `REFUSED-LOCALLY` | `FAIL … went through`: the model fell off `samplingParamsRejectedModelPrefixes` |
| anthropic | `… max=128000` (all five) | `PASS` | `FAIL(param) … recorded limit 128000 is too high`: lower that model's `maxOutputTokens`. The 10-minute non-streaming check is SDK-only and ai-assist uses raw `fetch`, so no streaming refusal is expected; a long generation timing out would show as a plain `FAIL` (state.md Q1, resolved) |
| openai | `base temp=0.3+effort=none` (gpt-6-luna) | `PASS` | `FAIL(param)`: luna rejects temperature even with effort `none`, so add it to `samplingParamsRejectedModelPrefixes` |
| openai | `base temp=0.3` (gpt-6-luna) | `EXPECTED-REJECT (<provider text naming temperature>)` | `FAIL … it answered`: #767 Q8 is wrong, and luna takes temperature at its default effort. `FAIL … not for the expected reason`: a 400 that does not mention temperature — read the provider text |
| openai | `advanced temp=0.3` / `frontier temp=0.3` | `REFUSED-LOCALLY` | `FAIL … went through`: sol or astra fell off `samplingParamsRejectedModelPrefixes` |
| openai | `… max=128000` (three tiers) | `PASS` | `FAIL(param) … too high`: lower that model's `maxOutputTokens` |
| gemini | `… max=65536` (three tiers + flash-lite) | `PASS` | `FAIL(param) … too high`: lower that model's `maxOutputTokens` |
| gemini | `@google-gemini:flash-lite effort=none` / `none+fail` | `PASS` | `FAIL(param)`: flash-lite rejects `thinkingBudget: 0`. List it as thinking-required |
| any | a `temp=…` row on an unexpected id with `the probe names a model no tier … resolves to` | none | an alias rotated. Update the probe's `models` in `modelTiers/index.ts` |

## 5. Gates

Logs are under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/probes/`.
Each gate is graded by grep: `not met|Operations failed|error TS|Jest tests? failed|FAILURE` must
match 0 times, and the only allowed `warning` is the tracked-symlink notice.

| gate | result | log |
|---|---|---|
| testbed build | pass, 0 warnings | `r2-build.log` |
| testbed lint | pass, 0 warnings | `r2-lint.log` |
| testbed test | 698/698, 100% coverage, 0 warnings (after review round 1) | `r2-test.log` |
| repo `rush rebuild` | pass, 0 failure lines, symlink notice only (re-run after review round 1) | `r2-rebuild.log` |
| repo `rush test` | pass, 39/39 projects, 0 failure lines, symlink notice only; no flake retries needed (re-run after review round 1) | `r2-test-all.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass, no change file needed | `change.log` |
| prettier 2.8.8 `--check` on the diff | pass | `prettier.log` |
| `verify-capability-docs` | pass, 0 failed | `capdocs.log` |
| `generate-capability-feed --check` | pass, 0 stale | `feed.log` |
