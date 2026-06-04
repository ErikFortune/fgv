# `ai-assist-cross-provider-continuation` — state

**Stream:** `ai-assist-cross-provider-continuation`
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Status:** commissioned 2026-06-04 — awaiting agent kickoff

---

## Why this stream exists (1-line)

PR #453 (testbed scenarios) is paused: the library only forwards `continuationMessages` for Anthropic; OpenAI / Gemini / xAI silently drop them. This stream extends continuation wire-forwarding to all four providers so the testbed PR's continuation gate validates end-to-end on its next live run.

Full diagnosis: `.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-continuation-roundtrip-anthropic-only.md` (on branch `claude/magical-newton-S53ZO`).

---

## Phases

### Phase 1 — Read surface
- [ ] Read the finding doc + prior-cluster continuation-wire-position finding
- [ ] Read Anthropic reference (`callAnthropicStream` + `buildAnthropicMessages` + `executeClientToolTurn`'s `anthropic` arm)
- [ ] Read OpenAI Responses + Gemini adapters
- [ ] Confirm `IBuildMessagesOptions.rawTail` declared but unused outside Anthropic
- [ ] Confirm xAI routes through OpenAI via `apiFormat: 'openai'`

### Phase 2 — OpenAI path
- [ ] `callOpenAiResponsesStream` signature widening (add `continuationMessages?`)
- [ ] `buildMessages` consumes `rawTail`, emits `function_call` + `function_call_output` tail items
- [ ] Unit test: request body carries the reconstructed wire items

### Phase 3 — Gemini path
- [ ] `callGeminiStream` signature widening (add `continuationMessages?`)
- [ ] `buildGeminiContents` consumes `rawTail`, emits model `functionCall` parts + user `functionResponse` parts at the tail
- [ ] Unit test: request body carries the reconstructed wire items

### Phase 4 — Switch wiring
- [ ] `executeClientToolTurn`'s `openai` arm forwards `continuationMessages`
- [ ] `executeClientToolTurn`'s `gemini` arm forwards `continuationMessages`
- [ ] Unit test confirms xAI inherits the fix via OpenAI routing

### Phase 5 — Code review + coverage closure
- [ ] `code-reviewer` agent run on the diff BEFORE chasing 100% coverage (L37)
- [ ] Findings resolved or dispositioned
- [ ] 100% coverage closed
- [ ] `rushx fixlint` run

### Phase 6 — Final gates + PR
- [ ] `rushx build` PASS
- [ ] `rushx lint` PASS (no warnings)
- [ ] `rushx test` PASS with 100% coverage
- [ ] `etc/ts-extras.api.md` regenerated and committed
- [ ] PR opens against `per-provider-testbed-scenarios` integration branch
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap

---

## Decisions made

(empty — agent records architectural decisions here)

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
