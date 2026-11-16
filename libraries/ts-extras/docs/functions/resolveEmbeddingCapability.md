[Home](../README.md) > resolveEmbeddingCapability

# Function: resolveEmbeddingCapability

Resolve the embedding capability that applies to a given model id for a
provider. Returns the entry from IAiProviderDescriptor.embedding whose
`modelPrefix` is the longest prefix of `modelId`. Ties are broken by
first-encountered.

## Signature

```typescript
function resolveEmbeddingCapability(descriptor: IAiProviderDescriptor, modelId: string): IAiEmbeddingModelCapability | undefined
```
