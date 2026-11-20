[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / isValidConditionToken

# Function: isValidConditionToken()

> **isValidConditionToken**(`token`): `token is ConditionToken`

Determines whether a string is a valid [condition token](../../../type-aliases/ConditionToken.md).
A condition token has the format:
`<qualifierName>=<value>` or `<value>`

## Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |

## Returns

`token is ConditionToken`

`true` if the string is a valid condition token, `false` otherwise.
