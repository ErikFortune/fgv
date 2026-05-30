[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridCellValidation

# Interface: IGridCellValidation

Validation configuration for grid cells.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="custom"></a> `custom?` | (`value`) => `string` \| `null` | Custom validation function that returns error message or null |
| <a id="maxlength"></a> `maxLength?` | `number` | Maximum length for string values |
| <a id="minlength"></a> `minLength?` | `number` | Minimum length for string values |
| <a id="pattern"></a> `pattern?` | `RegExp` | Regex pattern for validation |
| <a id="required"></a> `required?` | `boolean` | Whether the field is required |
