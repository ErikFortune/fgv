[Home](../../README.md) > [AiAssist](../README.md) > IGenerateJsonCompletionParams

# Interface: IGenerateJsonCompletionParams

Parameters for AiAssist.generateJsonCompletion. Extends
AiAssist.IProviderCompletionParams with JSON-validation knobs.

**Extends:** [`IProviderCompletionParams`](../../interfaces/IProviderCompletionParams.md)

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

[converter](./IGenerateJsonCompletionParams.converter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>

Caller-supplied `Converter<T>` or `Validator<T>` applied to the parsed
JSON value.

</td></tr>
<tr><td>

[jsonConverter](./IGenerateJsonCompletionParams.jsonConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt;

</td><td>

Full string-to-`T` pipeline override.

</td></tr>
<tr><td>

[promptHint](./IGenerateJsonCompletionParams.promptHint.md)

</td><td>

`readonly`

</td><td>

[JsonPromptHint](../../type-aliases/JsonPromptHint.md)

</td><td>

Controls the optional system-prompt augmentation.

</td></tr>
<tr><td>

[descriptor](./IProviderCompletionParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](../../interfaces/IAiProviderDescriptor.md)

</td><td>

The provider descriptor

</td></tr>
<tr><td>

[apiKey](./IProviderCompletionParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication

</td></tr>
<tr><td>

[temperature](./IProviderCompletionParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sampling temperature.

</td></tr>
<tr><td>

[modelOverride](./IProviderCompletionParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise)

</td></tr>
<tr><td>

[tier](./IProviderCompletionParams.tier.md)

</td><td>

`readonly`

</td><td>

"advanced" | "frontier"

</td><td>

Optional quality tier selecting which completion model to use.

</td></tr>
<tr><td>

[logger](./IProviderCompletionParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for request/response observability.

</td></tr>
<tr><td>

[tools](./IProviderCompletionParams.tools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiWebSearchToolConfig](../../interfaces/IAiWebSearchToolConfig.md)[]

</td><td>

Server-side tools to include in the request.

</td></tr>
<tr><td>

[signal](./IProviderCompletionParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal for cancelling the in-flight request.

</td></tr>
<tr><td>

[endpoint](./IProviderCompletionParams.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional override of the descriptor's default base URL (scheme + host +
optional port + path prefix).

</td></tr>
<tr><td>

[verifiedEndpoint](./IProviderCompletionParams.verifiedEndpoint.md)

</td><td>

`readonly`

</td><td>

[IAiVerifiedEndpoint](../../interfaces/IAiVerifiedEndpoint.md)

</td><td>

The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's
schemas are adapted with that provider's keyword table instead of the conservative one.

</td></tr>
<tr><td>

[thinking](./IProviderCompletionParams.thinking.md)

</td><td>

`readonly`

</td><td>

[IThinkingConfig](../../interfaces/IThinkingConfig.md)

</td><td>

Optional thinking/reasoning config.

</td></tr>
<tr><td>

[maxTokens](./IProviderCompletionParams.maxTokens.md)

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

[structuredOutput](./IProviderCompletionParams.structuredOutput.md)

</td><td>

`readonly`

</td><td>

[StructuredOutputRequest](../../type-aliases/StructuredOutputRequest.md)

</td><td>

Ask the provider to constrain its output — to a schema, or to syntactically

</td></tr>
<tr><td>

[cache](./IProviderCompletionParams.cache.md)

</td><td>

`readonly`

</td><td>

[IAiCacheRequest](../../interfaces/IAiCacheRequest.md)

</td><td>

Prompt-caching plan for this request.

</td></tr>
<tr><td>

[system](./IProviderCompletionParams.system.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

System instructions (schema docs, format rules, general guidance).

</td></tr>
<tr><td>

[messages](./IProviderCompletionParams.messages.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](../../interfaces/IChatMessage.md)[]

</td><td>

The ordered conversation turns.

</td></tr>
</tbody></table>
