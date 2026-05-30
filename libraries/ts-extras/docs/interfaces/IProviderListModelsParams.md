[Home](../README.md) > IProviderListModelsParams

# Interface: IProviderListModelsParams

Parameters for a list-models request.

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

[descriptor](./IProviderListModelsParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](IAiProviderDescriptor.md)

</td><td>

The provider descriptor

</td></tr>
<tr><td>

[apiKey](./IProviderListModelsParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication

</td></tr>
<tr><td>

[capability](./IProviderListModelsParams.capability.md)

</td><td>

`readonly`

</td><td>

[AiModelCapability](../type-aliases/AiModelCapability.md)

</td><td>

Optional capability filter; when set, only models declaring this capability are returned.

</td></tr>
<tr><td>

[capabilityConfig](./IProviderListModelsParams.capabilityConfig.md)

</td><td>

`readonly`

</td><td>

[IAiModelCapabilityConfig](IAiModelCapabilityConfig.md)

</td><td>

Optional capability config override (defaults to DEFAULT_MODEL_CAPABILITY_CONFIG).

</td></tr>
<tr><td>

[logger](./IProviderListModelsParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for request/response observability.

</td></tr>
<tr><td>

[signal](./IProviderListModelsParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal for cancelling the in-flight request.

</td></tr>
<tr><td>

[endpoint](./IProviderListModelsParams.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional override of the descriptor's default base URL — a well-formed

</td></tr>
</tbody></table>
