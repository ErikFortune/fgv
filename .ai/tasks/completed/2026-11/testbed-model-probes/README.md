# testbed-model-probes — live probes for the thinking-off, temperature and max-output claims

**Shipped**: 2026-11-09 into `integration/asks` via #768.
Package: `@fgv/testbed` (`samples/testbed`, private). No change file needed.

## Summary

The model-tier canaries (`src/scenarios/modelTiers/`) gained the live rows that #765 and #767 could
not run without keys:

- **Anthropic thinking**: `effort=none` / `effort=low` on every tier and extra model. Haiku 5.5's
  `'none'` sends `thinking: {type:'disabled'}`. Sonnet 5.5, Opus 5.5 and Fable 5.1 degrade it to
  `'low'`. `none+fail` is refused locally on those three, and each gets a raw `disabled` row that the
  provider must reject.
- **Temperature**: Anthropic accepts `1` with and without thinking and refuses `0.3` locally. OpenAI
  accepts `0.3` on `gpt-6-luna` with effort `'none'`, expects a provider 400 without it, and refuses
  it locally on `gpt-6.1-sol` and `gpt-6-astra`.
- **Max output**: a completion at `resolveMaxOutputTokens` for each Anthropic, OpenAI and Gemini
  target.

Three new outcomes are expected non-answers that do not fail a run: `[REFUSED-LOCALLY]`,
`[EXPECTED-REJECT]` and `[NO-RECORDED-LIMIT]`.

## What a reader should know

- **No live call was made.** No keys exist here. `result.md` § 4 is the run sheet for the user's
  keyed run: what each row should show, and what a deviation means.
- **The refused-locally claim is tested against the real library.** `modelTiersRequests.test.ts`
  replaces `fetch` with a recorder. It runs the live seam's exact params through
  `callProviderCompletion` and runs both scenarios against fake providers, and asserts that the
  refused rows send nothing and that the bodies sent are the documented wire.
- Decisions D1–D7, review amendments A1–A6 and the resolved Q1 (Anthropic 128K non-streaming is
  fine over raw `fetch`) are in `state.md`. `EXPECTED-REJECT` rows pass only on the stated reason
  and print the provider's own text.

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions and questions
- `result.md`: changes, the proof, keyless output, run sheet and gates
- `meta.yaml`
