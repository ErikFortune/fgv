[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / Puzzle

# Class: Puzzle

Abstract base class for all puzzles.

## Extended by

- [`Killer`](../namespaces/Puzzles/classes/Killer.md)
- [`Sudoku`](../namespaces/Puzzles/classes/Sudoku.md)
- [`SudokuX`](../namespaces/Puzzles/classes/SudokuX.md)

## Constructors

### Constructor

> `protected` **new Puzzle**(`puzzle`, `extraCages?`): `Puzzle`

Constructs a new puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md) | [Puzzle definition](../interfaces/IPuzzleDefinition.md) from which this puzzle state is to be initialized. |
| `extraCages?` | \[[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\][] | - |

#### Returns

`Puzzle`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_cages"></a> `_cages` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\> |
| <a id="_cells"></a> `_cells` | `readonly` | `Map`\<[`CellId`](../type-aliases/CellId.md), [`Cell`](Cell.md)\> |
| <a id="_columns"></a> `_columns` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\> |
| <a id="_rows"></a> `_rows` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\> |
| <a id="_sections"></a> `_sections` | `readonly` | `Map`\<[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\> |
| <a id="description"></a> `description` | `readonly` | `string` |
| <a id="dimensions"></a> `dimensions` | `readonly` | [`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md) |
| <a id="id"></a> `id?` | `readonly` | `string` |
| <a id="initialstate"></a> `initialState` | `readonly` | [`PuzzleState`](PuzzleState.md) |
| <a id="type"></a> `type` | `readonly` | `string` |

## Accessors

### cages

#### Get Signature

> **get** **cages**(): [`Cage`](Cage.md)[]

##### Returns

[`Cage`](Cage.md)[]

***

### cells

#### Get Signature

> **get** **cells**(): [`Cell`](Cell.md)[]

##### Returns

[`Cell`](Cell.md)[]

***

### cols

#### Get Signature

> **get** **cols**(): [`Cage`](Cage.md)[]

##### Returns

[`Cage`](Cage.md)[]

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

> **get** **rows**(): [`Cage`](Cage.md)[]

##### Returns

[`Cage`](Cage.md)[]

***

### sections

#### Get Signature

> **get** **sections**(): [`Cage`](Cage.md)[]

##### Returns

[`Cage`](Cage.md)[]

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

> **getCage**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

***

### getCell()

> **getCell**(`spec`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cell`](Cell.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cell`](Cell.md)\>

***

### getCellContents()

> **getCellContents**(`spec`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `cell`: [`Cell`](Cell.md); `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `cell`: [`Cell`](Cell.md); `contents`: [`ICellContents`](../interfaces/ICellContents.md); \}\>

***

### getCellNeighbor()

> **getCellNeighbor**(`spec`, `direction`, `wrap`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICell`](../interfaces/ICell.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) |
| `direction` | [`NavigationDirection`](../type-aliases/NavigationDirection.md) |
| `wrap` | [`NavigationWrap`](../type-aliases/NavigationWrap.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICell`](../interfaces/ICell.md)\>

***

### getColumn()

> **getColumn**(`col`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `col` | `number` \| [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

***

### getEmptyCells()

> **getEmptyCells**(`state`): [`Cell`](Cell.md)[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Cell`](Cell.md)[]

***

### getInvalidCells()

> **getInvalidCells**(`state`): [`Cell`](Cell.md)[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Cell`](Cell.md)[]

***

### getRow()

> **getRow**(`row`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | `number` \| [`CageId`](../type-aliases/CageId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

***

### getSection()

> **getSection**(`spec`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`CageId`](../type-aliases/CageId.md) \| [`IRowColumn`](../interfaces/IRowColumn.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](Cage.md)\>

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

> **updateCellNotes**(`want`, `notes`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `notes` | `number`[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateCellValue()

> **updateCellValue**(`want`, `value`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) |
| `value` | `number` \| `undefined` |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateContents()

> **updateContents**(`wantUpdates`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateNotes()

> **updateNotes**(`wantUpdates`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### updateValues()

> **updateValues**(`wantUpdates`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../interfaces/ICellState.md) \| [`ICellState`](../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../interfaces/IPuzzleUpdate.md)\>

***

### \_createColumnCages()

> `protected` `static` **\_createColumnCages**(`numRows`, `numCols`, `basicCageTotal`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\][]\>

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `numRows` | `number` |
| `numCols` | `number` |
| `basicCageTotal` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\][]\>

***

### \_createRowCages()

> `protected` `static` **\_createRowCages**(`numRows`, `numCols`, `basicCageTotal`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\][]\>

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `numRows` | `number` |
| `numCols` | `number` |
| `basicCageTotal` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../type-aliases/CageId.md), [`Cage`](Cage.md)\][]\>
