[Home](../../README.md) > [AiAssist](../README.md) > rejectsSamplingParamsWithThinking

# Function: rejectsSamplingParamsWithThinking

Whether a concrete (already-resolved) model restricts a caller-supplied `temperature` only while
reasoning, per the descriptor's
IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes
(exact-or-dash-bounded match).

## Signature

```typescript
function rejectsSamplingParamsWithThinking(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
