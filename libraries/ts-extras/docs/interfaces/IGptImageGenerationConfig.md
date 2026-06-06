[Home](../README.md) > IGptImageGenerationConfig

# Interface: IGptImageGenerationConfig

Provider-specific config for gpt-image-1.

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

[size](./IGptImageGenerationConfig.size.md)

</td><td>

`readonly`

</td><td>

[GptImageSize](../type-aliases/GptImageSize.md)

</td><td>

Image dimensions.

</td></tr>
<tr><td>

[quality](./IGptImageGenerationConfig.quality.md)

</td><td>

`readonly`

</td><td>

[GptImageQuality](../type-aliases/GptImageQuality.md)

</td><td>

Quality tier.

</td></tr>
<tr><td>

[outputFormat](./IGptImageGenerationConfig.outputFormat.md)

</td><td>

`readonly`

</td><td>

"png" | "jpeg" | "webp"

</td><td>

Output format (replaces response_format for this model).

</td></tr>
<tr><td>

[outputCompression](./IGptImageGenerationConfig.outputCompression.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

JPEG/WebP compression level 0–100.

</td></tr>
<tr><td>

[background](./IGptImageGenerationConfig.background.md)

</td><td>

`readonly`

</td><td>

"transparent" | "auto" | "opaque"

</td><td>

Background transparency control.

</td></tr>
<tr><td>

[moderation](./IGptImageGenerationConfig.moderation.md)

</td><td>

`readonly`

</td><td>

"auto" | "low"

</td><td>

Content moderation strictness.

</td></tr>
</tbody></table>
