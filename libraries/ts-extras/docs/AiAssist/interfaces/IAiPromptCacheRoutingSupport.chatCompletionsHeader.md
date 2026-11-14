[Home](../../README.md) > [AiAssist](../README.md) > [IAiPromptCacheRoutingSupport](./IAiPromptCacheRoutingSupport.md) > chatCompletionsHeader

## IAiPromptCacheRoutingSupport.chatCompletionsHeader property

Header name to carry the key on Chat Completions, or `undefined` when the provider takes it
as a `prompt_cache_key` body field there (OpenAI). xAI uses `x-grok-conv-id`.

**Signature:**

```typescript
readonly chatCompletionsHeader: string | undefined;
```
