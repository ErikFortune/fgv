[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveAnthropicThinkingOffType

# Function: resolveAnthropicThinkingOffType()

> **resolveAnthropicThinkingOffType**(`descriptor`, `modelId`): [`AnthropicThinkingOffType`](../type-aliases/AnthropicThinkingOffType.md)

The `thinking.type` that turns thinking off on a concrete (already-resolved) Anthropic model, per
the descriptor's [IAiProviderDescriptor.anthropicThinkingOffTypes](../interfaces/IAiProviderDescriptor.md#property-anthropicthinkingofftypes) (exact-or-dash-bounded
match, first rule wins).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the rules. |
| `modelId` | `string` | The resolved concrete model id. |

## Returns

[`AnthropicThinkingOffType`](../type-aliases/AnthropicThinkingOffType.md)

The matching rule's type, or `'disabled'` when no rule matches.
