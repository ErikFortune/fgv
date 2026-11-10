# Result — live-run-corrections

**Shipped:** `gemini-3.8-flash` is no longer thinking-required, so a generic `'none'` on the Gemini
base tier sends `thinkingBudget: 0` again; and OpenAI's `gpt-6.1-sol` and `gpt-6-astra` accept
`temperature: 1` with or without an effort, while every other value is still refused before the wire.

Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, change file
`none`). Branch `live-run-corrections`, based on `origin/integration/asks` @ `e9fe435f9`. PR: #771.

## 1. What changed in `ai-assist`

| declaration | before | after |
|---|---|---|
| Gemini `thinkingRequiredModelPrefixes` | `gemini-3.1-pro-preview, gemini-2.5-pro, gemini-3.5-flash-lite, gemini-3.8-flash` | `gemini-3.8-flash` removed. The registry comment quotes the 2026-11-10 evidence (`promptTokenCount` 8, `candidatesTokenCount` 1, `totalTokenCount` 9, no `thoughtsTokenCount`), keeps the flash-lite `thinkingLevel` lift condition, and states the dash-bounded side effect: `gemini-3.8-flash-*` variants are no longer matched |
| OpenAI `samplingParamsAcceptedTemperature` | undefined (every temperature refused on sol/astra) | `1`, with the live evidence at the declaration |
| `IAiProviderDescriptor.samplingParamsAcceptedTemperature` TSDoc | — | says the value holds with or without thinking, is descriptor-wide, and that OpenAI's rejected list is exactly sol and astra, both of which accepted `1` live (resolves `final-model-fixes` Q1) |
| `callOpenAiResponsesStream` (internal) | dropped `temperature` beside any effort other than `'none'` | also keeps it when it equals the new trailing `temperatureAcceptedWithThinking` argument, passed from `temperatureAcceptedWithThinking(descriptor, model)` by `streamingClient.ts` and `clientToolContinuationBuilder.ts` — the same treatment the Anthropic adapter already had (state.md D1) |

No provider or model branch was added. `checkTemperatureConflict` already exempts
`temperatureAcceptedWithThinking`, which is read off the descriptor, so declaring `1` on OpenAI is what
lets `temperature: 1` beside an effort through on the completion and chat-streaming paths; the
Responses adapter was the one place that still dropped it. The refusal wording for `0.3` is now
Anthropic's, with no code change on the no-effort path: `checkSamplingParams` picks it whenever an accepted value is
declared — "`gpt-6.1-sol does not accept a non-default temperature (0.3): remove temperature, or send
1`". The "accepts no temperature at all" branch stays, covered by a test on a descriptor copy with the
field removed (D2).

`api.md` is unchanged.

## 2. Testbed

- `OPENAI_TEMPERATURE_PROBES`: the `raw` / `observed` row is gone. sol and astra now carry typed
  `temp=1` and `temp=1+effort=low` rows, both expected `accepted`, sent through the library. `temp=0.3`
  stays `refused-locally`.
- `GEMINI_RAW_NONE_MODELS`: the `gemini-3.8-flash` `skip` rule is removed (D4). The Gemini rows follow
  the registry on their own: `base effort=none` reads `sent with thinking off`, `base none+fail` reads
  `PASS`, and there is still no `base none raw` row.
- The canary's `'observed'` / `raw` mechanism stays, with a unit test of its own now that no scenario
  uses it (D3).
- Scenario TSDoc and descriptions, and the testbed README's tag table and probe list, describe the new
  rows.

## 3. Red, then green

Logs are under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/lrc/`.

