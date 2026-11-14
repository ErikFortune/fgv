[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionSetToken

# Function: toConditionSetToken()

> **toConditionSetToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetToken`](../../../type-aliases/ConditionSetToken.md)\>

Converts a string to a [ConditionSetToken](../../../type-aliases/ConditionSetToken.md) if it is a valid condition set token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetToken`](../../../type-aliases/ConditionSetToken.md)\>

`Success` with the converted [ConditionSetToken](../../../type-aliases/ConditionSetToken.md) if successful, or `Failure` with an
error message if not.
