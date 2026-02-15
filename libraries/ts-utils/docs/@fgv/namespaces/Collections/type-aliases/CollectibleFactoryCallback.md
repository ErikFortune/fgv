[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / CollectibleFactoryCallback

# Type Alias: CollectibleFactoryCallback()\<TITEM\>

> **CollectibleFactoryCallback**\<`TITEM`\> = (`key`, `index`) => [`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>

Factory function for creating a new [ICollectible](../interfaces/ICollectible.md) instance given a key and an index.

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<`any`, `any`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | [`CollectibleKey`](CollectibleKey.md)\<`TITEM`\> |
| `index` | `number` |

## Returns

[`Result`](../../../../type-aliases/Result.md)\<`TITEM`\>
