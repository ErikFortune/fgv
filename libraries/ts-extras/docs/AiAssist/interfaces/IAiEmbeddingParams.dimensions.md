[Home](../../README.md) > [AiAssist](../README.md) > [IAiEmbeddingParams](./IAiEmbeddingParams.md) > dimensions

## IAiEmbeddingParams.dimensions property

Requested output dimensionality. Honored only by models whose capability
declares `supportsDimensions` (OpenAI `text-embedding-3-*`, Gemini
`gemini-embedding-001` via MRL truncation). Ignored — with a `logger.info`
note — by models that don't.

**Signature:**

```typescript
readonly dimensions: number;
```
