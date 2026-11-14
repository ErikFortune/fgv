[Home](../../README.md) > [Mustache](../README.md) > IRenderedSegment

# Interface: IRenderedSegment

One contiguous run of the rendered output, attributed to what produced it.

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

[kind](./IRenderedSegment.kind.md)

</td><td>

`readonly`

</td><td>

"literal" | "substitution"

</td><td>

`'literal'` for template text; `'substitution'` for an interpolated value.

</td></tr>
<tr><td>

[name](./IRenderedSegment.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Variable name, when `kind` is `'substitution'`.

</td></tr>
<tr><td>

[start](./IRenderedSegment.start.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Offset into `IRenderedTemplate.text`, in UTF-16 code units.

</td></tr>
<tr><td>

[length](./IRenderedSegment.length.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Length in UTF-16 code units.

</td></tr>
<tr><td>

[escaped](./IRenderedSegment.escaped.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

`false` for a triple-stash / `{{&}}` interpolation, which bypasses escaping.

</td></tr>
</tbody></table>
