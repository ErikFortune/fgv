[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveGeminiThinkingLevels

# Function: resolveGeminiThinkingLevels()

> **resolveGeminiThinkingLevels**(`descriptor`, `modelId`): readonly [`GeminiThinkingLevel`](../type-aliases/GeminiThinkingLevel.md)[] \| `undefined`

The thinking levels a concrete (already-resolved) Gemini model accepts, per the descriptor's
[AiAssist.IAiProviderDescriptor.geminiThinkingLevels](../interfaces/IAiProviderDescriptor.md#property-geminithinkinglevels) (exact-or-dash-bounded match; when several
rules match, the longest `modelPrefix` wins).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the rules. |
| `modelId` | `string` | The resolved concrete model id. |

## Returns

readonly [`GeminiThinkingLevel`](../type-aliases/GeminiThinkingLevel.md)[] \| `undefined`

The matching rule's levels (lowest first), or `undefined` when no rule matches — the
model is sent `thinkingBudget`.
