[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > continuationMessages

## IExecuteClientToolTurnParams.continuationMessages property

Provider-specific continuation messages to append after the prompt's user
message. Used to supply the output of AiAssist.IAiClientToolContinuation's
`messages` field from a prior turn back to the provider in the follow-up request.

Each provider applies its own shape guard to the supplied wire objects:
- Anthropic: projects each entry to `{ role, content }` (sufficient for
  thinking blocks and `tool_result` arrays).
- OpenAI / xAI Responses: passes each item verbatim (`function_call` /
  `function_call_output` items carry distinct fields per `type`); only guards
  that each entry is a JSON object.
- Gemini: projects each entry to `{ role, parts }`.

Entries that fail their provider's shape check are silently skipped.

**Signature:**

```typescript
readonly continuationMessages: readonly JsonObject[];
```
