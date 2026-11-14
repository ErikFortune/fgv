[Home](../README.md) > IValidatingReadOnlyConvertingResultMapConstructorParams

# Interface: IValidatingReadOnlyConvertingResultMapConstructorParams

Parameters for constructing a
Collections.ValidatingReadOnlyConvertingResultMap | ValidatingReadOnlyConvertingResultMap.

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

[inner](./IValidatingReadOnlyConvertingResultMapConstructorParams.inner.md)

</td><td>



</td><td>

[IReadOnlyResultMap](IReadOnlyResultMap.md)&lt;TK, TSRC&gt;

</td><td>

The inner map containing source values.

</td></tr>
<tr><td>

[converter](./IValidatingReadOnlyConvertingResultMapConstructorParams.converter.md)

</td><td>



</td><td>

[ConvertingResultMapValueConverter](../type-aliases/ConvertingResultMapValueConverter.md)&lt;TK, TSRC, TTARGET&gt;

</td><td>

The converter function to transform source values to target values.

</td></tr>
<tr><td>

[converters](./IValidatingReadOnlyConvertingResultMapConstructorParams.converters.md)

</td><td>



</td><td>

[KeyValueConverters](../classes/KeyValueConverters.md)&lt;TK, TTARGET&gt;

</td><td>

The key-value converters for validating weakly-typed access.

</td></tr>
</tbody></table>
