[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionSetIndex

# Function: toConditionSetIndex()

> **toConditionSetIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md)\>

Converts a number to a [ConditionSetIndex](../../../type-aliases/ConditionSetIndex.md) if it is a valid condition set index.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | the number to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md)\>

`Success` with the converted [ConditionSetIndex](../../../type-aliases/ConditionSetIndex.md) if successful, or `Failure` with an
error message if not.
