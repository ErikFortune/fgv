[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IGeminiThinkingConfig

# Interface: IGeminiThinkingConfig

Google Gemini-specific thinking configuration.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-includethoughts"></a> `includeThoughts?` | `readonly` | `boolean` | Whether to include thought summaries in the response. **Remarks** Reserved for forward compatibility and **currently ignored by every adapter** — nothing reads this field, so setting it has no effect on the request. Surfacing thinking output as stream events is not yet built. |
| <a id="property-thinkingbudget"></a> `thinkingBudget?` | `readonly` | `number` | Token budget for thinking. Maps 1:1 to `thinkingBudget` on the wire. - 0: disable thinking (Flash and Flash-Lite only; error on Pro) - positive integer: soft token cap - -1: dynamic - omitted: model default **Remarks** Deprecated by Google on Gemini 4, where a lone budget "maps to the nearest `thinkingLevel` … and returns a warning". Cannot be combined with [AiAssist.IGeminiThinkingConfig.thinkingLevel](#property-thinkinglevel). |
| <a id="property-thinkinglevel"></a> `thinkingLevel?` | `readonly` | [`GeminiThinkingLevel`](../type-aliases/GeminiThinkingLevel.md) | Thinking level. Maps 1:1 to `thinkingLevel` on the wire, in place of any budget. **Remarks** Validated before the wire: the value must be a [AiAssist.GeminiThinkingLevel](../type-aliases/GeminiThinkingLevel.md), and on a model with a level declaration ([AiAssist.IAiProviderDescriptor.geminiThinkingLevels](IAiProviderDescriptor.md#property-geminithinkinglevels)) one of that model's levels. On a model with none it is sent verbatim. Setting it together with [AiAssist.IGeminiThinkingConfig.thinkingBudget](#property-thinkingbudget) in one block is refused: Gemini 4 returns a 400 for the pair, and no model documents a meaning for it. |
