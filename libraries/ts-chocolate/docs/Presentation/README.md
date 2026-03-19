[Home](../README.md) > Presentation

# Namespace: Presentation

Presentation packlet - rendering confections and other entities for output.

Provides markdown rendering today; designed to grow with PDF and other formats.

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IConfectionMarkdownOptions](./interfaces/IConfectionMarkdownOptions.md)

</td><td>

Options for confection-to-Markdown rendering.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[renderTemplate](./functions/renderTemplate.md)

</td><td>

Renders a `{{variable}}` template string by substituting values from `params`.

</td></tr>
<tr><td>

[confectionToMarkdown](./functions/confectionToMarkdown.md)

</td><td>

Renders a single confection to a Markdown string.

</td></tr>
<tr><td>

[exportConfectionsAsMarkdown](./functions/exportConfectionsAsMarkdown.md)

</td><td>

Exports all confections in the iterable to a ZIP archive of Markdown files.

</td></tr>
<tr><td>

[exportAllAsMarkdown](./functions/exportAllAsMarkdown.md)

</td><td>

Exports all confections and non-built-in filling recipes to a single ZIP archive.

</td></tr>
<tr><td>

[fillingToMarkdown](./functions/fillingToMarkdown.md)

</td><td>

Renders a single non-built-in filling recipe to a Markdown string

</td></tr>
<tr><td>

[exportFillingsAsMarkdown](./functions/exportFillingsAsMarkdown.md)

</td><td>

Exports all non-built-in filling recipes to a ZIP archive of Markdown files.

</td></tr>
</tbody></table>
