[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / isValidContextQualifierToken

# Function: isValidContextQualifierToken()

> **isValidContextQualifierToken**(`token`): `token is ContextQualifierToken`

Determines whether a string is a valid [context qualifier token](../../../type-aliases/ContextQualifierToken.md).
A context qualifier token has the format:
`<qualifierName>=<value>` or `<value>`
Context qualifier tokens allow broader character set including commas for comma-separated values.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to validate |

## Returns

`token is ContextQualifierToken`

`true` if the string is a valid context qualifier token, `false` otherwise.
