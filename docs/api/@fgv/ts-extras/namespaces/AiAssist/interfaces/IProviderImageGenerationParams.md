[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IProviderImageGenerationParams

# Interface: IProviderImageGenerationParams

Parameters for an image-generation request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional override of the descriptor's base URL; per-route suffix is appended unchanged. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="property-modeloverride"></a> `modelOverride?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map (uses descriptor.defaultModel.image otherwise) |
| <a id="property-params"></a> `params` | `readonly` | [`IAiImageGenerationParams`](IAiImageGenerationParams.md) | The image-generation request |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Optional abort signal for cancelling the in-flight request. |
