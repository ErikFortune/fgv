[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / validateResolvedOptions

# Function: validateResolvedOptions()

> **validateResolvedOptions**(`modelId`, `capability`, `resolved`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResolvedImageOptions`](../interfaces/IResolvedImageOptions.md)\>

Validates the resolved options against per-model registry constraints.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | The resolved model string |
| `capability` | [`IAiImageModelCapability`](../interfaces/IAiImageModelCapability.md) | The resolved capability entry from the registry |
| `resolved` | [`IResolvedImageOptions`](../interfaces/IResolvedImageOptions.md) | The merged options from resolveImageOptions |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResolvedImageOptions`](../interfaces/IResolvedImageOptions.md)\>

The same resolved options on success, or a failure with a contextual message

## Remarks

Fails fast on the first violation. Error format:
`model "${model}": ${field} "${value}" is not accepted; accepted values: ${JSON.stringify(accepted)}`
