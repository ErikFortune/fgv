[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IConvertingCollectorConstructorParams

# Interface: IConvertingCollectorConstructorParams\<TITEM, TSRC\>

Parameters for constructing a [ConvertingCollector](../classes/ConvertingCollector.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-titem"></a> `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> | - |
| <a id="type-parameter-tsrc"></a> `TSRC` | `TITEM` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-entries"></a> `entries?` | [`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\>[] | An optional array of entries to add to the collector. |
| <a id="property-factory"></a> `factory` | [`CollectibleFactory`](../type-aliases/CollectibleFactory.md)\<`TITEM`, `TSRC`\> | The default [factory](../type-aliases/CollectibleFactory.md) to create items. |
