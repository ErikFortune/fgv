[Home](../../README.md) > [AiAssist](../README.md) > [IAiWebSearchToolConfig](./IAiWebSearchToolConfig.md) > allowedDomains

## IAiWebSearchToolConfig.allowedDomains property

Optional: restrict search to these domains.
Reaches Anthropic and the OpenAI/xAI Responses API; ignored on Gemini,
whose `google_search` tool takes no configuration at all.

**Signature:**

```typescript
readonly allowedDomains: readonly string[];
```
