# State — final-model-fixes

Worker-owned. `brief.md` is frozen.

## Status

Implementation, tests and docs done; gates and close-out follow. See `result.md`.

## Decisions

- **D1 Per-model Anthropic off value is data.** New `IAiProviderDescriptor.anthropicThinkingOffTypes`
  (`ReadonlyArray<IAnthropicThinkingOffRule>`, `{ modelPrefix, type }`, exact-or-dash-bounded, first
  match wins) with `AnthropicThinkingOffType = 'disabled' | 'between_tools'` and the public
  `AiAssist.resolveAnthropicThinkingOffType(descriptor, modelId)` (default `'disabled'`). The three
  dispatch sites (`callProviderCompletion`, `callProviderCompletionStream`, `executeClientToolTurn`)
  pass the resolved value to the Anthropic adapters as a trailing parameter defaulting to
  `'disabled'`; the emit sites send `{ type: thinkingOffType }`. No model check at any call site.
- **D2 The new symbols live in `ai-assist/anthropicThinkingOff.ts`, not `model.ts`.** `model.ts` was at
  1974 lines; adding them there tripped `max-lines` (2033 > 2000), which is a CI failure. The matcher
  `isExactOrDashBoundedPrefix` is now exported from `model.ts` (module-level, not from the barrel) so
  the new file reuses it rather than duplicating it. `model.ts` imports `IAnthropicThinkingOffRule`
  type-only, so the cycle is type-only.
- **D3 No effort beside the off value.** Confirmed in code: the emit branch that sends the off value
  is the `else` of `anthropicEffort !== undefined`, and the resolver's `'none'` sets only
  `anthropicThinkingDisabled`. Structured output adds `output_config.format` only. Pinned by tests
  that assert `output_config` is absent (completion, streaming, client-tool) and that a structured
  request on sonnet-5-5 carries `output_config` with no `effort`.
- **D4 Gemini dash-bounded match.** `gemini-3.8-flash` also matches a future `gemini-3.8-flash-lite`
  (or a dated snapshot). That is the documented safe direction for these lists (registry comment,
  model-alias-refresh A9), so the registry test's "accepts" list uses `gemini-2.5-flash`,
  `gemini-3.6-flash` and `gemini-3.5-flash` instead.
- **D5 Raw-none rows.** A `none raw` row is sent for a thinking-required model **or** a model with its
  own off value (it sends the default `disabled`, which must be rejected), unless a per-model
  `ICanaryRawNoneRule` skips it. Gemini rules: flash-lite's rejection must match `/invalid argument/i`;
  `gemini-3.8-flash` is skipped (accepts budget 0 and goes on thinking).
- **D6 OpenAI `temperature: 1` probe.** A sanctioned bypass exists: an `'other'` provider block's
  `config` is merged into the OpenAI chat body verbatim and is not checked (`IThinkingConfig`
  remarks; `otherParams`), the same mechanism as the Anthropic raw-none rows. Rows
  `advanced temp=1 raw` (gpt-6.1-sol) and `frontier temp=1 raw` (gpt-6-astra) use a new
  `CanaryExpectation`/outcome `'observed'` (tag `[OBSERVED]`): `accepted` or
  `rejected: <provider text>`, never a pass/fail claim; a local refusal on that row is a `FAIL`
  (the bypass did not bypass). The registry is unchanged. The test fake accepts on sol and rejects
  on astra purely so both renderings are exercised; it says nothing about the live answer.
- **D7 Existing test pinned to the old Gemini truth.** `thinkingParamRejection.antagonist.test.ts`
  pinned `'none'` → budget 0 on the default (base) model; it now pins it on `gemini-2.5-flash`, a
  model that still accepts budget 0, so it keeps testing the mapping.

## Red-then-green

- Red: `scratchpad/final/red-ts-extras.log` — 14 failing (12 in `thinkingOffAndSampling`, 1 registry,
  1 `apiClient.thinking`) before any source change (the `resolveAnthropicThinkingOffType` describe
  was temporarily held out so the file compiled).
- Green: `scratchpad/final/ts-extras-test2.log` — all pass, 100% coverage.
- Per-call-site revert check (TESTING_GUIDELINES "one test per caller"): dropping the off-type
  argument at each of the three dispatch sites turns exactly that path's tests red
  (`revert-completionClient.log`: 4 completion tests; `revert-streamingClient.log`: the streaming
  test; `revert-clientToolContinuationBuilder.log`: the client-tool test). Restored after each.

## Follow-ups (recorded, not done)

- **OpenAI `temperature: 1` on gpt-6.1-sol / gpt-6-astra** — unconfirmed. If the live `[OBSERVED]`
  rows read `accepted`, set `samplingParamsAcceptedTemperature` semantics for OpenAI (today the field
  is descriptor-wide and Anthropic's is 1, OpenAI's unset); if `rejected`, nothing changes. Either
  way it is a separate change.
- **Gemini `thinkingLevel` + Gemini 4 Argon rotation** — `docs/FUTURE.md` entry added.

## Open questions (parked)

- **Q1** `samplingParamsAcceptedTemperature` is descriptor-wide. If OpenAI turns out to accept `1` on
  sol/astra, setting it to 1 on the OpenAI descriptor would also let `temperature: 1` through to any
  other model on `samplingParamsRejectedModelPrefixes` there — currently only those two, so fine,
  but worth a look when the live answer arrives.

## Post-review additions (orchestrator review of `db10d9bd`, approved with doc-only P3s)

- Merged `origin/integration/asks` (`eeceb8bfa`, #768 squashed) with a merge commit; every conflict
  resolved to this branch's side and the merged tree equals `db10d9bd`.
- P3 doc edits: the "no effort beside the off value" claim now says a *generic* `'none'`, noting an
  explicit `'other'` block or `otherParams` can add one; the Gemini change-file and README text say
  `'none'` → budget 1024 changes cost/latency in an unknown direction; the dash-bounded lists are
  stated to match future variants on purpose; the README heading names the two listed models and
  says why `gemini-3.6-flash` / `gemini-3.5-flash` stay unlisted.
- **F3 (follow-up)** On the next keyed run, send one raw `thinkingBudget: 0` to `gemini-3.8-flash` and
  read `usageMetadata.thoughtsTokenCount`: non-zero confirms the listing (it ignores budget 0); zero
  means budget 0 works there and the entry should be dropped. The canary has no such row (by design:
  pass/fail on the answer alone cannot tell the two apart).
