[Home](../../README.md) > [AiAssist](../README.md) > [IAiAssistProviderConfig](./IAiAssistProviderConfig.md) > endpoint

## IAiAssistProviderConfig.endpoint property

Optional caller-supplied endpoint URL (http/https). Overrides
`descriptor.baseUrl` for this provider. Used to point a provider at a
self-hosted server (Ollama, LM Studio, llama.cpp's openai-server) or a
local proxy. Validation lives in `@fgv/ts-extras` — query strings,
fragments, and userinfo are rejected.

**Signature:**

```typescript
readonly endpoint: string;
```
