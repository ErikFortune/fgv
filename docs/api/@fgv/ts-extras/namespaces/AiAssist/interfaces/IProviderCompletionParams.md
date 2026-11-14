[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IProviderCompletionParams

# Interface: IProviderCompletionParams

Parameters for a provider completion request. Carries the unified
[AiAssist.IChatRequest](IChatRequest.md) shape (`system?` + ordered `messages`, last =
current user turn); history is linearized before the current turn.

## Extends

- [`IChatRequest`](IChatRequest.md)

## Extended by

- [`IGenerateJsonCompletionParams`](IGenerateJsonCompletionParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication |
| <a id="property-cache"></a> `cache?` | `readonly` | [`IAiCacheRequest`](IAiCacheRequest.md) | Prompt-caching plan for this request. Omitted, nothing cache-related is sent — the request body is byte-identical to a build predating this feature. See [AiAssist.IAiCacheRequest](IAiCacheRequest.md). |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional override of the descriptor's default base URL (scheme + host + optional port + path prefix). The per-route suffix (e.g. `/chat/completions`) is appended unchanged. Must be a well-formed `http`/`https` URL. Auth shape is unchanged: `needsSecret` providers still require an API key. Schemas sent to an overridden endpoint — client-tool parameters and structured-output schemas — are adapted with the conservative keyword table (`JsonSchema.unverifiedWireSchemaKeywords`), since the provider's documentation describes its own endpoint, unless `verifiedEndpoint` asserts this one is the provider itself. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Optional cap on generated output tokens, mapped to each provider's native field: Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens`, Gemini `generationConfig.maxOutputTokens`, and on the chat-completions path the descriptor's `chatOutputTokensField` (`max_completion_tokens` for OpenAI, Groq and xAI; `max_tokens` for Mistral, Ollama and `openai-compat`). When unset, every provider except Anthropic omits the field and applies its own default; Anthropic's Messages API requires the field, so it falls back to `DEFAULT_ANTHROPIC_MAX_TOKENS`. |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IChatMessage`](IChatMessage.md)[] | The ordered conversation turns. Must be non-empty; the last entry is the current `user` turn and the preceding entries are history. |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal for cancelling the in-flight request. |
| <a id="property-structuredoutput"></a> `structuredOutput?` | `readonly` | [`StructuredOutputRequest`](../type-aliases/StructuredOutputRequest.md) | Ask the provider to constrain its output — to a schema, or to syntactically valid JSON of arbitrary shape. **Remarks** **The caller supplies intent; the response reports outcome.** A caller cannot know up front which concrete model will serve the request (a `tier` request cascades, and aliases resolve at call time), so it never has to: whatever was actually enforced comes back on `IAiCompletionResponse.structuredOutput`. |
| <a id="property-system"></a> `system?` | `readonly` | `string` | System instructions (schema docs, format rules, general guidance). |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | Sampling temperature. Sent to the provider only when explicitly provided; omitted otherwise so the provider's own default applies. Many current-gen models reject a non-default value; a model on `IAiProviderDescriptor.samplingParamsRejectedModelPrefixes` still accepts the descriptor's `samplingParamsAcceptedTemperature`, with or without thinking, and is refused any other value before the wire; a model on `IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes` applies the same rule unless the request turns thinking off (effort `'none'`), when any value is sent. |
| <a id="property-thinking"></a> `thinking?` | `readonly` | [`IThinkingConfig`](IThinkingConfig.md) | Optional thinking/reasoning config. Anthropic, OpenAI, and xAI reject `temperature` when the effective merged effort is non-`'none'`, except a model's accepted default (`IAiProviderDescriptor.samplingParamsAcceptedTemperature`); Gemini always accepts both. |
| <a id="property-tier"></a> `tier?` | `readonly` | `"advanced"` \| `"frontier"` | Optional quality tier selecting which completion model to use. `undefined` selects the `base` tier; `'frontier'` cascades to `advanced` then `base` when a tier is unset for a provider. Orthogonal to `thinking` and `tools`, which never select a model. |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`IAiWebSearchToolConfig`](IAiWebSearchToolConfig.md)[] | Server-side tools to include in the request. Overrides settings-level tool config when provided. |
| <a id="property-verifiedendpoint"></a> `verifiedEndpoint?` | `readonly` | [`IAiVerifiedEndpoint`](IAiVerifiedEndpoint.md) | The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's schemas are adapted with that provider's keyword table instead of the conservative one. Ignored without `endpoint`, and honoured only as `IAiVerifiedEndpoint` describes. |
