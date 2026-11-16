[Home](../README.md) > resolveProviderModel

# Function: resolveProviderModel

The full provider model-resolution chokepoint: the ModelSpecKey walk
(via resolveModel) THEN resolveModelAlias.

## Signature

```typescript
function resolveProviderModel(descriptor: IAiProviderDescriptor, modelOverride: ModelSpec | undefined, context: ModelSpecKey): Result<string>
```
