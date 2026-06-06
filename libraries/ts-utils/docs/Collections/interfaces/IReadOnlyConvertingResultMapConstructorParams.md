[Home](../../README.md) > [Collections](../README.md) > IReadOnlyConvertingResultMapConstructorParams

# Interface: IReadOnlyConvertingResultMapConstructorParams

Parameters for constructing a Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[inner](./IReadOnlyConvertingResultMapConstructorParams.inner.md)

</td><td>



</td><td>

[IReadOnlyResultMap](../../interfaces/IReadOnlyResultMap.md)&lt;TK, TSRC&gt;

</td><td>

The inner map containing source values.

</td></tr>
<tr><td>

[converter](./IReadOnlyConvertingResultMapConstructorParams.converter.md)

</td><td>



</td><td>

[ConvertingResultMapValueConverter](../../type-aliases/ConvertingResultMapValueConverter.md)&lt;TK, TSRC, TTARGET&gt;

</td><td>

The converter function to transform source values to target values.

</td></tr>
<tr><td>

[onConversionError](./IReadOnlyConvertingResultMapConstructorParams.onConversionError.md)

</td><td>



</td><td>

[ConversionErrorHandling](../../type-aliases/ConversionErrorHandling.md)

</td><td>

Error handling behavior for conversion failures during iteration.

</td></tr>
<tr><td>

[logger](./IReadOnlyConvertingResultMapConstructorParams.logger.md)

</td><td>



</td><td>

[ILogger](../../interfaces/ILogger.md)

</td><td>

Optional logger for warnings when `onConversionError` is `'warn'`.

</td></tr>
</tbody></table>
