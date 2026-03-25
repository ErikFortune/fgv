[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / PuzzleState

# Class: PuzzleState

## Methods

### getCellContents()

> **getCellContents**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICellContents`](../interfaces/ICellContents.md)\>

Gets the contents of a cell specified by [id](../type-aliases/CellId.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`CellId`](../type-aliases/CellId.md) | The [id](../type-aliases/CellId.md) of the cell to be retrieved. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICellContents`](../interfaces/ICellContents.md)\>

A [CellContents](../interfaces/ICellContents.md) with the contents of
the requested cell.

***

### hasValue()

> **hasValue**(`id`): `boolean`

Determines if some cell has an assigned value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`CellId`](../type-aliases/CellId.md) | The [id](../type-aliases/CellId.md) of the cell to be tested. |

#### Returns

`boolean`

`true` if the cell has a value, `false` if the cell
is empty or invalid.

***

### update()

> **update**(`updates`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleState`\>

Creates a new PuzzleState which corresponds
to this state with updates applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `updates` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [CellState](../interfaces/ICellState.md) to be applied. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleState`\>

A new PuzzleState with updates applied.

***

### create()

> `static` **create**(`cells`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleState`\>

Constructs a new PuzzleState.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cells` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [CellState](../interfaces/ICellState.md) used to initialize the state. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleState`\>

The new PuzzleState.
