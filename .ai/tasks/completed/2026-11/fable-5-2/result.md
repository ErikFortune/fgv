# Result — fable-5-2

**Shipped:** `@anthropic:fable` now resolves to `claude-fable-5-2`, and `claude-fable-5-2` and `claude-mythos-5-2` are covered by every per-model declaration in `ai-assist`, so structured output uses JSON outputs, `'none'` degrades to `'low'`, a non-default temperature is refused locally, and `resolveMaxOutputTokens` answers 128000 for both.

Client-tool continuations also now replay each Anthropic assistant turn exactly as it streamed,
including `server_tool_use` / `web_search_tool_result` blocks and text citations, so a `web_search`
round beside a client tool no longer edits the history that 5.2's every-account prefix check
verifies (§ 3).

Packages: `@fgv/ts-extras` (`ai-assist`, change file `minor`) and `@fgv/testbed` (private, change file
`none`). Branch `fable-5-2`, based on `origin/integration/asks` @ `f66b7f0c0`. PR: #773.

Logs and the fetched pages are under
`/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/fable/` (pages in `docs/`).

## 1. Citations

All pages fetched 2026-11-11 from `platform.claude.com` (the `.md` form of each URL).

| fact | quote | source |
|---|---|---|
| Model id and GA | "Model ID: `claude-fable-5-2`" · "**Latest.** Released November 9, 2026." · Claude API availability "All customers on the Claude API" | `/docs/en/models/fable-5-2/overview`; `/docs/en/models/fable-5-2/whats-new-fable-5-2` |
| Mythos 5.2 id and parity | "Claude Mythos 5.2 \| claude-mythos-5-2 \| Same capabilities as Claude Fable 5.2 \| Organizations verified through Anthropic's verification programs" · "It has the same specifications and pricing as Claude Fable 5.2." | `whats-new-fable-5-2`; `/docs/en/models/mythos-5-2/overview` |
| Pricing (rotation, not a tier move) | "Input and output cost less than on Claude Fable 5.1 and Claude Mythos 5.1, which cost $10 USD per million input tokens and $50 USD per million output tokens." Table: "$8 / MTok … $40 / MTok" | `whats-new-fable-5-2` § Pricing |
| 5.1 still served | Fable 5.1 still listed with its own rows on the thinking, preserved-thinking and effort pages; the migration guide covers moving off it, not its retirement | `/docs/en/build-with-claude/thinking`; `/docs/en/models/fable-5-2/migration-guide` |
| Thinking always on → `adaptiveThinkingModelPrefixes`, `thinkingRequiredModelPrefixes` | "`thinking: {"type": "enabled"}` with `budget_tokens` and `thinking: {"type": "disabled"}` both return a 400 error. Omit `thinking` or send `{"type": "adaptive"}`" · table row "Claude Fable 5.2 \| Adaptive thinking \| Adaptive thinking \| 400 error \| 400 error \| 400 error" (same for Mythos 5.2) · "Claude Fable 5.2, Claude Mythos 5.2, … reject `thinking: {type: "disabled"}`. Thinking can't be turned off on these models." | `whats-new-fable-5-2` § Thinking and tool choice; `thinking` (per-model table, line 501) |
| No forced tool use → `structuredOutput` | "`tool_choice` set to `{"type": "any"}` or `{"type": "tool", "name": "..."}` returns a 400 `invalid_request_error`. For schema-valid JSON … use JSON outputs" | `whats-new-fable-5-2`; `thinking` § Response prefill and forced tool use |
| JSON outputs supported | `supportedModels:` front matter lists `claude-fable-5-2` and `claude-mythos-5-2` | `/docs/en/build-with-claude/structured-outputs` |
| Sampling parameters → `samplingParamsRejectedModelPrefixes`, accepted temperature 1 | "On Claude Fable 5.2, Claude Mythos 5.2, Claude Fable 5.1, … non-default `temperature`, `top_p`, or `top_k` values return a 400 error on every request … Starting with API version `2026-10-21`, a request that includes `temperature`, `top_p`, or `top_k` at any value returns a 400 error on every model." ai-assist pins `anthropic-version: 2023-06-01` (`endpoint.ts`) | `thinking` § Sampling parameters |
| Max output → `maxOutputTokens` | "Context window: 1M tokens · Max output: 128K tokens" (both overviews) · output-limits table "Claude Fable 5.2 \| 128K \| —", "Claude Mythos 5.2 \| 128K \| —" | `fable-5-2/overview`; `mythos-5-2/overview`; `thinking` § Output limits |
| Capabilities → `DEFAULT_MODEL_CAPABILITY_CONFIG` | "Input → output \| Text and images → text" · "Thinking \| Adaptive (always on)" | `fable-5-2/overview` |
| Effort | "all five effort levels: `low`, `medium`, `high`, `xhigh`, and `max`. The API default is `high`." | `whats-new-fable-5-2` § Feature support |
| No prefill | "Claude 4.6 and later models … reject a prefilled final assistant turn with a 400 error" | `thinking` § Response prefill |
| Prefix check on every account | "On Claude Fable 5.2 and Claude Mythos 5.2, a request that sends back an invalid thinking block and leaves `prefix_mismatch_behavior` unset gets a 400 error, whatever the account's age" · table: Fable 5.2 / Mythos 5.2 "400 error \| 400 error" in both account columns | `whats-new-fable-5-2` § Breaking changes; `/docs/en/build-with-claude/preserved-thinking` |
| What the replay must preserve | "Store the `content` array from each response and send it back unchanged as the assistant turn: every block type, in the order received, including `thinking` blocks whose `thinking` field is empty … A serializer that drops unknown block types or reorders blocks edits the prefix … A block sent back with an empty `signature` fails." | `preserved-thinking` § Send assistant turns back exactly as returned |
| Cross-model reads | "No other model reads their blocks." (only Fable 5.2 / Mythos 5.2 read 5.2 blocks) | `whats-new-fable-5-2` |
| `computer_20251124` | "A request to either model that declares a `computer_20251124` tool returns a 400 `invalid_request_error` on every platform except Amazon Bedrock" — ai-assist declares no computer-use tool (`grep -rn computer_ libraries/ts-extras/src` → nothing) | `whats-new-fable-5-2` |

