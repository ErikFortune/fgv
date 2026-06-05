# `ai-assist-responses-reasoning-events` — stream brief (cluster closeout)

**Status:** ready to commission (Erik runs locally with API keys)
**Workflow shape:** `stream` — closeout sub-stream for the `per-provider-testbed-scenarios` cluster
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-reasoning-events-and-closeout`

This is the **closeout** stream for the cluster. After this lands, the cluster-close PR (integration → release) opens with no further sub-streams expected.

The stream's headline value is **structural**, not just bug-fix: it makes the streaming adapters **self-diagnosing** so future wire-shape gaps surface visibly without empirical-detective work. The current bug (reasoning-mode events silently dropped on OpenAI / xAI) is the motivation; the fix is architectural.

---

## Why this stream exists

The cluster's empirical live runs (now armed with PR #457's `incompleteReason` diagnostic) surfaced three remaining issues. The OpenAI / xAI one is symptomatic of a deeper structural blind spot.

### Issue 1 (library; structural) — Streaming adapters silently drop unknown event types

Live runs of OpenAI and xAI scenarios produce **empty completions, NOT truncated**:

| Provider | Model | Status | Truncated | Final text | Client tool fires | Server tool events |
|---|---|---|---|---|---|---|
| OpenAI | `gpt-5.1` (reasoning low) | completed | false | 0 chars | 0 | 0 |
| xAI | `grok-4.3` (reasoning low) | completed | false | 0 chars | 0 | **4** (`web_search` fired twice) |

xAI is the smoking gun: `web_search_call.*` events parse correctly (4 fire), but text and `function_call` events are silent on both providers. Both go through `callOpenAiResponsesStream` (xAI via `apiFormat: 'openai'`). The events for reasoning-model final output and function calls are coming through the wire — the adapter just doesn't have handlers for them and **drops them silently**.

This isn't a one-off bug. **The adapters' silent-drop default makes every future provider-API evolution invisible until a consumer notices.** The structural fix is to **log unknown event types as warnings** so the next gap surfaces immediately when it appears, without an empirical-detective cycle. The current reasoning-mode gap then becomes self-explaining: run the scenario, the warnings name the event types, add handlers.

### Issue 2 (testbed) — Gemini scenario combines grounding + client tools, which Gemini forbids

Gemini's live run fails with HTTP 400:

```
"Built-in tools ({google_search}) and Function Calling cannot be combined in the same request. Please choose one to continue."
```

Gemini API constraint, **not a library bug**. The Gemini scenario should drop `web_search` and exercise client tool only.

---

## Mission

Land all the following in **one PR** so the cluster closes out cleanly:

1. **STRUCTURAL: warn on unrecognized events across all three streaming adapters** (`anthropic.ts` / `gemini.ts` / `openaiResponses.ts`). At each adapter's event-dispatch site, the default arm (no handler matches) logs a warn via the injected `ILogger`, including the event type name, a payload summary, and the provider id. The stream continues processing the next event normally — warn is diagnostic, not fatal. This makes the adapters **self-diagnosing**: the next wire-shape gap surfaces immediately as a warn in the consumer's logs.

   - Distinguish **unrecognized** events (no handler) from **intentionally discarded** events (handler exists, drops by design — e.g. thinking-content events today). Warn only on unrecognized.
   - Use a specific warn-tag prefix like `ai-assist:unrecognized-event` so deployments can filter/escalate selectively.
   - Inject `ILogger` via the existing adapter call signature if already wired; otherwise additive injection via `IStreamApiConfig` (small additive change, no consumer impact).

2. **DIAGNOSTIC: use the new instrumentation as your own debugging loop.** Run the OpenAI / xAI scenarios live with the warn-instrumented adapter. The warnings name the actual event types reasoning models emit. No documentation research needed — empirical names captured directly.

3. **HANDLERS: add reasoning-mode event handlers** to `openaiResponses.ts` for whatever event types the warnings surface (final text + function calls when reasoning is active). xAI inherits via `apiFormat: 'openai'`.

4. **TESTBED: drop `web_search` from `samples/testbed/src/scenarios/geminiClientTools/index.ts`** and mark "Server + client tool coexistence" as N/A for Gemini.

5. **LIVE VERIFICATION:** all four scenarios pass on a final re-run. Per-scenario gate-matrix outcome in `result.md`.

You have API keys via Erik's local environment. The testbed scenarios are your diagnostic instrument — run live as part of the fix loop, not only at the end.

---

## In scope

| Surface | Change shape |
|---|---|
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` | ✅ — warn-on-unknown + add reasoning-mode handlers for final text + function calls |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` | ✅ — warn-on-unknown only (no handler additions; Anthropic already works end-to-end). Symmetric structural change. |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts` | ✅ — warn-on-unknown only. Symmetric structural change. |
| `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/common.ts` (or wherever `IStreamApiConfig` lives) | ⚠️ only if a logger field is not already there; additive injection is the only allowed change |
| `libraries/ts-extras/src/packlets/ai-assist/model.ts` | ⚠️ only if new `IAiStreamEvent` event types are required to surface the reasoning-mode handlers |
| `samples/testbed/src/scenarios/geminiClientTools/index.ts` | ✅ — drop `web_search`, update gate matrix |
| `samples/testbed/src/scenarios/openaiClientTools/index.ts` / `xaiClientTools/index.ts` / `anthropicClientTools/index.ts` | ⚠️ untouched unless the reasoning-events fix surfaces a real scenario adjustment (file a finding first) |
| Tests | ✅ — per-adapter: unknown-event triggers warn + stream continues. Plus reasoning-mode SSE fixtures for `openaiResponses.ts` asserting actual emitted `IAiStreamEvent` sequence (per L37) |
| `libraries/ts-extras/etc/ts-extras.api.md` | ✅ — regenerate; commit. Expected: no public-surface diff (or one additive field if `IStreamApiConfig.logger?` needs introducing — name it in PR description) |
| Anything else | ❌ |

