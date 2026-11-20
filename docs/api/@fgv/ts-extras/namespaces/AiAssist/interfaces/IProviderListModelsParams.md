[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IProviderListModelsParams

# Interface: IProviderListModelsParams

Parameters for a list-models request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication |
| <a id="property-capability"></a> `capability?` | `readonly` | [`AiModelCapability`](../type-aliases/AiModelCapability.md) | Optional capability filter; when set, only models declaring this capability are returned. |
| <a id="property-capabilityconfig"></a> `capabilityConfig?` | `readonly` | [`IAiModelCapabilityConfig`](IAiModelCapabilityConfig.md) | Optional capability config override (defaults to [DEFAULT\_MODEL\_CAPABILITY\_CONFIG](../variables/DEFAULT_MODEL_CAPABILITY_CONFIG.md)). |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional override of the descriptor's base URL; per-format `/models` route is appended unchanged. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal for cancelling the in-flight request. |
