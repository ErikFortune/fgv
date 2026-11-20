# `ai-assist-cross-provider-continuation` — state

**Stream:** `ai-assist-cross-provider-continuation`
**Parent cluster:** `per-provider-testbed-scenarios`
**Integration branch (shared with cluster):** `per-provider-testbed-scenarios`
**Status:** implementation complete 2026-06-04 — all gates green, awaiting PR open against integration branch

---

## Why this stream exists (1-line)

PR #453 (testbed scenarios) is paused: the library only forwards `continuationMessages` for Anthropic; OpenAI / Gemini / xAI silently drop them. This stream extends continuation wire-forwarding to all four providers so the testbed PR's continuation gate validates end-to-end on its next live run.

Full diagnosis: `.ai/tasks/active/per-provider-testbed-scenarios/findings/inbox/2026-06-04-continuation-roundtrip-anthropic-only.md` (on branch `claude/magical-newton-S53ZO`).

---

## Phases

### Phase 1 — Read surface
- [x] Read the finding doc + prior-cluster continuation-wire-position finding
- [x] Read Anthropic reference (`callAnthropicStream` + `buildAnthropicMessages` + `executeClientToolTurn`'s `anthropic` arm)
- [x] Read OpenAI Responses + Gemini adapters
- [x] Confirm `IBuildMessagesOptions.rawTail` declared but unused outside Anthropic
- [x] Confirm xAI routes through OpenAI via `apiFormat: 'openai'` (registry.ts `xai-grok` descriptor line 229–233)

### Phase 2 — OpenAI path
- [x] `callOpenAiResponsesStream` signature widening (add `continuationMessages?`)
- [x] `buildMessages` consumes `rawTail`, emits `function_call` + `function_call_output` tail items (verbatim)
- [x] Unit test: request body carries the reconstructed wire items

### Phase 3 — Gemini path
- [x] `callGeminiStream` signature widening (add `continuationMessages?`)
- [x] `buildGeminiContents` consumes `rawTail`, emits model `functionCall` parts + user `functionResponse` parts at the tail
- [x] Unit test: request body carries the reconstructed wire items

### Phase 4 — Switch wiring
- [x] `executeClientToolTurn`'s `openai` arm forwards `continuationMessages`
- [x] `executeClientToolTurn`'s `gemini` arm forwards `continuationMessages`
- [x] Unit test confirms xAI inherits the fix via OpenAI routing (end-to-end through `executeClientToolTurn`)

### Phase 5 — Code review + coverage closure
- [x] `code-reviewer` agent run on the diff BEFORE chasing 100% coverage (L37)
- [x] Findings resolved or dispositioned (1 P1 + 3 P2 + 2 P3 — see result.md)
- [x] 100% coverage closed (no new `c8 ignore` directives)
- [x] `rushx fixlint` run

### Phase 6 — Final gates + PR
- [x] `rushx build` PASS
- [x] `rushx lint` PASS (no warnings)
- [x] `rushx test` PASS with 100% coverage
- [x] `etc/ts-extras.api.md` — re-run API Extractor produced no diff (all changes `@internal`; public surface unchanged)
- [ ] PR opens against `per-provider-testbed-scenarios` integration branch (not opened by agent — see result.md "Branch/PR note")
- [ ] Copilot loop driven; stopped on diminishing returns or 10-round cap (pending PR)

---

## Decisions made

- **OpenAI rawTail items appended verbatim, not projected.** OpenAI Responses
  continuation items (`function_call` / `function_call_output`) are a `type`-keyed
  discriminated union whose fields differ per item; projecting to `{ role, content }`
  (the Anthropic shape) would drop the distinguishing fields. The `openAiRawTailItemConverter`
  guards only that each entry is a JSON object and preserves it whole.
- **Gemini rawTail items projected to `{ role, parts }`.** Gemini turns carry all
  payload in `parts`; the converter narrows `role` to `'user' | 'model'` and validates
  `parts` is an array (typed `unknown[]` — `Array.isArray` cannot soundly assert a
  richer element type, and the array is serialized verbatim anyway).
- **`buildMessages` return type widened to `Array<Record<string, unknown>>`** to hold
  both `{ role, content }` messages and the heterogeneous OpenAI input items. Verified
  safe: no caller indexes `.role`/`.content` on the result (all spread it into the body).
- **Kept the imperative `expect(...).toSucceed(); if (!isSuccess) return; await collect(...)`
  test shape** (P2 disposition) — parallels the established Anthropic continuation test
  (`streamingAdapters.test.ts`), whose post-success step is an async stream consumption
  that does not fit a sync `toSucceedAndSatisfy` callback. Sibling consistency + the
  brief's "parallel the Anthropic test pattern" directive.

---

## Follow-up findings filed

(none — the change matched the brief's sketched shape exactly; no ambiguity surfaced.)
