# `ai-assist-responses-reasoning-events` — result (cluster closeout)

**Stream:** `ai-assist-responses-reasoning-events`
**Role in cluster:** **closeout** — bundles library fix + Gemini scenario fix + provider-drift instrumentation + live-run verification
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-reasoning-events-and-closeout`
**Status:** **cluster ready for close-out PR**

---

## TL;DR — what shipped

1. **Library fix #1 — `openaiResponses.ts`:** the adapter now correlates `item_id → call_id` for the OpenAI Responses API function_call event family. Live captures (2026-06-05) confirmed `response.function_call_arguments.{delta,done}` SSE events are keyed **only** by `item_id` (the `fc_*` output-item id) — never by `call_id` (the `call_*` continuation id). The old adapter looked up by `call_id`, found nothing, and silently no-op'd, so client-tool-call-done events never fired on reasoning models. This was the L37 reference-observation pattern playing out exactly: tests passed on a wire shape that did not match the live API.
2. **Library fix #2 — `clientToolContinuationBuilder.ts` (`buildOpenAiContinuation`):** the continuation now emits the required `call_id` field on function_call input items. The prior shape emitted `id: callId` (the optional field), which OpenAI's Responses API rejects with HTTP 400 (`Missing required parameter: 'input[2].call_id'`). The 400 surfaced live the moment fix #1 made the function-call event flow through. Both bugs had to be fixed together to make the OpenAI/xAI scenarios reach PASS.
3. **Testbed fix — Gemini scenario:** dropped `web_search` from the tool list and marked the "Server tool events emitted" and "Server + client tool coexistence" gates N/A. Gemini's `generateContent` API rejects requests that combine grounding with function calling.
4. **Provider-drift instrumentation:** both `openaiResponses.ts` and `anthropic.ts` now maintain a `RECOGNIZED_*_EVENTS` allowlist and emit a one-time `logger?.warn(...)` per stream per unknown event name. Final shape (after the Copilot review loop tightened the contract):
   - Warning starts with the stable `ai-assist:unrecognized-event` prefix (shared `UNRECOGNIZED_EVENT_WARN_TAG` constant in `common.ts`) so production deployments can filter / alert without coupling to the per-adapter detail message.
   - Warning includes a length-capped `payload preview: <…>` (200-char cap, newlines collapsed; `<no payload>` for empty data; shared `formatUnrecognizedEventPayloadPreview()` helper) so a triager can see the JSON shape that arrived without re-running the scenario under a debugger.
   - Warning names the allowlist constant so a developer can find the right list to update.

All four client-tool scenarios reach PASS gates live.

---

## Per-scenario live-run gate matrix

| Provider | Model | Verdict | Final text | Client tool | Server tool events | Continuation | Notes |
|---|---|---|---|---|---|---|---|
| Anthropic | `claude-sonnet-4-6` | **PASS** | non-empty | 1 call | 1 (web_search) | accepted | Regression check — unchanged |
| OpenAI | `gpt-5.1` (reasoning low) | **PASS** | 412 chars | 1 call | 0 (model didn't trigger) | accepted | Was empty; now works |
| xAI | `grok-4.3` (reasoning low) | **PASS** | 256 chars | 1 call | 2 (web_search) | accepted | Was empty; now works |
| Gemini | `gemini-2.5-flash` | **PASS** | 21 chars | 1 call | N/A | accepted | Was HTTP 400; now works (web_search dropped) |

**Gemini N/A gates (documented in the scenario):**
- "Server tool events emitted" — no server tools requested.
- "Server + client tool coexistence" — Gemini's API forbids the combination (HTTP 400 if attempted).

---

## What the brief anticipated vs what actually shipped

The brief framed Issue 1 as "extend `callOpenAiResponsesStream` to recognize reasoning-mode event types for final text and function calls" — implying *new* event-type arms. The live capture showed the missing arms were not actually new: `response.output_text.delta` and `response.function_call_arguments.{delta,done}` are the same names already handled. The bug was the **item_id↔call_id correlation** in the existing delta/done arms, surfaced because reasoning models emit a leading reasoning item (and xAI emits a reasoning_summary stream) before the function_call item — but the underlying event names did not change.

What this means concretely:
- **No new `IAiStreamEvent` event types were required.** Reasoning content is discarded by design (per `ai-assist-thinking-events` follow-on stream).
- **No new event-name arms were added.** The fix was internal correlation bookkeeping in the existing `response.output_item.added` / `response.function_call_arguments.{delta,done}` arms.
- **Test fixtures were updated** to reflect the real wire shape (delta/done events keyed by `item_id`, not `call_id`). The prior fixture shape was fiction.

The brief implicitly anticipated fix #1 only; fix #2 (continuation builder) was surfaced as a finding when the OpenAI live re-run hit HTTP 400 after fix #1 made the function call event flow. The finding is filed at `findings/inbox/2026-06-05-openai-continuation-missing-call_id.md` with disposition **RESOLVED inline** under the brief's surprise-found-inline rule.

The drift instrumentation (#4) was a user-requested follow-on after the same live-run loop surfaced the wire-shape mismatch — both bugs were the kind that "silent no-op on unknown event" hides for months until a live capture forces diagnosis. The instrumentation surfaces the next instance of the same class empirically.

---

## Files changed (cumulative across all 4 commits)

| Path | Change |
|---|---|
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/common.ts` | Shared `UNRECOGNIZED_EVENT_WARN_TAG` constant + `formatUnrecognizedEventPayloadPreview()` helper (200-char cap, newlines collapsed, `<no payload>` empty marker) |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` | item_id→call_id correlation; `RECOGNIZED_OPENAI_RESPONSES_EVENTS` allowlist (50+ entries); per-stream warn-on-unknown with stable prefix + payload preview |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts` | `buildOpenAiContinuation` emits `call_id` (was `id`) on function_call input items |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` | `RECOGNIZED_ANTHROPIC_EVENTS` allowlist; per-stream warn-on-unknown with stable prefix + payload preview; TSDoc reordered so translator function's doc is adjacent |
| `libraries/ts-extras/src/test/unit/ai-assist/streamingAdapters.test.ts` | Fixture-shape corrections (item_id, not call_id) + 3 new reasoning-flow tests asserting the actual emitted `IAiStreamEvent` sequence |
| `libraries/ts-extras/src/test/unit/ai-assist/streamingAdaptersDriftInstrument.test.ts` | **NEW**: 8 tests covering both adapters' drift-instrument behavior (warn-on-unknown, dedup-per-name, no-warn-for-recognized, no-logger no-op, stable-prefix assertion, parsed-JSON preview, 200-char truncation with ellipsis, `<no payload>` marker) — extracted to its own file so the main test file stays under the 2000-line cap |
| `libraries/ts-extras/src/test/unit/ai-assist/clientToolContinuationBuilder.test.ts` | Fixture-shape corrections (item_id, not call_id); added explicit `call_id` correlation assertions for the OpenAI continuation messages |
| `samples/testbed/src/scenarios/geminiClientTools/index.ts` | Dropped `web_search` from tool list; gate matrix updated (2 N/A gates with provider-constraint rationale); module header rewritten |

`libraries/ts-extras/etc/ts-extras.api.md` was not changed — all edits were to internal implementation and tests, public API surface unchanged.

## Commits on this branch (chronological)

1. `c358e64ee` — fix: item_id↔call_id correlation + continuation call_id + initial drift instrumentation
2. `47fe1a738` — fix: stable `ai-assist:unrecognized-event` warn-tag prefix + correct SDK provenance (Copilot round 1)
3. `03e6da5e8` — docs: reorder Anthropic translator TSDoc + remove unresolved cross-file `@link` (Copilot round 2)
4. `68361acf1` — feat: drift warning includes payload preview for empirical triage (Copilot round 3)

---

## L37 sequence

Followed: scenario-driven tests → `code-reviewer` agent pass → coverage-gap closure → Copilot review loop.

**Code-reviewer (internal) pass summary:**
- **P1:** None.
- **P2:** Imperative `if (!result.isSuccess()) return;` extraction pattern in new reasoning-flow tests. **Disposition:** the new tests follow the established convention in `streamingAdapters.test.ts` (every existing test in this file uses the same shape). A whole-file refactor to `toSucceedAndSatisfy` is out of scope for this stream.
- **P3:** Multi-call test fixture used identical id/call_id values. **Disposition:** the new reasoning-flow tests explicitly cover the `item.id (fc_*) !== item.call_id (call_*)` case, which is the load-bearing path that actually appears live.

Coverage closure ran AFTER the review pass. Final coverage in `@fgv/ts-extras`: **100% statements / branches / functions / lines** on every changed file.

**Copilot review loop (external) — converged after 3 substantive rounds + 1 convergence check.** Findings progression 3 → 1 → 2 → 0. Every finding across all rounds changed runtime or doc correctness; no nitpicks.

- **Round 1** (`c358e64ee`): missing `ai-assist:unrecognized-event` filter prefix on warnings (both adapters) + `@anthropic-ai` copy-paste error in OpenAI Responses allowlist provenance. Resolved in `47fe1a738`: shared `UNRECOGNIZED_EVENT_WARN_TAG` constant; corrected provenance to `openai-node`.
- **Round 2** (`47fe1a738`): allowlist TSDoc + const orphaned the translator function's TSDoc in `anthropic.ts`; cross-file `{@link RECOGNIZED_OPENAI_RESPONSES_EVENTS}` pointed at unexported symbol. Resolved in `03e6da5e8`: reordered to match `openaiResponses.ts` structure; in-file `@link` to `RECOGNIZED_ANTHROPIC_EVENTS` resolves.
- **Round 3** (`03e6da5e8`): warning includes event name but no payload preview → drift triage requires re-running under debugger. Resolved in `68361acf1`: shared `formatUnrecognizedEventPayloadPreview()` helper (200-char cap, newlines collapsed, `<no payload>` for empty); embedded in both adapters' warnings.
- **Round 4** (`68361acf1`): **zero new comments — convergence.** Stop signal was natural convergence, not the 10-round cap.

---

## Gates

- [x] `rushx build` passes in `@fgv/ts-extras` and `@fgv/testbed`
- [x] `rushx lint` passes (no warnings) in both packages
- [x] `rushx test` passes with **100% coverage** in `@fgv/ts-extras` (1502 passing — three extra after the Copilot-driven payload-preview tests)
- [x] `rushx test` passes in `@fgv/testbed` (143 passing)
- [x] `rushx fixlint` run before final commit
- [x] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% coverage (L37)
- [x] Copilot review loop driven; converged after 3 substantive rounds (no nitpicks; loop ended on natural convergence, not the 10-round cap)
- [x] Live re-run of all four scenarios — all PASS
- [x] No behavior change for non-reasoning OpenAI streams (existing `gpt-4o` tests pass unmodified)
- [x] No behavior change for Anthropic adapter (regression scenario PASS)

---

## Follow-up findings filed

| File | Status |
|---|---|
| `findings/inbox/2026-06-05-openai-continuation-missing-call_id.md` | **RESOLVED inline** in this PR (surprise found mid-loop; brief allows file-and-decide) |

The original `findings/inbox/2026-06-04-openai-xai-empty-completion.md` (filed by the prior stream) is **RESOLVED by this PR** — root cause was the item_id↔call_id correlation bug, not budget exhaustion. Confirmed by live runs producing non-empty completions on both OpenAI and xAI.

No follow-up findings filed for `ai-assist-thinking-events` — reasoning content surfacing remains out-of-scope per the brief, and the drift instrument now surfaces the underlying reasoning_summary_* events the next time someone wants to consume them.

---

## Cluster ready for close-out PR

This stream concludes the `per-provider-testbed-scenarios` cluster. The cluster's exit gate — "all four client-tool scenarios reach PASS or document N/A for known provider-constraint divergences on live re-run" — is met.

**No further sub-streams are needed.** The orchestrator can open the cluster-close PR (integration → release) bundling artifact migration for all sub-streams' substrates.
