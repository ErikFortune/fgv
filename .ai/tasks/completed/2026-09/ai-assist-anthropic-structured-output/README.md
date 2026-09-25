# ai-assist-anthropic-structured-output — non-forcing Anthropic structured output, and the Anthropic rotation

**Shipped**: 2026-09-25 via [#694](https://github.com/ErikFortune/fgv/pull/694), from
`claude/ai-assist-anthropic-structured-output` against `release`. **Not live-verified.** No
provider call was made from the agent's environment. The maintainer's `anthropic-model-tiers`
testbed run is the live gate.

## Summary

`claude-opus-5-5` and `claude-fable-5-1` return a 400 on a forced `tool_choice`, and forcing a tool
was ai-assist's only Anthropic structured-output mechanism. Two consequences followed. The successor
aliases could not rotate. And the `''` catch-all capability entry claimed both ids supported a
mechanism that failed on them.

This stream adds `anthropic-output-format` (Anthropic's JSON outputs, `output_config.format`) and
declares it for those two ids by `modelPrefix`. Every other line keeps `anthropic-tool-forced`.
The stream then rotates `@anthropic:opus` → `claude-opus-5-5` and `@anthropic:fable` →
`claude-fable-5-1`.

## Decisions (full reasoning and citations in `result.md` §1–§3)

- **JSON outputs over `tool_choice: auto` + strict tool.** Strict tool use constrains a call the
  model may choose not to make.
- **Reports `'schema'`.** The enforcement union did not move; the format union gained one member.
- **`web_search` still refused.** The reason is not a tools-channel clash. It is Anthropic's
  documented incompatibility between citations and `output_config.format`, and web search always
  cites. Whether web search's own citations trip that 400 is undocumented, and is a TECH_DEBT P3.

## What this stream is useful for next time

- **`result.md` §5** lists every Anthropic capability table and its disposition for the rotated
  ids, each with evidence.
- **The `output_config` merge (§4).** Two writers share Anthropic's `output_config` object. Any
  future field that lands there must merge rather than assign.
- **The canary's `structuredOutputProbe`** checks the reported enforcement against the registry, so
  a live run catches a declared format that the provider rejects or that the adapter fails to send.

## Files

- `libraries/ts-extras/src/packlets/ai-assist/`: `structuredOutputTypes.ts` (format union),
  `structuredOutput.ts` (wire, json-object, server-tools conflict), `completionClient.ts`
  (`output_config` merge), `registry.ts` (capability entries, aliases), `README.md`
- `libraries/ts-extras/CAPABILITIES.md`, `etc/ts-extras.api.md`, change file
- `samples/testbed/src/scenarios/modelTiers/` (probe) and its tests
- `docs/TECH_DEBT.md` (P2 removed, P3 added)

Archived alongside: `brief.md` (as briefed) and `result.md` (as shipped).
