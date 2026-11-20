[Home](../../README.md) > [AiAssist](../README.md) > callProxiedEmbedding

# Function: callProxiedEmbedding

Calls the embedding endpoint on a proxy server instead of calling the provider
API directly from the browser. Endpoint: `POST ${proxyUrl}/api/ai/embedding`.
Request body: `{ providerId, apiKey, params, modelOverride? }`. The proxy
handles descriptor lookup, model/capability resolution, and provider dispatch.
Error body `{ error: string }` is surfaced as `proxy: ${error}`.

## Signature

```typescript
function callProxiedEmbedding(proxyUrl: string, params: IProviderEmbeddingParams): Promise<Result<IAiEmbeddingResult>>
```
