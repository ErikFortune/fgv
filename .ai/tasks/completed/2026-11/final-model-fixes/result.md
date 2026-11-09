# Result — final-model-fixes

**Shipped:** on `claude-sonnet-5-5` a generic effort `'none'` now turns thinking off with
`thinking: {type: 'between_tools'}`, declared as per-model data; `gemini-3.5-flash-lite` and
`gemini-3.8-flash` degrade `'none'` to `'low'` (interim, until `thinkingLevel` is sent); and the
canaries probe all of it, plus a report-only `temperature: 1` row on `gpt-6.1-sol` and `gpt-6-astra`.

Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, no change
file). Branch `final-model-fixes`, based on `testbed-model-probes` (#768, since squash-merged into
`integration/asks` as `eeceb8bfa`; the diff against `origin/integration/asks` is this stream's files
only). PR: #769.

## 1. What changed in `ai-assist`

| declaration | before | after |
|---|---|---|
| `IAiProviderDescriptor.anthropicThinkingOffTypes` (new) | — | Anthropic: `[{ modelPrefix: 'claude-sonnet-5-5', type: 'between_tools' }]` |
| `AnthropicThinkingOffType`, `IAnthropicThinkingOffRule`, `AiAssist.resolveAnthropicThinkingOffType` (new, `anthropicThinkingOff.ts`) | — | exact-or-dash-bounded, first rule wins, default `'disabled'` |
| Anthropic `thinkingRequiredModelPrefixes` | `opus-5-5, sonnet-5-5, fable-5, mythos-5, mythos-preview` | `claude-sonnet-5-5` removed |
| Gemini `thinkingRequiredModelPrefixes` | `gemini-3.1-pro-preview, gemini-2.5-pro` | `+ gemini-3.5-flash-lite, gemini-3.8-flash`, with the doc table quoted and the interim/lift condition at the declaration |

- **Emit sites.** `callAnthropicCompletion` and `callAnthropicStream` take the off type as a trailing
  parameter (default `'disabled'`) and send `{ type: thinkingOffType }` in the existing
  thinking-off branch. The three dispatch sites (`callProviderCompletion`,
  `callProviderCompletionStream`, `executeClientToolTurn`) pass
  `resolveAnthropicThinkingOffType(descriptor, config.model)`. No model check at a call site.
- **No effort beside it.** The off value is sent only in the `else` of `anthropicEffort !== undefined`,
  and a resolved `'none'` sets only `anthropicThinkingDisabled`; structured output adds
  `output_config.format` only. So `between_tools`' 400 at `xhigh`/`max` cannot be reached by `'none'`.
- **Client-tool flag.** `executeClientToolTurn`'s guard keys on `isThinkingRequiredModel`; sonnet-5-5
  is no longer listed, so a caller-built `anthropicThinkingDisabled` goes through and is sent as
  `between_tools`. Opus/Fable/Mythos are still refused.
- **Why a new file.** Adding the symbols to `model.ts` put it at 2033 lines, over the 2000-line
  `max-lines` limit (a CI failure). `isExactOrDashBoundedPrefix` is exported module-level (not from
  the barrel) so the new file reuses the matcher.
- **Docs.** Change file `common/changes/@fgv/ts-extras/final-model-fixes_2026-11-09-00-00.json`,
  `ai-assist/README.md`, `libraries/ts-extras/CAPABILITIES.md`, TSDoc on `IThinkingConfig.effort`,
  `thinkingRequiredModelPrefixes` and `IResolvedThinkingConfig.anthropicThinkingDisabled`. Each
  discloses that the base tier's `'none'` changes again (from degraded `'low'` to real thinking-off)
  and that inter-tool-call notes still come back as thinking blocks.
- **Deferred.** `docs/FUTURE.md` § "`ai-assist` — send Gemini's `thinkingLevel`, then rotate
  `@google-gemini:pro` to Gemini 4".

## 2. Red, then green

- **Red** (`red-ts-extras.log`): 14 tests failing before any source change — 6 Anthropic
  (`claude-sonnet-5-5`/`@anthropic:sonnet` between_tools ×2, `none+fail` sends between_tools,
  structured output with no effort, streaming, client-tool), 7 Gemini (low budget ×4, `fail` refusal
  ×2, base tier in `apiClient.thinking`) and the registry listing test.
- **Green** (`ts-extras-test2.log`): all pass, 100% coverage, no new `c8 ignore`.
- **One test per call site** (`revert-*.log`): removing the off-type argument at each dispatch site
  turns exactly its path red — completion (4 tests), streaming (1), client-tool (1). Restored each.
- Request bodies are read from the stubbed `fetch` throughout.

## 3. Testbed

- `thinkingExpectation` names the model's own off value: Anthropic `base effort=none` reads
  `sent with thinking off (between_tools)`.
