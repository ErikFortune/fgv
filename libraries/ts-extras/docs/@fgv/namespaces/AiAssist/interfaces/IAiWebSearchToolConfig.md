[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IAiWebSearchToolConfig

# Interface: IAiWebSearchToolConfig

Configuration specific to web search tools.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="alloweddomains"></a> `allowedDomains?` | `readonly` | readonly `string`[] | Optional: restrict search to these domains. |
| <a id="blockeddomains"></a> `blockedDomains?` | `readonly` | readonly `string`[] | Optional: exclude these domains from search. |
| <a id="enableimageunderstanding"></a> `enableImageUnderstanding?` | `readonly` | `boolean` | Optional: enable image understanding during web search. When true, the model can view and analyze images found during search. Currently supported by xAI only; ignored by other providers. |
| <a id="maxuses"></a> `maxUses?` | `readonly` | `number` | Optional: max number of searches per request. |
| <a id="type"></a> `type` | `readonly` | `"web_search"` | - |
