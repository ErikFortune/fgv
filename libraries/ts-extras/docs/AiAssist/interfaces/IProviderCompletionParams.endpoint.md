[Home](../../README.md) > [AiAssist](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > endpoint

## IProviderCompletionParams.endpoint property

Optional override of the descriptor's default base URL (scheme + host +
optional port + path prefix). The per-route suffix (e.g. `/chat/completions`)
is appended unchanged. Must be a well-formed `http`/`https` URL. Auth shape
is unchanged: `needsSecret` providers still require an API key.

Schemas sent to an overridden endpoint — client-tool parameters and structured-output
schemas — are adapted with the conservative keyword table
(`JsonSchema.unverifiedWireSchemaKeywords`), since the provider's documentation describes its
own endpoint, unless `verifiedEndpoint` asserts this one is the provider itself.

**Signature:**

```typescript
readonly endpoint: string;
```
