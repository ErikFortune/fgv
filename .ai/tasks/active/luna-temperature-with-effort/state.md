# luna-temperature-with-effort — state (worker-owned)

## Decisions

- **D1 — field.** `IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes`, sibling of
  `samplingParamsRejectedModelPrefixes`, reusing `samplingParamsAcceptedTemperature`. Public query
  `rejectsSamplingParamsWithThinking` (sibling of `rejectsSamplingParams`). OpenAI lists
  `gpt-6-luna` only.
- **D2 — "thinking off".** Read from ai-assist's own resolved fields only (`requestTurnsThinkingOff`,
  internal): OpenAI/xAI effort `'none'`, Anthropic thinking-off with no effort, Gemini budget `0`.
  No resolved config (no effort) is *on* — listed models reason by default, which is what the field
  declares. A verbatim `other` block (`otherParams`) is not inspected, so a thinking-off value sent
  that way is not recognized (documented on the field). The brief's "no effort on a model whose
  default is off" case has no listed model today; a default-off model would need its own
  declaration, so it is not modelled (no speculative field).
- **D3 — where the rule runs.** `checkSamplingParams` takes the resolved thinking config as a fourth
  parameter; the three callers (completion, streaming, client-tool) pass the one they already hold.
  `temperatureAcceptedWithThinking` returns the accepted value for either list, so
  `checkTemperatureConflict` stands aside for `1` and `checkSamplingParams` gives the model's own
  message. A model on both lists follows the effort-blind list.
- **D4 — max-lines.** `model.ts` crossed 2000 lines; the sampling functions (`rejectsSamplingParams`,
  `rejectsSamplingParamsWithThinking`, `requestTurnsThinkingOff`, `temperatureAcceptedWithThinking`,
  `checkSamplingParams`) moved to a new `samplingParams.ts`, following `geminiThinking.ts` /
  `anthropicThinkingOff.ts`. Public exports unchanged in name; api.md lists them under the new file.
- **D5 — message.** "`<id>` does not accept a non-default temperature (x) while reasoning: remove
  temperature, send 1, or set effort 'none'"; with no accepted value declared, "`<id>` does not
  accept temperature while reasoning: remove temperature, or set effort 'none'".
- **D6 — testbed.** luna rows: `temp=0.3+effort=none` PASS (unchanged), `temp=0.3` REFUSED-LOCALLY
  (was EXPECTED-REJECT), `temp=1+effort=low` PASS (was OBSERVED raw), `temp=0.3+effort=low`
  REFUSED-LOCALLY (new), and one raw row `temp=0.3+effort=low raw` EXPECTED-REJECT matching
  "Only the default (1) value is supported" (was OBSERVED). The raw `temp=1` row is dropped — its
  question is answered and the typed row now carries it.

## Red → green
- With luna removed from the registry list, 11 luna tests in `openAiThinkingAndTemperature.test.ts`
  fail across all three paths; restored, all pass.
- Caller pinning: replacing `resolvedThinking` with `undefined` at the streaming call site turns
  exactly `callProviderCompletionStream › sends temperature 0.3 with effort 'none'` red.

## Inline review (code-reviewer rubric)
- No `any`, Result pattern throughout, no new casts, no `c8 ignore`.
- Sibling sweep: temperature docstrings on the completion / streaming / client-tool params, and
  `checkTemperatureConflict`'s doc + comment, updated for the new list. Existing tests that pinned
  luna `1`-beside-effort as a conflict were moved to `gpt-6-sol` (still unlisted).
- P3, kept: new TSDoc `{@link IAiProviderDescriptor.…}` links produce the same `ae-unresolved-link`
  api.md warnings as their siblings (sibling-consistent).

## Open questions
- Q1: `gpt-6-sol` likely behaves like luna, but there is no evidence; left unlisted per the brief.
