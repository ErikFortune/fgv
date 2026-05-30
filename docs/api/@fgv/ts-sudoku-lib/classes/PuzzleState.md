[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / PuzzleState

# Class: PuzzleState

## Constructors

### Constructor

> `protected` **new PuzzleState**(`from`, `updates?`): `PuzzleState`

**`Internal`**

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `Map`\<[`CellId`](../type-aliases/CellId.md), [`ICellContents`](../interfaces/ICellContents.md)\> |
| `updates?` | [`ICellState`](../interfaces/ICellState.md)[] |

#### Returns

`PuzzleState`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_cells"></a> `_cells` | `readonly` | `Map`\<[`CellId`](../type-aliases/CellId.md), [`ICellContents`](../interfaces/ICellContents.md)\> | **`Internal`** |

## Methods

### getCellContents()

> **getCellContents**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellContents`](../interfaces/ICellContents.md)\>

Gets the contents of a cell specified by [id](../type-aliases/CellId.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`CellId`](../type-aliases/CellId.md) | The [id](../type-aliases/CellId.md) of the cell to be retrieved. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellContents`](../interfaces/ICellContents.md)\>

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

> **update**(`updates`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleState`\>

Creates a new PuzzleState which corresponds
to this state with updates applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `updates` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [CellState](../interfaces/ICellState.md) to be applied. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleState`\>

A new PuzzleState with updates applied.

***

### \_toEntries()

> `protected` `static` **\_toEntries**(`states?`): \[[`CellId`](../type-aliases/CellId.md), [`ICellContents`](../interfaces/ICellContents.md)\][]

**`Internal`**

Convert [CellContents](../interfaces/ICellContents.md) to `[`[CellId](../type-aliases/CellId.md)`,` [CellContents](../interfaces/ICellContents.md)`]`
tuple for `Map` construction.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `states?` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [CellContents](../interfaces/ICellContents.md) to be converted. |

#### Returns

\[[`CellId`](../type-aliases/CellId.md), [`ICellContents`](../interfaces/ICellContents.md)\][]

The corresponding array of `[`[CellId](../type-aliases/CellId.md)`,` [CellContents](../interfaces/ICellContents.md)`]`

***

### create()

> `static` **create**(`cells`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleState`\>

Constructs a new PuzzleState.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cells` | [`ICellState`](../interfaces/ICellState.md)[] | An array of [CellState](../interfaces/ICellState.md) used to initialize the state. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleState`\>

The new PuzzleState.
