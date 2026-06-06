[Home](../../README.md) > [AiAssist](../README.md) > IImagen4GenerationConfig

# Interface: IImagen4GenerationConfig

Provider-specific config for Google Imagen 4 models.

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

[aspectRatio](./IImagen4GenerationConfig.aspectRatio.md)

</td><td>

`readonly`

</td><td>

"1:1" | "3:4" | "4:3" | "9:16" | "16:9"

</td><td>

Aspect ratio string.

</td></tr>
<tr><td>

[imageSize](./IImagen4GenerationConfig.imageSize.md)

</td><td>

`readonly`

</td><td>

"1K" | "2K"

</td><td>

Output resolution.

</td></tr>
<tr><td>

[addWatermark](./IImagen4GenerationConfig.addWatermark.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to add SynthID watermark.

</td></tr>
<tr><td>

[enhancePrompt](./IImagen4GenerationConfig.enhancePrompt.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

LLM-based prompt rewriting.

</td></tr>
<tr><td>

[outputMimeType](./IImagen4GenerationConfig.outputMimeType.md)

</td><td>

`readonly`

</td><td>

"image/jpeg" | "image/png"

</td><td>

Output MIME type.

</td></tr>
<tr><td>

[outputCompressionQuality](./IImagen4GenerationConfig.outputCompressionQuality.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

JPEG compression quality.

</td></tr>
<tr><td>

[personGeneration](./IImagen4GenerationConfig.personGeneration.md)

</td><td>

`readonly`

</td><td>

"allow_all" | "allow_adult" | "dont_allow"

</td><td>

Person generation policy.

</td></tr>
</tbody></table>
