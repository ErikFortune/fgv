[Home](../README.md) > [IAiEmbeddingModelCapability](./IAiEmbeddingModelCapability.md) > maxBatchSize

## IAiEmbeddingModelCapability.maxBatchSize property

Maximum number of inputs accepted per request. When present, the dispatcher
rejects batches larger than this up front (no auto-chunking in v1).

**Signature:**

```typescript
readonly maxBatchSize: number;
```
