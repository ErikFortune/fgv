# live-run-corrections — two registry corrections from the 2026-11-10 keyed run

**Shipped**: 2026-11-10, PR #771 (targets `integration/asks`).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, change file
`none`).

## Summary

The user's keyed run answered both open follow-ups from `final-model-fixes`:

- **Gemini 3.8 Flash turns thinking off with budget 0.** A raw `thinkingBudget: 0` request returned
  `usageMetadata` with no `thoughtsTokenCount`. The model comes off `thinkingRequiredModelPrefixes`, so
  a generic `'none'` on `@google-gemini:flash` (the base tier) sends budget 0 again and
  `onUnsupported: 'fail'` no longer refuses it. `gemini-3.5-flash-lite` stays listed (it 400s on
  budget 0), with its `thinkingLevel` lift condition.
- **OpenAI's sol and astra accept `temperature: 1`.** The OpenAI descriptor declares
  `samplingParamsAcceptedTemperature: 1`, so `1` is sent with or without an effort; any other value is
  refused before the wire with Anthropic's wording. The value is descriptor-wide, and OpenAI's rejected
  list is exactly the two models the evidence covers.

## What a reader should know

- The OpenAI Responses streaming adapter (every client-tool turn, and streaming with tools) used to
  drop `temperature` beside an effort. It now keeps the accepted default, threaded from
  `temperatureAcceptedWithThinking` as the Anthropic adapter already was (`state.md` D1).
- The `final-model-fixes` change file was still pending, so its 3.8-flash claim was removed rather
  than left for the CHANGELOG to contradict (D5).
- No live call was made here; every change is proven by stubbed-fetch request-body tests, each shown
  red first (`result.md` § 3). `result.md` § 4 is the run sheet for the changed rows.

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D7
- `result.md`: changes, red/green evidence, run sheet and gates
- `meta.yaml`
