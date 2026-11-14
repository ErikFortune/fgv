[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / isThinkingRequiredModel

# Function: isThinkingRequiredModel()

> **isThinkingRequiredModel**(`descriptor`, `modelId`): `boolean`

Whether a concrete (already-resolved) model cannot run with thinking off, per the descriptor's
[IAiProviderDescriptor.thinkingRequiredModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-thinkingrequiredmodelprefixes) (exact-or-dash-bounded match).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefix list. |
| `modelId` | `string` | The resolved concrete model id to test. |

## Returns

`boolean`

`true` when a generic `effort: 'none'` would be rejected by `modelId`.
