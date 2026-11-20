[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / supportsPromptCacheRouting

# Function: supportsPromptCacheRouting()

> **supportsPromptCacheRouting**(`descriptor`): [`IAiPromptCacheRoutingSupport`](../interfaces/IAiPromptCacheRoutingSupport.md) \| `undefined`

Whether a provider accepts an opaque prompt-cache **routing** key, and by what transport.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) |

## Returns

[`IAiPromptCacheRoutingSupport`](../interfaces/IAiPromptCacheRoutingSupport.md) \| `undefined`

## Remarks

Distinct from [AiAssist.supportsPromptCacheBreakpoints](supportsPromptCacheBreakpoints.md), and deliberately so. A breakpoint
restructures the request body and needs the server to tolerate an unrecognized field inside
`content`; a routing key is a single opaque string whose only job is to make repeated requests
with a shared prefix land on the same cache-holding server.

The two were originally gated together, which had a perverse effect: xAI does byte-for-byte
prefix matching from the start of the `messages` array, and its cache is **per-server and
evictable**, so without a routing key a caller can miss on an identical prefix simply by being
routed elsewhere. Measured on `grok-4.3`: two requests sharing an 8,684-token system prefix but
differing in their final user turn returned 2.2% cached, while a byte-identical pair returned
99.5%. Withholding the routing key from xAI withheld it from the provider whose caching depends
on it most.

The transport differs by route, which is why this returns a descriptor rather than a boolean:

| provider | Chat Completions | Responses |
|---|---|---|
| `openai` | `prompt_cache_key` body field | `prompt_cache_key` body field |
| `xai-grok` | `x-grok-conv-id` **header** | `prompt_cache_key` body field |

Every other `apiFormat: 'openai'` descriptor (Groq, Mistral, Ollama, self-hosted
`openai-compat`) returns `undefined` and gets the request it would have gotten had the caller
passed no `cache` at all — the same unconfirmed-tolerance reasoning as
[AiAssist.supportsStreamUsageOption](supportsStreamUsageOption.md).
