[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IGeminiThinkingLevelRule

# Interface: IGeminiThinkingLevelRule

One entry in [AiAssist.IAiProviderDescriptor.geminiThinkingLevels](IAiProviderDescriptor.md#property-geminithinkinglevels): a Gemini model controlled by
`thinkingLevel` rather than `thinkingBudget`, and the levels it accepts.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-levels"></a> `levels` | `readonly` | readonly [`GeminiThinkingLevel`](../type-aliases/GeminiThinkingLevel.md)[] | The levels the model accepts, lowest first. The first entry is the model's lowest level. |
| <a id="property-modelprefix"></a> `modelPrefix` | `readonly` | `string` | A concrete model id, matched exact-or-dash-bounded. |
