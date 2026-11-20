[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProviderListModels

# Function: callProviderListModels()

> **callProviderListModels**(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiModelInfo`](../interfaces/IAiModelInfo.md)[]\>\>

Lists models available from a provider, routing by `descriptor.apiFormat`.
Capabilities are resolved from native provider info and a configurable rule set.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IProviderListModelsParams`](../interfaces/IProviderListModelsParams.md) | Request parameters (descriptor, API key, optional capability filter) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiModelInfo`](../interfaces/IAiModelInfo.md)[]\>\>
