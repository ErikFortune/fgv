[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toResourceId

# Function: toResourceId()

> **toResourceId**(`id`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md)\>

Converts a string to a [resource ID](../../../type-aliases/ResourceId.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md)\>

`Success` with the converted ID if valid, or `Failure` with an error message
if not.
