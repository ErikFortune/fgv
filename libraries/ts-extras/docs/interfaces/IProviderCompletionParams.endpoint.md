[Home](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > endpoint

## IProviderCompletionParams.endpoint property

Optional override of the descriptor's default base URL (scheme + host +
optional port + path prefix). The per-route suffix (e.g. `/chat/completions`)
is appended unchanged. Must be a well-formed `http`/`https` URL. Auth shape
is unchanged: `needsSecret` providers still require an API key.

**Signature:**

```typescript
readonly endpoint: string;
```