The brief's summary matched the pages on every point.

## 2. What changed in `ai-assist`

| declaration | before | after |
|---|---|---|
| `@anthropic:fable` alias | `claude-fable-5-1` | `claude-fable-5-2` |
| `structuredOutput` | 5.2 ids fell to the `''` catch-all (`anthropic-tool-forced`, a 400) | explicit `claude-fable-5-2` / `claude-mythos-5-2` → `anthropic-output-format` |
| `maxOutputTokens` (exact ids) | no 5.2 entry (resolved `undefined`) | `claude-fable-5-2`, `claude-mythos-5-2` → 128000 |
| `DEFAULT_MODEL_CAPABILITY_CONFIG.anthropic` | `claude-mythos-5-2` hit only `/^claude-/` (no `thinking`) | `/^claude-mythos-5-2/` → chat, tools, vision, thinking. `claude-fable-5-2` was already covered by `/^claude-fable-/` |
| `AnthropicThinkingModelNames` | no 5.2 ids | `'claude-fable-5-2' \| 'claude-mythos-5-2'` (api.md updated) |
| `adaptiveThinkingModelPrefixes`, `thinkingRequiredModelPrefixes`, `samplingParamsRejectedModelPrefixes` | covered by dash-bounded `claude-fable-5` / `claude-mythos-5` | unchanged entries; comments now cite the 2026-11-11 pages (state.md D1) |
| `anthropicThinkingOffTypes` | — | unchanged: the 5.2 ids resolve to the default `disabled`, which is never sent because both are thinking-required (D2) |
| `samplingParamsAcceptedTemperature` | 1 | unchanged (D3) |
| Anthropic streaming adapter (internal) | buffered thinking, redacted thinking, text, tool_use as rebuilt objects | thinking and text keep their `content_block_start` objects; also `web_search`'s `server_tool_use` (start object + `input_json_delta` buffer) and `web_search_tool_result` (start object), and text `citations` from `citations_delta`; any other block type is not buffered and is warned about once per type (state.md D7, D8, R1) |
| `buildAnthropicContinuation` (internal) | imperative loop over the four buffered types | `mapResults` over the blocks in stream order with a per-block helper; replays the server-tool blocks and citations in place; fails on a `server_tool_use` input that does not parse to an object |

## 3. Preserved thinking: is the replayed history append-only?

**Yes, for these block types, which are replayed as streamed:**

- `thinking` — its `content_block_start` object with the accumulated `thinking` (empty included) and
  `signature` laid over it;
- `text` — its start object with the accumulated `text` and, when any arrived, `citations` laid over it;
- `redacted_thinking` — `{type, data}`;
- `web_search`'s `server_tool_use` — its start object, with `input` replaced by the parsed
  `input_json_delta` chunks when any arrived — and `web_search_tool_result` — its start object.

