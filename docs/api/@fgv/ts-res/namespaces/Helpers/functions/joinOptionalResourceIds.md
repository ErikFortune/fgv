[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / joinOptionalResourceIds

# Function: joinOptionalResourceIds()

> **joinOptionalResourceIds**(...`ids`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md) \| `undefined`\>

Joins a list of [resource ID](../../../type-aliases/ResourceId.md) or [resource name](../../../type-aliases/ResourceName.md) with
to create a new [resource ID](../../../type-aliases/ResourceId.md). Returns `undefined` if no names are defined.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`ids` | (`string` \| `undefined`)[] | The names or IDs to join. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md) \| `undefined`\>

`Success` with the new ID if the base and names are valid, `Success` with `undefined`
if names were present, or `Failure` with an error message if the resulting id is invalid.
