[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / PuzzleSession

# Class: PuzzleSession

Represents a single puzzle session, including puzzle, current state and redo/undo.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_nextstep"></a> `_nextStep` | `protected` | `number` | - |
| <a id="_numsteps"></a> `_numSteps` | `protected` | `number` | - |
| <a id="_puzzle"></a> `_puzzle` | `readonly` | [`Puzzle`](Puzzle.md) | - |
| <a id="_steps"></a> `_steps` | `protected` | `IPuzzleStep`[] | - |
| <a id="state"></a> `state` | `public` | [`PuzzleState`](PuzzleState.md) | The current [state](PuzzleState.md) of this puzzle session. |

## Accessors

### cages

#### Get Signature

> **get** **cages**(): [`ICage`](../interfaces/ICage.md)[]

All [cages](../interfaces/ICage.md) in the puzzle being solved.

##### Returns

[`ICage`](../interfaces/ICage.md)[]

***

### canRedo

#### Get Signature

> **get** **canRedo**(): `boolean`

Indicates whether redo is currently possible.

##### Returns

`boolean`

***

### canUndo

#### Get Signature

> **get** **canUndo**(): `boolean`

Indicates whether undo is currently possible.

##### Returns

`boolean`

***

### cells

#### Get Signature

> **get** **cells**(): [`ICell`](../interfaces/ICell.md)[]

The cells [cells](../interfaces/ICell.md) in the puzzle being solved.

##### Returns

[`ICell`](../interfaces/ICell.md)[]

***

### cols

#### Get Signature

> **get** **cols**(): [`ICage`](../interfaces/ICage.md)[]

The column [cages](../interfaces/ICage.md) in the puzzle being solved.

##### Returns

[`ICage`](../interfaces/ICage.md)[]

***

### description

#### Get Signature

> **get** **description**(): `string`

Description of the puzzle being solved.

##### Returns

`string`

***

### id

#### Get Signature

> **get** **id**(): `string` \| `undefined`

ID of the puzzle being solved.

##### Returns

`string` \| `undefined`

***

### nextStep

#### Get Signature

> **get** **nextStep**(): `number`

Index of the next step in this puzzle session.

##### Returns

`number`

***

### numColumns

#### Get Signature

> **get** **numColumns**(): `number`

Number of columns in the puzzle being solved.

##### Returns

`number`

***

### numRows

#### Get Signature

> **get** **numRows**(): `number`

Number of rows in the puzzle being solved.

##### Returns

`number`

***

### numSteps

#### Get Signature

> **get** **numSteps**(): `number`

Number of steps currently elapsed in this puzzle session.  Note
that after undo, `nextStep` will be less than `numSteps`.

##### Returns

`number`

***

### puzzle

#### Get Signature

> **get** **puzzle**(): [`Puzzle`](Puzzle.md)

The puzzle structure for this session.

##### Returns

[`Puzzle`](Puzzle.md)

***

### rows

#### Get Signature

> **get** **rows**(): [`ICage`](../interfaces/ICage.md)[]

The row [cages](../interfaces/ICage.md) in the puzzle being solved.

##### Returns

[`ICage`](../interfaces/ICage.md)[]

***

### sections

#### Get Signature

> **get** **sections**(): [`ICage`](../interfaces/ICage.md)[]

The section [cages](../interfaces/ICage.md) in the puzzle being solved.

##### Returns

[`ICage`](../interfaces/ICage.md)[]

***

### type

#### Get Signature

> **get** **type**(): `string`

Type of the puzzle being solved.

##### Returns

`string`

## Methods

### cageContainedValues()

> **cageContainedValues**(`spec`): `Set`\<`number`\>

Determines the numbers currently present in some cage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`ICage`](../interfaces/ICage.md) | A `string` ([CageId](../type-aliases/CageId.md)) or [ICage](../interfaces/ICage.md) indicating the cage to be tested. |

#### Returns

`Set`\<`number`\>

A `Set<number>` containing all numbers present in the cage.

***

### cageContainsValue()

> **cageContainsValue**(`spec`, `value`): `boolean`

Determines if some [cage](../interfaces/ICage.md) contains a specific value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`ICage`](../interfaces/ICage.md) | A `string` ([CageId](../type-aliases/CageId.md)) or [ICage](../interfaces/ICage.md) indicating the cage to be tested. |
| `value` | `number` | The value to be tested. |

#### Returns

`boolean`

`true` if the cage exists and contains the specified value,
`false` otherwise.

***

### cellHasValue()

> **cellHasValue**(`spec`): `boolean`

Determines if a cell has a value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string` ([CellId](../type-aliases/CellId.md)), [RowColumn](../interfaces/IRowColumn.md) or [ICell](../interfaces/ICell.md) describing the cell to be tested. |

#### Returns

`boolean`

`true` if the cell has a value, `false` if the cell is empty or the cell itself is invalid.

***

### cellIsValid()

> **cellIsValid**(`spec`): `boolean`

Determines if a cell is valid.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string` ([CellId](../type-aliases/CellId.md)), [RowColumn](../interfaces/IRowColumn.md) or [ICell](../interfaces/ICell.md) describing the cell to be tested. |

