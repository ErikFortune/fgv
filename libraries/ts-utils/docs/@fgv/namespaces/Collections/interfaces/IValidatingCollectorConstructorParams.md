[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IValidatingCollectorConstructorParams

# Interface: IValidatingCollectorConstructorParams\<TITEM\>

Parameters for constructing a [ValidatingCollector](../classes/ValidatingCollector.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The key-value converters for validation. |
| <a id="items"></a> `items?` | `unknown`[] | Optional initial items to populate the collector. |
