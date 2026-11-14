[Home](../../README.md) > [AiAssist](../README.md) > resolveMaxOutputTokens

# Function: resolveMaxOutputTokens

The largest `maxTokens` the provider accepts for a completion on the model a call would use, or
`undefined` when that limit is unknown.

## Signature

```typescript
function resolveMaxOutputTokens(descriptor: IAiProviderDescriptor, modelOverride: ModelSpec, context: ModelSpecKey): number | undefined
```
