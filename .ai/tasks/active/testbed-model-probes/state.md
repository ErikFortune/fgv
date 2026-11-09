# State — testbed-model-probes

Worker-owned. The brief is frozen; decisions and questions live here.

## Progress

- [x] Read the canary, its tests, and the ai-assist behaviours being probed
  (`thinkingOptionsResolver.ts`, `model.ts`, `registry.ts`, `completionClient.ts`).
- [x] Canary extended: thinking / strict-none probes cover extra models; new temperature and
  max-output probe families; three new expected outcomes (`refused-locally`, `expected-reject`,
  `no-recorded-limit`).
- [x] Live seam reduced to one call; the request it sends is built by a pure, tested
  `buildCanaryCompletionParams`.
- [x] Anthropic, OpenAI, Gemini scenarios opted in; descriptions, TSDoc and README updated.
- [x] Stale `anthropicClientTools` comment corrected.
- [x] testbed build / lint / test green (100% coverage, no new `c8 ignore`).
- [x] Repo-wide gates (see `result.md`).

## Decisions

- **D1 Raw `disabled` row on Anthropic: yes, on every thinking-required target, not only
  sonnet-5-5.** The canary's existing mechanism adds a `none raw` row for every target listed in
  `thinkingRequiredModelPrefixes`; for Anthropic that is sonnet-5-5 (base), opus-5-5 (advanced and
  the frontier cascade) and fable-5-1. Each listing rests on its own doc quote (Sonnet 5.5 is quoted
  separately from Opus 5.5 / Fable 5.1), so each gets its own staleness check, the same purpose
  rawNone serves for OpenAI / xAI / Gemini. Cost: each is a 400 that consumes no output tokens.
  Anthropic has no typed off value in `IAnthropicThinkingConfig`, so the raw block is an `'other'`
  block, `{ provider: 'other', models: [concrete], config: { thinking: { type: 'disabled' } } }`:
  `EFFORT_WIRE_KEYS.anthropic` includes `thinking`, so the gate stands aside and the body carries
  exactly what a generic `'none'` would send if the gate let it through. Verified in the dry-run
  test (`modelTiersRequests.test.ts`).
- **D2 Thinking and strict-none probes now run on extra models too, for every provider.** Required
  for the brief's haiku and fable rows (both are `extraModels`). Applied uniformly rather than as an
  Anthropic-only flag; the only other scenario with extra models is Gemini, which gains three rows on
  `@google-gemini:flash-lite` (`effort=none`, `effort=low`, `none+fail`; flash-lite is not
  thinking-required, so no raw row). Same for max-output: Gemini's flash-lite gets a row as well as
  the completion tiers the brief names. Strict additions; each is one tiny call.
- **D3 Strict-none outcomes renamed onto the new tags.** A listed model's local refusal was
  `[PASS] … (refused locally, as listed)`; it is now `[REFUSED-LOCALLY] … (as listed)`. A raw row the
  provider rejects was `[PASS] … (the provider still rejects none, as listed)`; it is now
  `[EXPECTED-REJECT]`. One vocabulary for "an expected non-answer" across the report. Existing tests
  updated; verdict semantics unchanged (neither fails a run).
- **D4 How refused-locally is proven.** Classification: a failure matches one of ai-assist's known
  pre-wire refusal messages and carries no `returned <status>` (`isLocalRefusal`). Proof that no
  network call happens: `modelTiersRequests.test.ts` runs the exact params the live seam builds
  through the real `callProviderCompletion` with `globalThis.fetch` replaced by a recording mock, and
  asserts zero requests for each refused-locally case; it also runs the real Anthropic and OpenAI
  scenarios keyed (dummy key) against fake providers and checks the wire bodies (no
  `temperature: 0.3` anywhere, haiku `none` sends `thinking: {type:'disabled'}`, sonnet `none` sends
  adaptive + `output_config.effort: 'low'`, the `max_tokens` / `max_completion_tokens` counts).
  jsdom has no `fetch`, so the file installs the mock on `globalThis` for its duration and removes
  it after (the `agentTasks.test.ts` precedent). A `@jest-environment node` docblock was tried and
  does not work here: heft emits `"use strict"` above it.
- **D5 Temperature probe expectations are stated in the scenario, not derived from the registry.**
  The OpenAI `gpt-6-luna` no-effort 400 is deliberately *not* in the registry (#767 Q8), so it can
  only be stated. A probe that names a model no target resolves to produces a `FAIL` row, so an
  alias rotation cannot silently drop the row.
- **D6 OpenAI temperature value is 0.3** (any value is refused on sol/astra; a non-default value is
  the stronger test of Q8 on luna). Anthropic uses 1 (accepted) and 0.3 (refused), per the brief.
- **D7 Keyless rows carry their expectation** (`(expect refused-locally)` etc.), so the keyless
  report is the list of what the keyed run checks. Keyless rows use the existing `PENDING` tag for
  `not-run`.

## Open questions

- **Q1 (for the live run)** Anthropic `max_tokens: 128000` on the non-streaming Messages API: the
  docs record 128K as the synchronous limit; ai-assist calls by raw `fetch`, so the SDK's
  long-request guard does not apply. If the API itself refuses a non-streaming 128K request, the row
  shows `FAIL(param) … the recorded limit 128000 is too high` — that would mean the limit is
  streaming-only, not that the number is wrong. Noted in the run sheet.

## ts-extras defects

None found. No `@fgv/ts-extras` change.
