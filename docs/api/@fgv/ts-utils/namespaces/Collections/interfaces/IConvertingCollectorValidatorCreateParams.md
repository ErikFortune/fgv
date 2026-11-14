[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IConvertingCollectorValidatorCreateParams

# Interface: IConvertingCollectorValidatorCreateParams\<TITEM, TSRC\>

Parameters for constructing a [ConvertingCollectorValidator](../classes/ConvertingCollectorValidator.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-titem"></a> `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> | - |
| <a id="type-parameter-tsrc"></a> `TSRC` | `TITEM` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-collector"></a> `collector` | [`ConvertingCollector`](../classes/ConvertingCollector.md)\<`TITEM`, `TSRC`\> | The converting collector to validate access to. |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\> | The key-value converters for validation. |
