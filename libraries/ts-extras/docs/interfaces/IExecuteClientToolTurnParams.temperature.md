[Home](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > temperature

## IExecuteClientToolTurnParams.temperature property

Sampling temperature. Sent to the provider only when explicitly provided; omitted otherwise
so the provider's own default applies. Many current-gen models reject a non-default value;
a model on `IAiProviderDescriptor.samplingParamsRejectedModelPrefixes` still accepts the
descriptor's `samplingParamsAcceptedTemperature`, with or without thinking, and is refused
any other value before the wire; a model on
`IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes` applies the same rule
unless the request turns thinking off (effort `'none'`), when any value is sent. Beside a
`resolvedThinking` effort, a temperature the provider's thinking mode rejects is refused before
the wire too, as on the completion and streaming paths, rather than dropped.

**Signature:**

```typescript
readonly temperature: number;
```
