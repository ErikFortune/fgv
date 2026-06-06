[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / CollectibleKey

# Type Alias: CollectibleKey\<TITEM\>

> **CollectibleKey**\<`TITEM`\> = `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md)\<infer TKEY\> ? `TKEY` : `never`

Infer the key type from an [ICollectible](../interfaces/ICollectible.md) type.

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](../interfaces/ICollectible.md) |
