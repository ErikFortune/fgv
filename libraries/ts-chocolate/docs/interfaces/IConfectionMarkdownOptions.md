[Home](../README.md) > IConfectionMarkdownOptions

# Interface: IConfectionMarkdownOptions

Options for confection-to-Markdown rendering.

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

[variations](./IConfectionMarkdownOptions.variations.md)

</td><td>

`readonly`

</td><td>

"all" | "golden" | [ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)[]

</td><td>

Which variations to render.

</td></tr>
<tr><td>

[includeScaledFillings](./IConfectionMarkdownOptions.includeScaledFillings.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If true, appended scaled filling recipes (ingredient breakdown with weights)
for each variation, scaled to the variation's default yield.

</td></tr>
</tbody></table>
