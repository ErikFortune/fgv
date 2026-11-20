[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / isValidConditionKey

# Function: isValidConditionKey()

> **isValidConditionKey**(`key`): `key is ConditionKey`

Determines whether a string is a valid condition key.  A condition key has
the format:
`<qualifierName>(-<operator>)?-[<value>]@<priority>`
where operator is omitted for the default 'matches' operator.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | the string to validate |

## Returns

`key is ConditionKey`

`true` if the string is a valid condition key, `false` otherwise.
