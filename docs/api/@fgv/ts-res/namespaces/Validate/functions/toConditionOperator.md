[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionOperator

# Function: toConditionOperator()

> **toConditionOperator**(`operator`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionOperator`](../../../type-aliases/ConditionOperator.md)\>

Converts a string to a [ConditionOperator](../../../type-aliases/ConditionOperator.md) if it is a valid condition operator.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operator` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionOperator`](../../../type-aliases/ConditionOperator.md)\>

`Success` with the converted [ConditionOperator](../../../type-aliases/ConditionOperator.md) if successful, or `Failure` with an
error message if not.
