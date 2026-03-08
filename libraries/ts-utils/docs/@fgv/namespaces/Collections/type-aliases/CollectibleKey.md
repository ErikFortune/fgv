[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / CollectibleKey

# Type Alias: CollectibleKey\<TITEM\>

> **CollectibleKey**\<`TITEM`\> = `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<infer TKEY\> ? [`TKEY`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) : `never`

Infer the key type from an [ICollectible](../interfaces/ICollectible.md) type.

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md) |
