# Result: `luna-temperature-with-effort`

**Shipped:** ai-assist accepts `temperature: 1` beside a reasoning effort on `gpt-6-luna`, still sends any temperature with effort `'none'`, and refuses any other value while luna reasons — no effort included — before the wire, from a new declared list, `samplingParamsRejectedWithThinkingModelPrefixes`.

Branch `luna-temperature-with-effort` off `origin/integration/asks` @ `c8a84c9d2` (after #775). Packages:
`@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (`none`).

## 1. What changed

- **`IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes`** (exact-or-dash-bounded):
  models that reason by default and, while reasoning, reject every `temperature` except
  `samplingParamsAcceptedTemperature` (every value when none is declared). With thinking off they take
  any value. Public query `rejectsSamplingParamsWithThinking`, sibling of `rejectsSamplingParams`. A model
  on both lists follows the effort-blind one.
- **"Thinking off"** is read from the wire the descriptor speaks (`apiFormat`): on the OpenAI format
  the effort the adapter sends, `openAiEffort ?? xaiEffort`, is `'none'`; on Anthropic thinking is
  disabled with no effort; on Gemini the budget is `0`. A verbatim `'other'` block that sets the wire's
  effort key (`EFFORT_WIRE_KEYS`) is merged last and decides. No effort is *on* (luna defaults to
  `medium`). (Review round 1; the first cut ignored `other` blocks and read every provider's fields.)
- **Requests whose outcome changes**, all on `gpt-6-luna`: a temperature other than `1` whose wire
  effort is not `'none'` (no effort, a typed effort, or an `'other'` effort overriding a generic
  `'none'`) — a provider 400 — is now refused locally; `1` beside a typed effort, previously refused,
  is now sent. A request whose `'other'` block sends `'none'` is sent exactly as before.
- **OpenAI** lists `gpt-6-luna` only (`@openai:mini`, the base tier). `gpt-6-sol` stays on neither list.
- **Checks.** `temperatureAcceptedWithThinking` returns the accepted value for either list, so
  `checkTemperatureConflict` stands aside for `1`; `checkSamplingParams` gained the resolved thinking
  config and refuses with "`gpt-6-luna` does not accept a non-default temperature (0.3) while reasoning:
  remove temperature, send 1, or set effort 'none'". All three paths pass the config they already hold.
  The "set effort 'none'" hint is dropped on a thinking-required model or a Gemini level model, where
  `'none'` does not turn thinking off.
- **Move.** `model.ts` crossed `max-lines`; the sampling helpers moved to `samplingParams.ts`
  (exports unchanged in name).

## 2. Red → green, per path

With luna removed from the registry list, these failed; restored, all pass
(`openAiThinkingAndTemperature.test.ts › gpt-6-luna restricts temperature only while reasoning`):

| path | `1` + `low` | `0.3` + `low` | `0.3`, no effort | `0.3` + `'none'` |
|---|---|---|---|---|
| completion | red → sent (`gpt-6-luna` and `@openai:mini`) | red (conflict message) → refused, while-reasoning message | red (sent) → refused | sent (existing test) |
| streaming | red → sent | red → refused | red (sent) → refused | sent (new) |
| client-tool | red → sent | red → refused | red (sent) → refused | sent (existing test) |

Caller pinning (TESTING_GUIDELINES § predicate never called): passing `undefined` instead of
`resolvedThinking` at the streaming call site turns exactly `callProviderCompletionStream › sends
temperature 0.3 with effort 'none'` red; the completion and client-tool equivalents are pinned by the
existing `0.3` + `'none'` tests on those paths. `samplingParams.test.ts` covers every branch of the
thinking-off predicate and the no-accepted-value message. Tests that pinned luna `1`-beside-effort as a
conflict moved to `gpt-6-sol`.

## 2a. Review round 1, red → green

On `da08a2e4c` (the reviewed head) all 9 new end-to-end tests in `openAiThinkingAndTemperature.test.ts`
fail; on the fix they pass:

| finding | path | case | before → after |
|---|---|---|---|
| P2-1 | completion | 0.3 + `other` `reasoning_effort: 'none'` | refused → sent |
| P2-1 | completion | 0.3 + generic `'none'` + `other` `reasoning_effort: 'low'` | sent → refused |
| P2-1 | streaming | same two cases | refused → sent; sent → refused |
| P2-1 | client-tool | 0.3 + `otherParams.reasoning.effort` `'none'` / `'low'` over `openAiEffort: 'none'` | refused → sent; sent → refused |
| P2-2 | client-tool | 0.3 + `anthropicThinkingDisabled` / `geminiThinkingBudget: 0` / `openAiEffort: 'low'` + `xaiEffort: 'none'` | sent → refused (each) |

The predicate's branches are unit-tested in `samplingParams.test.ts` (28 cases across the three wire
formats), with the hint cases (thinking-required, Gemini level model, Gemini budget model).

## 3. Testbed (`openai-model-tiers`), expected outcomes on a keyed run

| row | before | now |
|---|---|---|
| `base temp=0.3+effort=none` | PASS | PASS (unchanged) |
| `base temp=1` | — | PASS (review round 1; with the fake rejecting it, the row reads `FAIL(param)`) |
| `base temp=0.3` | EXPECTED-REJECT (provider 400) | REFUSED-LOCALLY |
| `base temp=1+effort=low` | OBSERVED raw | PASS, through the library |
| `base temp=0.3+effort=low` | — | REFUSED-LOCALLY |
| `base temp=0.3+effort=low raw` | OBSERVED | EXPECTED-REJECT, must match `/only the default \(1\) value is supported/i`; an answer FAILs and means the list entry is stale |
| `base temp=1+effort=low raw` | OBSERVED | removed (answered; the typed row carries it) |

The fake OpenAI in `modelTiersRequests.test.ts` now accepts `1` from luna at any effort and returns
luna's live 400 text otherwise.

## 4. Gates

Run from `/home/user/fgv-luna` on `9130c265e` (the work commit), logs under the scratchpad `luna/`:

| gate | result |
|---|---|
| `install` | exit 0, `ERR_PNPM` 0 |
| `change --verify --target-branch origin/integration/asks` | exit 0; both change files found |
| `rebuild` | exit 0, `SUCCESS: 39 operations`; error/`not met` greps 0; `warning` 1 (tracked-symlink notice) |
| `lint` | exit 0, `SUCCESS: 34 operations`; greps 0; `warning` 1 (tracked-symlink notice) |
| `test` | exit 0, `SUCCESS: 38 operations` + `NO OP: 1`; `not met` / `Jest tests failed` / `error TS` 0; `warning` 1 (tracked-symlink notice); no NUL padding |

Review round 1, on `cfe5df073` (logs prefixed `r1-`): install exit 0; `change --verify` exit 0;
`rebuild` `SUCCESS: 39 operations`; `lint` `SUCCESS: 34 operations`; `test` `SUCCESS: 38 operations` +
`NO OP: 1`. Failure greps 0 in each; `warning` 1 in each of rebuild, lint and test (the tracked-symlink
notice); no NUL padding. `origin/integration/asks` still at `c8a84c9d2`, so no merge was needed.

`ts-extras` coverage: `samplingParams.ts`, `model.ts`, `registry.ts`, `completionClient.ts`,
`streamingClient.ts`, `clientToolContinuationBuilder.ts` all 100 / 100 / 100 / 100.

## 5. Review (inline, code-reviewer rubric)

No P1. P2 applied: sibling docstrings (the three `temperature` params, `checkTemperatureConflict` doc
and comment) updated for the new list. P3 kept: the new `{@link IAiProviderDescriptor.…}` TSDoc links
add `ae-unresolved-link` lines to `ts-extras.api.md`, as their siblings do. No `c8 ignore`.

## 6. Open

- Q1: `gpt-6-sol` likely follows luna's rule; unlisted until a keyed run shows it.
