[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierDefaultValueToken

# Function: toQualifierDefaultValueToken()

> **toQualifierDefaultValueToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierDefaultValueToken`](../../../type-aliases/QualifierDefaultValueToken.md)\>

Converts a string to a [QualifierDefaultValueToken](../../../type-aliases/QualifierDefaultValueToken.md) if it is a valid qualifier default value token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierDefaultValueToken`](../../../type-aliases/QualifierDefaultValueToken.md)\>

`Success` with the converted [QualifierDefaultValueToken](../../../type-aliases/QualifierDefaultValueToken.md) if successful, or `Failure` with an
error message if not.