---

## Out of scope

- **Surfacing reasoning/thinking content** as caller-visible events. Separate `ai-assist-thinking-events` followup. Current adapters discard thinking content by design — just don't crash on reasoning events, surface text and function calls correctly. The warn-on-unknown rule **does not** apply to events the adapter intentionally discards.
- **Anthropic-side handler changes** — Anthropic works end-to-end; the warn-on-unknown instrumentation is structural only.
- **Library default `max_output_tokens`** for reasoning models — usability call queued in FUTURE.md.
- **Pre-emptive provider-constraint validation** (e.g. fail-fast on Gemini grounding + client tool combination at the consumer side) — separate FUTURE.md item; not in this stream.
- **`@fgv/ts-prompt-assist`** — different library, unaffected.
- **Any non-`@fgv/ts-extras/ai-assist` and non-`@fgv/testbed` package.**

---

## Required reading + research

1. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/`** — all three adapters. Internalize their event-dispatch shapes. Confirm where the "default arm" goes today and how to add a warn-log site without breaking the next-event-processing flow.
2. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/common.ts`** — confirm whether an `ILogger` is already wired through `IStreamApiConfig`. If yes, use it. If not, design an additive injection (no consumer impact when absent — fall back to a `NoOpLogger` per the `ts-utils-logging` conventions).
3. **`@fgv/ts-utils` logging surface** (`/ts-utils-logging` skill) — `ILogger.warn(...)` semantics; how to format structured warns with a stable tag prefix.
4. **`.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-openai-xai-empty-completion.md`** — the original finding. PR #457's `incompleteReason` ruled out truncation; this stream's instrumentation surfaces what's actually happening.
5. **`.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-gemini-tool-schema-additionalproperties.md`** — historical context for Issue 2.
6. **`samples/testbed/src/scenarios/anthropicClientTools/index.ts`** — the working reference for the Gemini scenario fix's gate-matrix style.
7. **`.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md`** — L37 reference observation. Tests must verify actual emitted stream events from realistic SSE fixtures, not just call success.

---

## Live-run diagnostic instrument

**You have API keys via Erik's local environment.** Use the testbed scenarios as your diagnostic loop:

```bash
cd samples/testbed
node bin/testbed.js --scenario anthropic-client-tools  # regression check
node bin/testbed.js --scenario openai-client-tools
node bin/testbed.js --scenario gemini-client-tools
node bin/testbed.js --scenario xai-client-tools
```

After landing the warn-on-unknown instrumentation, run the OpenAI / xAI scenarios — the warn-logs name the actual event types reasoning models emit. Use those names to design the handlers. This is the empirical alternative to documentation research.

If reasoning-mode events emit in batches (multiple unrecognized types in one stream), the agent decides which to handle now (final text + function calls — in-scope) vs which to defer (e.g. reasoning content blocks — out of scope, file finding for `ai-assist-thinking-events`).

---

## L37 reminder (load-bearing)

