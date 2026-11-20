[Home](../README.md) > IKeyValueConverterConstructorParams

# Interface: IKeyValueConverterConstructorParams

Parameters for constructing a Collections.KeyValueConverters | KeyValueConverters instance.

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

[key](./IKeyValueConverterConstructorParams.key.md)

</td><td>



</td><td>

[Validator](Validator.md)&lt;TK, unknown&gt; | [Converter](Converter.md)&lt;TK, unknown&gt; | [ConverterFunc](../type-aliases/ConverterFunc.md)&lt;TK, unknown&gt;

</td><td>

Required key Validator | validator, Converter | converter,

</td></tr>
<tr><td>

[value](./IKeyValueConverterConstructorParams.value.md)

</td><td>



</td><td>

[Validator](Validator.md)&lt;TV, unknown&gt; | [Converter](Converter.md)&lt;TV, unknown&gt; | [ConverterFunc](../type-aliases/ConverterFunc.md)&lt;TV, unknown&gt;

</td><td>

Required value Validator | validator, Converter | converter,

</td></tr>
</tbody></table>
