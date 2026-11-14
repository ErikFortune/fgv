[Home](../README.md) > KeyedConverterOptions

# Interface: KeyedConverterOptions

Options for recordOf and
mapOf
helper functions.

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

[onError](./KeyedConverterOptions.onError.md)

</td><td>



</td><td>

"fail" | "ignore"

</td><td>

if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
cannot be converted.

</td></tr>
<tr><td>

[keyConverter](./KeyedConverterOptions.keyConverter.md)

</td><td>



</td><td>

[Converter](Converter.md)&lt;T, TC&gt; | [Validator](Validator.md)&lt;T, TC&gt;

</td><td>

If present, `keyConverter` is used to convert the source object property names to

</td></tr>
</tbody></table>
