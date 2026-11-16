[Home](../README.md) > IAiProviderDescriptor

# Interface: IAiProviderDescriptor

Describes a single AI provider — single source of truth for all metadata.

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

[id](./IAiProviderDescriptor.id.md)

</td><td>

`readonly`

</td><td>

[AiProviderId](../type-aliases/AiProviderId.md)

</td><td>

Provider identifier (e.g.

</td></tr>
<tr><td>

[label](./IAiProviderDescriptor.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable label (e.g.

</td></tr>
<tr><td>

[buttonLabel](./IAiProviderDescriptor.buttonLabel.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Button label for action buttons (e.g.

</td></tr>
<tr><td>

[needsSecret](./IAiProviderDescriptor.needsSecret.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider requires an API key secret

</td></tr>
<tr><td>

[apiFormat](./IAiProviderDescriptor.apiFormat.md)

</td><td>

`readonly`

</td><td>

[AiApiFormat](../type-aliases/AiApiFormat.md)

</td><td>

Which API adapter format to use

</td></tr>
<tr><td>

[baseUrl](./IAiProviderDescriptor.baseUrl.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base URL for the API (e.g.

</td></tr>
<tr><td>

[defaultModel](./IAiProviderDescriptor.defaultModel.md)

</td><td>

`readonly`

</td><td>

[ModelSpec](../type-aliases/ModelSpec.md)

</td><td>

Default model specification — string or context-aware map.

</td></tr>
<tr><td>

[aliases](./IAiProviderDescriptor.aliases.md)

</td><td>

`readonly`

</td><td>

[IModelAliasMap](IModelAliasMap.md)

</td><td>

Canonical fgv alias → concrete model map for this provider.

</td></tr>
<tr><td>

[supportedTools](./IAiProviderDescriptor.supportedTools.md)

</td><td>

`readonly`

</td><td>

readonly "web_search"[]

</td><td>

Which server-side tools this provider supports (empty = none).

</td></tr>
<tr><td>

[serverToolsExclusiveWithClientTools](./IAiProviderDescriptor.serverToolsExclusiveWithClientTools.md)

</td><td>

`readonly`

</td><td>

readonly "web_search"[]

</td><td>

Server tools this provider's API refuses to accept in the *same request* as
client (function) tools.

</td></tr>
<tr><td>

[corsRestricted](./IAiProviderDescriptor.corsRestricted.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's API enforces CORS restrictions that prevent direct browser calls.

</td></tr>
<tr><td>

[streamingCorsRestricted](./IAiProviderDescriptor.streamingCorsRestricted.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's streaming completion endpoint requires a proxy
for direct browser calls.

</td></tr>
<tr><td>

[acceptsImageInput](./IAiProviderDescriptor.acceptsImageInput.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this provider's chat completions API accepts image input
(i.e.

</td></tr>
<tr><td>

[imageGeneration](./IAiProviderDescriptor.imageGeneration.md)

</td><td>

`readonly`

</td><td>

readonly [IAiImageModelCapability](IAiImageModelCapability.md)[]

</td><td>

Image-generation capabilities, scoped to model id prefixes.

</td></tr>
<tr><td>

[embedding](./IAiProviderDescriptor.embedding.md)

</td><td>

`readonly`

</td><td>

readonly [IAiEmbeddingModelCapability](IAiEmbeddingModelCapability.md)[]

</td><td>

Embedding capabilities, scoped to model id prefixes.

</td></tr>
<tr><td>

[structuredOutput](./IAiProviderDescriptor.structuredOutput.md)

</td><td>

`readonly`

</td><td>

readonly [IAiStructuredOutputCapability](IAiStructuredOutputCapability.md)[]

</td><td>

Per-model-family structured-output capability, longest-prefix matched against
the **resolved** completion model id.

</td></tr>
<tr><td>

[maxOutputTokens](./IAiProviderDescriptor.maxOutputTokens.md)

</td><td>

`readonly`

</td><td>

readonly [IAiMaxOutputTokensCapability](IAiMaxOutputTokensCapability.md)[]

</td><td>

Per-model maximum output tokens — the largest `maxTokens` the provider accepts for a
completion on that model.

</td></tr>
<tr><td>

[chatOutputTokensField](./IAiProviderDescriptor.chatOutputTokensField.md)

</td><td>

`readonly`

</td><td>

[ChatOutputTokensField](../type-aliases/ChatOutputTokensField.md)

</td><td>

The Chat Completions request field that carries `maxTokens` on this provider's
OpenAI-format chat path: `'max_completion_tokens'`, or the legacy `'max_tokens'` (the
default when undefined).

</td></tr>
<tr><td>

[responsesOnlyModelPrefixes](./IAiProviderDescriptor.responsesOnlyModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Concrete model ids (prefix-matched) that must be invoked via the OpenAI
Responses API rather than chat completions — e.g.

</td></tr>
<tr><td>

[adaptiveThinkingModelPrefixes](./IAiProviderDescriptor.adaptiveThinkingModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Concrete Anthropic model ids (exact-or-dash-bounded-prefix-matched) that require the
adaptive thinking wire shape (`thinking: { type: 'adaptive' }` + top-level
`output_config: { effort }`) rather than the legacy manual-budget shape
(`thinking: { type: 'enabled', budget_tokens }`).

</td></tr>
<tr><td>

[thinkingRequiredModelPrefixes](./IAiProviderDescriptor.thinkingRequiredModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.adaptiveThinkingModelPrefixes) that cannot run with thinking off.

</td></tr>
<tr><td>

[anthropicThinkingOffTypes](./IAiProviderDescriptor.anthropicThinkingOffTypes.md)

</td><td>

`readonly`

</td><td>

readonly [IAnthropicThinkingOffRule](IAnthropicThinkingOffRule.md)[]

</td><td>

Per-model Anthropic thinking-off values for adaptive-thinking models that turn thinking off
with something other than `thinking: { type: 'disabled' }`, the default.

</td></tr>
<tr><td>

[geminiThinkingLevels](./IAiProviderDescriptor.geminiThinkingLevels.md)

</td><td>

`readonly`

</td><td>

readonly [IGeminiThinkingLevelRule](IGeminiThinkingLevelRule.md)[]

</td><td>

Gemini models sent `thinkingLevel` rather than `thinkingBudget`, each with the levels it
accepts, lowest first; matched exact-or-dash-bounded, longest prefix wins (see
AiAssist.resolveGeminiThinkingLevels).

</td></tr>
<tr><td>

[geminiThinkingLevelRejectedModelPrefixes](./IAiProviderDescriptor.geminiThinkingLevelRejectedModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Gemini models (exact-or-dash-bounded) that do not support `thinkingLevel` at all and take only
`thinkingBudget`.

</td></tr>
<tr><td>

[samplingParamsRejectedModelPrefixes](./IAiProviderDescriptor.samplingParamsRejectedModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.thinkingRequiredModelPrefixes) that reject a caller-supplied
`temperature` with or without thinking — every value, or every value but
IAiProviderDescriptor.samplingParamsAcceptedTemperature when the descriptor declares
one.

</td></tr>
<tr><td>

[samplingParamsRejectedWithThinkingModelPrefixes](./IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Concrete model ids (exact-or-dash-bounded-prefix-matched, like
IAiProviderDescriptor.samplingParamsRejectedModelPrefixes) that reason by default and
reject a caller-supplied `temperature` only while reasoning — every value, or every value but
IAiProviderDescriptor.samplingParamsAcceptedTemperature when the descriptor declares
one.

</td></tr>
<tr><td>

[samplingParamsAcceptedTemperature](./IAiProviderDescriptor.samplingParamsAcceptedTemperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The one `temperature` that the models on
IAiProviderDescriptor.samplingParamsRejectedModelPrefixes still accept, with or without
thinking, and that the models on
IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes still accept while
reasoning — the provider's own default, which a provider that rejects only non-default values
lets through.

</td></tr>
</tbody></table>
