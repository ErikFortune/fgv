[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [Converters](../../../README.md) / [Jar](../README.md) / datedRegistryFromJarRecords

# Function: datedRegistryFromJarRecords()

> **datedRegistryFromJarRecords**\<`T`, `TC`\>(`entryConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IDatedRegistry`](../../../../Model/interfaces/IDatedRegistry.md)\<`T`\>, `TC`\>

**`Internal`**

Helper function which creates a converter that returns a validated [DatedRegistry](../../../../Model/interfaces/IDatedRegistry.md)
containing entries of supplied template type `T`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entryConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | A `Converter<T>` to validate each entry |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IDatedRegistry`](../../../../Model/interfaces/IDatedRegistry.md)\<`T`\>, `TC`\>

A new validating `Converter` which yields [DatedRegistry\<T\>](../../../../Model/interfaces/IDatedRegistry.md)