| step | result | log |
|---|---|---|
| ts-extras targeted suites, tests changed, source not | **25 failing**: 3.8-flash and `@google-gemini:flash` `'none'` → budget 0 (×4, incl. `onUnsupported: 'fail'`); sol/astra 0.3 refusal wording (×4); sol/astra `temperature: 1` on completion (×4), streaming (×2), client-tool (×2); `temperature: 1` + effort on completion, streaming, client-tool (×6); `apiClient.thinking` 3.8-flash budget 0 and the astra refusal wording; `registry.test` listing. (The streaming-with-tools pair was added after this run; its red is the adapter mutant below.) | `red-ts-extras.log` |
| same suites after the change | all pass | `green-targeted.log` |
| mutant: flash-lite removed from the Gemini list | 3 red: flash-lite and `@google-gemini:flash-lite` `'none'` → 1024, flash-lite `'fail'` refused | `mutant-flashlite-unlisted.log` |
| mutant: OpenAI accepted temperature set to 0.3 | the 0.3 refusals (×4) and the 0.3-with-effort refusals (×2) red, with the `temperature: 1` rows | `mutant-openai-accepts-0.3.log` |
| mutant: Responses adapter clause removed | 4 red: client-tool and streaming-with-tools `temperature: 1` + effort on sol and astra | `mutant-adapter-unthreaded.log` |
| testbed `modelTiers*` against ts-extras built from the **old** registry, new tests | 3 red: keyed OpenAI (`[FAIL] advanced temp=1 … refused locally: gpt-6.1-sol does not accept temperature on any request`, and `temp=1+effort=low` refused with "thinking mode is not compatible with temperature"), keyed Gemini, keyless Gemini (`expect sent with thinking off`) | `red-testbed.log` |
| testbed full suite, new registry | pass, 100% coverage | `testbed-test.log` |

The two "still" acceptance cases (flash-lite keeps 1024, 0.3 is still refused) pass before and after by
design; their red runs are the mutants above (D7).

## 4. Run sheet — changed rows

Keyless output is in `keyless-openai.txt` and `keyless-google-gemini.txt` in the log directory; each
changed row below prints there as `PENDING` with the stated expectation. Rows not listed are as in
`final-model-fixes/result.md` § 4 and #768's run sheet.

| scenario | row | expected | a deviation means |
|---|---|---|---|
| gemini | `base effort=none` (gemini-3.8-flash) | `PASS (sent with thinking off)` | `FAIL(param)`: budget 0 rejected on 3.8-flash — the 2026-11-10 evidence no longer holds |
| gemini | `base none+fail` (gemini-3.8-flash) | `PASS` | `REFUSED-LOCALLY`: 3.8-flash is back on `thinkingRequiredModelPrefixes`. `FAIL(param)`: as above |
| gemini | `base none raw` | **no row** | unlisted, default off value: nothing for a raw row to pin |
| gemini | `@google-gemini:flash-lite effort=none` / `none+fail` / `none raw` | unchanged: `PASS (degraded to 'low' (thinking-required))` / `REFUSED-LOCALLY (as listed)` / `EXPECTED-REJECT (… invalid argument …)` | as in `final-model-fixes` |
| openai | `advanced temp=1` (gpt-6.1-sol) | `PASS` | `REFUSED-LOCALLY`/`FAIL … refused locally`: the accepted default is gone from the descriptor. `FAIL(param)`/`BLOCKED(param)`: sol now rejects `1` — read the provider text |
| openai | `frontier temp=1` (gpt-6-astra) | `PASS` | as above, for astra |
| openai | `advanced temp=1+effort=low` (gpt-6.1-sol) | `PASS` | `FAIL … refused locally: thinking mode is not compatible with temperature`: the conflict exemption stopped applying. A provider 400: sol rejects `1` beside an explicit effort, though it took it at the default effort |
| openai | `frontier temp=1+effort=low` (gpt-6-astra) | `PASS` | as above, for astra |
| openai | `advanced` / `frontier temp=0.3` | `REFUSED-LOCALLY` (message now "… does not accept a non-default temperature (0.3): remove temperature, or send 1") | `FAIL … went through`: the restriction fell off |
| openai | `advanced` / `frontier temp=1 raw` | **removed** | — |

## 5. Follow-ups resolved here

- `final-model-fixes` **F3** (send budget 0 to 3.8-flash and read `thoughtsTokenCount`): answered by the
  2026-11-10 keyed run — none returned — and acted on in § 1.
- `final-model-fixes` **Q1** (`samplingParamsAcceptedTemperature` is descriptor-wide): resolved — the
  OpenAI rejected list is exactly sol and astra, and the evidence covers both. Recorded in the field's
  TSDoc and the registry comment.
