[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IReadOnlyConvertingResultMapConstructorParams

# Interface: IReadOnlyConvertingResultMapConstructorParams\<TK, TSRC, TTARGET\>

Parameters for constructing a [ReadOnlyConvertingResultMap](../classes/ReadOnlyConvertingResultMap.md).

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
| <a id="inner"></a> `inner` | [`IReadOnlyResultMap`](IReadOnlyResultMap.md)\<`TK`, `TSRC`\> | The inner map containing source values. |
| <a id="logger"></a> `logger?` | [`ILogger`](../../Logging/interfaces/ILogger.md) | Optional logger for warnings when `onConversionError` is `'warn'`. |
| <a id="onconversionerror"></a> `onConversionError?` | [`ConversionErrorHandling`](../type-aliases/ConversionErrorHandling.md) | Error handling behavior for conversion failures during iteration. Defaults to `'ignore'` (silently skip failed conversions). |
