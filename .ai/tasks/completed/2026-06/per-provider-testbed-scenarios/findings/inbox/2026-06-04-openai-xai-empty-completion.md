# Finding: OpenAI & xAI client-tool scenarios return an empty completion (no visible answer, client tool never fires)

**Date:** 2026-06-04
**Surfaced by:** `per-provider-testbed-scenarios` stream — live runs of `openai-client-tools` and `xai-client-tools`
**Library:** `@fgv/ts-extras/ai-assist` (suspected) — possibly consumer-side config
**Severity:** P1 if confirmed — the scenarios never reach a usable answer; client tools do not fire
**Disposition:** **RESOLVED** by the `ai-assist-responses-reasoning-events` stream (closeout PR on `chore/ai-assist-reasoning-events-and-closeout`, 2026-06-05). Root cause was NOT budget exhaustion — it was an `item_id ↔ call_id` correlation bug in the OpenAI Responses streaming adapter (delta/done events carry only `item_id`; the adapter looked up by `call_id` and silently no-op'd). The leading "incomplete completion" hypothesis was wrong: live captures confirmed `status: 'completed'`, not `'incomplete'`. A latent second bug in the continuation builder (emitting `id` instead of required `call_id` on function_call input items) surfaced live the moment the adapter fix made function_call events flow through; both were fixed together in the closeout PR. All four scenarios (Anthropic / OpenAI / xAI / Gemini) now PASS on live re-run.

---

## What was observed (live)

Both runs returned HTTP 200, completed cleanly (no stream error, no 4xx), but produced **no visible answer**:

- **OpenAI (`gpt-5.1`, `reasoning.effort=low`):** zero text, zero client-tool calls, zero server-tool events, `continuation present: false`. Completely empty.
- **xAI (`grok-4.3`, `reasoning.effort=low`):** **web_search server tool fired** (tool-event observed) but the model emitted **no final text** and **never called the `recall_memory` client tool**.

Common thread across both: a reasoning model completes the stream with **no final assistant message and no client-tool invocation**.

## A second defect masked the first (already fixed on this branch)

The scenarios originally hardcoded `scenario: PASS` and discarded the turn outcome's `truncated`/`fullText` signals, so these empty completions were reported as PASS — a false positive. Fixed in commit `2af21845`: the verdict is now computed (PASS requires final text AND a non-truncated completion), and the summary surfaces `Response truncated (status=incomplete): true|false`, the response length, and a `DIAGNOSIS:` line. That fix is also the diagnostic instrument for this finding.

## Leading hypothesis (pending confirmation)

The signature — reasoning model, clean completion, no visible message, client tool never fires, xAI even runs its server tool first — is the classic **`status: "incomplete"` (truncated) response**: the reasoning step (plus xAI's web_search step) consumes the output-token budget before the model emits the visible answer. The library already captures this as `firstTurnOutcome.truncated` (set from `response.status === 'incomplete'` at `openaiResponses.ts:281`); the scenario was simply discarding it.

Ruled out by code inspection:
- **Not an SSE/stream-termination bug** — `readSseEvents` reads to stream end correctly, and xAI surfacing `web_search` events proves the SSE framing parses.
- **Not tools-not-merged** — client tools are merged into the request (`clientToolContinuationBuilder.ts:418`).
- **Not adapter mis-parse** — `output_text.delta`, `output_item.added`/`function_call`, and `web_search_call.*` are all handled.

## Confirming step (one live re-run)

Re-run after `rush build --to @fgv/testbed`; read the new `Response truncated (status=incomplete): …` line:

- **`true` → confirmed budget exhaustion.** Fix is **consumer-side, no library change required**: the OpenAI Responses adapter already merges `resolvedThinking.otherParams` into the request body (`openaiResponses.ts:345`), so the scenarios can pass `otherParams: { max_output_tokens: <N> }`. (Optional library improvement: have the adapter apply a sane default `max_output_tokens` for reasoning models so naive consumers don't silently truncate — a usability gap, not strictly a bug.)
- **`false` but still empty → genuine provider/adapter gap.** The model produced no message text after using tools/reasoning. This would be a deeper `@fgv/ts-extras/ai-assist` investigation.

## Library diagnostic gap (independent of which branch above is true)

`responsesCompletedPayload` (`openaiResponses.ts:162`) captures only `response.status` — it discards `incomplete_details.reason` (e.g. `max_output_tokens` vs `content_filter`). Extending the validator to capture `incomplete_details.reason` and surfacing it on the `done` event would make this entire class of "completed but empty" failure self-explaining instead of requiring inference. Recommended additive library improvement regardless of root cause.

## Impact on this stream

The OpenAI and xAI scenarios cannot report a clean PASS until the empty-completion cause is resolved (config or library). The reporting fix ensures they now FAIL honestly instead of masking it. This is the empirical safety net working as designed — the third wire/behavior issue surfaced by this stream's live runs (after the Anthropic-only continuation forwarding fixed in PR #454, and the Gemini `additionalProperties` 400).
