# `ai-assist-responses-reasoning-events` — state (cluster closeout)

**Stream:** `ai-assist-responses-reasoning-events`
**Role in cluster:** **closeout** — bundles library fix + Gemini scenario fix + live-run verification so cluster-close PR can open
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Work branch:** `chore/ai-assist-reasoning-events-and-closeout`
**Status:** commissioned 2026-06-05 — Erik runs locally with API keys

---

## Phases

### Phase 1 — Read surface
- [ ] Read all four required-reading items in `brief.md`
- [ ] Research OpenAI Responses API reasoning-mode event types via published docs + `openai-node` SDK source
- [ ] Confirm xAI uses same event family as OpenAI

### Phase 2 — Library fix (`openaiResponses.ts`)
- [ ] Add reasoning-mode event handlers for final text + function calls
- [ ] Verify no behavior change for non-reasoning OpenAI streams
- [ ] Unit tests: realistic SSE fixtures + assert actual emitted `IAiStreamEvent` sequence

### Phase 3 — Live re-runs (library only)
- [ ] OpenAI live re-run → expected: non-empty completion
- [ ] xAI live re-run → expected: non-empty completion; web_search events still work
- [ ] If anything unexpected: file finding, decide whether to continue or pause

### Phase 4 — Gemini scenario fix
- [ ] Drop `web_search` from `samples/testbed/src/scenarios/geminiClientTools/index.ts`
- [ ] Mark "Server + client tool coexistence" as N/A in the gate matrix

### Phase 5 — Live re-runs (full suite)
- [ ] Anthropic (regression)
- [ ] OpenAI
- [ ] Gemini
- [ ] xAI
- [ ] Record per-scenario outcomes in `result.md`

### Phase 6 — Code review + coverage closure
- [ ] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% coverage (L37)
- [ ] Findings resolved or dispositioned
- [ ] 100% coverage closed
- [ ] `rushx fixlint` run

### Phase 7 — Final gates + PR
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in `@fgv/ts-extras`
- [ ] `rushx build` / `rushx lint` / `rushx test` PASS in `@fgv/testbed`
- [ ] `etc/ts-extras.api.md` regenerated; committed
- [ ] Finding doc disposition updated
- [ ] `result.md` records per-scenario live-run outcomes + "cluster ready for close-out PR"
- [ ] PR opens against `per-provider-testbed-scenarios` integration branch
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap

---

## Decisions made

(empty — agent records architectural decisions here)

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
