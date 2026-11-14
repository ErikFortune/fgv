[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / isResponsesOnlyModel

# Function: isResponsesOnlyModel()

> **isResponsesOnlyModel**(`descriptor`, `modelId`): `boolean`

Determines whether a concrete (already-resolved) model id must be invoked via
the OpenAI Responses API rather than chat completions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefix list. |
| `modelId` | `string` | The resolved concrete model id to test. |

## Returns

`boolean`

`true` when `modelId` starts with any declared Responses-only prefix.

## Remarks

Matches `modelId` against the descriptor's
[IAiProviderDescriptor.responsesOnlyModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-responsesonlymodelprefixes) by prefix. A provider
that declares no list (the common case) always returns `false`. Consulted by
both the completion (`callProviderCompletion`) and streaming
(`callProviderCompletionStream`) OpenAI dispatch branches so a Responses-only
model (e.g. `gpt-5.5-pro`) routes correctly even with no tools requested.
