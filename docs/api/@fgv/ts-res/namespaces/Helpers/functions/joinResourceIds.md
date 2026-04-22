[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / joinResourceIds

# Function: joinResourceIds()

> **joinResourceIds**(...`ids`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md)\>

Joins a list of [resource ID](../../../type-aliases/ResourceId.md) or [resource name](../../../type-aliases/ResourceName.md) with
to create a new [resource ID](../../../type-aliases/ResourceId.md). Fails if resulting ID is invalid or empty.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`ids` | (`string` \| `undefined`)[] | The names or IDs to join. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceId`](../../../type-aliases/ResourceId.md)\>

`Success` with the new ID if the base and names are valid, or `Failure` with an error message
if not.
