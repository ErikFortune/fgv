[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IValidatingConvertingResultMapConstructorParams

# Interface: IValidatingConvertingResultMapConstructorParams\<TK, TSRC, TTARGET, TSRCMAP\>

Parameters for constructing a
[ValidatingConvertingResultMap](../classes/ValidatingConvertingResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | - |
| <a id="type-parameter-tsrc"></a> `TSRC` | - |
| <a id="type-parameter-ttarget"></a> `TTARGET` | - |
| <a id="type-parameter-tsrcmap"></a> `TSRCMAP` *extends* [`IResultMap`](IResultMap.md)\<`TK`, `TSRC`\> | [`IResultMap`](IResultMap.md)\<`TK`, `TSRC`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-converter"></a> `converter` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TTARGET`\> | The key-value converters for validating weakly-typed access. |
| <a id="property-inner"></a> `inner` | `TSRCMAP` | The inner map containing source values. |
