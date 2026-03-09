[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IValidatingReadOnlyConvertingResultMapConstructorParams

# Interface: IValidatingReadOnlyConvertingResultMapConstructorParams\<TK, TSRC, TTARGET\>

Parameters for constructing a
[ValidatingReadOnlyConvertingResultMap](../classes/ValidatingReadOnlyConvertingResultMap.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TSRC` |
| `TTARGET` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="converter"></a> `converter` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TTARGET`\> | The key-value converters for validating weakly-typed access. |
| <a id="inner"></a> `inner` | [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TSRC`\> | The inner map containing source values. |
