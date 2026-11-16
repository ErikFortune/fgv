[Home](../README.md) > [IAiMaxOutputTokensCapability](./IAiMaxOutputTokensCapability.md) > modelId

## IAiMaxOutputTokensCapability.modelId property

The concrete model id this limit belongs to. It matches only a resolved model id equal to it:
a dated snapshot (`claude-haiku-4-5-20251001`) needs an entry of its own, and no other id
inherits this one by prefix.

**Signature:**

```typescript
readonly modelId: string;
```
