[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / ICellContents

# Interface: ICellContents

The contents of a single [cell](ICell.md) in a [puzzle](../classes/PuzzleSession.md).

## Extended by

- [`ICellState`](ICellState.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="notes"></a> `notes` | `readonly` | `number`[] | Any notes associated with the [cell](ICell.md). |
| <a id="value"></a> `value?` | `readonly` | `number` | The value of the [cell](ICell.md), or `undefined` if no value has been assigned. |
