[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / splitResourceId

# Function: splitResourceId()

> **splitResourceId**(`id`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)[]\>

Splits a [resource id](../../../type-aliases/ResourceId.md) into its component [resource names](../../../type-aliases/ResourceName.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` \| `undefined` | The ID to split. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)[]\>

`Success`with an array of [ResourceName](../../../type-aliases/ResourceName.md) objects if the ID is valid, or
`Failure` with an error message if not.
