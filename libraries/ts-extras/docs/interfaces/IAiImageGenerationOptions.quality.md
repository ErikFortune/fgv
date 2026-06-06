[Home](../README.md) > [IAiImageGenerationOptions](./IAiImageGenerationOptions.md) > quality

## IAiImageGenerationOptions.quality property

Quality tier. Accepted values differ per model:
- dall-e-3: 'standard' | 'hd'
- gpt-image-1: 'low' | 'medium' | 'high' | 'auto'
Other models ignore this field.

**Signature:**

```typescript
readonly quality: AiImageQuality;
```
