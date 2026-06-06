[Home](../../README.md) > [AiAssist](../README.md) > [IAiClientToolContinuation](./IAiClientToolContinuation.md) > messages

## IAiClientToolContinuation.messages property

Provider-native wire-format message objects to supply back on the next
streaming call via `IExecuteClientToolTurnParams.continuationMessages`
(which is forwarded as `rawTail` to the underlying call). The exact
shape depends on the provider format and may contain provider-specific
blocks (e.g. Anthropic thinking/redacted_thinking/tool_use). These are
NOT `IChatMessage[]` and must not be prepended via `messagesBefore` —
the normalized-message path would strip the provider-native fields
(signatures, redacted thinking) that the server requires for
continuation validation.

**Signature:**

```typescript
readonly messages: readonly JsonObject[];
```
