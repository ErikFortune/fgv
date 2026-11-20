[Home](../../README.md) > [AiAssist](../README.md) > [IProviderCompletionStreamParams](./IProviderCompletionStreamParams.md) > temperature

## IProviderCompletionStreamParams.temperature property

Sampling temperature. Sent to the provider only when explicitly provided; omitted otherwise
so the provider's own default applies. Many current-gen models reject a non-default value;
a model on `IAiProviderDescriptor.samplingParamsRejectedModelPrefixes` still accepts the
descriptor's `samplingParamsAcceptedTemperature`, with or without thinking, and is refused
any other value before the wire; a model on
`IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes` applies the same rule
unless the request turns thinking off (effort `'none'`), when any value is sent.

**Signature:**

```typescript
readonly temperature: number;
```
