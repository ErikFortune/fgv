# `ai-assist-responses-reasoning-events` — state (cluster closeout)

**Stream:** `ai-assist-responses-reasoning-events`
**Role in cluster:** **closeout** — bundles structural warn-on-unknown-event instrumentation + reasoning-mode handler additions + Gemini scenario fix + live-run verification so cluster-close PR can open
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-reasoning-events-and-closeout`
**Status:** commissioned 2026-06-05 (revised to instrument-on-unknown approach) — Erik runs locally with API keys

---

## Headline

The cluster's empirical loop surfaced that the streaming adapters silently drop unknown events — a structural blind spot that explains the current OpenAI/xAI reasoning bug AND will mask the next provider-API evolution unless addressed. This stream:

1. Instruments all three adapters (Anthropic, Gemini, OpenAI Responses) with **warn-on-unrecognized-event**.
2. Uses the instrumentation as the agent's own diagnostic loop to identify what reasoning-mode events look like on gpt-5.1 / grok-4.3.
3. Adds handlers for those events (final text + function calls).
4. Drops `web_search` from the Gemini scenario (provider API forbids grounding + function calling combined).
5. Verifies all four scenarios on live re-run.

---

## Phases

### Phase 1 — Read surface
- [ ] Read brief.md (the revised instrument-on-unknown contract)
- [ ] Read all three streaming adapters; identify the default arm in each event-dispatch site
- [ ] Confirm `IStreamApiConfig` logger wiring (additive injection if absent; `NoOpLogger` default)
- [ ] Read the `/ts-utils-logging` skill conventions
- [ ] Read the two openai/xai + gemini finding docs for historical context

### Phase 2 — Structural: warn-on-unknown across all three adapters
- [ ] Anthropic adapter: warn-on-unknown at default-arm; distinguish unrecognized from intentionally discarded
- [ ] Gemini adapter: same
- [ ] OpenAI Responses adapter: same
- [ ] Stable warn-tag prefix (`ai-assist:unrecognized-event` or chosen variant) across all three
- [ ] Per-adapter unit test: unknown event triggers warn + stream continues processing

### Phase 3 — Diagnostic loop (uses Phase 2 instrumentation)
- [ ] Live-run OpenAI scenario; capture warn-logged event type names
- [ ] Live-run xAI scenario; capture warn-logged event type names
- [ ] Decide which events are in-scope (final text + function calls) vs out-of-scope (reasoning content — file finding for `ai-assist-thinking-events`)
- [ ] Record captured event names in `result.md` (useful documentation for future-provider-API watchers)

### Phase 4 — Handlers for the in-scope reasoning-mode events
- [ ] OpenAI Responses adapter: add handlers for the captured event types (final text + function calls)
- [ ] Verify xAI inherits via `apiFormat: 'openai'` routing
- [ ] Realistic SSE fixture tests asserting actual emitted `IAiStreamEvent` sequence

### Phase 5 — Live re-runs (library only)
- [ ] OpenAI live re-run → expected: non-empty completion + (if model decides to call recall_memory) client-tool-call-done events
- [ ] xAI live re-run → expected: non-empty completion; web_search events still work; same client-tool expectations

### Phase 6 — Gemini scenario fix
- [ ] Drop `web_search` from `samples/testbed/src/scenarios/geminiClientTools/index.ts`
- [ ] Mark "Server + client tool coexistence" as N/A in the gate matrix

### Phase 7 — Live re-runs (full suite)
- [ ] Anthropic (regression)
- [ ] OpenAI
- [ ] Gemini
- [ ] xAI
- [ ] Record per-scenario outcomes in `result.md`

### Phase 8 — Code review + coverage closure
- [ ] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% coverage (L37)
- [ ] Findings resolved or dispositioned
- [ ] 100% coverage closed
- [ ] `rushx fixlint` run

### Phase 9 — Final gates + PR
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in `@fgv/ts-extras`
- [ ] `rushx build` / `rushx lint` / `rushx test` PASS in `@fgv/testbed`
- [ ] `etc/ts-extras.api.md` regenerated; committed
- [ ] Finding doc disposition updated
- [ ] `result.md` records per-scenario live-run outcomes + captured event-type names + "cluster ready for close-out PR"
- [ ] PR opens against `per-provider-testbed-scenarios` integration branch
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap

---

## Decisions made

(empty — agent records architectural decisions here)

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
