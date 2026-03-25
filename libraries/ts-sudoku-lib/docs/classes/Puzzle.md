[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / Puzzle

# Class: Puzzle

Abstract base class for all puzzles.

## Extended by

- [`Killer`](../@fgv/namespaces/Puzzles/classes/Killer.md)
- [`Sudoku`](../@fgv/namespaces/Puzzles/classes/Sudoku.md)
- [`SudokuX`](../@fgv/namespaces/Puzzles/classes/SudokuX.md)

## Constructors

### Constructor

> `protected` **new Puzzle**(`puzzle`, `extraCages?`): `Puzzle`

Constructs a new puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md) | IPuzzleDefinition \| Puzzle definition from which this puzzle state is to be initialized. |
| `extraCages?` | \[[`CageId`](../type-aliases/CageId.md), `Cage`\][] | - |

#### Returns

`Puzzle`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_cages"></a> `_cages` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), `Cage`\> |
| <a id="_cells"></a> `_cells` | `readonly` | `Map`\<[`CellId`](../type-aliases/CellId.md), `Cell`\> |
| <a id="_columns"></a> `_columns` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), `Cage`\> |
| <a id="_rows"></a> `_rows` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), `Cage`\> |
| <a id="_sections"></a> `_sections` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), `Cage`\> |
| <a id="description"></a> `description` | `readonly` | `string` |
| <a id="dimensions"></a> `dimensions` | `readonly` | [`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md) |
| <a id="id"></a> `id?` | `readonly` | `string` |
| <a id="initialstate"></a> `initialState` | `readonly` | [`PuzzleState`](PuzzleState.md) |
| <a id="type"></a> `type` | `readonly` | `string` |

## Accessors

### cages

#### Get Signature

> **get** **cages**(): `Cage`[]

##### Returns

`Cage`[]

***

### cells

#### Get Signature

> **get** **cells**(): `Cell`[]

##### Returns

`Cell`[]

***

### cols

#### Get Signature

> **get** **cols**(): `Cage`[]

##### Returns

`Cage`[]

***

### numColumns

#### Get Signature

> **get** **numColumns**(): `number`

##### Returns

`number`

***

### numRows

#### Get Signature

> **get** **numRows**(): `number`

##### Returns

`number`

***

### rows

#### Get Signature

> **get** **rows**(): `Cage`[]

##### Returns

`Cage`[]

***

### sections

#### Get Signature

> **get** **sections**(): `Cage`[]

##### Returns

`Cage`[]

## Methods

### checkIsSolved()

> **checkIsSolved**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`boolean`

***

### checkIsValid()

> **checkIsValid**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`boolean`

***

### getCage()

> **getCage**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

***

### getCell()

> **getCell**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cell`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cell`\>

***

### getCellContents()

> **getCellContents**(`spec`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: `Cell`; `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `cell`: `Cell`; `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

***

### getCellNeighbor()

> **getCellNeighbor**(`spec`, `direction`, `wrap`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../interfaces/ICell.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) |
| `direction` | [`NavigationDirection`](../type-aliases/NavigationDirection.md) |
| `wrap` | [`NavigationWrap`](../type-aliases/NavigationWrap.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICell`](../interfaces/ICell.md)\>

***

### getColumn()

> **getColumn**(`col`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `col` | `number` \| [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

***

### getEmptyCells()

> **getEmptyCells**(`state`): `Cell`[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`Cell`[]

***

### getInvalidCells()

> **getInvalidCells**(`state`): `Cell`[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`Cell`[]

***

### getRow()

> **getRow**(`row`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | `number` \| [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

***

### getSection()

> **getSection**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`CageId`](../type-aliases/CageId.md) \| [`IRowColumn`](../interfaces/IRowColumn.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Cage`\>

***

### toString()

> **toString**(`state`): `string`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`string`

***

### toStrings()

> **toStrings**(`state`): `string`[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`string`[]

***

### updateCellNotes()

> **updateCellNotes**(`want`, `notes`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `notes` | `number`[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateCellValue()

> **updateCellValue**(`want`, `value`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `value` | `number` \| `undefined` |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateContents()

> **updateContents**(`wantUpdates`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateNotes()

> **updateNotes**(`wantUpdates`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateValues()

> **updateValues**(`wantUpdates`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>
