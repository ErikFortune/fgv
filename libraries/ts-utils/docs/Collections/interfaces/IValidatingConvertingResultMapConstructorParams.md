[Home](../../README.md) > [Collections](../README.md) > IValidatingConvertingResultMapConstructorParams

# Interface: IValidatingConvertingResultMapConstructorParams

Parameters for constructing a
Collections.ValidatingConvertingResultMap | ValidatingConvertingResultMap.

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

[inner](./IValidatingConvertingResultMapConstructorParams.inner.md)

</td><td>



</td><td>

TSRCMAP

</td><td>

The inner map containing source values.

</td></tr>
<tr><td>

[converter](./IValidatingConvertingResultMapConstructorParams.converter.md)

</td><td>



</td><td>

[ConvertingResultMapValueConverter](../../type-aliases/ConvertingResultMapValueConverter.md)&lt;TK, TSRC, TTARGET&gt;

</td><td>

The converter function to transform source values to target values.

</td></tr>
<tr><td>

[converters](./IValidatingConvertingResultMapConstructorParams.converters.md)

</td><td>



</td><td>

[KeyValueConverters](../../classes/KeyValueConverters.md)&lt;TK, TTARGET&gt;

</td><td>

The key-value converters for validating weakly-typed access.

</td></tr>
</tbody></table>
