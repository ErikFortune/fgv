[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > samplingParamsAcceptedTemperature

## IAiProviderDescriptor.samplingParamsAcceptedTemperature property

The one `temperature` that the models on
IAiProviderDescriptor.samplingParamsRejectedModelPrefixes still accept, with or without
thinking, and that the models on
IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes still accept while
reasoning — the provider's own default, which a provider that rejects only non-default values
lets through. Undefined means those models accept no `temperature` where they restrict it.
Descriptor-wide, not per model: declare it only when the evidence covers every listed model
(OpenAI lists `gpt-6.1-sol` and `gpt-6-astra` on the first list and `gpt-6-luna` on the second,
and all three accepted `temperature: 1` live with thinking on).

**Signature:**

```typescript
readonly samplingParamsAcceptedTemperature: number;
```
