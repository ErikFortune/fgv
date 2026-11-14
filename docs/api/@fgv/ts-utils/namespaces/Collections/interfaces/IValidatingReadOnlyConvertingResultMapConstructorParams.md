[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IValidatingReadOnlyConvertingResultMapConstructorParams

# Interface: IValidatingReadOnlyConvertingResultMapConstructorParams\<TK, TSRC, TTARGET\>

Parameters for constructing a
[ValidatingReadOnlyConvertingResultMap](../classes/ValidatingReadOnlyConvertingResultMap.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` |
| <a id="type-parameter-tsrc"></a> `TSRC` |
| <a id="type-parameter-ttarget"></a> `TTARGET` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-converter"></a> `converter` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TTARGET`\> | The key-value converters for validating weakly-typed access. |
| <a id="property-inner"></a> `inner` | [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TSRC`\> | The inner map containing source values. |
