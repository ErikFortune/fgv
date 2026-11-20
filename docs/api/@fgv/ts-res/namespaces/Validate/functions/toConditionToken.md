[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionToken

# Function: toConditionToken()

> **toConditionToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionToken`](../../../type-aliases/ConditionToken.md)\>

Converts a string to a [ConditionToken](../../../type-aliases/ConditionToken.md) if it is a valid condition token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionToken`](../../../type-aliases/ConditionToken.md)\>

`Success` with the converted [ConditionToken](../../../type-aliases/ConditionToken.md) if successful, or `Failure` with an
error message if not.
