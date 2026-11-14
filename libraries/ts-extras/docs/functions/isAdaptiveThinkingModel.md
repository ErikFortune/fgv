[Home](../README.md) > isAdaptiveThinkingModel

# Function: isAdaptiveThinkingModel

Determines whether a concrete (already-resolved) Anthropic model id uses the adaptive
thinking wire shape (`thinking: { type: 'adaptive' }` + top-level `output_config.effort`)
rather than the legacy manual-budget shape (`thinking: { type: 'enabled', budget_tokens }`).

## Signature

```typescript
function isAdaptiveThinkingModel(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
