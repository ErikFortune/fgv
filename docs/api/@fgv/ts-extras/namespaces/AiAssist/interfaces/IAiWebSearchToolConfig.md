[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiWebSearchToolConfig

# Interface: IAiWebSearchToolConfig

Configuration specific to web search tools.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-alloweddomains"></a> `allowedDomains?` | `readonly` | readonly `string`[] | Optional: restrict search to these domains. Reaches Anthropic and the OpenAI/xAI Responses API; ignored on Gemini, whose `google_search` tool takes no configuration at all. |
| <a id="property-blockeddomains"></a> `blockedDomains?` | `readonly` | readonly `string`[] | Optional: exclude these domains from search. Same reach as [AiAssist.IAiWebSearchToolConfig.allowedDomains](#property-alloweddomains): Anthropic and OpenAI/xAI, ignored on Gemini. |
| <a id="property-enableimageunderstanding"></a> `enableImageUnderstanding?` | `readonly` | `boolean` | Optional: enable image understanding during web search. When true, the model can view and analyze images found during search. Currently supported by xAI only; ignored by other providers. |
| <a id="property-maxuses"></a> `maxUses?` | `readonly` | `number` | Optional: max number of searches per request. **Anthropic only** — emitted as `max_uses` by the Anthropic formatter and read nowhere else, so it is silently ignored on OpenAI/xAI and Gemini. |
| <a id="property-type"></a> `type` | `readonly` | `"web_search"` | - |