**Not replayed as streamed:** any other block type, including other server tools' `server_tool_use`
(not buffered at all; a one-time warning per type — replaying a server tool call without its result
would itself be rejected); an empty `text` block (skipped; the API rejects empty text on input); and a
client `tool_use`, rebuilt as `{type, id, name, input}` with `input` re-serialized from its parsed
value.

As first traced, a turn where `web_search` ran lost its server-tool blocks and text citations. At the
orchestrator's direction that is fixed here (state.md D7, D8); review round 1 narrowed and hardened it
(R1).

The trace:

- **Capture.** `translateAnthropicStream` (`streamingAdapters/anthropic.ts`) keys every block by its
  SSE `index`. A `thinking` block is created at `content_block_start` with `thinking: ''` and
  `signature: ''`; `thinking_delta` and `signature_delta` are **appended** (`+=`), so an empty-text
  block that receives only its signature is kept with its full signature. `redacted_thinking` keeps
  `data` from the start event. `text` keeps its start object; `tool_use` keeps id, name and an args
  buffer. A `web_search` `server_tool_use` is buffered as its start object with an args buffer fed by
  `input_json_delta`; `web_search_tool_result` as its start object (it arrives complete);
  `citations_delta` appends to the text block's `citations`. Any other block type is not buffered.
- **Rebuild.** `buildAnthropicContinuation` (`streamingAdapters/clientToolContinuationBuilder.ts`)
  maps the buffer in index order through one helper per block (`mapResults`), emitting the list
  above, then a user turn of `tool_result` blocks correlated against the buffered `tool_use` ids.
- **Accumulate.** `executeClientToolTurn` prepends the inbound `continuationMessages` to the new
  continuation (`[...continuationMessages, ...continuation.messages]`), so each round's tail is the
  previous one plus two messages; `runClientToolLoop` replaces its tail with that cumulative value
  (`clientToolLoop.ts`, `this._tail = turn.continuation?.messages ?? this._tail`) and passes the same
  `system`, `messages`, `tools` and `clientTools` to every round. `buildAnthropicMessages`
  (`chatRequestBuilders.ts`) emits head, the prompt's user turn, then the raw tail in order.
- **Proof.** `clientToolLoopPreservedThinking.test.ts` runs a three-round loop on `@anthropic:fable`,
  `claude-fable-5-2` and `claude-mythos-5-2` (round 1: an empty-text thinking block with a signature
  split over two deltas, a progress-update thinking block, a tool call; round 2: redacted thinking and
  a tool call) and asserts, from the request bodies, that `system` and `tools` serialize identically
  on every request, that each request's `messages` begins with the previous request's `messages`
  serialized byte-for-byte and adds exactly two, and that the assistant turns carry each block as
  streamed. Mutating the builder to skip empty-text thinking blocks turns all three red
  (`pt-mutant.log`); restored, green (`pt.log`). Two more cases replay a round that interleaves
  thinking → `server_tool_use` (input split over two deltas) → `web_search_tool_result` → cited text
  (two `citations_delta`) → client `tool_use`, on `claude-fable-5-2` with thinking and on
  `claude-haiku-4-5` without, and assert the serialized assistant turn is byte-identical to the
  streamed blocks on both later requests and that every request extends the last. Both were red on the
  unfixed code (the server blocks and citations were missing, `q1-red.log`) and are green after it
  (`q1-green-targeted.log`, `q1-extras-test.log`).

What remains, recorded in `state.md`:

- **Q1 (resolved):** the dropped server-tool blocks and citations, fixed as above. Unit cover for the
  new branches: a `server_tool_use` with no input deltas replays its start object unchanged; unparseable
  or non-object input fails the continuation; a non-`web_search` server tool and an unknown block type
  are not buffered and warn once each (and drop quietly with no logger); a citation aimed at a non-text
  or missing block, or a `citations_delta` with no citation, is ignored; a field on a text or thinking
  start object is replayed.
- **Q2:** an empty `text` block is skipped; the API rejects empty text on input, and no page says one
  is streamed. Left alone.
- **Q3:** `tool_use.input` is replayed as the parsed object, not the streamed bytes. Same value.

## 4. Testbed

- **New scenario `anthropic-client-tools-fable`.** Same implementation as `anthropic-client-tools`
  (now built by `makeCliImpl(model)`), run on `@anthropic:fable`. Run it with
  `ANTHROPIC_API_KEY=… node samples/testbed/bin/testbed.js --scenario anthropic-client-tools-fable` (or the
  web runner). Its summary line names the resolved id (`Model: @anthropic:fable (claude-fable-5-2)`).
  Any 400 from it, including "The block is bound to a different conversation", is now a finding: the
  replay is meant to be append-only whether or not the model searched.
