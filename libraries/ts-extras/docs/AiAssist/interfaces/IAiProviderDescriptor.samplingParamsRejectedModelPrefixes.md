[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > samplingParamsRejectedModelPrefixes

## IAiProviderDescriptor.samplingParamsRejectedModelPrefixes property

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.thinkingRequiredModelPrefixes) that reject a caller-supplied
`temperature` with or without thinking — every value, or every value but
IAiProviderDescriptor.samplingParamsAcceptedTemperature when the descriptor declares
one. A call that sets a rejected `temperature` on a listed model is refused before the wire (see
AiAssist.rejectsSamplingParams). Empty or undefined means every model accepts
`temperature` (subject to the thinking-mode conflict).

**Signature:**

```typescript
readonly samplingParamsRejectedModelPrefixes: readonly string[];
```
