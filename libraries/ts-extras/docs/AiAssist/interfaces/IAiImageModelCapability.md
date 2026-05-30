[Home](../../README.md) > [AiAssist](../README.md) > IAiImageModelCapability

# Interface: IAiImageModelCapability

Image-generation capability for a model family within a provider. Used as
an entry in IAiProviderDescriptor.imageGeneration.

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

[modelPrefix](./IAiImageModelCapability.modelPrefix.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Prefix matched against the resolved image model id.

</td></tr>
<tr><td>

[format](./IAiImageModelCapability.format.md)

</td><td>

`readonly`

</td><td>

[AiImageApiFormat](../../type-aliases/AiImageApiFormat.md)

</td><td>

API format used to dispatch requests for matching models.

</td></tr>
<tr><td>

[acceptsImageReferenceInput](./IAiImageModelCapability.acceptsImageReferenceInput.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether matching models accept reference images via
AiAssist.IAiImageGenerationParams.referenceImages.

</td></tr>
</tbody></table>
