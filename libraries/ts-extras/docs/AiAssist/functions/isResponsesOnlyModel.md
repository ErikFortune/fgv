[Home](../../README.md) > [AiAssist](../README.md) > isResponsesOnlyModel

# Function: isResponsesOnlyModel

Determines whether a concrete (already-resolved) model id must be invoked via
the OpenAI Responses API rather than chat completions.

## Signature

```typescript
function isResponsesOnlyModel(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
