# Finding: design gap on continuation-message wire position discovered during C3/C4

**Date:** 2026-06-04
**Surfaced by:** Phase C implementation (retroactively, by orchestrator)
**Sub-phase:** C3 / C4
**Disposition:** Accepted as-shipped; substrate update logged here

---

## What the design said

The Phase A design (`design.md` §2.3, §2.X Example A) framed the round-trip continuation as:

> "When defined, the consumer should call `callProviderCompletionStream` again with these messages prepended (via `messagesBefore`) to continue the conversation."

`IAiClientToolContinuation.messages` was typed as `ReadonlyArray<IChatMessage>` in the design; the consumer-driven loop example showed `conversationHistory = [...conversationHistory, ...turnResult.value.continuation.messages]` flowing back through `messagesBefore`.

## What the implementation found

Two distinct mismatches between the design and the wire reality, both surfaced during C3 (continuation builder) and confirmed by C4 (live testbed verification):

1. **Type mismatch.** `messagesBefore` is `ReadonlyArray<IChatMessage>` — fgv-native chat-message shape. Anthropic continuation messages are provider-format raw wire objects (`{ role, content: [{ type: 'thinking', thinking, signature }, { type: 'tool_use', ... }] }`, `{ role, content: [{ type: 'tool_result', ... }] }`) carrying the load-bearing thinking blocks per the B4 spike findings. These cannot be expressed as `IChatMessage` without losing the thinking/tool_use/tool_result block-level fidelity that the Anthropic API requires for round-trip continuation.
2. **Position mismatch.** `messagesBefore` is positioned at the **head** of the message array (before the user message). The continuation messages must appear at the **tail** — the assistant turn that responded to the user's last message comes AFTER the user message, not before it. Prepending the continuation via `messagesBefore` would put the assistant-with-thinking-blocks before the user message, which is structurally wrong and would either confuse the model or fail the API's message-ordering validation.

The design's framing was internally consistent (consumer drives the loop, continuation messages prepended) but had not been pressure-tested against the actual wire-format requirements that the B4 spike later surfaced. The mismatch only becomes visible when you have both (a) thinking blocks that must round-trip and (b) the realization that those blocks can't be expressed in `IChatMessage`.

## What shipped

The C3/C4 implementation introduced two additive surface changes:

- **`IExecuteClientToolTurnParams.continuationMessages?: ReadonlyArray<JsonObject>`** — accepts provider-format wire messages from a prior turn's `continuation.messages`. Distinct from `messagesBefore` in both type (`JsonObject` vs `IChatMessage`) and intended position (tail vs head).
- **`IBuildMessagesOptions.rawTail?: ReadonlyArray<JsonObject>`** — new optional field in `chatRequestBuilders.ts`; appended verbatim after the user message in the constructed messages array. `buildAnthropicMessages` consumes it; `buildMessages` (OpenAI/xAI path) does not need it for Phase C (Anthropic-only thinking-block round-trip) but the field is declared at the options layer so a future provider can adopt it without a builder-signature change.

`IAiClientToolContinuation.messages` is now typed `ReadonlyArray<JsonObject>` to match what the round-trip actually carries.

## Why this wasn't surfaced via findings-inbox before landing

Per the brief, unexpected ambiguity should have been written to `findings/inbox/` BEFORE proceeding. The implementing agent fixed it inline and documented in `result.md` instead. The brief's findings-inbox convention is the right pattern for this class of mid-stream surfacing; this entry retroactively closes that loop.

## Disposition

**Accept as-shipped.** Erik's call (2026-06-04): the fix is sound (the original design was unimplementable for the thinking-block case) and the additive surface change is well-scoped. The field naming (`continuationMessages` vs `messagesBefore`) is acceptable — they're distinct concepts with distinct types and distinct wire positions, so the parallel-naming question doesn't reduce to a single shared name.

## Lessons for future streams

1. **Design docs that propose a return-and-feed-back loop should pressure-test the type round-trip explicitly.** The B4 spike empirically verified the wire-format requirements for thinking blocks, but the design's `IAiClientToolContinuation.messages: ReadonlyArray<IChatMessage>` typing wasn't reconciled against those wire-format requirements during the Phase A → Phase B handoff. Either layer should have caught it.
2. **Mid-stream design-gap surfacing via findings-inbox is the codified pattern.** When an implementing agent hits this class of finding, the right move is: write the finding, propose a fix, and either proceed (low-stakes) or escalate (high-stakes). Fixing inline + documenting in `result.md` works for genuinely low-stakes additive fixes but loses the orchestrator's visibility into the deviation before it lands. For Phase C this was retrievable; for larger deviations it wouldn't be.
3. **The `published-primitives-reflex` and "extending core libraries" disciplines applied correctly.** The fix extended `IBuildMessagesOptions` and `IExecuteClientToolTurnParams` additively rather than introducing a parallel message-construction path. This is the right shape; the only process gap was the late surfacing.
