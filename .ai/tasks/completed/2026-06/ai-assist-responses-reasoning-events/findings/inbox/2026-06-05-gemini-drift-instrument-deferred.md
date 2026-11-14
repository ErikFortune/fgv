# Finding: Gemini-side drift instrumentation deferred — wire shape doesn't carry SSE event names

**Date:** 2026-06-05
**Surfaced by:** `ai-assist-responses-reasoning-events` stream — Phase 5 (drift instrumentation pass)
**Library:** `@fgv/ts-extras/ai-assist/streamingAdapters/gemini.ts`
**Severity:** P3 — future-proofing gap, not a current bug
**Disposition:** **DEFERRED** to a follow-up stream; out of scope for the cluster closeout.

---

## Context

The closeout brief asked for warn-on-unrecognized-event drift instrumentation symmetric across all three streaming adapters (Anthropic, OpenAI Responses, Gemini). The instrumentation landed on Anthropic and OpenAI Responses — both of which use the SSE `event:` field as the dispatch key, where an allowlist of known event names is a natural fit.

## Why Gemini is structurally different

Gemini's `generateContent` streaming response does not emit named SSE events. The wire is JSON chunks (one per server-side chunk), each parsed as `{ candidates: [{ content: { parts: [...] }, finishReason? }] }`. The adapter's dispatch happens **inside** the parsed JSON — handling `parts` items by their `text` / `functionCall` / `executableCode` shape, and `candidates[i].finishReason` for the terminal state.

The unknown-event allowlist concept does not translate directly. There are no event names to allowlist; there are JSON sub-shapes to dispatch on.

## What the structural alternative would look like

The same goal — warn empirically the next time the wire carries data the adapter doesn't recognize — translates as:

1. When a `candidates[i].content.parts[j]` carries a `type` field (or a top-level key) the adapter doesn't dispatch, log a one-time warning per (`partKind`) per stream.
2. When the top-level chunk carries fields the adapter doesn't consume (e.g., `usageMetadata`, `promptFeedback`, future additions), the adapter could optionally surface them via a debug log.
3. When a `candidate.finishReason` is an unknown enum value (today: `STOP`, `MAX_TOKENS`, `SAFETY`, `RECITATION`, `OTHER`), warn empirically.

This is more nuanced than the Anthropic/OpenAI allowlist because Gemini's wire is richer in structure. A naive "warn on every unhandled JSON key" would produce noise for fields the adapter intentionally ignores (sequence numbers, model IDs).

## Why deferred rather than addressed inline

- The cluster's empirical drivers for the closeout — OpenAI/xAI reasoning bug + Gemini grounding constraint — do not surface a Gemini drift gap. Gemini's scenario passes end-to-end on the existing handlers.
- The right Gemini-side instrumentation requires more design (what's the dispatch surface? which "unknown" categories are worth warning on?). Doing it well takes a dedicated stream's worth of design work; doing it poorly creates either noise or false reassurance.
- The closeout PR is structurally large already (item_id correlation fix + continuation builder fix + Anthropic + OpenAI Responses instrumentation + Gemini scenario fix). Adding a half-considered Gemini instrumentation expands the review surface without proportionate gain.

## Recommendation

File as a future stream — `ai-assist-gemini-drift-instrument` — under the `FUTURE.md` substrate. Scope:

- Survey of the Gemini wire shapes that arrive on `generateContent` streaming (text/functionCall/executableCode parts, plus the lifecycle fields).
- Decide on a dispatch-tag taxonomy that maps to the structural goal (warn on unrecognized part `type` and unrecognized `finishReason` enum values).
- Symmetric implementation: per-stream dedup, `logger?.warn`, allowlist as the source of truth.

Estimated effort: half a day's work — small.

## Affected packages

- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts`
