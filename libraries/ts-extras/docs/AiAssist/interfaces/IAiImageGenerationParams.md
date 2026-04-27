[Home](../../README.md) > [AiAssist](../README.md) > IAiImageGenerationParams

# Interface: IAiImageGenerationParams

Parameters for an image-generation request.

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

[prompt](./IAiImageGenerationParams.prompt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The text prompt describing the desired image.

</td></tr>
<tr><td>

[options](./IAiImageGenerationParams.options.md)

</td><td>

`readonly`

</td><td>

[IAiImageGenerationOptions](../../interfaces/IAiImageGenerationOptions.md)

</td><td>

Optional generation options.

</td></tr>
<tr><td>

[referenceImages](./IAiImageGenerationParams.referenceImages.md)

</td><td>

`readonly`

</td><td>

readonly [IAiImageAttachment](../../interfaces/IAiImageAttachment.md)[]

</td><td>

Optional reference images.

</td></tr>
</tbody></table>
