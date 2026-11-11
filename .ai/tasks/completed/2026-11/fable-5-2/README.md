# fable-5-2 — rotate `@anthropic:fable` to Claude Fable 5.2 and register Mythos 5.2

**Shipped**: 2026-11-11, PR #773 (targets `integration/asks`).
Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, change file
`none`).

## Summary

Anthropic released Claude Fable 5.2 (`claude-fable-5-2`, GA, $8 / $40 per MTok against 5.1's $10 / $50)
and Claude Mythos 5.2 (`claude-mythos-5-2`, verified organisations only), with Fable 5.1's request
surface. The non-tier `@anthropic:fable` alias now targets `claude-fable-5-2`, and both 5.2 ids are on
every per-model table: JSON-outputs structured output (they 400 on a forced `tool_choice`), 128000 max
output, Mythos 5.2 capability detection, and the thinking-model name union. The thinking-required,
adaptive and sampling lists already covered both through their dash-bounded `claude-fable-5` /
`claude-mythos-5` entries; their comments now cite the 5.2 pages.

## What a reader should know

- **Preserved thinking is enforced on every account for 5.2.** On every Anthropic model, the
  client-tool replay is append-only and sends back as streamed: thinking and text blocks (their start
  objects with accumulated thinking, signature, text and citations), redacted thinking, and
  `web_search`'s `server_tool_use` / `web_search_tool_result` — the last two and the citations fixed in
  this stream. Not replayed as streamed: other block types (warned once), empty text (skipped), and
  client `tool_use` input (re-serialized). Pinned by `clientToolLoopPreservedThinking.test.ts`
  (`state.md` D7, D8, R1). A tail made on 5.2 loses its reasoning if resumed on another model.
- Temperature is unchanged: the docs restrict only non-default values on 5.2, as on 5.1, under the
  `2023-06-01` API version ai-assist pins.
- New testbed scenario `anthropic-client-tools-fable`: the live check of the replay on 5.2. It reports
  `PASS` only when a continuation was actually sent, and says whether the server-tool path was
  exercised. Any 400 from it is a finding.
- No live call was made; every change is proven by stubbed-fetch request-body tests shown red first
  (`result.md` § 5).

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D8, review round 1 (R1), Q1 resolved, Q2–Q3 noted
- `result.md`: citations, changes, preserved-thinking trace, red/green evidence, gates, run sheet
- `meta.yaml`
