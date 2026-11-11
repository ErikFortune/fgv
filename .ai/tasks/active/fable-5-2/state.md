# State: `fable-5-2`

Worker-owned. The brief is frozen; questions and decisions go here.

## Progress

- [x] Read brief and background; fetched the Anthropic pages (2026-11-11) into the log directory
  (`docs/`): models overview, Fable 5.2 overview, what's new in Fable 5.2, Fable 5.2 migration guide,
  Mythos 5.2 overview, thinking, preserved thinking, structured outputs, effort.
- [x] `rush install`; `build --to @fgv/ts-extras`, later `--to-except @fgv/testbed`.
- [x] Red tests written and run red (`fable52.test.ts`; testbed rows against the old registry).
- [x] Registry + model-union change; green.
- [x] Preserved-thinking trace (result.md § 3) with a pinning request-body test, shown red by mutation.
- [x] Testbed: `anthropic-client-tools-fable` scenario; pinned ids rotated.
- [x] Docs, change files.
- [x] Commit, then gates.
- [x] Close-out per `finalize-task`.

## Decisions (worker)

- **D1 — no explicit 5.2 entries on the dash-bounded lists.** `adaptiveThinkingModelPrefixes`,
  `thinkingRequiredModelPrefixes` and `samplingParamsRejectedModelPrefixes` already match both 5.2 ids
  through `claude-fable-5` and `claude-mythos-5` (exact-or-dash-bounded). The brief allowed
  "confirm ... or add"; adding an exact entry next to a covering prefix would be dead data. Each
  list's registry comment now cites the 2026-11-11 page that names the 5.2 models, and the tests pin
  the behaviour per id (shown red by removing the covering prefixes, D4).
- **D2 — `anthropicThinkingOffTypes` stays as is.** Its only entry is `claude-sonnet-5-5`; neither
  5.2 id matches, so both resolve to the default `disabled`, which is never sent: both are
  thinking-required, so `'none'` is degraded to `'low'` or refused before the off value is chosen,
  and `executeClientToolTurn` refuses a caller-built off flag for a thinking-required model.
- **D3 — temperature unchanged.** The thinking page (fetched 2026-11-11) lists Fable 5.2 and Mythos
  5.2 in the same sentence as Fable 5.1: "non-default `temperature`, `top_p`, or `top_k` values return
  a 400 error". The any-value rule is tied to API version `2026-10-21`, and ai-assist sends
  `anthropic-version: 2023-06-01`, so `samplingParamsAcceptedTemperature: 1` keeps applying. The live
  run is the confirmation.
- **D4 — red for already-covered behaviour is shown by mutation.** The `'none'`, temperature and
  thinking-required tests for the 5.2 ids pass before the change because the dash-bounded entries
  cover them. Their red run replaces `claude-fable-5` / `claude-mythos-5` with the 5.1 ids in the
  thinking-required and sampling lists (11 red, `mutant-extras.log`).
- **D5 — the testbed check is a second scenario id, `anthropic-client-tools-fable`.** An env var
  would not reach the web runner; a second id built from the same implementation (a `makeCliImpl(model)`
  factory) keeps the original scenario unchanged and adds one registry line. It keeps `web_search`
  so it stays the same round-trip as the sonnet scenario — see Q1 for what that means on 5.2.
- **D6 — the preserved-thinking answer is "yes for thinking, text and tool_use; no when a server
  tool's blocks are in the same turn".** See result.md § 3. Not fixed here: the fix is larger than a
  few lines (Q1).

## Questions / parked

- **Q1 — server-tool blocks are dropped from the replayed assistant turn (not fixed; larger than a
  few lines).** The Anthropic streaming adapter buffers only `thinking`, `redacted_thinking`, `text`
  and `tool_use` blocks (`streamingAdapters/anthropic.ts`, `content_block_start` handler);
  `server_tool_use` and `web_search_tool_result` only emit a `tool-event`. So when `web_search` runs in
  the same round as a client tool call, `buildAnthropicContinuation` sends the assistant turn back
  without those blocks. The preserved-thinking page lists "drops unknown block types" as an edit and
  requires "every block type, in the order received". Any thinking block after the dropped blocks —
  in that turn or a later one — then fails the prefix check, which on Fable 5.2 and Mythos 5.2 is a
  400 for every account (and on Sonnet 5.5 / Opus 5.5 for accounts created on or after 2026-08-31).
  Anthropic does not list `web_search` as exclusive with client tools in this registry
  (`serverToolsExclusiveWithClientTools` is Gemini-only), so the path is reachable, and the testbed's
  `anthropic-client-tools*` scenarios exercise it whenever the model searches in a tool-calling round.
  The fix: buffer `server_tool_use` (id, name, input from `input_json_delta`) and
  `web_search_tool_result` (its `content` from `content_block_start`, which the start-payload validator
  would need to keep), and emit them in stream order in the continuation — plus request-body tests.
  Recorded in `docs/TECH_DEBT.md`.
- **Q2 — empty text blocks are dropped (left alone).** `buildAnthropicContinuation` skips a `text`
  block with no text. The API rejects an empty text block on input, so sending it back is not an
  option; whether the API ever streams one in a thinking-model turn is not stated on any fetched page.
  If it did, a thinking block after it would fail the prefix check. Noted, not changed.
- **Q3 — `tool_use.input` is re-serialized, not replayed byte-for-byte.** The continuation sends
  `JSON.parse(argsBuffer)`, so key order is preserved but number and whitespace formatting may differ
  from the streamed text. The pages describe the check as comparing what was sent; the input object
  is the same value. No evidence it matters; the live fable run is the check.
