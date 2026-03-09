[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IValidatingConvertingCollectorConstructorParams

# Interface: IValidatingConvertingCollectorConstructorParams\<TITEM, TSRC\>

Parameters for constructing a [ValidatingConvertingCollector](../classes/ValidatingConvertingCollector.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\> | The key-value converters for validation. |
| <a id="entries"></a> `entries?` | [`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\>[] | An optional array of entries to add to the collector. |
| <a id="factory"></a> `factory` | [`CollectibleFactory`](../type-aliases/CollectibleFactory.md)\<`TITEM`, `TSRC`\> | The default [factory](../type-aliases/CollectibleFactory.md) to create items. |
