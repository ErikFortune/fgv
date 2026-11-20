[Home](../README.md) > IMustacheTemplateOptions

# Interface: IMustacheTemplateOptions

Options for template parsing and validation.

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

[tags](./IMustacheTemplateOptions.tags.md)

</td><td>

`readonly`

</td><td>

readonly [string, string]

</td><td>

Custom opening and closing tags (default: `['{{', '}}']`)

</td></tr>
<tr><td>

[includeComments](./IMustacheTemplateOptions.includeComments.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to include comment tokens in variable extraction (default: false)

</td></tr>
<tr><td>

[includePartials](./IMustacheTemplateOptions.includePartials.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to include partial references in variable extraction (default: false)

</td></tr>
<tr><td>

[escape](./IMustacheTemplateOptions.escape.md)

</td><td>

`readonly`

</td><td>

[MustacheEscapeStrategy](../type-aliases/MustacheEscapeStrategy.md)

</td><td>

Escape strategy applied to double-brace `{{name}}` tokens at render
time.

</td></tr>
</tbody></table>
