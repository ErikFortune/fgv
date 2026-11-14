[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / ICollectible

# Interface: ICollectible\<TKEY, TINDEX\>

An item that can be collected by some [Collector](../classes/ConvertingCollector.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tkey"></a> `TKEY` *extends* `string` | `string` |
| <a id="type-parameter-tindex"></a> `TINDEX` *extends* `number` | `number` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-index"></a> `index` | `readonly` | `TINDEX` \| `undefined` |
| <a id="property-key"></a> `key` | `readonly` | `TKEY` |

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../../type-aliases/Result.md)\<`TINDEX`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../../type-aliases/Result.md)\<`TINDEX`\>
