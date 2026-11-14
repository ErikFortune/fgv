[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / isAdaptiveThinkingModel

# Function: isAdaptiveThinkingModel()

> **isAdaptiveThinkingModel**(`descriptor`, `modelId`): `boolean`

Determines whether a concrete (already-resolved) Anthropic model id uses the adaptive
thinking wire shape (`thinking: { type: 'adaptive' }` + top-level `output_config.effort`)
rather than the legacy manual-budget shape (`thinking: { type: 'enabled', budget_tokens }`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefix list. |
| `modelId` | `string` | The resolved concrete model id to test. |

## Returns

`boolean`

`true` when `modelId` exactly matches or is dash-bounded-prefixed by any declared
adaptive-thinking prefix.

## Remarks

Matches `modelId` against the descriptor's
[IAiProviderDescriptor.adaptiveThinkingModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-adaptivethinkingmodelprefixes) using the same
exact-or-dash-bounded matcher semantics as the model-specific blocks in
`mergeThinkingConfig` (an entry matches when it equals the resolved model or when the
resolved model starts with the entry followed by a `-`) — a plain prefix match would risk a
false positive against an unrelated model sharing the same leading characters. A provider
that declares no list (the common case — this is Anthropic-specific) always returns `false`.
Consulted by the completion (`callProviderCompletion`), streaming
(`callProviderCompletionStream`), and client-tool (`executeClientToolTurn`) Anthropic
dispatch sites so every Anthropic wire-request path picks the correct thinking shape for the
resolved model.
