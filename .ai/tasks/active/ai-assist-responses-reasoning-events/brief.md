# `ai-assist-responses-reasoning-events` — stream brief (cluster closeout)

**Status:** ready to commission (Erik runs locally with API keys)
**Workflow shape:** `stream` — closeout sub-stream for the `per-provider-testbed-scenarios` cluster
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-reasoning-events-and-closeout`

This is the **closeout** stream for the cluster. After this lands, the cluster-close PR (integration → release) opens with no further sub-streams expected.

---

## Why this stream exists

The cluster's empirical live runs (now armed with PR #457's `incompleteReason` diagnostic) surfaced three issues with the OpenAI / Gemini / xAI client-tool scenarios. Two were closed by PR #454 and PR #457; **three more issues remain**, which this stream closes out together:

### Issue 1 (library) — OpenAI and xAI reasoning-mode events not handled

Live runs of OpenAI and xAI scenarios produce **empty completions, NOT truncated**:

| Provider | Model | Status | Truncated | Final text | Client tool fires | Server tool events |
|---|---|---|---|---|---|---|
| OpenAI | `gpt-5.1` (reasoning low) | completed | false | 0 chars | 0 | 0 |
| xAI | `grok-4.3` (reasoning low) | completed | false | 0 chars | 0 | **4** (`web_search` fired twice) |

xAI is the smoking gun: `web_search_call.*` events parse correctly (4 fire), but text and `function_call` events are silent on both providers. They share `callOpenAiResponsesStream` (xAI via `apiFormat: 'openai'`). Hypothesis: **OpenAI's Responses API emits reasoning-model final text and function calls through additional/different event types** the adapter doesn't recognize.

### Issue 2 (testbed) — Gemini scenario combines grounding + client tools, which Gemini forbids

Gemini's live run fails with HTTP 400:

```
"Built-in tools ({google_search}) and Function Calling cannot be combined in the same request. Please choose one to continue."
```

This is a Gemini API constraint, **not a library bug**. The Gemini scenario should drop `web_search` and exercise client tool only.

### Issue 3 (testbed, possibly) — OpenAI scenario may need a final empty-completion sanity check

Once Issue 1 lands and OpenAI's reasoning streams emit text + function calls correctly, the OpenAI scenario should pass empirically. If not, file as a finding rather than guessing.

---

## Mission

Land all three fixes in **one PR** so the cluster closes out cleanly:

1. **Library fix** — extend `callOpenAiResponsesStream` to recognize reasoning-model event types for final text and function calls. xAI inherits via routing.
2. **Gemini scenario fix** — drop `web_search` from the Gemini scenario's tool list; verify client-tool-only round-trip. Mark "Server + client tool coexistence" as N/A for Gemini (additional to the already-N/A "Server tool events emitted").
3. **Live empirical verification** — Erik runs all four scenarios locally with API keys after the work lands; this stream's `result.md` records the per-scenario outcomes. **You have API keys via Erik's local environment.** Run the scenarios as you fix — that's the diagnostic instrument.

---

## In scope

| Surface | Change shape |
|---|---|
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` | ✅ — recognize and handle reasoning-mode event types for final text + function calls |
| `libraries/ts-extras/src/packlets/ai-assist/model.ts` | ⚠️ only if new `IAiStreamEvent` event types are required to surface the fixed behavior |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` / `gemini.ts` | ❌ untouched |
| `samples/testbed/src/scenarios/geminiClientTools/index.ts` | ✅ — drop `web_search` from the tool list; update the gate matrix to mark "Server + client tool coexistence" as N/A |
| `samples/testbed/src/scenarios/openaiClientTools/index.ts` / `xaiClientTools/index.ts` | ⚠️ untouched unless the reasoning-events library fix surfaces a real scenario adjustment (file a finding if so) |
| `samples/testbed/src/scenarios/anthropicClientTools/index.ts` | ❌ untouched |
| Tests | ✅ — adapter tests for reasoning-mode events (per L37, assert actual emitted events from SSE fixtures) |
| `libraries/ts-extras/etc/ts-extras.api.md` | ✅ — regenerate; commit |
| Anything else | ❌ |

---

## Required reading + research

1. **OpenAI Responses API streaming events documentation** — agent does its own research at https://platform.openai.com/docs/api-reference/responses-streaming. Current adapter handles `output_text.delta`, `output_item.added` (function_call), `web_search_call.*`, and `response.completed`. Find what reasoning models emit in addition / instead.
2. **`openai-node` SDK reasoning-stream handling** — official SDK is authoritative on event-name handling. SDK source lives in `node_modules/openai/` after `rush install`. Useful precedent.
3. **xAI Grok 4 reasoning documentation** — xAI's Responses API surface inherits OpenAI's. Verify grok-4.3 uses the same event family.
4. **`.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-openai-xai-empty-completion.md`** — the original finding. PR #457's `incompleteReason` ruled out the leading "budget exhaustion" hypothesis. This stream is the follow-on root-cause work.
5. **`.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-gemini-tool-schema-additionalproperties.md`** — historical context. The Gemini schema-sanitization fix (PR #457) was prerequisite; the grounding/function-calling exclusion (this stream's Issue 2) is the next layer.
6. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts`** — internalize the current event-handler structure before adding new arms.
7. **`samples/testbed/src/scenarios/anthropicClientTools/index.ts`** — the working reference. The Gemini scenario should diverge in the same controlled way the existing N/A handling does.
8. **`.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md`** — L37 reference observation. Tests must verify actual emitted stream events from realistic SSE fixtures, not just call success.

