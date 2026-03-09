[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IAiAssistProviderConfig

# Interface: IAiAssistProviderConfig

Configuration for a single AI assist provider.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="model"></a> `model?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map. |
| <a id="provider"></a> `provider` | `readonly` | [`AiProviderId`](../type-aliases/AiProviderId.md) | Which provider this configures |
| <a id="secretname"></a> `secretName?` | `readonly` | `string` | For API-based providers: the keystore secret name holding the API key |
| <a id="tools"></a> `tools?` | `readonly` | readonly [`IAiToolEnablement`](IAiToolEnablement.md)[] | Tool enablement/configuration. Tools are disabled unless explicitly enabled. |
