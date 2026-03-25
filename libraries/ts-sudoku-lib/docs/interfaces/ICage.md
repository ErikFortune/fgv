[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / ICage

# Interface: ICage

Describes the structure of a single cage in a [puzzle](../classes/PuzzleSession.md).
Does not describe state.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cagetype"></a> `cageType` | `readonly` | [`CageType`](../type-aliases/CageType.md) | The [type](../type-aliases/CageType.md) of the cage. |
| <a id="cellids"></a> `cellIds` | `readonly` | [`CellId`](../type-aliases/CellId.md)[] | The identity of each cell in the cage. |
| <a id="id"></a> `id` | `readonly` | [`CageId`](../type-aliases/CageId.md) | Unique identifier for the cage. |
| <a id="numcells"></a> `numCells` | `readonly` | `number` | The number of cells in the cage. |
| <a id="total"></a> `total` | `readonly` | `number` | The expected sum of all cells in the cage. |

## Methods

### containsCell()

> **containsCell**(`id`): `boolean`

Determines if a supplied cell is present in the cage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`CellId`](../type-aliases/CellId.md) | the identifier to be searched. |

#### Returns

`boolean`
