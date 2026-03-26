[Home](../../README.md) > [Conversion](../README.md) > ObjectConverterOptions

# Interface: ObjectConverterOptions

Options for an Conversion.ObjectConverter | ObjectConverter.

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

[optionalFields](./ObjectConverterOptions.optionalFields.md)

</td><td>



</td><td>

(keyof T)[]

</td><td>

If present, lists optional fields.

</td></tr>
<tr><td>

[strict](./ObjectConverterOptions.strict.md)

</td><td>



</td><td>

boolean

</td><td>

If true, unrecognized fields yield an error.

</td></tr>
<tr><td>

[description](./ObjectConverterOptions.description.md)

</td><td>



</td><td>

string

</td><td>

Optional description to be included in error messages.

</td></tr>
<tr><td>

[modifier](./ObjectConverterOptions.modifier.md)

</td><td>



</td><td>

"required" | "partial"

</td><td>

Optional modifier to apply to the converter.

</td></tr>
</tbody></table>
