# State: `live-run-corrections`

Worker-owned. The brief is frozen; questions and decisions go here.

## Progress

- [x] Read brief, background (`final-model-fixes` state Q1/F3 + result, `model-alias-refresh` A5/A10).
- [x] `rush install`; dependencies of `@fgv/testbed` built.
- [x] Red tests (ts-extras + testbed) written and run red.
- [x] Registry + adapter change; green (per-package build/lint/test at 100%).
- [x] Docs (README, CAPABILITIES, change files, testbed README, FUTURE.md).
- [ ] Commit, then gates.
- [ ] Close-out per `finalize-task`.

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

## Questions

(none)
