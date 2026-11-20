[Home](../README.md) > IYamlSerializeOptions

# Interface: IYamlSerializeOptions

Options for YAML serialization, mirroring commonly-used `js-yaml` `DumpOptions`.

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

[indent](./IYamlSerializeOptions.indent.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Indentation width in spaces (default: 2).

</td></tr>
<tr><td>

[flowLevel](./IYamlSerializeOptions.flowLevel.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Nesting level at which to switch from block to flow style.

</td></tr>
<tr><td>

[sortKeys](./IYamlSerializeOptions.sortKeys.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, sort keys when dumping (default: false).

</td></tr>
<tr><td>

[lineWidth](./IYamlSerializeOptions.lineWidth.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum line width (default: 80).

</td></tr>
<tr><td>

[noRefs](./IYamlSerializeOptions.noRefs.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, don't convert duplicate objects into references (default: false).

</td></tr>
<tr><td>

[noArrayIndent](./IYamlSerializeOptions.noArrayIndent.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, don't add an indentation level to array elements (default: false).

</td></tr>
<tr><td>

[forceQuotes](./IYamlSerializeOptions.forceQuotes.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, all non-key strings will be quoted (default: false).

</td></tr>
</tbody></table>
