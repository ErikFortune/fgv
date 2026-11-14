[Home](../README.md) > [IAiEmbeddingModelCapability](./IAiEmbeddingModelCapability.md) > supportsDimensions

## IAiEmbeddingModelCapability.supportsDimensions property

Whether matching models honor a requested output `dimensions`
(OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001` via MRL
truncation). When false/undefined, a caller-supplied `dimensions` is a
no-op (logged, not failed — see AiAssist.IAiEmbeddingParams).

**Signature:**

```typescript
readonly supportsDimensions: boolean;
```
