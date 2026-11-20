[Home](../README.md) > callProviderEmbedding

# Function: callProviderEmbedding

Calls the appropriate embedding API for a given provider. Routes by the
`format` of the resolved AiAssist.IAiEmbeddingModelCapability:
`'openai-embeddings'` or `'gemini-embeddings'`.

## Signature

```typescript
function callProviderEmbedding(params: IProviderEmbeddingParams): Promise<Result<IAiEmbeddingResult>>
```
