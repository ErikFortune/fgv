[Home](../README.md) > [IAiClientToolContinuation](./IAiClientToolContinuation.md) > messages

## IAiClientToolContinuation.messages property

**Cumulative** provider-native wire-format message objects covering all
tool rounds so far. On each turn, `executeClientToolTurn` prepends the
inbound `continuationMessages` so that this array always contains the
complete wire tail from round 1 through the current round.

To drive a multi-round loop, simply **replace** `continuationMessages`
with this value — do not manually concatenate:

```ts
let tail: JsonObject[] | undefined;
while (true) {
  const { events, nextTurn } = executeClientToolTurn({
    ..., continuationMessages: tail
  }).orThrow();
  for await (const e of events) { /* observe */ }
  const outcome = (await nextTurn).orThrow();
  if (!outcome.continuation) break;
  tail = [...outcome.continuation.messages]; // replace — already cumulative
}
```

The exact shape is provider-native and may include provider-specific
blocks (e.g. Anthropic thinking/redacted_thinking/tool_use, OpenAI
function_call/function_call_output items, Gemini functionCall/functionResponse
parts). These are NOT `IChatMessage[]` and must NOT be placed in the
`messages` parameter — the normalized-message path strips provider-native
fields (thinking signatures, redacted_thinking data) that the server
requires for continuation validation.

`toolCallsSummary` is per-round only (the calls executed in the current
turn). Only `messages` is cumulative.

**Signature:**

```typescript
readonly messages: readonly JsonObject[];
```
