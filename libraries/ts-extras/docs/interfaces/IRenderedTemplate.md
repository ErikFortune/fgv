[Home](../README.md) > IRenderedTemplate

# Interface: IRenderedTemplate

A render plus the map of which part of the output came from where.

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

[text](./IRenderedTemplate.text.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The rendered output — identical to what `MustacheTemplate.render` returns.

</td></tr>
<tr><td>

[segments](./IRenderedTemplate.segments.md)

</td><td>

`readonly`

</td><td>

readonly [IRenderedSegment](IRenderedSegment.md)[]

</td><td>

Document-ordered, contiguous and gapless: every code unit of `text` belongs to exactly one
segment, so concatenating them reproduces `text` exactly.

</td></tr>
</tbody></table>
