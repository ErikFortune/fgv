[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / Cage

# Class: Cage

**`Internal`**

## Implements

- [`ICage`](../interfaces/ICage.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_cellids"></a> `_cellIds` | `readonly` | [`CellId`](../type-aliases/CellId.md)[] | - |
| <a id="cagetype"></a> `cageType` | `readonly` | [`CageType`](../type-aliases/CageType.md) | The [type](../type-aliases/CageType.md) of the cage. |
| <a id="id"></a> `id` | `readonly` | [`CageId`](../type-aliases/CageId.md) | Unique identifier for the cage. |
| <a id="total"></a> `total` | `readonly` | `number` | The expected sum of all cells in the cage. |

## Accessors

### cellIds

#### Get Signature

> **get** **cellIds**(): [`CellId`](../type-aliases/CellId.md)[]

The identity of each cell in the cage.

##### Returns

[`CellId`](../type-aliases/CellId.md)[]

The identity of each cell in the cage.

#### Implementation of

[`ICage`](../interfaces/ICage.md).[`cellIds`](../interfaces/ICage.md#cellids)

***

### numCells

#### Get Signature

> **get** **numCells**(): `number`

The number of cells in the cage.

##### Returns

`number`

The number of cells in the cage.

#### Implementation of

[`ICage`](../interfaces/ICage.md).[`numCells`](../interfaces/ICage.md#numcells)

## Methods

### containedValues()

> **containedValues**(`state`): `Set`\<`number`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`PuzzleState`](PuzzleState.md) |

#### Returns

`Set`\<`number`\>

***

### containsCell()

> **containsCell**(`id`): `boolean`

Determines if a supplied cell is present in the cage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`CellId`](../type-aliases/CellId.md) | the identifier to be searched. |

#### Returns

`boolean`

#### Implementation of

[`ICage`](../interfaces/ICage.md).[`containsCell`](../interfaces/ICage.md#containscell)

***

### containsValue()

> **containsValue**(`value`, `state`, `ignore?`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |
| `state` | [`PuzzleState`](PuzzleState.md) |
| `ignore?` | [`CellId`](../type-aliases/CellId.md)[] |

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

### create()

> `static` **create**(`id`, `type`, `total`, `cells`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Cage`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`CageId`](../type-aliases/CageId.md) |
| `type` | [`CageType`](../type-aliases/CageType.md) |
| `total` | `number` |
| `cells` | [`CellId`](../type-aliases/CellId.md)[] |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Cage`\>
