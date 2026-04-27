[Home](../README.md) > callProviderImageGeneration

# Function: callProviderImageGeneration

Calls the appropriate image-generation API for a given provider.

Resolves a IAiImageModelCapability from
IAiProviderDescriptor.imageGeneration for the requested model and
routes by its `format`:
- `'openai-images'` for OpenAI (DALL-E, gpt-image-1)
- `'xai-images'` for xAI Grok image models
- `'gemini-imagen'` for Google Imagen `:predict`
- `'gemini-image-out'` for Gemini chat-style image output (Nano Banana)

Image-model selection reuses the existing `'image'` ModelSpecKey.
When `request.referenceImages` is non-empty, the call is rejected up front
unless the resolved capability declares `acceptsImageReferenceInput`.

## Signature

```typescript
function callProviderImageGeneration(params: IProviderImageGenerationParams): Promise<Result<IAiImageGenerationResponse>>
```
