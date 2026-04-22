[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Puzzles](../README.md) / Killer

# Class: Killer

Abstract base class for all puzzles.

## Extends

- [`Puzzle`](../../../classes/Puzzle.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_cages"></a> `_cages` | `readonly` | `Map`\<[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\> |
| <a id="_cells"></a> `_cells` | `readonly` | `Map`\<[`CellId`](../../../type-aliases/CellId.md), [`Cell`](../../../classes/Cell.md)\> |
| <a id="_columns"></a> `_columns` | `readonly` | `Map`\<[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\> |
| <a id="_rows"></a> `_rows` | `readonly` | `Map`\<[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\> |
| <a id="_sections"></a> `_sections` | `readonly` | `Map`\<[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\> |
| <a id="description"></a> `description` | `readonly` | `string` |
| <a id="dimensions"></a> `dimensions` | `readonly` | [`IPuzzleDefinition`](../../../interfaces/IPuzzleDefinition.md) |
| <a id="id"></a> `id?` | `readonly` | `string` |
| <a id="initialstate"></a> `initialState` | `readonly` | [`PuzzleState`](../../../classes/PuzzleState.md) |
| <a id="type"></a> `type` | `readonly` | `string` |

## Accessors

### cages

#### Get Signature

> **get** **cages**(): [`Cage`](../../../classes/Cage.md)[]

##### Returns

[`Cage`](../../../classes/Cage.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`cages`](../../../classes/Puzzle.md#cages)

***

### cells

#### Get Signature

> **get** **cells**(): [`Cell`](../../../classes/Cell.md)[]

##### Returns

[`Cell`](../../../classes/Cell.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`cells`](../../../classes/Puzzle.md#cells)

***

### cols

#### Get Signature

> **get** **cols**(): [`Cage`](../../../classes/Cage.md)[]

##### Returns

[`Cage`](../../../classes/Cage.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`cols`](../../../classes/Puzzle.md#cols)

***

### numColumns

#### Get Signature

> **get** **numColumns**(): `number`

##### Returns

`number`

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`numColumns`](../../../classes/Puzzle.md#numcolumns)

***

### numRows

#### Get Signature

> **get** **numRows**(): `number`

##### Returns

`number`

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`numRows`](../../../classes/Puzzle.md#numrows)

***

### rows

#### Get Signature

> **get** **rows**(): [`Cage`](../../../classes/Cage.md)[]

##### Returns

[`Cage`](../../../classes/Cage.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`rows`](../../../classes/Puzzle.md#rows)

***

### sections

#### Get Signature

> **get** **sections**(): [`Cage`](../../../classes/Cage.md)[]

##### Returns

[`Cage`](../../../classes/Cage.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`sections`](../../../classes/Puzzle.md#sections)

## Methods

### checkIsSolved()

> **checkIsSolved**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

`boolean`

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`checkIsSolved`](../../../classes/Puzzle.md#checkissolved)

***

### checkIsValid()

> **checkIsValid**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

`boolean`

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`checkIsValid`](../../../classes/Puzzle.md#checkisvalid)

***

### getCage()

> **getCage**(`id`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`CageId`](../../../type-aliases/CageId.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getCage`](../../../classes/Puzzle.md#getcage)

***

### getCell()

> **getCell**(`spec`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cell`](../../../classes/Cell.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../interfaces/IRowColumn.md) \| [`ICell`](../../../interfaces/ICell.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cell`](../../../classes/Cell.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getCell`](../../../classes/Puzzle.md#getcell)

***

### getCellContents()

> **getCellContents**(`spec`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `cell`: [`Cell`](../../../classes/Cell.md); `contents`: [`ICellContents`](../../../interfaces/ICellContents.md); \}\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../interfaces/IRowColumn.md) |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `cell`: [`Cell`](../../../classes/Cell.md); `contents`: [`ICellContents`](../../../interfaces/ICellContents.md); \}\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getCellContents`](../../../classes/Puzzle.md#getcellcontents)

***

### getCellNeighbor()

> **getCellNeighbor**(`spec`, `direction`, `wrap`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICell`](../../../interfaces/ICell.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../../../interfaces/IRowColumn.md) \| [`ICell`](../../../interfaces/ICell.md) |
| `direction` | [`NavigationDirection`](../../../type-aliases/NavigationDirection.md) |
| `wrap` | [`NavigationWrap`](../../../type-aliases/NavigationWrap.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICell`](../../../interfaces/ICell.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getCellNeighbor`](../../../classes/Puzzle.md#getcellneighbor)

***

### getColumn()

> **getColumn**(`col`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `col` | `number` \| [`CageId`](../../../type-aliases/CageId.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getColumn`](../../../classes/Puzzle.md#getcolumn)

***

### getEmptyCells()

> **getEmptyCells**(`state`): [`Cell`](../../../classes/Cell.md)[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Cell`](../../../classes/Cell.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getEmptyCells`](../../../classes/Puzzle.md#getemptycells)

***

### getInvalidCells()

> **getInvalidCells**(`state`): [`Cell`](../../../classes/Cell.md)[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Cell`](../../../classes/Cell.md)[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getInvalidCells`](../../../classes/Puzzle.md#getinvalidcells)

***

### getRow()

> **getRow**(`row`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | `number` \| [`CageId`](../../../type-aliases/CageId.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getRow`](../../../classes/Puzzle.md#getrow)

***

### getSection()

> **getSection**(`spec`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`CageId`](../../../type-aliases/CageId.md) \| [`IRowColumn`](../../../interfaces/IRowColumn.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Cage`](../../../classes/Cage.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`getSection`](../../../classes/Puzzle.md#getsection)

***

### toString()

> **toString**(`state`): `string`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

`string`

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`toString`](../../../classes/Puzzle.md#tostring)

***

### toStrings()

> **toStrings**(`state`): `string`[]

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

`string`[]

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`toStrings`](../../../classes/Puzzle.md#tostrings)

***

### updateCellNotes()

> **updateCellNotes**(`want`, `notes`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../../../interfaces/IRowColumn.md) |
| `notes` | `number`[] |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`updateCellNotes`](../../../classes/Puzzle.md#updatecellnotes)

***

### updateCellValue()

> **updateCellValue**(`want`, `value`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `want` | `string` \| [`IRowColumn`](../../../interfaces/IRowColumn.md) |
| `value` | `number` \| `undefined` |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`updateCellValue`](../../../classes/Puzzle.md#updatecellvalue)

***

### updateContents()

> **updateContents**(`wantUpdates`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../../../interfaces/ICellState.md) \| [`ICellState`](../../../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`updateContents`](../../../classes/Puzzle.md#updatecontents)

***

### updateNotes()

> **updateNotes**(`wantUpdates`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../../../interfaces/ICellState.md) \| [`ICellState`](../../../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`updateNotes`](../../../classes/Puzzle.md#updatenotes)

***

### updateValues()

> **updateValues**(`wantUpdates`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `wantUpdates` | [`ICellState`](../../../interfaces/ICellState.md) \| [`ICellState`](../../../interfaces/ICellState.md)[] |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleUpdate`](../../../interfaces/IPuzzleUpdate.md)\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`updateValues`](../../../classes/Puzzle.md#updatevalues)

***

### \_createColumnCages()

> `protected` `static` **\_createColumnCages**(`numRows`, `numCols`, `basicCageTotal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\][]\>

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `numRows` | `number` |
| `numCols` | `number` |
| `basicCageTotal` | `number` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\][]\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`_createColumnCages`](../../../classes/Puzzle.md#_createcolumncages)

***

### \_createRowCages()

> `protected` `static` **\_createRowCages**(`numRows`, `numCols`, `basicCageTotal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\][]\>

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `numRows` | `number` |
| `numCols` | `number` |
| `basicCageTotal` | `number` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\[[`CageId`](../../../type-aliases/CageId.md), [`Cage`](../../../classes/Cage.md)\][]\>

#### Inherited from

[`Puzzle`](../../../classes/Puzzle.md).[`_createRowCages`](../../../classes/Puzzle.md#_createrowcages)

***

### create()

> `static` **create**(`desc`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Puzzle`](../../../classes/Puzzle.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `desc` | [`IPuzzleDefinition`](../../../interfaces/IPuzzleDefinition.md) |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Puzzle`](../../../classes/Puzzle.md)\>
