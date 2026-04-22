[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / parseCellId

# Function: parseCellId()

> **parseCellId**(`cellId`): [`IRowColumn`](../interfaces/IRowColumn.md) \| `undefined`

Parse a cell ID string back to row/column coordinates

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cellId` | `string` | Cell ID string (e.g., "A1", "A01", "AB15") |

## Returns

[`IRowColumn`](../interfaces/IRowColumn.md) \| `undefined`

Row and column indices (0-based) or undefined if invalid
