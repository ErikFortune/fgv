[Home](../../README.md) > [AiAssist](../README.md) > IProviderEmbeddingParams

# Interface: IProviderEmbeddingParams

Parameters for a provider embedding request. Mirrors
AiAssist.IProviderImageGenerationParams.

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

[descriptor](./IProviderEmbeddingParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](../../interfaces/IAiProviderDescriptor.md)

</td><td>

The provider descriptor.

</td></tr>
<tr><td>

[apiKey](./IProviderEmbeddingParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication (empty string for keyless self-hosted providers).

</td></tr>
<tr><td>

[params](./IProviderEmbeddingParams.params.md)

</td><td>

`readonly`

</td><td>

[IAiEmbeddingParams](../../interfaces/IAiEmbeddingParams.md)

</td><td>

The embedding request (input + optional knobs).

</td></tr>
<tr><td>

[modelOverride](./IProviderEmbeddingParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map.

</td></tr>
<tr><td>

[logger](./IProviderEmbeddingParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for request/response observability.

</td></tr>
<tr><td>

[signal](./IProviderEmbeddingParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal for cancelling the in-flight request.

</td></tr>
<tr><td>

[endpoint](./IProviderEmbeddingParams.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional override of the descriptor's base URL; the `/embeddings` suffix is appended unchanged.

</td></tr>
</tbody></table>
