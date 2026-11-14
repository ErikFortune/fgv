[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / validateCellValue

# Function: validateCellValue()

> **validateCellValue**(`value`, `validation?`): [`Result`](../../../type-aliases/Result.md)\<`ICellValidationResult`\>

Validates a cell value according to the column's validation rules.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The value to validate |
| `validation?` | [`IGridCellValidation`](../interfaces/IGridCellValidation.md) | Validation configuration |

## Returns

[`Result`](../../../type-aliases/Result.md)\<`ICellValidationResult`\>

Result containing validation outcome
