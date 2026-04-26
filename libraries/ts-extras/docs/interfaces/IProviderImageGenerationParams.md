[Home](../README.md) > IProviderImageGenerationParams

# Interface: IProviderImageGenerationParams

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

[descriptor](./IProviderImageGenerationParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](IAiProviderDescriptor.md)

</td><td>

The provider descriptor

</td></tr>
<tr><td>

[apiKey](./IProviderImageGenerationParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication

</td></tr>
<tr><td>

[params](./IProviderImageGenerationParams.params.md)

</td><td>

`readonly`

</td><td>

[IAiImageGenerationParams](IAiImageGenerationParams.md)

</td><td>

The image-generation request

</td></tr>
<tr><td>

[modelOverride](./IProviderImageGenerationParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map (uses descriptor.defaultModel.image otherwise)

</td></tr>
<tr><td>

[logger](./IProviderImageGenerationParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for request/response observability.

</td></tr>
<tr><td>

[signal](./IProviderImageGenerationParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal for cancelling the in-flight request.

</td></tr>
</tbody></table>
