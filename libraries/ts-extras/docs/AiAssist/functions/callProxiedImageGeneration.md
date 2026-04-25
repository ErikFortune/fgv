[Home](../../README.md) > [AiAssist](../README.md) > callProxiedImageGeneration

# Function: callProxiedImageGeneration

Calls the image-generation endpoint on a proxy server instead of calling
the provider API directly from the browser.

## Signature

```typescript
function callProxiedImageGeneration(proxyUrl: string, params: IProviderImageGenerationParams): Promise<Result<IAiImageGenerationResponse>>
```
