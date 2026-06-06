[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toResourceTypeName

# Function: toResourceTypeName()

> **toResourceTypeName**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md)\>

Converts a string to a [resource type name](../../../type-aliases/ResourceTypeName.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceTypeName`](../../../type-aliases/ResourceTypeName.md)\>

`Success` with the converted name if valid, or `Failure` with an error message
if not.
