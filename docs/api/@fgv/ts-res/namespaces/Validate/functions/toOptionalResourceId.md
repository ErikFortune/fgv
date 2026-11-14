[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toOptionalResourceId

# Function: toOptionalResourceId()

> **toOptionalResourceId**(`id?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md) \| `undefined`\>

Converts an optional string to an optional [resource ID](../../../type-aliases/ResourceId.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id?` | `string` | The string to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md) \| `undefined`\>

`Success` with the converted ID if valid, or `Failure` with an error message
if not.
