[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionKey

# Function: toConditionKey()

> **toConditionKey**(`key`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionKey`](../../../type-aliases/ConditionKey.md)\>

Converts a string to a [ConditionKey](../../../type-aliases/ConditionKey.md) if it is a valid condition key.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionKey`](../../../type-aliases/ConditionKey.md)\>

`Success` with the converted [ConditionKey](../../../type-aliases/ConditionKey.md) if successful, or `Failure` with an
error message if not.
