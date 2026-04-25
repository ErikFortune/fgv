[Home](../README.md) > IAiImageAttachment

# Interface: IAiImageAttachment

Image attachment for a vision (image-input) prompt.

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

[detail](./IAiImageAttachment.detail.md)

</td><td>

`readonly`

</td><td>

"auto" | "high" | "low"

</td><td>

OpenAI vision detail hint:

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
