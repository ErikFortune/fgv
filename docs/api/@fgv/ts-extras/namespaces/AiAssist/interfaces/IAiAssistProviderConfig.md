[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiAssistProviderConfig

# Interface: IAiAssistProviderConfig

Configuration for a single AI assist provider.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-endpoint"></a> `endpoint?` | `readonly` | `string` | Optional caller-supplied endpoint URL (http/https). Overrides `descriptor.baseUrl` for this provider. Used to point a provider at a self-hosted server (Ollama, LM Studio, llama.cpp's openai-server) or a local proxy. Validation lives in `@fgv/ts-extras` — query strings, fragments, and userinfo are rejected. |
| <a id="property-model"></a> `model?` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Optional model override — string or context-aware map. |
| <a id="property-provider"></a> `provider` | `readonly` | [`AiProviderId`](../type-aliases/AiProviderId.md) | Which provider this configures |
| <a id="property-secretname"></a> `secretName?` | `readonly` | `string` | For API-based providers: the keystore secret name holding the API key |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`IAiToolEnablement`](IAiToolEnablement.md)[] | Tool enablement/configuration. Tools are disabled unless explicitly enabled. |
