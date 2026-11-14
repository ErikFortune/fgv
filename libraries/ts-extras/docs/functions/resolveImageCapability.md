[Home](../README.md) > resolveImageCapability

# Function: resolveImageCapability

Resolve the image-generation capability that applies to a given model id
for a provider. Returns the entry from
IAiProviderDescriptor.imageGeneration whose `modelPrefix` is the
longest prefix of `modelId`. Ties are broken by first-encountered, so rule
order does not matter for correctness — only for tie-breaking among rules
with identical-length prefixes (an unusual case).

## Signature

```typescript
function resolveImageCapability(descriptor: IAiProviderDescriptor, modelId: string): IAiImageModelCapability | undefined
```
