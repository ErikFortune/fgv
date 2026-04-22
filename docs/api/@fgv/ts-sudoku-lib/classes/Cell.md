[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / Cell

# Class: Cell

**`Internal`**

## Implements

- [`ICellInit`](../interfaces/ICellInit.md)
- [`ICell`](../interfaces/ICell.md)

## Constructors

### Constructor

> **new Cell**(`init`, `cages`): `Cell`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `init` | [`ICellInit`](../interfaces/ICellInit.md) |
| `cages` | readonly [`Cage`](Cage.md)[] |

#### Returns

`Cell`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cages"></a> `cages` | `readonly` | readonly [`Cage`](Cage.md)[] | All of the [cages](../interfaces/ICage.md) to which this cell belongs. |
| <a id="col"></a> `col` | `readonly` | `number` | Column number of the cell. |
| <a id="id"></a> `id` | `readonly` | [`CellId`](../type-aliases/CellId.md) | Unique identifier for the cell. |
| <a id="immutable"></a> `immutable` | `readonly` | `boolean` | Indicates whether this cell is a given value (immutable). |
| <a id="immutablevalue"></a> `immutableValue?` | `readonly` | `number` | Given value of this cell, or `undefined` if the cell is not immutable. |
| <a id="row"></a> `row` | `readonly` | `number` | Row number of the cell. |

## Methods

### hasValue()

> **hasValue**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`boolean`

***

### isValid()

> **isValid**(`state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`boolean`

***

### isValidValue()

> **isValidValue**(`value`, `state`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` \| `undefined` |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`boolean`

***

### toString()

> **toString**(`state?`): `string`

Returns a string representation of an object.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state?` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`string`

***

### update()

> **update**(`value`, `notes`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` \| `undefined` |
| `notes` | `number`[] |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>

***

### updateNotes()

> **updateNotes**(`notes`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notes` | `number`[] |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>

***

### updateValue()

> **updateValue**(`value`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` \| `undefined` |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ICellState`](../interfaces/ICellState.md)\>
