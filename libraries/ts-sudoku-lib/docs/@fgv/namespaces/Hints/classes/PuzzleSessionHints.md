[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / PuzzleSessionHints

# Class: PuzzleSessionHints

Wrapper class that integrates hint functionality with PuzzleSession.
Provides hint generation, application, and explanation capabilities while
maintaining integration with existing state management and undo/redo functionality.

## Accessors

### cages

#### Get Signature

> **get** **cages**(): [`ICage`](../../../../interfaces/ICage.md)[]

Gets all cages.

##### Returns

[`ICage`](../../../../interfaces/ICage.md)[]

Array of all cages

***

### canRedo

#### Get Signature

> **get** **canRedo**(): `boolean`

Gets whether redo is possible.

##### Returns

`boolean`

true if redo is possible

***

### canUndo

#### Get Signature

> **get** **canUndo**(): `boolean`

Gets whether undo is possible.

##### Returns

`boolean`

true if undo is possible

***

### cells

#### Get Signature

> **get** **cells**(): [`ICell`](../../../../interfaces/ICell.md)[]

Gets all cells.

##### Returns

[`ICell`](../../../../interfaces/ICell.md)[]

Array of all cells

***

### cols

#### Get Signature

> **get** **cols**(): [`ICage`](../../../../interfaces/ICage.md)[]

Gets the columns.

##### Returns

[`ICage`](../../../../interfaces/ICage.md)[]

Array of column cages

***

### config

#### Get Signature

> **get** **config**(): [`IPuzzleSessionHintsConfig`](../interfaces/IPuzzleSessionHintsConfig.md)

Gets the configuration.

##### Returns

[`IPuzzleSessionHintsConfig`](../interfaces/IPuzzleSessionHintsConfig.md)

The configuration

***

### description

#### Get Signature

> **get** **description**(): `string`

Gets the puzzle description.

##### Returns

`string`

The puzzle description

***

### hintSystem

#### Get Signature

> **get** **hintSystem**(): [`HintSystem`](HintSystem.md)

Gets the HintSystem instance.

##### Returns

[`HintSystem`](HintSystem.md)

The hint system

***

### id

#### Get Signature

> **get** **id**(): `string` \| `undefined`

Gets the puzzle ID.

##### Returns

`string` \| `undefined`

The puzzle ID

***

### nextStep

#### Get Signature

> **get** **nextStep**(): `number`

Gets the next step index.

##### Returns

`number`

Next step index

***

### numColumns

#### Get Signature

> **get** **numColumns**(): `number`

Gets the number of columns in the puzzle.

##### Returns

`number`

The number of columns

***

### numRows

#### Get Signature

> **get** **numRows**(): `number`

Gets the number of rows in the puzzle.

##### Returns

`number`

The number of rows

***

### numSteps

#### Get Signature

> **get** **numSteps**(): `number`

Gets the number of steps.

##### Returns

`number`

Number of steps

***

### rows

#### Get Signature

> **get** **rows**(): [`ICage`](../../../../interfaces/ICage.md)[]

Gets the rows.

##### Returns

[`ICage`](../../../../interfaces/ICage.md)[]

Array of row cages

***

### sections

#### Get Signature

> **get** **sections**(): [`ICage`](../../../../interfaces/ICage.md)[]

Gets the sections.

##### Returns

[`ICage`](../../../../interfaces/ICage.md)[]

Array of section cages

***

### session

#### Get Signature

> **get** **session**(): [`PuzzleSession`](../../../../classes/PuzzleSession.md)

Gets the wrapped PuzzleSession instance.

##### Returns

[`PuzzleSession`](../../../../classes/PuzzleSession.md)

The underlying PuzzleSession

***

### state

#### Get Signature

> **get** **state**(): [`PuzzleState`](../../../../classes/PuzzleState.md)

Gets the current puzzle state.

##### Returns

[`PuzzleState`](../../../../classes/PuzzleState.md)

The current state

## Methods

### applyHint()

> **applyHint**(`hint`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Applies a hint to the puzzle, updating the state and adding to undo history.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to apply |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance if successful

***

### cageContainedValues()

> **cageContainedValues**(`spec`): `Set`\<`number`\>

Gets contained values in a cage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`ICage`](../../../../interfaces/ICage.md) | Cage specification |

#### Returns

`Set`\<`number`\>

Set of contained values

***

### cageContainsValue()

> **cageContainsValue**(`spec`, `value`): `boolean`

Checks if a cage contains a value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`ICage`](../../../../interfaces/ICage.md) | Cage specification |
| `value` | `number` | Value to check |

#### Returns

`boolean`

true if cage contains value

***

### cellHasValue()

> **cellHasValue**(`spec`): `boolean`

Checks if a cell has a value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |

#### Returns

`boolean`

true if cell has value

***

### cellIsValid()

> **cellIsValid**(`spec`): `boolean`

Checks if a cell is valid.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |

#### Returns

`boolean`

true if valid

***

### checkIsSolved()

