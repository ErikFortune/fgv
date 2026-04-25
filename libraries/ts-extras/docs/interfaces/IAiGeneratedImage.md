[Home](../README.md) > IAiGeneratedImage

# Interface: IAiGeneratedImage

A single generated image.

**Extends:** [`IAiImageData`](IAiImageData.md)

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

[revisedPrompt](./IAiGeneratedImage.revisedPrompt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The prompt as rewritten by the provider, if any.

</td></tr>
<tr><td>

[mimeType](./IAiImageData.mimeType.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

MIME type, e.g.

</td></tr>
<tr><td>

[base64](./IAiImageData.base64.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded image bytes (no `data:` prefix).

</td></tr>
</tbody></table>
