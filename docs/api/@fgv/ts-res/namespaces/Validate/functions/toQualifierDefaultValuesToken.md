[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierDefaultValuesToken

# Function: toQualifierDefaultValuesToken()

> **toQualifierDefaultValuesToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierDefaultValuesToken`](../../../type-aliases/QualifierDefaultValuesToken.md)\>

Converts a string to a [QualifierDefaultValuesToken](../../../type-aliases/QualifierDefaultValuesToken.md) if it is a valid qualifier default values token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierDefaultValuesToken`](../../../type-aliases/QualifierDefaultValuesToken.md)\>

`Success` with the converted [QualifierDefaultValuesToken](../../../type-aliases/QualifierDefaultValuesToken.md) if successful, or `Failure` with an
error message if not.
