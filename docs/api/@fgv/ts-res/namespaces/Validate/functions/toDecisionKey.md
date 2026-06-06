[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toDecisionKey

# Function: toDecisionKey()

> **toDecisionKey**(`key`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionKey`](../../../type-aliases/DecisionKey.md)\>

Converts a string to a [DecisionKey](../../../type-aliases/DecisionKey.md) if it is a valid decision key.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`DecisionKey`](../../../type-aliases/DecisionKey.md)\>

`Success` with the converted [DecisionKey](../../../type-aliases/DecisionKey.md) if successful, or `Failure` with an
error message if not.
