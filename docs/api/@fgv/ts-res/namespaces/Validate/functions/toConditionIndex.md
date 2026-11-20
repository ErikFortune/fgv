[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionIndex

# Function: toConditionIndex()

> **toConditionIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionIndex`](../../../type-aliases/ConditionIndex.md)\>

Converts a number to a [ConditionIndex](../../../type-aliases/ConditionIndex.md) if it is a valid condition index.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | the number to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionIndex`](../../../type-aliases/ConditionIndex.md)\>

`Success` with the converted [ConditionIndex](../../../type-aliases/ConditionIndex.md) if successful, or `Failure` with an
error message if not.
