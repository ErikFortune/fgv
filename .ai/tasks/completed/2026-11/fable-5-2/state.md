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
- [x] Orchestrator decision on Q1 (2026-11-11): fix in this stream. Red test, adapter + builder
  change, green; docs updated; gates re-run.

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
  so it stays the same round-trip as the sonnet scenario, search path included (Q1, now fixed).
- **D6 — the preserved-thinking answer was "yes for thinking, text and tool_use; no when a server
  tool's blocks are in the same turn".** First parked as larger than the brief's bound (Q1); the
  orchestrator then directed the fix into this stream (D7).
- **D7 — the Q1 fix keeps the raw block.** `server_tool_use` and `web_search_tool_result` are buffered
  as the `content_block_start` JSON object itself (the start validator now checks the typed fields and
  keeps the object, rather than a typed copy), so every field the API sent comes back in its original
  key order. `server_tool_use.input` is replaced by its parsed `input_json_delta` chunks when any
  arrived; unparseable or non-object input fails the continuation rather than inventing one. Any
  `server_tool_use` is buffered, not only `web_search` (only `web_search` still emits a `tool-event`);
  `web_search_tool_result` is the only result type the adapter recognized, so it is the only one
  added. There is no separate continuation validator to widen: `rawTailMessageConverter` already
  accepts any content array.
- **D8 — citations are part of the same fix.** A search round streams `citations_delta` events onto the
  text blocks that cite it; the adapter dropped them, so the replayed text block lost its `citations` —
  the same edit by the page's definition, in the same round. They are now appended per text block and
  replayed as `{type, text, citations}`. Without this, fixing the two block types would still have left
  the search path non-append-only.

## Questions / parked

- **Q1 — RESOLVED (D7, D8), at the orchestrator's direction.** Original finding: server-tool blocks
  were dropped from the replayed assistant turn. The Anthropic streaming adapter buffered only `thinking`, `redacted_thinking`, `text`
  and `tool_use` blocks (`streamingAdapters/anthropic.ts`, `content_block_start` handler);
  `server_tool_use` and `web_search_tool_result` only emitted a `tool-event`. So when `web_search` runs in
  the same round as a client tool call, `buildAnthropicContinuation` sends the assistant turn back
  without those blocks. The preserved-thinking page lists "drops unknown block types" as an edit and
  requires "every block type, in the order received". Any thinking block after the dropped blocks —
  in that turn or a later one — then fails the prefix check, which on Fable 5.2 and Mythos 5.2 is a
  400 for every account (and on Sonnet 5.5 / Opus 5.5 for accounts created on or after 2026-08-31).
  Anthropic does not list `web_search` as exclusive with client tools in this registry
  (`serverToolsExclusiveWithClientTools` is Gemini-only), so the path is reachable, and the testbed's
  `anthropic-client-tools*` scenarios exercise it whenever the model searches in a tool-calling round.
  The fix as built is D7 and D8.
  Was recorded in `docs/TECH_DEBT.md`; that entry is now closed.
- **Q2 — empty text blocks are dropped (left alone).** `buildAnthropicContinuation` skips a `text`
  block with no text. The API rejects an empty text block on input, so sending it back is not an
  option; whether the API ever streams one in a thinking-model turn is not stated on any fetched page.
  If it did, a thinking block after it would fail the prefix check. Noted, not changed.
- **Q3 — `tool_use.input` is re-serialized, not replayed byte-for-byte.** The continuation sends
  `JSON.parse(argsBuffer)`, so key order is preserved but number and whitespace formatting may differ
  from the streamed text. The pages describe the check as comparing what was sent; the input object
  is the same value. No evidence it matters; the live fable run is the check.
