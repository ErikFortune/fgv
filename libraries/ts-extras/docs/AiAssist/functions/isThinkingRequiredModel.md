[Home](../../README.md) > [AiAssist](../README.md) > isThinkingRequiredModel

# Function: isThinkingRequiredModel

Whether a concrete (already-resolved) model cannot run with thinking off, per the descriptor's
IAiProviderDescriptor.thinkingRequiredModelPrefixes (exact-or-dash-bounded match).

## Signature

```typescript
function isThinkingRequiredModel(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
