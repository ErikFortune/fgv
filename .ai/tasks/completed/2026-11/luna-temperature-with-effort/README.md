# luna-temperature-with-effort — accept the default temperature beside an effort on `gpt-6-luna`

**Shipped**: 2026-11-11, PR #TBD (targets `integration/asks`, after #775).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, change file
`none`).

## Summary

`gpt-6-luna` restricts `temperature` only while it reasons: a keyed run showed `0.3` accepted with effort
`'none'`, `0.3` rejected beside effort `low` and with no effort (luna defaults to `medium`), and `1`
accepted beside effort `low`. ai-assist used to refuse every temperature beside an effort on luna,
`1` included, and to send `0.3` with no effort for the provider to reject. A new declared list,
`IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes` (queried with
`rejectsSamplingParamsWithThinking`), reuses `samplingParamsAcceptedTemperature` for the value accepted
while reasoning. OpenAI lists `gpt-6-luna` alone.

## What a reader should know

- **Thinking counts as off only through ai-assist's own fields** — effort `'none'` (or the resolved
  equivalent). No effort means the model's default, which for a listed model reasons. A verbatim
  `other` block is not inspected.
- **Same rule on all three paths** — completion, streaming, client-tool — with the message "… does not
  accept a non-default temperature (x) while reasoning: remove temperature, send 1, or set effort
  'none'".
- **Not on `samplingParamsRejectedModelPrefixes`**: that list is effort-blind and would refuse the
  documented `0.3` + `'none'`.
- **`gpt-6-sol` is unchanged** (the evidence covers luna only): beside an effort, any temperature is
  still the thinking/temperature conflict.
- The sampling helpers moved from `model.ts` to `samplingParams.ts` (`max-lines`).
- Testbed luna rows now state outcomes through the library; one raw `0.3` + `low` row expects the
  provider's own "Only the default (1) value is supported" 400 (`result.md` § 3).

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D6, red/green notes, inline review, open question Q1
- `result.md`: change summary, red/green per path, testbed row table, gates
