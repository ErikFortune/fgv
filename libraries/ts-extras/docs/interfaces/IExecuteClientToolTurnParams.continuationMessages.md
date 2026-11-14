[Home](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > continuationMessages

## IExecuteClientToolTurnParams.continuationMessages property

The cumulative provider-native wire tail from the previous turn's
AiAssist.IAiClientToolContinuation.messages. Supply this as-is
each round — `messages` is already cumulative, so **replace** rather
than manually concatenate:

```ts
tail = outcome.continuation.messages; // replace — already cumulative
```

On the first turn this should be `undefined` (or omitted).

Each provider applies its own shape guard to the supplied wire objects:
- Anthropic: projects each entry to `{ role, content }` (sufficient for
  thinking blocks and `tool_result` arrays).
- OpenAI / xAI Responses: passes each item verbatim (`function_call` /
  `function_call_output` items carry distinct fields per `type`); only
  guards that each entry is a JSON object.
- Gemini: projects each entry to `{ role, parts }`.

Entries that fail their provider's shape check are silently skipped.
Do NOT place these objects in the `messages` parameter — the
normalized-message path strips provider-native fields.

**Signature:**

```typescript
readonly continuationMessages: readonly JsonObject[];
```
