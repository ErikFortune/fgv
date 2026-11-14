[Home](../README.md) > [IProviderEmbeddingParams](./IProviderEmbeddingParams.md) > modelOverride

## IProviderEmbeddingParams.modelOverride property

Optional model override — string or context-aware map. Uses
`descriptor.defaultModel.embedding` otherwise. Self-hosted providers
(`ollama`, `openai-compat`) have no default and require this.

**Signature:**

```typescript
readonly modelOverride: ModelSpec;
```
