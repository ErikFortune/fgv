[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiPromptCacheRoutingSupport

# Interface: IAiPromptCacheRoutingSupport

How a provider carries an [AiAssist.IAiCacheRequest.cacheKey](IAiCacheRequest.md#property-cachekey) on the wire.

## Remarks

Returned by [AiAssist.supportsPromptCacheRouting](../functions/supportsPromptCacheRouting.md). The Responses API takes the key as a
`prompt_cache_key` body field on every provider that supports it, so only the Chat Completions
transport varies and only that is described here.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chatcompletionsheader"></a> `chatCompletionsHeader` | `readonly` | `string` \| `undefined` | Header name to carry the key on Chat Completions, or `undefined` when the provider takes it as a `prompt_cache_key` body field there (OpenAI). xAI uses `x-grok-conv-id`. |
