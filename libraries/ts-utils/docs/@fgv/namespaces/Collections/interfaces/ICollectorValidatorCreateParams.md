[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ICollectorValidatorCreateParams

# Interface: ICollectorValidatorCreateParams\<TITEM\>

Parameters for constructing a [CollectorValidator](../classes/CollectorValidator.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="collector"></a> `collector` | `readonly` | [`Collector`](../classes/Collector.md)\<`TITEM`\> | The collector to validate access to. |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TITEM`\> | The key-value converters for validation. |
