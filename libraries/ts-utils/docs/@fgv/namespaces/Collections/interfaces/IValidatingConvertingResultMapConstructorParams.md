[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IValidatingConvertingResultMapConstructorParams

# Interface: IValidatingConvertingResultMapConstructorParams\<TK, TSRC, TTARGET, TSRCMAP\>

Parameters for constructing a
[ValidatingConvertingResultMap](../classes/ValidatingConvertingResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | - |
| `TSRC` | - |
| `TTARGET` | - |
| `TSRCMAP` *extends* [`IResultMap`](IResultMap.md)\<`TK`, `TSRC`\> | [`IResultMap`](IResultMap.md)\<`TK`, `TSRC`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="converter"></a> `converter` | [`ConvertingResultMapValueConverter`](../type-aliases/ConvertingResultMapValueConverter.md)\<`TK`, `TSRC`, `TTARGET`\> | The converter function to transform source values to target values. |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TTARGET`\> | The key-value converters for validating weakly-typed access. |
| <a id="inner"></a> `inner` | `TSRCMAP` | The inner map containing source values. |
