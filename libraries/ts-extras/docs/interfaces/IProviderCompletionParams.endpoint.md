[Home](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > endpoint

## IProviderCompletionParams.endpoint property

Optional override of the descriptor's default base URL. When set, the
dispatcher uses this URL (scheme + host + optional port + optional path
prefix) and appends the descriptor's per-route suffix (e.g.
`/chat/completions`) the same way it composes against the default.

Must be a well-formed `http`/`https` URL string. Used to dispatch the same
provider descriptor against a self-hosted or local endpoint (e.g.
`http://localhost:11434/v1` for Ollama, or LAN-hosted OpenAI-compatible
servers).

Setting `endpoint` does not change the auth shape: providers with
`needsSecret === true` still require an API key.

**Signature:**

```typescript
readonly endpoint: string;
```
