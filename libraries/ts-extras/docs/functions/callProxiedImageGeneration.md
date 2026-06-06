[Home](../README.md) > callProxiedImageGeneration

# Function: callProxiedImageGeneration

Calls the image-generation endpoint on a proxy server instead of calling
the provider API directly from the browser.
Endpoint: `POST ${proxyUrl}/api/ai/image-generation`. Request body:
`{providerId, apiKey, params, modelOverride?}`. The proxy handles descriptor
lookup, model resolution, provider dispatch, and response normalization
(including repackaging `referenceImages` for the upstream wire format).
Error body `{error: string}` is surfaced as `proxy: ${error}`.

## Signature

```typescript
function callProxiedImageGeneration(proxyUrl: string, params: IProviderImageGenerationParams): Promise<Result<IAiImageGenerationResponse>>
```
