[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > endpoint

## IExecuteClientToolTurnParams.endpoint property

Optional override of the descriptor's default base URL. Same semantics as
the non-streaming completion path and `callProviderCompletionStream`: a
well-formed `http`/`https` URL is substituted for `descriptor.baseUrl`
when composing the per-format request, with the per-format suffix appended
unchanged. Validated at the dispatcher; auth shape is unaffected. Use this
to point a client-tool turn at a local / LAN OpenAI-compatible server
(Ollama, LM Studio, llama.cpp).

Schemas sent to an overridden endpoint — client-tool parameters and structured-output
schemas — are adapted with the conservative keyword table
(`JsonSchema.unverifiedWireSchemaKeywords`), since the provider's documentation describes its
own endpoint, unless `verifiedEndpoint` asserts this one is the provider itself.

**Signature:**

```typescript
readonly endpoint: string;
```
