[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierName

# Function: toQualifierName()

> **toQualifierName**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

Converts a string to a [QualifierName](../../../type-aliases/QualifierName.md) if it is a valid qualifier name.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierName`](../../../type-aliases/QualifierName.md)\>

`Success` with the converted [QualifierName](../../../type-aliases/QualifierName.md) if successful, or `Failure` with an
error message if not.
