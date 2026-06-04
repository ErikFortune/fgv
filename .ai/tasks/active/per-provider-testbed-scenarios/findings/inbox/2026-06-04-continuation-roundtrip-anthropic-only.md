# Finding: continuation round-trip is Anthropic-only; OpenAI/Gemini/xAI testbed scenarios cannot validate the continuation gate

**Date:** 2026-06-04
**Surfaced by:** `per-provider-testbed-scenarios` stream — Copilot review round 2 on PR #453
**Library:** `@fgv/ts-extras/ai-assist`
**Disposition:** BLOCKED — Erik's call (2026-06-04): scenarios stay exactly as briefed (do not alter scenario behavior, do not drop the continuation call); the library gap is the blocker. Erik will work with the orchestrator to queue a `@fgv/ts-extras/ai-assist` fix in a separate stream; this stream pauses until that lands, then resumes to validate the continuation gate live.

---

## What was found

`AiAssist.executeClientToolTurn` accepts `continuationMessages` but only forwards it to the **Anthropic** adapter. In `streamingAdapters/clientToolContinuationBuilder.ts` the provider switch passes `continuationMessages` to `callAnthropicStream` (as `rawTail`), but the `openai` and `gemini` cases call `callOpenAiResponsesStream` / `callGeminiStream` with only `messagesBefore` — and those two adapters have **no `continuationMessages` parameter at all** (verified: `openaiResponses.ts:318` and `gemini.ts:210` take `messagesBefore` only; `anthropic.ts:427` is the only one with `continuationMessages` → `rawTail`).

Consequence for the testbed scenarios added in this stream: the OpenAI, Gemini, and xAI scenarios pass `continuationMessages: continuation.messages` on their second `executeClientToolTurn` call, but the library **silently drops it** for those `apiFormat`s. The second turn therefore re-runs the original prompt without the reconstructed `function_call` / `function_call_output` (or Gemini `functionCall`/`functionResponse`) items — it is not a true continuation. Any "continuation round-trip works (PASS)" wording in those three scenarios is a **false positive**.

## Why this is a known limitation, not a fresh bug

The prior stream's finding `ai-assist-client-tools/findings/inbox/2026-06-04-continuation-message-wire-position.md` already documents this explicitly:

> `IBuildMessagesOptions.rawTail?: ReadonlyArray<JsonObject>` — `buildAnthropicMessages` consumes it; `buildMessages` (OpenAI/xAI path) does not need it for Phase C (Anthropic-only thinking-block round-trip) but the field is declared at the options layer so a future provider can adopt it without a builder-signature change.

So continuation round-trip was **intentionally scoped Anthropic-only** at Phase C, with the OpenAI/Gemini/xAI extension anticipated as future work. Copilot's round-2 finding is correct on the facts and is precisely the empirical-safety-net value these scenarios were commissioned to provide — surfaced here by review before a live run.

## Impact on the gate matrix (this stream)

For OpenAI / Gemini / xAI, the **first-turn** gates remain valid and verifiable on a live run:
- Live API round-trip without HTTP 4xx — verifiable
- Client tool invoked + executed (harness side) + continuation **built** — verifiable
- Reasoning/thinking enabled — verifiable
- Server tool events (OpenAI/xAI `web_search`) — verifiable; Gemini grounding N/A
- Server + client coexistence in the request — verifiable

The **continuation-acceptance** gate (provider accepts the reconstructed assistant turn + tool outputs on the follow-up request) is **BLOCKED** for these three providers until the library extends `callOpenAiResponsesStream` / `callGeminiStream` (and the `executeClientToolTurn` switch arms) to forward `continuationMessages`. Anthropic is unaffected (its scenario already validates this gate).

## Proposed library extension (out of scope for this stream unless Erik expands it)

Additive, no breaking change:
1. Widen `callOpenAiResponsesStream` and `callGeminiStream` signatures with an optional `continuationMessages?: ReadonlyArray<JsonObject>`.
2. Thread it into the respective request builders' `rawTail` (the `chatRequestBuilders.ts` option already exists; the OpenAI/Gemini `buildMessages`/`buildGeminiContents` paths need to honor `rawTail`).
3. Forward `continuationMessages` in the `openai`/`gemini` cases of the `executeClientToolTurn` switch.
4. Add unit coverage for the OpenAI/Gemini continuation-message wire position.

This is the same shape the prior finding anticipated ("a future provider can adopt it without a builder-signature change").

## Disposition (decided)

**The scenarios stay exactly as briefed.** Erik's direction (2026-06-04): do not change scenario behavior, do not drop the second `executeClientToolTurn` continuation call, do not relabel gates. The brief is the brief — the scenarios are written assuming the library forwards `continuationMessages` for every provider, which is the correct end-state. The library not yet doing so for OpenAI/Gemini/xAI is the **blocker**, not something the testbed should paper over.

**Action:** this stream **pauses** here. Erik will work with the orchestrator to queue a `@fgv/ts-extras/ai-assist` fix (the additive extension sketched above) in a separate stream. Once that lands and this branch rebases onto it, the OpenAI/Gemini/xAI scenarios will validate the continuation-acceptance gate live with no scenario edits required.

Until then, a live run of these three scenarios would either re-run the original prompt on the second turn (continuation silently dropped) or — once the library is fixed — genuinely round-trip. The scenarios are intentionally left in their final, correct form so they light up the moment the library catches up.
