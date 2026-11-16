[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IValidatingCollectorConstructorParams

# Interface: IValidatingCollectorConstructorParams\<TITEM\>

Parameters for constructing a [ValidatingCollector](../classes/ValidatingCollector.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-titem"></a> `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The key-value converters for validation. |
| <a id="property-items"></a> `items?` | `unknown`[] | Optional initial items to populate the collector. |
