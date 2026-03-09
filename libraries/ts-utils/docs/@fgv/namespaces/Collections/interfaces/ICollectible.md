[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ICollectible

# Interface: ICollectible\<TKEY, TINDEX\>

An item that can be collected by some [Collector](../classes/ConvertingCollector.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="index"></a> `index` | `readonly` | `TINDEX` \| `undefined` |
| <a id="key"></a> `key` | `readonly` | `TKEY` |

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../type-aliases/Result.md)\<`TINDEX`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TINDEX`\>
