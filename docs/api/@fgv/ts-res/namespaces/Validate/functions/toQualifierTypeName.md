[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierTypeName

# Function: toQualifierTypeName()

> **toQualifierTypeName**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)\>

Converts a string to a [QualifierTypeName](../../../type-aliases/QualifierTypeName.md) if it is a valid qualifier type name.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)\>

`Success` with the converted [QualifierTypeName](../../../type-aliases/QualifierTypeName.md) if successful, or `Failure` with an
error message if not.
