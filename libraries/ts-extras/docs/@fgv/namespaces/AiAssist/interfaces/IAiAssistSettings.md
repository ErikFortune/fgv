[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IAiAssistSettings

# Interface: IAiAssistSettings

AI assist settings — which providers are enabled and their configuration.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="defaultprovider"></a> `defaultProvider?` | `readonly` | [`AiProviderId`](../type-aliases/AiProviderId.md) | Which enabled provider is the default for the main button. Falls back to first in list. |
| <a id="providers"></a> `providers` | `readonly` | readonly [`IAiAssistProviderConfig`](IAiAssistProviderConfig.md)[] | Enabled providers and their configuration. |
| <a id="proxyurl"></a> `proxyUrl?` | `readonly` | `string` | Optional proxy URL for routing API requests through a backend server (e.g. `http://localhost:3001`). |
