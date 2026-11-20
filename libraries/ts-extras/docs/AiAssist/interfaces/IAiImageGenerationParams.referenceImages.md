[Home](../../README.md) > [AiAssist](../README.md) > [IAiImageGenerationParams](./IAiImageGenerationParams.md) > referenceImages

## IAiImageGenerationParams.referenceImages property

Optional reference images. When present, the provider will use them as
visual context (e.g. to preserve a character's appearance across multiple
generations). The dispatcher resolves the
AiAssist.IAiImageModelCapability for the requested model and
rejects the call up front if `acceptsImageReferenceInput` is not set on
the matching capability. An empty array is treated identically to
`undefined`.

**Signature:**

```typescript
readonly referenceImages: readonly IAiImageAttachment[];
```
