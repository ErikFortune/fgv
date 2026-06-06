[Home](../README.md) > IProviderCompletionStreamParams

# Interface: IProviderCompletionStreamParams

Parameters for a streaming completion request. Structurally identical to
the non-streaming `IProviderCompletionParams`; kept as its own interface
so callers can be explicit about which path they're invoking.

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

[descriptor](./IProviderCompletionStreamParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](IAiProviderDescriptor.md)

</td><td>

The provider descriptor

</td></tr>
<tr><td>

[apiKey](./IProviderCompletionStreamParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication

</td></tr>
<tr><td>

[prompt](./IProviderCompletionStreamParams.prompt.md)

</td><td>

`readonly`

</td><td>

[AiPrompt](../classes/AiPrompt.md)

</td><td>

The structured prompt to send

</td></tr>
<tr><td>

[messagesBefore](./IProviderCompletionStreamParams.messagesBefore.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](IChatMessage.md)[]

</td><td>

Prior conversation history to insert between the system prompt and the
prompt's user message.

</td></tr>
<tr><td>

[temperature](./IProviderCompletionStreamParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sampling temperature (default: 0.7)

</td></tr>
<tr><td>

[modelOverride](./IProviderCompletionStreamParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map.

</td></tr>
<tr><td>

[logger](./IProviderCompletionStreamParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for request/response observability.

</td></tr>
<tr><td>

[tools](./IProviderCompletionStreamParams.tools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiWebSearchToolConfig](IAiWebSearchToolConfig.md)[]

</td><td>

Server-side tools to include in the request.

</td></tr>
<tr><td>

[signal](./IProviderCompletionStreamParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal for cancelling the in-flight stream.

</td></tr>
<tr><td>

[endpoint](./IProviderCompletionStreamParams.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional override of the descriptor's default base URL.

</td></tr>
<tr><td>

[thinking](./IProviderCompletionStreamParams.thinking.md)

</td><td>

`readonly`

</td><td>

[IThinkingConfig](IThinkingConfig.md)

</td><td>

Optional thinking/reasoning mode configuration.

</td></tr>
</tbody></table>
