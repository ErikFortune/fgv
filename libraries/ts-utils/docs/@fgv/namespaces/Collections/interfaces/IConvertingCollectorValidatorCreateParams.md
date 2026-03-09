[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IConvertingCollectorValidatorCreateParams

# Interface: IConvertingCollectorValidatorCreateParams\<TITEM, TSRC\>

Parameters for constructing a [ConvertingCollectorValidator](../classes/ConvertingCollectorValidator.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TITEM` *extends* [`ICollectible`](ICollectible.md)\<`any`, `any`\> | - |
| `TSRC` | `TITEM` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="collector"></a> `collector` | [`ConvertingCollector`](../classes/ConvertingCollector.md)\<`TITEM`, `TSRC`\> | The converting collector to validate access to. |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<[`CollectibleKey`](../type-aliases/CollectibleKey.md)\<`TITEM`\>, `TSRC`\> | The key-value converters for validation. |
