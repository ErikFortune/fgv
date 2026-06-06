[Home](../../README.md) > [AiAssist](../README.md) > IAiImageGenerationOptions

# Interface: IAiImageGenerationOptions

Options for image generation requests.

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

[size](./IAiImageGenerationOptions.size.md)

</td><td>

`readonly`

</td><td>

[AiImageSize](../../type-aliases/AiImageSize.md)

</td><td>

Image dimensions for OpenAI models (mapped to `size` field).

</td></tr>
<tr><td>

[count](./IAiImageGenerationOptions.count.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of images.

</td></tr>
<tr><td>

[quality](./IAiImageGenerationOptions.quality.md)

</td><td>

`readonly`

</td><td>

[AiImageQuality](../../type-aliases/AiImageQuality.md)

</td><td>

Quality tier.

</td></tr>
<tr><td>

[seed](./IAiImageGenerationOptions.seed.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Reproducibility seed, where supported.

</td></tr>
<tr><td>

[models](./IAiImageGenerationOptions.models.md)

</td><td>

`readonly`

</td><td>

readonly [IModelFamilyConfig](../../type-aliases/IModelFamilyConfig.md)[]

</td><td>

Optional precision via model-family-scoped blocks.

</td></tr>
</tbody></table>
