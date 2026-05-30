[Home](../README.md) > IAiImageGenerationOptions

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

"auto" | "1024x1024" | "1024x1792" | "1792x1024"

</td><td>

Image dimensions.

</td></tr>
<tr><td>

[count](./IAiImageGenerationOptions.count.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of images to generate.

</td></tr>
<tr><td>

[quality](./IAiImageGenerationOptions.quality.md)

</td><td>

`readonly`

</td><td>

"high" | "standard"

</td><td>

Generation quality hint where supported.

</td></tr>
<tr><td>

[seed](./IAiImageGenerationOptions.seed.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Random seed for reproducibility, where supported.

</td></tr>
<tr><td>

[imagen](./IAiImageGenerationOptions.imagen.md)

</td><td>

`readonly`

</td><td>

{ negativePrompt?: string; aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" }

</td><td>

Imagen-specific options.

</td></tr>
</tbody></table>
