[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / ICollectorValidatorCreateParams

# Interface: ICollectorValidatorCreateParams\<TITEM\>

Parameters for constructing a [CollectorValidator](../classes/CollectorValidator.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-titem"></a> `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-collector"></a> `collector` | `readonly` | [`Collector`](../classes/Collector.md)\<`TITEM`\> | The collector to validate access to. |
| <a id="property-converters"></a> `converters` | `readonly` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The key-value converters for validation. |
