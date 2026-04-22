[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / ICellState

# Interface: ICellState

Describes the state of or a state update for a single [cell](ICell.md) in a
[puzzle](../classes/PuzzleSession.md).

## Extends

- [`ICellContents`](ICellContents.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | [`CellId`](../type-aliases/CellId.md) | - |
| <a id="notes"></a> `notes` | `readonly` | `number`[] | Any notes associated with the [cell](ICell.md). |
| <a id="value"></a> `value?` | `readonly` | `number` | The value of the [cell](ICell.md), or `undefined` if no value has been assigned. |
