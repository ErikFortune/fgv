[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IProviderCompletionStreamParams

# Interface: IProviderCompletionStreamParams

Parameters for a streaming completion request. The non-streaming
`IProviderCompletionParams` shape **minus `structuredOutput`**; kept as its
own interface so callers can be explicit about which path they're invoking.

## Remarks

The omission is deliberate, not an oversight. Native structured output is a
non-streaming feature on every provider the package supports, so the field
would have nowhere to go here. A caller that needs it must use
`callProviderCompletion`.

Carries the unified [AiAssist.IChatRequest](IChatRequest.md) shape (`system?` + ordered
`messages`): the last message is the current user turn and the preceding
messages are history, linearized before the current turn (identical to the
completion and client-tool turn paths).

## Extends

- [`IChatRequest`](IChatRequest.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication |
| <a id="property-cache"></a> `cache?` | `readonly` | [`IAiCacheRequest`](IAiCacheRequest.md) | Prompt-caching plan for this request. Omitted, nothing cache-related is sent — the request body is byte-identical to a build predating this feature. See [AiAssist.IAiCacheRequest](IAiCacheRequest.md). Validated against this request's own `system` at the point it is applied, and gated per provider exactly as `IProviderCompletionParams.cache` is on the non-streaming path. |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional override of the descriptor's default base URL. Same semantics as the non-streaming completion path: a well-formed `http`/`https` URL is substituted for `descriptor.baseUrl` when composing the streaming request, with the per-format suffix appended unchanged. Validated at the dispatcher; auth shape is unaffected. Schemas sent to an overridden endpoint — client-tool parameters and structured-output schemas — are adapted with the conservative keyword table (`JsonSchema.unverifiedWireSchemaKeywords`), since the provider's documentation describes its own endpoint, unless `verifiedEndpoint` asserts this one is the provider itself. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Optional cap on generated output tokens, mapped to each provider's native field: Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens`, Gemini `generationConfig.maxOutputTokens`, and on the chat-completions path the descriptor's `chatOutputTokensField` (`max_completion_tokens` for OpenAI, Groq and xAI; `max_tokens` for Mistral, Ollama and `openai-compat`). When unset, every provider except Anthropic omits the field and applies its own default; Anthropic's Messages API requires the field, so it falls back to `DEFAULT_ANTHROPIC_MAX_TOKENS`. |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IChatMessage`](IChatMessage.md)[] | The ordered conversation turns. Must be non-empty; the last entry is the current `user` turn and the preceding entries are history. |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal for cancelling the in-flight stream. |
| <a id="property-system"></a> `system?` | `readonly` | `string` | System instructions (schema docs, format rules, general guidance). |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | Sampling temperature. Sent to the provider only when explicitly provided; omitted otherwise so the provider's own default applies. Many current-gen models reject a non-default value; a model on `IAiProviderDescriptor.samplingParamsRejectedModelPrefixes` still accepts the descriptor's `samplingParamsAcceptedTemperature`, with or without thinking, and is refused any other value before the wire; a model on `IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes` applies the same rule unless the request turns thinking off (effort `'none'`), when any value is sent. |
| <a id="property-thinking"></a> `thinking?` | `readonly` | [`IThinkingConfig`](IThinkingConfig.md) | Optional thinking/reasoning mode configuration. |
| <a id="property-tier"></a> `tier?` | `readonly` | `"advanced"` \| `"frontier"` | Optional quality tier selecting which completion model to use. `undefined` selects the `base` tier; `'frontier'` cascades to `advanced` then `base` when a tier is unset for a provider. Orthogonal to `thinking` and `tools`, which never select a model. |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`IAiWebSearchToolConfig`](IAiWebSearchToolConfig.md)[] | Server-side tools to include in the request. |
| <a id="property-verifiedendpoint"></a> `verifiedEndpoint?` | `readonly` | [`IAiVerifiedEndpoint`](IAiVerifiedEndpoint.md) | The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's schemas are adapted with that provider's keyword table instead of the conservative one. Ignored without `endpoint`, and honoured only as `IAiVerifiedEndpoint` describes. |