- `final-model-fixes` **OBSERVED follow-up** (if both read `accepted`, declare `1`): both read
  `accepted`; declared in § 1, rows replaced in § 2.
- The pending `final-model-fixes` change file no longer says `gemini-3.8-flash` joined the list (D5);
  `docs/FUTURE.md`'s `thinkingLevel` entry keeps every claim and now names flash-lite alone as listed
  (D6).

## 5a. Review round (orchestrator review of #771, P3s)

- **Refusal beside an effort.** With an effort set, a non-default temperature on a sampling-restricted
  model (sol, astra, and every Anthropic model on the list) was refused by `checkTemperatureConflict`
  with "remove temperature or disable thinking" — wrong advice for a rule that holds with or without
  thinking, on models that mostly cannot turn thinking off. `checkTemperatureConflict` now stands aside
  whenever the descriptor gives the model an accepted temperature (`temperatureAcceptedWithThinking`
  is defined), and `checkSamplingParams`, which both callers run next, refuses with "`<model>` does not
  accept a non-default temperature (x): remove temperature, or send `<accepted>`". Data-driven: the
  condition is the descriptor value, not a provider. Models off the list keep the conflict message.
- **Red, then green** (`red2-ts-extras.log` → `green2-targeted.log`): 10 red before the change —
  completion ×4 and streaming ×4 (claude-haiku-5-5, claude-opus-5-5, gpt-6.1-sol, gpt-6-astra, 0.3 with
  effort `low`), the `checkTemperatureConflict` unit test, and `apiClient.thinking`'s astra 0.7 with an
  explicit `high` block. The four client-tool rows were already green: that path runs
  `checkSamplingParams` first and has no conflict check; they pin the message there.
- Two existing expectations changed with it: `apiClient.thinking` (astra 0.7 beside an explicit `high`
  block) and `streamingClient` (astra 0.7 with a degraded `'none'`) now expect the model's own refusal
  rather than the conflict or degrade message; the degrade note stays pinned on xAI, whose models do
  not restrict temperature.
- Comments and public TSDoc made true: `temperature` on `IProviderCompletionParams`,
  `IExecuteClientToolTurnParams` and `IProviderCompletionStreamParams`, `thinking` on `IProviderCompletionParams`,
  and the no-effort-gate notes in `callOpenAiCompletion` and `callOpenAiChatStream`.
- README, CAPABILITIES and the change file now say the refusal reads the same with or without an
  effort.

## 6. Gates

Graded by grep: `not met|Operations failed|error TS|Jest tests? failed|FAILURE` must be 0; the only
allowed `warning` is the tracked-symlink notice.

| gate | result | log |
|---|---|---|
| ts-extras build + test (heft, full) | pass, 100% coverage, 0 warnings | `ts-extras-test.log` |
| ts-extras lint | pass | `ts-extras-lint.log` |
| testbed build + test (heft, full) | pass, 100% coverage, 0 warnings | `testbed-test.log` |
| testbed lint | pass | `testbed-lint.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass | `change-verify.log` |
| prettier 2.8.8 `--check` on every changed file | pass | — |
| `verify-capability-docs` | pass | `verify-cap.log` |
| `generate-capability-feed --check` | pass | `feed-check.log` |
| `rush rebuild` | pass, 0 graded hits, only the symlink notice | `rebuild.log` |
| `rush lint` | pass, 0 graded hits, only the symlink notice | `lint.log` |
| `rush test` (background, waited for) | pass: `SUCCESS: 38 operations`, 0 graded hits, only the symlink notice, no flakes and no retries; log not NUL-padded | `test.log` |

**Review round (after § 5a), re-gated on `e28c02dcb`:** ts-extras build + test 100% (`ts-extras-test2.log`),
ts-extras lint (`ts-extras-lint2.log`), `rush rebuild` (`rebuild2.log`), `rush lint` (`lint2.log`),
`rush test` `SUCCESS: 38 operations` with no retries (`test2.log`), `change --verify`
(`change-verify2.log`), prettier 2.8.8, `verify-capability-docs` (`verify-cap2.log`),
`generate-capability-feed --check` (`feed-check2.log`) — all pass, 0 graded hits, only the symlink
notice.
