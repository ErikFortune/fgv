[Home](../README.md) > IFormatValueForMessageOptions

# Interface: IFormatValueForMessageOptions

Options for formatValueForMessage.

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

[maxLength](./IFormatValueForMessageOptions.maxLength.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum length of the returned text, in UTF-16 code units, including the trailing
ellipsis (`…`) that marks a truncated rendering.

</td></tr>
<tr><td>

[indent](./IFormatValueForMessageOptions.indent.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of spaces used to indent nested members, with the same meaning (and the same clamp to
0–10) as the `space` argument of `JSON.stringify`.

</td></tr>
<tr><td>

[style](./IFormatValueForMessageOptions.style.md)

</td><td>

`readonly`

</td><td>

"string" | "json"

</td><td>

How to render the value:
- `'json'` (default): the `JSON.stringify` rendering described at formatValueForMessage.

</td></tr>
</tbody></table>
