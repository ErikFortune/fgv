[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientToolContinuation

# Interface: IAiClientToolContinuation

The provider-specific continuation data needed to build the follow-up request
for the next round of the conversation.

## Remarks

`messages` are provider-native request objects (Anthropic: content-block arrays,
OpenAI Responses API: input items, Gemini: content parts). The continuation
builder in `clientToolContinuationBuilder.ts` populates this.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | **Cumulative** provider-native wire-format message objects covering all tool rounds so far. On each turn, `executeClientToolTurn` prepends the inbound `continuationMessages` so that this array always contains the complete wire tail from round 1 through the current round. To drive a multi-round loop, simply **replace** `continuationMessages` with this value — do not manually concatenate: `let tail: JsonObject[] \| undefined; while (true) { const { events, nextTurn } = executeClientToolTurn({ ..., continuationMessages: tail }).orThrow(); for await (const e of events) { /* observe */ } const outcome = (await nextTurn).orThrow(); if (!outcome.continuation) break; tail = [...outcome.continuation.messages]; // replace — already cumulative }` The exact shape is provider-native and may include provider-specific blocks (e.g. Anthropic thinking/redacted_thinking/tool_use, OpenAI function_call/function_call_output items, Gemini functionCall/functionResponse parts). These are NOT `IChatMessage[]` and must NOT be placed in the `messages` parameter — the normalized-message path strips provider-native fields (thinking signatures, redacted_thinking data) that the server requires for continuation validation. `toolCallsSummary` is per-round only (the calls executed in the current turn). Only `messages` is cumulative. |
| <a id="property-toolcallssummary"></a> `toolCallsSummary` | `readonly` | readonly [`IAiClientToolCallSummary`](IAiClientToolCallSummary.md)[] | Summary of each tool call executed in this turn (per-round, not cumulative). |
