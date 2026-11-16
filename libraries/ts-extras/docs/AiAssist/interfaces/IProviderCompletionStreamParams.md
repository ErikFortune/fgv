[Home](../../README.md) > [AiAssist](../README.md) > IProviderCompletionStreamParams

# Interface: IProviderCompletionStreamParams

Parameters for a streaming completion request. The non-streaming
`IProviderCompletionParams` shape **minus `structuredOutput`**; kept as its
own interface so callers can be explicit about which path they're invoking.

**Extends:** [`IChatRequest`](../../interfaces/IChatRequest.md)

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

[IAiProviderDescriptor](../../interfaces/IAiProviderDescriptor.md)

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

[temperature](./IProviderCompletionStreamParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sampling temperature.

</td></tr>
<tr><td>

[modelOverride](./IProviderCompletionStreamParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map.

</td></tr>
<tr><td>

[tier](./IProviderCompletionStreamParams.tier.md)

</td><td>

`readonly`

</td><td>

"advanced" | "frontier"

</td><td>

Optional quality tier selecting which completion model to use.

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

readonly [IAiWebSearchToolConfig](../../interfaces/IAiWebSearchToolConfig.md)[]

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

[verifiedEndpoint](./IProviderCompletionStreamParams.verifiedEndpoint.md)

</td><td>

`readonly`

</td><td>

[IAiVerifiedEndpoint](../../interfaces/IAiVerifiedEndpoint.md)

</td><td>

The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's
schemas are adapted with that provider's keyword table instead of the conservative one.

</td></tr>
<tr><td>

[thinking](./IProviderCompletionStreamParams.thinking.md)

</td><td>

`readonly`

</td><td>

[IThinkingConfig](../../interfaces/IThinkingConfig.md)

</td><td>

Optional thinking/reasoning mode configuration.

</td></tr>
<tr><td>

[maxTokens](./IProviderCompletionStreamParams.maxTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Optional cap on generated output tokens, mapped to each provider's native field:
Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens`, Gemini
`generationConfig.maxOutputTokens`, and on the chat-completions path the descriptor's
`chatOutputTokensField` (`max_completion_tokens` for OpenAI, Groq and xAI; `max_tokens` for
Mistral, Ollama and `openai-compat`).

</td></tr>
<tr><td>

[cache](./IProviderCompletionStreamParams.cache.md)

</td><td>

`readonly`

</td><td>

[IAiCacheRequest](../../interfaces/IAiCacheRequest.md)

</td><td>

Prompt-caching plan for this request.

</td></tr>
<tr><td>

[system](./IChatRequest.system.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

System instructions (schema docs, format rules, general guidance).

</td></tr>
<tr><td>

[messages](./IChatRequest.messages.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](../../interfaces/IChatMessage.md)[]

</td><td>

The ordered conversation turns.

</td></tr>
</tbody></table>
