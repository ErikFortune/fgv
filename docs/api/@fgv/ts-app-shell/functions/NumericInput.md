[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / NumericInput

# Function: NumericInput()

> **NumericInput**(`props`): `ReactElement`

Numeric input that selects all on focus and allows empty values.

Internally manages a string so the user can freely type, backspace to empty,
and replace the entire value. On blur, the string is parsed to a number
(clamped to min/max) and reported to the parent via `onChange`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`INumericInputProps`](../interfaces/INumericInputProps.md) |

## Returns

`ReactElement`
