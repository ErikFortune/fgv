[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IAiProviderDescriptor

# Interface: IAiProviderDescriptor

Describes a single AI provider — single source of truth for all metadata.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="apiformat"></a> `apiFormat` | `readonly` | [`AiApiFormat`](../type-aliases/AiApiFormat.md) | Which API adapter format to use |
| <a id="baseurl"></a> `baseUrl` | `readonly` | `string` | Base URL for the API (e.g. 'https://api.x.ai/v1') |
| <a id="buttonlabel"></a> `buttonLabel` | `readonly` | `string` | Button label for action buttons (e.g. "AI Assist | Grok") |
| <a id="corsrestricted"></a> `corsRestricted` | `readonly` | `boolean` | Whether this provider's API enforces CORS restrictions that prevent direct browser calls. |
| <a id="defaultmodel"></a> `defaultModel` | `readonly` | [`ModelSpec`](../type-aliases/ModelSpec.md) | Default model specification — string or context-aware map. |
| <a id="id"></a> `id` | `readonly` | [`AiProviderId`](../type-aliases/AiProviderId.md) | Provider identifier (e.g. 'xai-grok', 'anthropic') |
| <a id="label"></a> `label` | `readonly` | `string` | Human-readable label (e.g. "xAI Grok") |
| <a id="needssecret"></a> `needsSecret` | `readonly` | `boolean` | Whether this provider requires an API key secret |
| <a id="supportedtools"></a> `supportedTools` | `readonly` | readonly `"web_search"`[] | Which server-side tools this provider supports (empty = none). |
