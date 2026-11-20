[Home](../../README.md) > [AiAssist](../README.md) > [IAiCacheRequest](./IAiCacheRequest.md) > cacheKey

## IAiCacheRequest.cacheKey property

Opaque cache-routing key, sent where the provider has one and by that provider's transport:
`prompt_cache_key` as a body field on OpenAI (both routes) and on xAI Responses, and an
`x-grok-conv-id` header on xAI Chat Completions. See `supportsPromptCacheRouting`.

**Signature:**

```typescript
readonly cacheKey: string;
```
