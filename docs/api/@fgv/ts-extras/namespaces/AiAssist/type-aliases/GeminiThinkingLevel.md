[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / GeminiThinkingLevel

# Type Alias: GeminiThinkingLevel

> **GeminiThinkingLevel** = [`StringOneOf`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<*typeof* [`allGeminiThinkingLevels`](../variables/allGeminiThinkingLevels.md)\>

A Gemini `generationConfig.thinkingConfig.thinkingLevel` value.

## Remarks

`'minimal'` "matches the 'no thinking' setting for most queries" but does not guarantee that
thinking is off. Which levels a model accepts is per model (see
[AiAssist.IAiProviderDescriptor.geminiThinkingLevels](../interfaces/IAiProviderDescriptor.md#property-geminithinkinglevels)); a level a model does not list is a
provider error.
