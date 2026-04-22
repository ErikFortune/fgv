[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierContextValue

# Function: toQualifierContextValue()

> **toQualifierContextValue**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Converts a string to a [QualifierContextValue](../../../type-aliases/QualifierContextValue.md) if it is a valid qualifier context value.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the converted [QualifierContextValue](../../../type-aliases/QualifierContextValue.md) if successful, or `Failure` with an
error message if not.
