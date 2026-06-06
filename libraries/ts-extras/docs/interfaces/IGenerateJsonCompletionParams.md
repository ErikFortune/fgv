[Home](../README.md) > IGenerateJsonCompletionParams

# Interface: IGenerateJsonCompletionParams

Parameters for AiAssist.generateJsonCompletion. Extends
AiAssist.IProviderCompletionParams with JSON-validation knobs.

**Extends:** [`IProviderCompletionParams`](IProviderCompletionParams.md)

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

[JsonPromptHint](../type-aliases/JsonPromptHint.md)

</td><td>

Controls the optional system-prompt augmentation.

</td></tr>
<tr><td>

[descriptor](./IProviderCompletionParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](IAiProviderDescriptor.md)

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

[prompt](./IProviderCompletionParams.prompt.md)

</td><td>

`readonly`

</td><td>

[AiPrompt](../classes/AiPrompt.md)

</td><td>

The structured prompt to send

</td></tr>
<tr><td>

[additionalMessages](./IProviderCompletionParams.additionalMessages.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](IChatMessage.md)[]

</td><td>

Additional messages to append after system+user in order (e.g.

</td></tr>
<tr><td>

[temperature](./IProviderCompletionParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sampling temperature (default: 0.7)

</td></tr>
<tr><td>

[modelOverride](./IProviderCompletionParams.modelOverride.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise)

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

readonly [IAiWebSearchToolConfig](IAiWebSearchToolConfig.md)[]

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

[thinking](./IProviderCompletionParams.thinking.md)

</td><td>

`readonly`

</td><td>

[IThinkingConfig](IThinkingConfig.md)

</td><td>

Optional thinking/reasoning config.

</td></tr>
</tbody></table>
