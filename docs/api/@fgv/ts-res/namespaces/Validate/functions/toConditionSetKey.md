[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionSetKey

# Function: toConditionSetKey()

> **toConditionSetKey**(`key`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

Converts a string to a [ConditionSetKey](../../../type-aliases/ConditionSetKey.md) if it is a valid condition set key.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

`Success` with the converted [ConditionSetKey](../../../type-aliases/ConditionSetKey.md) if successful, or `Failure` with an
error message if not.
