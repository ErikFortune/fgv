[Home](../README.md) > callProviderImageGeneration

# Function: callProviderImageGeneration

Calls the appropriate image-generation API for a given provider.

Routes based on `descriptor.imageApiFormat`:
- `'openai-images'` for OpenAI (DALL-E, gpt-image-1)
- `'xai-images'` for xAI Grok image models
- `'gemini-imagen'` for Google Imagen

Image-model selection reuses the existing `'image'` ModelSpecKey.

## Signature

```typescript
function callProviderImageGeneration(params: IProviderImageGenerationParams): Promise<Result<IAiImageGenerationResponse>>
```
