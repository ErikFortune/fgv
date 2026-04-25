[Home](../../README.md) > [AiAssist](../README.md) > [IAiImageGenerationOptions](./IAiImageGenerationOptions.md) > size

## IAiImageGenerationOptions.size property

Image dimensions. Used by openai-format providers (mapped to the
provider's `size` field). Ignored by Imagen — use
IAiImageGenerationOptions.imagen `aspectRatio` instead.

Note: each model has its own accepted set; `dall-e-3` only accepts the
values listed here.

**Signature:**

```typescript
readonly size: "auto" | "1024x1024" | "1024x1792" | "1792x1024";
```
