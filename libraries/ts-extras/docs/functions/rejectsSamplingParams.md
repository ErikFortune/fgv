[Home](../README.md) > rejectsSamplingParams

# Function: rejectsSamplingParams

Whether a concrete (already-resolved) model restricts a caller-supplied `temperature`, per the
descriptor's IAiProviderDescriptor.samplingParamsRejectedModelPrefixes
(exact-or-dash-bounded match).

## Signature

```typescript
function rejectsSamplingParams(descriptor: IAiProviderDescriptor, modelId: string): boolean
```
