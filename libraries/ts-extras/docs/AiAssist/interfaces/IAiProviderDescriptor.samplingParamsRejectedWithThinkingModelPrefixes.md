[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > samplingParamsRejectedWithThinkingModelPrefixes

## IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes property

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.samplingParamsRejectedModelPrefixes) that reason by default and
reject a caller-supplied `temperature` only while reasoning — every value, or every value but
IAiProviderDescriptor.samplingParamsAcceptedTemperature when the descriptor declares
one. With thinking off they accept any `temperature`.

**Signature:**

```typescript
readonly samplingParamsRejectedWithThinkingModelPrefixes: readonly string[];
```