#### Returns

`boolean`

`true` if the cell value is valid, `false` if the cell value or the cell itself is invalid.

***

### checkIsSolved()

> **checkIsSolved**(): `boolean`

Determines if the puzzle is correctly solved.

#### Returns

`boolean`

`true` if the puzzle is solved, `false` if the puzzle has
empty or invalid cells.

***

### checkIsValid()

> **checkIsValid**(): `boolean`

Determines if the puzzle is valid in its current state.

#### Returns

`boolean`

`true` if all non-empty cells in the puzzle are valid,
or `false` if any cells are invalid.

***

### getCellContents()

> **getCellContents**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: [`ICell`](../interfaces/ICell.md); `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

Gets the [contents](../interfaces/ICellContents.md) for a specified cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) | A `string` ([CellId](../type-aliases/CellId.md)), [RowColumn](../interfaces/IRowColumn.md) or [ICell](../interfaces/ICell.md) describing the cell to be queried. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: [`ICell`](../interfaces/ICell.md); `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

`Success` with the [cell description](../interfaces/ICell.md) and [cell contents](../interfaces/ICellContents.md), or
`Failure` with details if an error occurs.

***

### getCellNeighbor()

> **getCellNeighbor**(`spec`, `direction`, `wrap`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../interfaces/ICell.md)\>

Gets the neighbor for a cell in a given direction using specified wrapping rules.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string` ([CellId](../type-aliases/CellId.md)), [RowColumn](../interfaces/IRowColumn.md) or [ICell](../interfaces/ICell.md) describing the cell to be tested. |
| `direction` | [`NavigationDirection`](../type-aliases/NavigationDirection.md) | The direction of the desired neighbor. |
| `wrap` | [`NavigationWrap`](../type-aliases/NavigationWrap.md) | Wrapping rules to be applied. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../interfaces/ICell.md)\>

`Success` with the requested [cell](../interfaces/ICell.md), or `Failure` with details if an error occurs.

***

### getEmptyCells()

> **getEmptyCells**(): [`ICell`](../interfaces/ICell.md)[]

Gets all of the currently empty [cells](../interfaces/ICell.md) in the puzzle.

#### Returns

[`ICell`](../interfaces/ICell.md)[]

An array of [ICell](../interfaces/ICell.md) with all empty cells.

***

### getInvalidCells()

> **getInvalidCells**(): [`ICell`](../interfaces/ICell.md)[]

Gets all of the currently invalid [cells](../interfaces/ICell.md) in the puzzle.

#### Returns

[`ICell`](../interfaces/ICell.md)[]

An array of [ICell](../interfaces/ICell.md) with all invalid cells.

***

### isValidForCell()

> **isValidForCell**(`spec`, `value`): `boolean`

Determines if supplied value is valid for a specific cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string` ([CellId](../type-aliases/CellId.md)), [RowColumn](../interfaces/IRowColumn.md) or [ICell](../interfaces/ICell.md) describing the cell to be tested. |
| `value` | `number` | The value to be tested. |

#### Returns

`boolean`

`true` if `value` is valid for the requested cell, `false` if the value or the cell itself is invalid.

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Redo a single move in this puzzle session.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with `this` if the redo is applied, or `Failure`
with details if an error occurs.

***

### toStrings()

> **toStrings**(): `string`[]

Gets a string representation of this puzzle, one string
per row.

#### Returns

`string`[]

***

### undo()

> **undo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Undo a single move in this puzzle session.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with `this` if the undo is applied, or `Failure`
with details if an error occurs.

***

### updateCellNotes()

> **updateCellNotes**(`spec`, `notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Updates the notes on a cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string`, [row and column](../interfaces/IRowColumn.md), or [cell](../interfaces/ICell.md) identifying the cell to be updated. |
| `notes` | `number`[] | New notes for the cell. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with `this` if the update is applied, `Failure` with details if an error occurs.

***

### updateCells()

> **updateCells**(`updates`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Updates value & notes for multiple cells.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `updates` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [cell state](../interfaces/ICellState.md) objects, each describing one cell to be updated. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with `this` if the updates are applied, `Failure` with details if
an error occurs.

***

### updateCellValue()

> **updateCellValue**(`spec`, `value`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Updates the value of a cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) | A `string`, [row and column](../interfaces/IRowColumn.md), or [cell](../interfaces/ICell.md) identifying the cell to be updated. |
| `value` | `number` \| `undefined` | A new value for the cell. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with `this` if the update is applied, `Failure` with details if an error occurs.

***

### create()

> `static` **create**(`puzzle`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

Creates a new puzzle session from a supplied
[puzzle](Puzzle.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](Puzzle.md) | The [puzzle](Puzzle.md) from which the session is to be initialized. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSession`\>

`Success` with the requested puzzle session,
or `Failure` with details if an error occurs.
