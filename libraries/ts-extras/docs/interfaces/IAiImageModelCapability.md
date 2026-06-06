[Home](../README.md) > IAiImageModelCapability

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

[AiImageApiFormat](../type-aliases/AiImageApiFormat.md)

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
<tr><td>

[acceptedSizes](./IAiImageModelCapability.acceptedSizes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Accepted size strings.

</td></tr>
<tr><td>

[supportsQualityParam](./IAiImageModelCapability.supportsQualityParam.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

When true, quality param is sent.

</td></tr>
<tr><td>

[acceptedQualities](./IAiImageModelCapability.acceptedQualities.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Accepted quality values when supportsQualityParam is true.

</td></tr>
<tr><td>

[maxCount](./IAiImageModelCapability.maxCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum count (n).

</td></tr>
<tr><td>

[outputParamStyle](./IAiImageModelCapability.outputParamStyle.md)

</td><td>

`readonly`

</td><td>

"none" | "response-format" | "output-format"

</td><td>

How to encode the output format on the wire:

</td></tr>
<tr><td>

[defaultOutputMimeType](./IAiImageModelCapability.defaultOutputMimeType.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Default MIME type for response images.

</td></tr>
</tbody></table>