- Strict none: a `none raw` row now goes on a thinking-required model **or** a model with its own off
  value; it sends the provider's default (`disabled`) and must be rejected. Its note on sonnet reads
  "the provider still rejects disabled; this model's off value is between_tools".
- New `ICanaryRawNoneRule` / `ITierCanarySpec.rawNoneModels`: Gemini's flash-lite rejection must match
  `/invalid argument/i`; `gemini-3.8-flash` is skipped (it accepts budget 0 and goes on thinking, so a
  raw row could tell nothing apart).
- **OpenAI `temperature: 1` — a sanctioned bypass exists.** An `'other'` provider block is sent
  verbatim and is not checked (the same mechanism as the Anthropic raw-none rows), so
  `ICanaryTemperatureProbe.raw` sends the temperature as `{ provider: 'other', models: [concrete],
  config: { temperature } }`. A new expectation/outcome `'observed'` (`[OBSERVED]`) reports
  `accepted` or `rejected: <provider text>` and never fails the run; a local refusal on such a row is
  a `FAIL` (the bypass did not bypass). The registry is unchanged.
- Keyed dry runs against fake providers (`modelTiersRequests.test.ts`): sonnet's two `'none'` bodies
  carry `between_tools` and no `output_config`; the raw rows carry temperature 1 to sol and astra;
  budget 0 goes only to pro (×2) and flash-lite, never to 3.8-flash. The fake OpenAI accepts 1 on sol
  and rejects it on astra only so both renderings are exercised — it says nothing about the live answer.

## 4. Run sheet — changed and new rows

Keyless output is in `keyless-anthropic.txt`, `keyless-openai.txt`, `keyless-google-gemini.txt` in the
log directory. Rows not listed here are as in #768's run sheet
(`.ai/tasks/completed/2026-11/testbed-model-probes/result.md` § 4).

| scenario | row | expected | a deviation means |
|---|---|---|---|
| anthropic | `base effort=none` (claude-sonnet-5-5) | `PASS (sent with thinking off (between_tools))` | `FAIL(param)`: `between_tools` is rejected on sonnet-5-5 — read the provider text; the off-value rule is wrong |
| anthropic | `base none+fail` (claude-sonnet-5-5) | `PASS` | `FAIL(param)`: as above. `REFUSED`/`FAIL … refused locally`: sonnet-5-5 is back on `thinkingRequiredModelPrefixes` |
| anthropic | `base none raw` (claude-sonnet-5-5, sends `disabled`) | `EXPECTED-REJECT (the provider still rejects disabled; this model's off value is between_tools: <provider text>)` | `FAIL … the provider accepted none`: sonnet-5-5 now accepts `disabled`; the `anthropicThinkingOffTypes` entry is stale |
| anthropic | `advanced` / `frontier` / `@anthropic:fable effort=none` | `PASS (degraded to 'low')` | unchanged from #768 |
| anthropic | `advanced` / `frontier` / `@anthropic:fable none+fail`, `none raw` | `REFUSED-LOCALLY`, `EXPECTED-REJECT` | unchanged from #768 (the live run confirmed "`thinking.type.disabled` is not supported for this model") |
| gemini | `base effort=none` (gemini-3.8-flash) | `PASS (degraded to 'low' (thinking-required))` | `FAIL(param)`: budget 1024 rejected on 3.8-flash |
| gemini | `base none+fail` (gemini-3.8-flash) | `REFUSED-LOCALLY (as listed)` | `FAIL … went through`: 3.8-flash fell off the list |
| gemini | `base none raw` | **no row** | 3.8-flash accepts budget 0 and goes on thinking; a raw row could not tell anything apart |
| gemini | `@google-gemini:flash-lite effort=none` | `PASS (degraded to 'low' (thinking-required))` | `FAIL(param)`: budget 1024 rejected on flash-lite |
| gemini | `@google-gemini:flash-lite none+fail` | `REFUSED-LOCALLY (as listed)` | `FAIL … went through`: flash-lite fell off the list |
| gemini | `@google-gemini:flash-lite none raw` (budget 0) | `EXPECTED-REJECT (… Request contains an invalid argument.)` | `FAIL … accepted none`: flash-lite now takes budget 0 — check whether it actually turns thinking off before dropping the listing. `FAIL … not for the expected reason`: a 400 not matching `/invalid argument/i` |
| gemini | `advanced` / `frontier none raw` (pro) | `EXPECTED-REJECT (… Budget 0 …)` | unchanged |
| openai | `advanced temp=1 raw` (gpt-6.1-sol) | `OBSERVED (accepted)` or `OBSERVED (rejected: <provider text>)` | **no pass/fail claim.** Either reading is the answer to the open question. `FAIL … refused locally`: the `'other'` bypass stopped bypassing — a testbed defect |
| openai | `frontier temp=1 raw` (gpt-6-astra) | as above | as above |

