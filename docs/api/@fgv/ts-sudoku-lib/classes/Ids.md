[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / Ids

# Class: Ids

## Constructors

### Constructor

> **new Ids**(): `Ids`

#### Returns

`Ids`

## Methods

### cageId()

> `static` **cageId**(`from`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CageId`](../type-aliases/CageId.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `string` \| [`ICage`](../interfaces/ICage.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CageId`](../type-aliases/CageId.md)\>

***

### cellId()

> `static` **cellId**(`spec`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CellId`](../type-aliases/CellId.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | `string` \| [`IRowColumn`](../interfaces/IRowColumn.md) \| [`ICell`](../interfaces/ICell.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CellId`](../type-aliases/CellId.md)\>

***

### cellIds()

> `static` **cellIds**(`firstRow`, `numRows`, `firstCol`, `numCols`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CellId`](../type-aliases/CellId.md)[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `firstRow` | `number` |
| `numRows` | `number` |
| `firstCol` | `number` |
| `numCols` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`CellId`](../type-aliases/CellId.md)[]\>

***

### columnCageId()

> `static` **columnCageId**(`col`): [`CageId`](../type-aliases/CageId.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `col` | `number` |

#### Returns

[`CageId`](../type-aliases/CageId.md)

***

### rowCageId()

> `static` **rowCageId**(`row`): [`CageId`](../type-aliases/CageId.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `row` | `number` |

#### Returns

[`CageId`](../type-aliases/CageId.md)

***

### sectionCageId()

> `static` **sectionCageId**(`row`, `col`, `cageHeight`, `cageWidth`): [`CageId`](../type-aliases/CageId.md)

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `row` | `number` | `undefined` |
| `col` | `number` | `undefined` |
| `cageHeight` | `number` | `3` |
| `cageWidth` | `number` | `3` |

#### Returns

[`CageId`](../type-aliases/CageId.md)
