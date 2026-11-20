# State: `live-run-corrections`

Worker-owned. The brief is frozen; questions and decisions go here.

## Progress

- [x] Read brief, background (`final-model-fixes` state Q1/F3 + result, `model-alias-refresh` A5/A10).
- [x] `rush install`; dependencies of `@fgv/testbed` built.
- [x] Red tests (ts-extras + testbed) written and run red.
- [x] Registry + adapter change; green (per-package build/lint/test at 100%).
- [x] Docs (README, CAPABILITIES, change files, testbed README, FUTURE.md).
- [x] Commit (`ff80f053a`), then gates — all green (result.md § 6).
- [x] Close-out per `finalize-task`: migrated to `completed/2026-11/`, meta.yaml, README, ledger entry
  (#771), feed regenerated.

## Decisions (worker)

- **D1 — the client-tool path needed one more change than the registry.** `callOpenAiResponsesStream`
  (the Responses streaming adapter; every OpenAI client-tool turn and every streaming call with tools
  routes through it) drops `temperature` whenever an effort other than `'none'` is set. That is the
  adapter safety net for the unguarded client-tool path; the Anthropic adapter has the same net and
  is already handed `temperatureAcceptedWithThinking` so the accepted default passes it. The OpenAI
  adapter was not, so after the registry change `temperature: 1` with a resolved effort on sol/astra
  would still have been silently stripped on that path, contradicting brief decision 2 ("sent, with
  or without effort"). The same value is threaded into the OpenAI Responses adapter, from the same
  `temperatureAcceptedWithThinking(descriptor, model)` call. Data-driven: no provider or model branch.
- **D2 — `checkSamplingParams`' "accepts no temperature at all" branch stays.** No registry
  descriptor exercises it after this change (Anthropic and OpenAI both declare 1), but it is the
  documented meaning of an undefined `samplingParamsAcceptedTemperature` beside a non-empty rejected
  list. It is now covered by a test on a descriptor copy with the field removed.
- **D3 — the canary's `'observed'` / `raw` temperature machinery stays.** After this change no
  scenario sends a raw temperature row, but the mechanism is a generic canary capability with its own
  unit tests, and the brief replaces the rows, not the mechanism.
- **D4 — `GEMINI_RAW_NONE_MODELS['gemini-3.8-flash']` (the `skip` rule) is removed.** With 3.8-flash
  unlisted, `rawNonePlan` already sends no raw row for it (unlisted, default off value), so the rule
  is dead and its text ("accepts thinkingBudget 0 and ignores it") is the stale claim.

- **D5 — the `final-model-fixes` change file is corrected, not just countered.** That file is still
  pending (no published `CHANGELOG.md` entry carries it), so it would publish in the same alpha as
  this stream's file. Left as written, the CHANGELOG would say gemini-3.8-flash joined
  `thinkingRequiredModelPrefixes` and that its `'none'` changed to budget 1024 — neither of which is
  true of any published alpha, since the listing never shipped. Its Gemini sentence now names
  flash-lite only, and this stream's change file states that 3.8-flash is deliberately unlisted and
  keeps sending budget 0. (The brief's "update the change file" is read as covering both.)
- **D6 — `docs/FUTURE.md`.** Every `thinkingLevel` claim stays. One sentence in that entry said
  gemini-3.8-flash sits on the list as an interim; that is no longer true, so it now names flash-lite
  only, with a parenthetical pointing here.
- **D7 — the "still" acceptance cases were shown red by mutation.** "flash-lite `'none'` still sends
  1024" and "0.3 is still refused" pass both before and after the change by design, so their red runs
  are mutants: flash-lite removed from the Gemini list (3 tests red), and OpenAI's accepted
  temperature set to 0.3 (the 0.3-refusal tests red). The adapter threading (D1) was shown red the
  same way (4 tests red with the adapter's accepted-default clause removed).

- **D8 (review round on #771)** — the conflict check stands aside for a model with an accepted
  temperature, so the sampling check's message (which names the model and the accepted value) is the
  refusal beside an effort too. See result.md § 5a.

## Follow-ups (not this PR)

- **F1** — the client-tool path has no OpenAI guard for a caller-built `resolvedThinking: { openAiEffort:
  'none' }` aimed at a thinking-required model (sol, astra); it reaches the wire and the provider 400s.
  The Anthropic flag has a guard (`anthropicThinkingDisabled` on a thinking-required model is refused).
- **F2** — `gpt-6-luna` and `gpt-6-sol` with `temperature: 1` beside an effort are refused locally by
  the thinking/temperature conflict, though the provider likely accepts its default there too (luna's
  400 for 0.3 reads "Only the default (1) value is supported"). A canary probe row (`temp=1+effort=low`
  on luna, expected `observed`) could settle it before any registry change.

## Questions

(none)
