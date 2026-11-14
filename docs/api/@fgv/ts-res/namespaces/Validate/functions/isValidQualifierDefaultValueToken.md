[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / isValidQualifierDefaultValueToken

# Function: isValidQualifierDefaultValueToken()

> **isValidQualifierDefaultValueToken**(`token`): `token is QualifierDefaultValueToken`

Determines whether a string is a valid [qualifier default value token](../../../type-aliases/QualifierDefaultValueToken.md).
A qualifier default value token has the format:
`<qualifierName>=<value>` or `<qualifierName>=` (to remove default)
Default values allow broader character set including commas for comma-separated values.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to validate |

## Returns

`token is QualifierDefaultValueToken`

`true` if the string is a valid qualifier default value token, `false` otherwise.
