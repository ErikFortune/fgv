[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / IValidationError

# Interface: IValidationError

Validation error for display in the UI

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="cellid"></a> `cellId` | `readonly` | `CellId` |
| <a id="conflictingcells"></a> `conflictingCells` | `readonly` | `CellId`[] |
| <a id="message"></a> `message` | `readonly` | `string` |
| <a id="type"></a> `type` | `readonly` | `"invalid-value"` \| `"duplicate-row"` \| `"duplicate-column"` \| `"duplicate-section"` \| `"duplicate-diagonal"` |
