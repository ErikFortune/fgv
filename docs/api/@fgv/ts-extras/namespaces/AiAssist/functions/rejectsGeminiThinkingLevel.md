[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / rejectsGeminiThinkingLevel

# Function: rejectsGeminiThinkingLevel()

> **rejectsGeminiThinkingLevel**(`descriptor`, `modelId`): `boolean`

Whether a concrete (already-resolved) Gemini model rejects `thinkingLevel` altogether, per the
descriptor's [AiAssist.IAiProviderDescriptor.geminiThinkingLevelRejectedModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-geminithinkinglevelrejectedmodelprefixes)
(exact-or-dash-bounded match).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefixes. |
| `modelId` | `string` | The resolved concrete model id. |

## Returns

`boolean`

`true` when an explicit `thinkingLevel` is refused for `modelId` before the wire.
