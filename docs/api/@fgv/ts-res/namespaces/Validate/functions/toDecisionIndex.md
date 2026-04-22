[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toDecisionIndex

# Function: toDecisionIndex()

> **toDecisionIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../../../type-aliases/DecisionIndex.md)\>

Converts a number to a [DecisionIndex](../../../type-aliases/DecisionIndex.md) if it is a valid decision index.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | the number to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionIndex`](../../../type-aliases/DecisionIndex.md)\>

`Success` with the converted [DecisionIndex](../../../type-aliases/DecisionIndex.md) if successful, or `Failure` with an
error message if not.
