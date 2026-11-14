[Home](../../README.md) > [AiAssist](../README.md) > [IAiWebSearchToolConfig](./IAiWebSearchToolConfig.md) > maxUses

## IAiWebSearchToolConfig.maxUses property

Optional: max number of searches per request.
**Anthropic only** — emitted as `max_uses` by the Anthropic formatter and
read nowhere else, so it is silently ignored on OpenAI/xAI and Gemini.

**Signature:**

```typescript
readonly maxUses: number;
```
