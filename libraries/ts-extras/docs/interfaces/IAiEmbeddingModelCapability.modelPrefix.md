[Home](../README.md) > [IAiEmbeddingModelCapability](./IAiEmbeddingModelCapability.md) > modelPrefix

## IAiEmbeddingModelCapability.modelPrefix property

Prefix matched against the resolved embedding model id. The empty string is
the catch-all and matches every model. When multiple rules' prefixes match
a model id, the longest prefix wins; ties are broken by first-encountered.

**Signature:**

```typescript
readonly modelPrefix: string;
```
