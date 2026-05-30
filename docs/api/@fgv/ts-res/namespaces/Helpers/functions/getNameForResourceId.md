[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / getNameForResourceId

# Function: getNameForResourceId()

> **getNameForResourceId**(`id`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)\>

Gets the name for a resource ID.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` \| `undefined` | The resource ID to get the name for. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)\>

`Success` with the resource name if found, or `Failure` with an error message if not.
