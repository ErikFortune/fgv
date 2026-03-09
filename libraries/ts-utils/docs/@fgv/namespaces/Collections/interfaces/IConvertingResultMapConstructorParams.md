[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IConvertingResultMapConstructorParams

# Interface: IConvertingResultMapConstructorParams\<TK, TSRC, TTARGET, TSRCMAP\>

Parameters for constructing a [ConvertingResultMap](../classes/ConvertingResultMap.md).

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
| <a id="inner"></a> `inner` | `TSRCMAP` | The inner map containing source values. |
