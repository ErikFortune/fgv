[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IResolvedThinkingConfig

# Interface: IResolvedThinkingConfig

Resolved thinking wire parameters for a specific provider, after merging
all applicable config blocks. Ready for provider-specific wire encoding.

Callers that pre-resolve thinking config outside of the standard streaming
helpers (e.g. `executeClientToolTurn`) accept this type via the
`resolvedThinking` parameter and pass it directly to the adapter layer.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-anthropiceffort"></a> `anthropicEffort?` | `readonly` | `"max"` \| `"high"` \| `"low"` \| `"medium"` | Anthropic: effort level. The emit-site picks one of two wire shapes — on the Claude 5 family it sends the effort string verbatim in `output_config` with no budget; on older models it converts via `anthropicEffortToBudgetTokens`. See [AiAssist.IAnthropicThinkingConfig.effort](IAnthropicThinkingConfig.md#property-effort). |
| <a id="property-anthropicthinkingdisabled"></a> `anthropicThinkingDisabled?` | `readonly` | `true` | Anthropic: a generic `effort: 'none'` asked for thinking off. On an adaptive-thinking model (thinking on by default) the emit-site sends the model's off value (`thinking: { type: 'disabled' }` unless [AiAssist.IAiProviderDescriptor.anthropicThinkingOffTypes](IAiProviderDescriptor.md#property-anthropicthinkingofftypes) names another) and no effort; on an older model it sends nothing, which is already off. Ignored when [IResolvedThinkingConfig.anthropicEffort](#property-anthropiceffort) is set. |
| <a id="property-geminithinkingbudget"></a> `geminiThinkingBudget?` | `readonly` | `number` | Gemini: generationConfig.thinkingConfig.thinkingBudget. Never set together with `geminiThinkingLevel`. |
| <a id="property-geminithinkinglevel"></a> `geminiThinkingLevel?` | `readonly` | [`GeminiThinkingLevel`](../type-aliases/GeminiThinkingLevel.md) | Gemini: generationConfig.thinkingConfig.thinkingLevel. Never set together with `geminiThinkingBudget`. |
| <a id="property-openaieffort"></a> `openAiEffort?` | `readonly` | `"none"` \| `"high"` \| `"low"` \| `"medium"` \| `"minimal"` \| `"xhigh"` | OpenAI Chat: reasoning_effort value; OpenAI Responses: reasoning.effort |
| <a id="property-otherparams"></a> `otherParams?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Other/passthrough: merged verbatim into wire request |
| <a id="property-xaieffort"></a> `xaiEffort?` | `readonly` | `"none"` \| `"high"` \| `"low"` \| `"medium"` | xAI: reasoning_effort value (omit for grok-4) |