> **checkIsSolved**(): `boolean`

Checks if the puzzle is solved.

#### Returns

`boolean`

true if the puzzle is solved

***

### checkIsValid()

> **checkIsValid**(): `boolean`

Checks if the puzzle is valid.

#### Returns

`boolean`

true if the puzzle is valid

***

### getAllHints()

> **getAllHints**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Gets all available hints for the current puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional hint generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Result containing array of hints

***

### getCellContents()

> **getCellContents**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: [`ICell`](../../../../interfaces/ICell.md); `contents`: [`ICellContents`](../../../../interfaces/ICellContents.md); \}\>

Gets cell contents.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) | Cell specification |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: [`ICell`](../../../../interfaces/ICell.md); `contents`: [`ICellContents`](../../../../interfaces/ICellContents.md); \}\>

Result containing cell and contents

***

### getCellNeighbor()

> **getCellNeighbor**(`spec`, `direction`, `wrap`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../../../../interfaces/ICell.md)\>

Gets a cell neighbor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |
| `direction` | [`NavigationDirection`](../../../../type-aliases/NavigationDirection.md) | Navigation direction |
| `wrap` | [`NavigationWrap`](../../../../type-aliases/NavigationWrap.md) | Wrap behavior |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../../../../interfaces/ICell.md)\>

Result containing neighbor cell

***

### getEmptyCells()

> **getEmptyCells**(): [`ICell`](../../../../interfaces/ICell.md)[]

Gets empty cells.

#### Returns

[`ICell`](../../../../interfaces/ICell.md)[]

Array of empty cells

***

### getExplanation()

> **getExplanation**(`hint`, `level?`): `string`

Gets a formatted explanation for a hint.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to explain |
| `level?` | [`ExplanationLevel`](../type-aliases/ExplanationLevel.md) | The explanation level (defaults to configured default) |

#### Returns

`string`

Formatted explanation string

***

### getHint()

> **getHint**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](../interfaces/IHint.md)\>

Gets the best available hint for the current puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional hint generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](../interfaces/IHint.md)\>

Result containing the best hint

***

### getHintsForCell()

> **getHintsForCell**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Gets hints that specifically affect a given cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification (ID, row/column, or cell object) |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional hint generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Result containing hints affecting the specified cell

***

### getHintStatistics()

> **getHintStatistics**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `hintsByDifficulty`: `Map`\<`string`, `number`\>; `hintsByTechnique`: `Map`\<`string`, `number`\>; `totalHints`: `number`; \}\>

Gets statistics about available hints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional hint generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `hintsByDifficulty`: `Map`\<`string`, `number`\>; `hintsByTechnique`: `Map`\<`string`, `number`\>; `totalHints`: `number`; \}\>

Result containing hint statistics

***

### getInvalidCells()

> **getInvalidCells**(): [`ICell`](../../../../interfaces/ICell.md)[]

Gets invalid cells.

#### Returns

[`ICell`](../../../../interfaces/ICell.md)[]

Array of invalid cells

***

### getSystemSummary()

> **getSystemSummary**(): `string`

Gets a summary of the hint system capabilities.

#### Returns

`string`

System capabilities summary

***

### hasHints()

> **hasHints**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Checks if hints are available for the current state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional hint generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Result containing boolean indicating availability

***

### isValidForCell()

> **isValidForCell**(`spec`, `value`): `boolean`

Checks if a value is valid for a cell.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |
| `value` | `number` | Value to check |

#### Returns

`boolean`

true if valid

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Performs a redo operation.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance

***

### toStrings()

> **toStrings**(): `string`[]

Gets string representation of the puzzle.

#### Returns

`string`[]

Array of strings representing puzzle rows

***

### undo()

> **undo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Performs an undo operation.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance

***

### updateCellNotes()

> **updateCellNotes**(`spec`, `notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Updates cell notes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |
| `notes` | `number`[] | New notes |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance

***

### updateCells()

> **updateCells**(`updates`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Updates multiple cells.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `updates` | [`ICellState`](../../../../interfaces/ICellState.md)[] | Array of cell updates |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance

***

### updateCellValue()

> **updateCellValue**(`spec`, `value`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Updates a cell value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../../interfaces/IRowColumn.md) \| [`ICell`](../../../../interfaces/ICell.md) | Cell specification |
| `value` | `number` \| `undefined` | New value |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result with this instance

***

### validateHint()

> **validateHint**(`hint`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Validates that a hint can be applied to the current state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to validate |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating validation success or failure

***

### create()

> `static` **create**(`session`, `config?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Creates a new PuzzleSessionHints wrapper for an existing PuzzleSession.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`PuzzleSession`](../../../../classes/PuzzleSession.md) | The PuzzleSession to wrap |
| `config?` | [`IPuzzleSessionHintsConfig`](../interfaces/IPuzzleSessionHintsConfig.md) | Optional configuration for the hint system |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleSessionHints`\>

Result containing the new PuzzleSessionHints wrapper