---

## Live-run diagnostic instrument

**You have API keys via Erik's local environment.** Use the testbed scenarios as your diagnostic loop:

```bash
cd samples/testbed
node bin/testbed.js --scenario openai-client-tools
node bin/testbed.js --scenario gemini-client-tools
node bin/testbed.js --scenario xai-client-tools
node bin/testbed.js --scenario anthropic-client-tools   # regression check
```

After each adapter change, re-run the relevant scenario. The four-scenario suite is the cluster's exit gate; all four should reach PASS (or document N/A where the provider-constraint divergence is intentional).

**If you need raw SSE event types to fix the OpenAI/xAI reasoning issue,** temporarily instrument the adapter (e.g. `console.log(event.event, event.data?.type)` in the SSE reader) to capture event names during a live run. Remove the instrumentation before final commit. This is the empirical alternative to the documentation-only research path.

---

## L37 reminder (load-bearing)

`code-reviewer` agent runs on the cumulative diff **BEFORE** chasing 100% measured coverage. Sequence: scenario-driven functional tests → `code-reviewer` pass → coverage-gap closure. Reference observation: `.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md` — that cluster reached 100% coverage on a test architecture that mocked the response side and never validated the request body. Your tests for the reasoning-events fix must assert the **actual emitted stream events** from realistic mocked SSE payloads.

---

## Out of scope

- **Surfacing thinking/reasoning content as caller-visible events.** Separate `ai-assist-thinking-events` followup stream. Current adapters discard thinking content by design (per the prior cluster's Phase C). Just don't crash on reasoning events here — surface text and function calls correctly; if the simplest fix is to discard reasoning blocks, do that.
- **Anthropic-side anything** — Anthropic already works end-to-end.
- **Library default `max_output_tokens`** for reasoning models — usability call queued in FUTURE.md.
- **Any non-`@fgv/ts-extras/ai-assist` and non-`@fgv/testbed` package.**
- **Scenario edits unrelated to Issue 2** — leave OpenAI/xAI/Anthropic scenarios alone unless the reasoning-events library fix surfaces a real scenario adjustment, in which case file a finding before editing.

---

## Acceptance criteria

- [ ] OpenAI scenario (`gpt-5.1`) live run produces non-empty completion. If the model decides to call `recall_memory`, the client-tool-call-done counter is nonzero. If the model decides not to call it, the final text path is non-empty.
- [ ] xAI scenario (`grok-4.3`) live run produces non-empty completion. The 4-event web_search behavior continues to work. Same client-tool-call expectations as OpenAI.
- [ ] Gemini scenario (`gemini-2.5-flash`) live run completes without HTTP 400; client tool round-trip works end-to-end (with the grounding tool dropped).
- [ ] Anthropic scenario (`claude-sonnet-4-6`) continues to PASS unmodified (regression check).
- [ ] `callOpenAiResponsesStream` handles reasoning-mode event types for final text and function calls.
- [ ] No behavior change for non-reasoning OpenAI streams (existing `gpt-4o` test coverage passes unmodified).
- [ ] No behavior change for Anthropic or Gemini library adapters.
- [ ] **New unit tests** drive realistic reasoning-mode SSE fixtures through the adapter and assert the resulting `IAiStreamEvent` sequence — per L37, assert the actual emitted events, not call-success.
- [ ] Gemini scenario file: `web_search` removed from tool list; gate matrix updated to mark coexistence N/A.
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in `@fgv/ts-extras`.
- [ ] `rushx build` / `rushx lint` / `rushx test` PASS in `@fgv/testbed`.
- [ ] `rushx fixlint` run before final commit.
- [ ] `code-reviewer` agent runs on the cumulative diff BEFORE chasing 100% coverage (L37).
- [ ] `etc/ts-extras.api.md` regenerated; committed.
- [ ] `result.md` records per-scenario outcomes from your local live runs.
- [ ] PR opens against the `per-provider-testbed-scenarios` integration branch (NOT `release`).
- [ ] Finding doc `findings/inbox/2026-06-04-openai-xai-empty-completion.md` updated with disposition: RESOLVED by this PR.

---

## Exit artifact shape

- `state.md` — phase-by-phase progress + decisions made
- `result.md` — what shipped, files changed, code-reviewer pass summary, **per-scenario live-run outcomes**, any reasoning-content follow-up findings for the `ai-assist-thinking-events` future stream

Artifact migration to `completed/2026-06/` is the cluster-close PR's job (orchestrator's), not this stream's.

---

## Branching

This is the **closeout** sub-stream of the cluster. Same integration branch.

- **Integration branch (cluster):** `per-provider-testbed-scenarios`
- **Your work branch:** `chore/ai-assist-reasoning-events-and-closeout` (this branch — already created with this brief committed)
- **PR target:** `per-provider-testbed-scenarios` integration branch — NOT `release`.
- **After this PR merges:** orchestrator opens cluster-close PR (integration → release) bundling artifact migration for all sub-streams' substrates.

---

## Cluster-close handoff

When you finish, your final state-update should explicitly note **"cluster ready for close-out PR"** so the orchestrator knows to open the integration → release promotion next. Include in `result.md`:

- The four-scenario live-run gate matrix outcome (PASS/N/A per provider).
- Any follow-up findings filed (e.g. for `ai-assist-thinking-events`).
- Confirmation that no further sub-streams are needed.

---

## Resume protocol

Standard: read `state.md`, resume at the next phase boundary.
