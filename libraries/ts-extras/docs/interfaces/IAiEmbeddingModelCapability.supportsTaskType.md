[Home](../README.md) > [IAiEmbeddingModelCapability](./IAiEmbeddingModelCapability.md) > supportsTaskType

## IAiEmbeddingModelCapability.supportsTaskType property

Whether matching models honor a `taskType` hint (Gemini only today). When
false/undefined, a caller-supplied `taskType` is a no-op (logged, not
failed).

**Signature:**

```typescript
readonly supportsTaskType: boolean;
```
