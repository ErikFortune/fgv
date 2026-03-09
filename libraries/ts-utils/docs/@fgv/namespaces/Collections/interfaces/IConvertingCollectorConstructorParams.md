[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IConvertingCollectorConstructorParams

# Interface: IConvertingCollectorConstructorParams\<TITEM, TSRC\>

Parameters for constructing a [ConvertingCollector](../classes/ConvertingCollector.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="entries"></a> `entries?` | [`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\>[] | An optional array of entries to add to the collector. |
| <a id="factory"></a> `factory` | [`CollectibleFactory`](../type-aliases/CollectibleFactory.md)\<`TITEM`, `TSRC`\> | The default [factory](../type-aliases/CollectibleFactory.md) to create items. |