**Confirm the `gemini-3.8-flash` listing on the next keyed run.** Nothing in the canary sends it budget
0 any more. Send one raw `thinkingBudget: 0` request to `gemini-3.8-flash` by hand (or a temporary
row) and read `usageMetadata.thoughtsTokenCount` on the response: a non-zero count confirms that it
ignores budget 0 and the listing is right; zero means budget 0 does turn thinking off there and the
entry should come off the list. Recorded as follow-up F3 in `state.md`.

**Follow-up from the OBSERVED rows.** If both read `accepted`, OpenAI's sol/astra take the default
temperature, and ai-assist's refusal of every temperature there is stricter than the provider: a
separate change would declare `samplingParamsAcceptedTemperature: 1` for those models (state.md Q1:
the field is descriptor-wide). If either reads `rejected`, nothing changes for that model.

## 5. Gates

Logs are under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/final/`.
Graded by grep: `not met|Operations failed|error TS|Jest tests? failed|FAILURE` must be 0; the only
allowed `warning` is the tracked-symlink notice.

| gate | result | log |
|---|---|---|
| red run (targeted ts-extras suites, before the source change) | 14 failing, as intended | `red-ts-extras.log` |
| ts-extras build + test (heft) | pass, 100% coverage; only the API-signature-changed notice (api.md updated and committed) | `ts-extras-test2.log` |
| ts-extras lint | pass, 0 problems | `ts-extras-lint.log` |
| per-call-site revert checks | each dispatch site's test goes red when its argument is removed | `revert-completionClient.log`, `revert-streamingClient.log`, `revert-clientToolContinuationBuilder.log` |
| testbed build + test (heft) | pass, 100% coverage, 0 warnings | `testbed-test3.log` |
| testbed lint | pass, 0 problems | `testbed-lint.log` |
| repo `rush rebuild` | exit 0, 0 failure lines, symlink notice only | `rebuild.log` |
| repo `rush test` | exit 0, 38 operations succeeded (+1 with no work), 0 failure lines, symlink notice only; no flake retries needed | `test-all.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass (finds the ts-extras change file; `origin/integration/asks` = `eeceb8bfa`, which contains #768) | `change.log` |
| prettier 2.8.8 `--check` on the diff | pass | `prettier.log` |
| keyless scenario runs (anthropic, openai, google-gemini) | each exits 0 with the STOP-FLAG verdict | `keyless-*.txt` |
| `verify-capability-docs` | pass, 0 failed (router 23,885/24,000 chars) | `capdocs.log` |
| `generate-capability-feed --check` (after regenerating for this stream's headline) | pass, 0 stale | `feed.log` |

The two comment-only fixes from the antagonist pass below were made after the repo-wide gates; both
packages were rebuilt and linted again afterwards (`ts-extras-build2.log`, `testbed-build2.log`, 0
warnings).

## 6. Antagonist pass (self-run; no sub-agent available by instruction)

Checked: every `meta.yaml` summary claim against `brief.md`/this file; `sourceLine` verbatim against
§ header; the red count (6 Anthropic + 7 Gemini + 1 registry = 14) against `red-ts-extras.log`; the
per-site revert counts against the `revert-*.log` files; that the diff against
`origin/integration/asks` touches only this stream's files; each brief decision against the code.

Found and fixed:
- `IThinkingConfig.effort`'s mapping table still said "'none': Anthropic — no thinking param
  emitted", stale since #767 and wrong again now; it points to the remarks.
- The canary module header described raw rows on listed models only, and the temperature
  expectations without `observed`; both updated.

Declined: a sub-agent reviewer (forbidden by the kickoff). `prs` was empty at close-out because no PR existed yet; the orchestrator filled in #769 on opening it.


## 7. Gates after the base merge and review P3s

`origin/integration/asks` (`eeceb8bfa`) merged with a merge commit; the merged tree was identical to
`db10d9bd` before the doc-only P3 edits. Logs under
`/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/final/r2/`, graded as above.

| gate | result | log |
|---|---|---|
| `rush purge` + `rush install` | pass | `purge.log`, `install.log` |
| repo `rush rebuild` | exit 0, 0 failure lines, symlink notice only | `rebuild.log` |
| repo `rush lint` | exit 0, 34 operations, symlink notice only | `lint-all.log` |
| repo `rush test` (includes ts-extras and testbed at their 100% thresholds) | exit 0, 38 operations, 0 failure lines, symlink notice only; no flake retries | `test-all.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass | `change.log` |
| prettier 2.8.8 `--check` on the diff | pass | `prettier.log` |
| `verify-capability-docs` | 0 failed | `capdocs.log` |
| `generate-capability-feed --check` | 0 stale | `feed.log` |
