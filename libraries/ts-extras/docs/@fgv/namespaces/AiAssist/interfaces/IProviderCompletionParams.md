[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IProviderCompletionParams

# Interface: IProviderCompletionParams

Parameters for a provider completion request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="additionalmessages"></a> `additionalMessages?` | `readonly` | readonly [`IChatMessage`](IChatMessage.md)[] | Additional messages to append after system+user (e.g. for correction retries). These are appended in order after the initial system and user messages. |
| <a id="apikey"></a> `apiKey` | `readonly` | `string` | API key for authentication |
| <a id="descriptor"></a> `descriptor` | `readonly` | [`IAiProviderDescriptor`](IAiProviderDescriptor.md) | The provider descriptor |
| <a id="logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for request/response observability. |
| <a id="modeloverride"></a> `modelOverride?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map (uses descriptor.defaultModel otherwise) |
| <a id="prompt"></a> `prompt` | `readonly` | [`AiPrompt`](../classes/AiPrompt.md) | The structured prompt to send |
| <a id="temperature"></a> `temperature?` | `readonly` | `number` | Sampling temperature (default: 0.7) |
| <a id="tools"></a> `tools?` | `readonly` | readonly [`IAiWebSearchToolConfig`](IAiWebSearchToolConfig.md)[] | Server-side tools to include in the request. Overrides settings-level tool config when provided. |
