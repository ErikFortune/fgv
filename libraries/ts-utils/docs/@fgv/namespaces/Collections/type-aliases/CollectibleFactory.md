[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / CollectibleFactory

# Type Alias: CollectibleFactory()\<TITEM, TSRC\>

> **CollectibleFactory**\<`TITEM`, `TSRC`\> = (`key`, `index`, `item`) => [`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Factory function for creating a new [ICollectible](../interfaces/ICollectible.md) instance given a key, an index and a source representation
of the item to be added.

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |
| `TSRC` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`CollectibleKey`](CollectibleKey.md)\<`TITEM`\> |
| `index` | `number` |
| `item` | `TSRC` |

## Returns

[`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>
