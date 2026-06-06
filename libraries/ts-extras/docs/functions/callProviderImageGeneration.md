[Home](../README.md) > callProviderImageGeneration

# Function: callProviderImageGeneration

Calls the appropriate image-generation API for a given provider.
Routes by the `format` field of the resolved IAiImageModelCapability:
`'openai-images'`, `'xai-images'`, `'xai-images-edits'`, `'gemini-imagen'`,
or `'gemini-image-out'`. Rejects up front if `referenceImages` is set but the
capability does not declare `acceptsImageReferenceInput`.

## Signature

```typescript
function callProviderImageGeneration(params: IProviderImageGenerationParams): Promise<Result<IAiImageGenerationResponse>>
```
