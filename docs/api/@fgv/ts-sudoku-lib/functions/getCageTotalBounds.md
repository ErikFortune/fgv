[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / getCageTotalBounds

# Function: getCageTotalBounds()

> **getCageTotalBounds**(`cageSize`, `maxValue`): `object`

Calculate the minimum and maximum possible totals for a cage of given size

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cageSize` | `number` | Number of cells in the cage |
| `maxValue` | `number` | Maximum value allowed in a cell (e.g., 9 for 9x9, 16 for 16x16) |

## Returns

`object`

Object with min and max possible totals

| Name | Type |
| ------ | ------ |
| `max` | `number` |
| `min` | `number` |
