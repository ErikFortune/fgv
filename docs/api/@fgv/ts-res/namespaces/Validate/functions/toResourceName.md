[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toResourceName

# Function: toResourceName()

> **toResourceName**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)\>

Converts a string to a [resource name](../../../type-aliases/ResourceName.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceName`](../../../type-aliases/ResourceName.md)\>

`Success` with the converted name if valid, or `Failure` with an error message
if not.
