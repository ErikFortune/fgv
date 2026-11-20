[Home](../../README.md) > [AiAssist](../README.md) > [IProviderCompletionStreamParams](./IProviderCompletionStreamParams.md) > endpoint

## IProviderCompletionStreamParams.endpoint property

Optional override of the descriptor's default base URL. Same semantics as
the non-streaming completion path: a well-formed `http`/`https` URL is
substituted for `descriptor.baseUrl` when composing the streaming
request, with the per-format suffix appended unchanged. Validated at the
dispatcher; auth shape is unaffected.

Schemas sent to an overridden endpoint — client-tool parameters and structured-output
schemas — are adapted with the conservative keyword table
(`JsonSchema.unverifiedWireSchemaKeywords`), since the provider's documentation describes its
own endpoint, unless `verifiedEndpoint` asserts this one is the provider itself.

**Signature:**

```typescript
readonly endpoint: string;
```