- Rows that follow `@anthropic:fable` pick up 5.2 through the registry; every pinned `claude-fable-5-1`
  in testbed source, TSDoc and tests now reads `claude-fable-5-2`. The scenario-id snapshot gains the
  new id. The wire-probe comment names the 5.2 lines among those that get JSON outputs.

## 5. Red, then green

| step | result | log |
|---|---|---|
| `fable52.test.ts` before any change | compile red: `'claude-fable-5-2'` / `'claude-mythos-5-2'` not assignable to `AnthropicThinkingModelNames` | `red-extras.log` (first run, overwritten; reproduced in the transcript) |
| same, union added, registry not | **7 red**: alias → 5-2; structured output for both ids (tool-forced 400 path); `resolveMaxOutputTokens` for both; mythos-5-2 capability detection; (one alias-level helper test, since moved to raw ids) | `red-extras.log` |
| registry changed | all green; full ts-extras suite 100% | `green1-extras.log` |
| mutant: `claude-fable-5` / `claude-mythos-5` replaced by the 5.1 ids in the thinking-required and sampling lists | **11 red**: `'none'` → `'low'` and `'fail'` refusal on alias/fable/mythos, temperature 0.3 refusal on all three, thinking-required on both ids | `mutant-extras.log` |
| preserved-thinking test, builder mutated to drop empty-text thinking | 3 red | `pt-mutant.log` |
| testbed tests against ts-extras built from the old registry | **11 red** (every `@anthropic:fable` row expecting `claude-fable-5-2`, plus the scenario-id snapshot) | `red-testbed.log` |
| testbed, new registry | green, 100% | `green-testbed.log` |
| Q1: new server-tool replay cases, unfixed adapter and builder | **2 red** (fable-5-2 with thinking, haiku-4-5 without): the replayed turn lacked `server_tool_use`, `web_search_tool_result` and the text's `citations` | `q1-red.log` |
| Q1: after the fix | 5/5 targeted green; full ts-extras suite green at 100% | `q1-green-targeted.log`, `q1-extras-test.log` |
| R1 items 1, 3, 8, new tests, before the R1 change | **4 red**: a `code_execution` `server_tool_use` was buffered (and nothing warned); start-object fields on text / thinking were not replayed; `claude-mythos-5-20260601` and `claude-mythos-5-10` were tagged thinking | `r1-red-extras.log` |
| R1 item 5, old unconditional-PASS verdicts extracted into `clientToolRunVerdicts` | **3 red**: one-round run printed `PASS`; no `[exercised]` / `[not exercised]` line (the first test's two regexes were also corrected afterwards) | `r1-red-testbed-behaviour.log` |
| R1 after the change | ts-extras green at 100%, 0 warnings; testbed green | `r1-green-extras.log`, `r1-green-testbed.log` |

## 6. Gates

| gate | result | log |
|---|---|---|
| ts-extras `build` / `lint` / `test` | pass, 0 warnings, 100% | `build-extras.log`, `lint-extras.log`, `green1-extras.log` |
| testbed `test` / `lint` | pass, 100% | `green-testbed.log`, `lint-testbed.log` |
| `rush rebuild` | rc 0; error grep 0; only warning is the tracked-symlink notice | `gate-rebuild.log` |
| `rush lint` | rc 0; error grep 0; tracked-symlink notice only | `gate-lint.log` |
| `rush test` (background, waited for) | rc 0; error grep 0; tracked-symlink notice only; no flake retries needed | `gate-test.log` |
| `rush change --verify --target-branch origin/integration/asks` | pass | `gate-change.log` |
| prettier 2.8.8 `--check` on changed files | pass | `gate-prettier.log` |
| `verify-capability-docs` | 0 failed | `gate-capdocs.log` |
| `generate-capability-feed --check` (after regenerating) | 0 stale | `gate-feed.log` |

**Re-run after the Q1 fix (commit `73fa8e72d`), new logs:** ts-extras build / lint / test at 100%,
0 warnings (`q1-build-extras.log`, `q1-lint-extras.log`, `q1-extras-test.log`); testbed test
(`q1-testbed-test.log`); `rush rebuild`, `rush lint`, `rush test` (background, waited for) all rc 0
with 0 error-grep hits and only the tracked-symlink notice (`q1-gate-rebuild.log`, `q1-gate-lint.log`,
`q1-gate-test.log`); `change --verify` (`q1-gate-change.log`), prettier (`q1-gate-prettier.log`),
`verify-capability-docs` 0 failed (`q1-gate-capdocs.log`), `generate-capability-feed --check` 0 stale
(`q1-gate-feed.log`). No new `c8 ignore`; no flake retries.

**Re-run after review round 1 (commit `d07953986`), new logs:** ts-extras build / lint / test at
100%, 0 warnings (`r1-build-extras.log`, `r1-lint-extras.log`, `r1-green-extras.log`); testbed test /
lint (`r1-green-testbed.log`, `r1-lint-testbed.log`); `rush rebuild`, `rush lint`, `rush test`
(background, waited for) all rc 0 with 0 error-grep hits and only the tracked-symlink notice
(`r1-gate-rebuild.log`, `r1-gate-lint.log`, `r1-gate-test.log`); `change --verify`
(`r1-gate-change.log`), prettier (`r1-gate-prettier.log`), `verify-capability-docs` 0 failed
(`r1-gate-capdocs.log`), `generate-capability-feed --check` 0 stale (`r1-gate-feed.log`). No new
`c8 ignore` (three removed); no flake retries.

## 7. Run sheet — changed and new rows

Rows not listed are as in `live-run-corrections/result.md` § 4 and earlier sheets. Keyless output:
`keyless-anthropic-model-tiers.txt` (every `@anthropic:fable` row `PENDING` on `claude-fable-5-2` with the expectation below), `keyless-anthropic-structured-output.txt` (`SKIPPED`, no key), `keyless-anthropic-client-tools-fable.txt` (fails fast naming the missing key, as the sonnet scenario does).

| scenario | row | expected | a deviation means |
|---|---|---|---|
| anthropic-model-tiers | `@anthropic:fable` | `PASS`, resolves `claude-fable-5-2` | `FAIL(model)` / 404: the id is not served to this key |
| anthropic-model-tiers | `@anthropic:fable schema` / `schema+effort=low` | `PASS (enforcement 'schema')` on `claude-fable-5-2` | a 400 naming `tool_choice`: the 5.2 `structuredOutput` entry is not reaching the request; a 400 naming `output_config`: JSON outputs unavailable (e.g. a CMEK organisation, per the what's-new page) |
| anthropic-model-tiers | `@anthropic:fable effort=none` | `PASS (degraded to 'low' (thinking-required))` | `FAIL(param)` naming `thinking.type.disabled`: the thinking-required match fell off |
| anthropic-model-tiers | `@anthropic:fable none+fail` | `REFUSED-LOCALLY (as listed)` | `PASS`: no longer listed as thinking-required |
| anthropic-model-tiers | `@anthropic:fable none raw` | `EXPECTED-REJECT` (400 on `thinking: {type:'disabled'}`) | `PASS`/accepted: 5.2 now accepts `disabled` — the docs changed; revisit `thinkingRequiredModelPrefixes` |
| anthropic-model-tiers | `@anthropic:fable effort=low` | `PASS` | — |
| anthropic-model-tiers | `@anthropic:fable max=128000` | `PASS` on `claude-fable-5-2` | a 400 on `max_tokens`: the cited 128K limit is wrong for this key |
| anthropic-model-tiers | `@anthropic:fable temp=1` / `temp=1+effort=low` / `temp=0.3` | `PASS` / `PASS` / `REFUSED-LOCALLY` | a 400 on `temperature: 1`: 5.2 rejects the default under `2023-06-01` too |
| anthropic-structured-output | `anthropic output_config.format (@anthropic:fable)` | `PASS` on `claude-fable-5-2` | as for the schema rows above |
| **new** anthropic-client-tools-fable | header | `…: PASS` when ≥ 2 rounds ran; `…: NOT EXERCISED (only one round ran…)` otherwise | `NOT EXERCISED`: the model answered without a tool, so nothing was replayed — re-run; it is not a pass |
| anthropic-client-tools-fable | `Continuation replay` / `Thinking-block signature` | `[PASS]` | `[NOT EXERCISED]`: as above. A 400 "The block is bound to a different conversation" fails the run: a replayed turn was edited — a finding. Compare the block types the failing round streamed with § 3's list; an `is not replayed` warning in the log names a type that was dropped |
| anthropic-client-tools-fable | `Server tool and client tool in one round, replayed` | `[exercised]` is the run that checks the server-tool replay path | `[not exercised]`: the model did not search in a tool-calling round; the run proves the thinking/text/tool_use replay only. Re-run for the server-tool path |
| anthropic-client-tools (sonnet) | same rows | same reading | the same 400 is the same finding |
