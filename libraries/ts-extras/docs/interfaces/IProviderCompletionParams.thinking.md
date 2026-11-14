[Home](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > thinking

## IProviderCompletionParams.thinking property

Optional thinking/reasoning config. Anthropic, OpenAI, and xAI reject `temperature` when
the effective merged effort is non-`'none'`, except a model's accepted default
(`IAiProviderDescriptor.samplingParamsAcceptedTemperature`); Gemini always accepts both.

**Signature:**

```typescript
readonly thinking: IThinkingConfig;
```
