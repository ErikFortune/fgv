# Finding: continuation round-trip is Anthropic-only; OpenAI/Gemini/xAI testbed scenarios cannot validate the continuation gate

**Date:** 2026-06-04
**Surfaced by:** `per-provider-testbed-scenarios` stream — Copilot review round 2 on PR #453
**Library:** `@fgv/ts-extras/ai-assist`
**Disposition:** RESOLVED — the library blocker landed on the `per-provider-testbed-scenarios` integration branch via PR #454 (`ai-assist-cross-provider-continuation`), squash commit `38d6dc02e`. `executeClientToolTurn` now forwards `continuationMessages` through `rawTail` to all three adapters (verified: `clientToolContinuationBuilder.ts` switch arms anthropic/openai/gemini; `openaiResponses.ts:324` and `gemini.ts:217` now accept `continuationMessages` → `rawTail`). This PR (#453) rebased onto `38d6dc02` with no conflicts and **no scenario edits** — the scenarios were left in their final correct form per Erik's earlier call, so they now light up against the post-fix library. Local gates re-confirmed green after rebase (build / lint / test 100%). The continuation-acceptance gate is now **wired on all four providers**; the only remaining gap is live-API execution (no provider keys in the agent env — user-side completion).

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

## Resolution (2026-06-04)

The "scenarios stay exactly as briefed" call paid off exactly as intended. The library fix landed independently as PR #454 and merged to the integration branch (`38d6dc02e`); rebasing this PR onto it required **zero scenario edits** — the scenarios that were written assuming cross-provider continuation now exercise the real, fixed library path.

What landed in #454 (the additive extension sketched above, in full):
1. `callOpenAiResponsesStream` (`openaiResponses.ts:324`) and `callGeminiStream` (`gemini.ts:217`) gained the optional `continuationMessages?: ReadonlyArray<JsonObject>` parameter, threaded to the builder's `rawTail`.
2. The `executeClientToolTurn` provider switch (`clientToolContinuationBuilder.ts`) now forwards `continuationMessages` in the `openai` and `gemini` cases (line 465 / 478), matching the anthropic case (451).
3. xAI inherits the fix via `apiFormat: 'openai'` routing.

Post-rebase state of this PR:
- `rush build --to @fgv/testbed` — green (rebuilds patched `ts-extras`)
- `rushx lint` (testbed) — green
- `rushx test` (testbed) — green, 100% coverage
- Missing-key CLI diagnostics for all three scenarios — still fire correctly

The continuation-acceptance gate is now **wired on all four providers**. The only outstanding gate is live-API execution, which remains gapped solely on credentials (no provider keys in the agent environment) — see `result.md` for the user-side run commands. This finding is closed.
