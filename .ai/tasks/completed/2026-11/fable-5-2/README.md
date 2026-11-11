# fable-5-2 — rotate `@anthropic:fable` to Claude Fable 5.2 and register Mythos 5.2

**Shipped**: 2026-11-11, PR #TBD (targets `integration/asks`).
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

- **Preserved thinking is enforced on every account for 5.2.** The client-tool replay keeps thinking
  (including empty-text blocks and split signatures), redacted thinking, text and tool_use blocks
  unchanged and append-only — pinned by `clientToolLoopPreservedThinking.test.ts`. It **drops
  `server_tool_use` / `web_search_tool_result` blocks**, which is an edit: a `web_search` + client-tool
  round on 5.2 can 400. Not fixed here (larger than the brief allowed); `docs/TECH_DEBT.md` [P2],
  `state.md` Q1.
- Temperature is unchanged: the docs restrict only non-default values on 5.2, as on 5.1, under the
  `2023-06-01` API version ai-assist pins.
- New testbed scenario `anthropic-client-tools-fable`: the live check of the replay on 5.2. Its run-sheet
  row says how to tell the known gap from a new finding.
- No live call was made; every change is proven by stubbed-fetch request-body tests shown red first
  (`result.md` § 5).

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions D1–D6, parked Q1–Q3
- `result.md`: citations, changes, preserved-thinking trace, red/green evidence, gates, run sheet
- `meta.yaml`
