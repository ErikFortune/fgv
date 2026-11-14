[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IProviderEmbeddingParams

# Interface: IProviderEmbeddingParams

Parameters for a provider embedding request. Mirrors
[AiAssist.IProviderImageGenerationParams](IProviderImageGenerationParams.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication (empty string for keyless self-hosted providers). |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor. |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional override of the descriptor's base URL; the `/embeddings` suffix is appended unchanged. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map. Uses `descriptor.defaultModel.embedding` otherwise. Self-hosted providers (`ollama`, `openai-compat`) have no default and require this. |
| <a id="property-params"></a> `params` | `readonly` | [`IAiEmbeddingParams`](IAiEmbeddingParams.md) | The embedding request (input + optional knobs). |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal for cancelling the in-flight request. |