`code-reviewer` agent runs on the cumulative diff **BEFORE** chasing 100% measured coverage. Sequence: scenario-driven functional tests → `code-reviewer` pass → coverage-gap closure. Reference observation: `.ai/tasks/completed/2026-06/ai-assist-client-tools/README.md`. The prior cluster reached 100% on tests that mocked the response side and never validated the request body. **Your tests for the reasoning-events fix must assert the actual emitted stream events from realistic mocked SSE payloads, AND the warn-on-unknown tests must verify the warn-log actually fires with the correct tag + content.**

---

## Acceptance criteria

- [ ] All three streaming adapters log a warn on unrecognized events with stable tag prefix (e.g. `ai-assist:unrecognized-event`), event type name, payload summary, provider id.
- [ ] Stream processing continues normally after a warn-logged unknown event (warn is diagnostic, not fatal).
- [ ] Intentionally discarded events (thinking content today) do NOT trigger warns. Documented in each adapter's TSDoc.
- [ ] `callOpenAiResponsesStream` handles reasoning-mode event types for final text + function calls. gpt-5.1 / grok-4.3 streams emit text deltas + `client-tool-call-*` events.
- [ ] No behavior change for non-reasoning OpenAI streams (existing `gpt-4o` test coverage passes unmodified).
- [ ] No behavior change for Anthropic or Gemini adapters (handler-set unchanged; only the warn-instrumentation is new).
- [ ] Gemini scenario file: `web_search` removed from tool list; gate matrix updated to mark coexistence N/A.
- [ ] Live runs: all four scenarios reach PASS (or document N/A for known provider-constraint divergences). Per-scenario gate matrix in `result.md`.
- [ ] **Per-adapter warn-on-unknown unit test** (drives an SSE fixture with an unknown event type; asserts the warn fires with the expected tag + content; asserts the stream continues processing). One per adapter (3 tests).
- [ ] **Reasoning-mode SSE fixture tests** for `openaiResponses.ts` — assert actual emitted `IAiStreamEvent` sequence (text deltas + function_call_done events at correct positions). Per L37.
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in `@fgv/ts-extras`.
- [ ] `rushx build` / `rushx lint` / `rushx test` PASS in `@fgv/testbed`.
- [ ] `rushx fixlint` run before final commit.
- [ ] **`code-reviewer` agent runs on the cumulative diff BEFORE 100%-coverage closure** (L37).
- [ ] `etc/ts-extras.api.md` regenerated; committed. (Expected: no public-surface diff. If `IStreamApiConfig.logger?` needs introducing, name it in the PR description.)
- [ ] PR opens against the `per-provider-testbed-scenarios` integration branch (NOT `release`).
- [ ] Finding doc `findings/inbox/2026-06-04-openai-xai-empty-completion.md` updated with disposition: RESOLVED by this PR.

---

## Exit artifact shape

- `state.md` — phase-by-phase progress + decisions
- `result.md` — what shipped, files changed, code-reviewer pass summary, **per-scenario live-run gate matrix**, any reasoning-content follow-up findings filed for the `ai-assist-thinking-events` future stream
- `result.md` ends with explicit **"cluster ready for close-out PR"** signal

Artifact migration to `completed/2026-06/` is the cluster-close PR's job (orchestrator's), not this stream's.

---

## Branching

This is the **closeout** sub-stream of the cluster.

- **Integration branch (cluster):** `per-provider-testbed-scenarios`
- **Your work branch:** `chore/ai-assist-reasoning-events-and-closeout` (this branch — already created with this brief committed)
- **PR target:** `per-provider-testbed-scenarios` integration branch — NOT `release`.
- **After this PR merges:** orchestrator opens cluster-close PR (integration → release) bundling artifact migration for all sub-streams' substrates.

---

## Cluster-close handoff

When you finish, your final state-update should explicitly note **"cluster ready for close-out PR"** so the orchestrator knows to open the integration → release promotion next. Include in `result.md`:

- The four-scenario live-run gate matrix outcome (PASS/N/A per provider).
- The warn-on-unknown event-type names captured during your debug loop (these are useful documentation for future-provider-API watchers).
- Any follow-up findings filed (e.g. for `ai-assist-thinking-events`, or any pre-emptive provider-constraint validation work to queue).
- Confirmation that no further sub-streams are needed.

---

## Missing-input rule

If anything is ambiguous, STOP and surface it. Specifically: if the warn-instrumentation surfaces an event class that's structurally larger than just-final-text-and-function-calls (e.g. reasoning models also restructure server-tool events in a way that breaks the existing xAI path), file a finding and ping Erik — don't unilaterally widen the handler set beyond final text + function calls.

---

## Resume protocol

Standard: read `state.md`, resume at the next phase boundary.
