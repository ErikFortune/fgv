[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / ICell

# Interface: ICell

Describes the structure of a single cell in a [puzzle](../classes/PuzzleSession.md).
Does not describe state.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cages"></a> `cages` | `readonly` | readonly [`ICage`](ICage.md)[] | All of the ICage \| cages to which this cell belongs. |
| <a id="col"></a> `col` | `readonly` | `number` | Column number of the cell. |
| <a id="id"></a> `id` | `readonly` | [`CellId`](../type-aliases/CellId.md) | Unique identifier for the cell. |
| <a id="immutable"></a> `immutable` | `readonly` | `boolean` | Indicates whether this cell is a given value (immutable). |
| <a id="immutablevalue"></a> `immutableValue?` | `readonly` | `number` | Given value of this cell, or `undefined` if the cell is not immutable. |
| <a id="row"></a> `row` | `readonly` | `number` | Row number of the cell. |
