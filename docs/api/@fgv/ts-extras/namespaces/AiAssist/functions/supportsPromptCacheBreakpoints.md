[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / supportsPromptCacheBreakpoints

# Function: supportsPromptCacheBreakpoints()

> **supportsPromptCacheBreakpoints**(`descriptor`): `boolean`

Whether a provider has confirmed tolerance for the request-shape change
[AiAssist.IAiCacheRequest.systemBreakpoints](../interfaces/IAiCacheRequest.md#property-systembreakpoints) produces on the shared Chat Completions /
Responses paths: splitting `system` into content parts each carrying a
`prompt_cache_breakpoint` field.

This governs **breakpoints only**. The routing key is a separate capability with a different
support set — see [AiAssist.supportsPromptCacheRouting](supportsPromptCacheRouting.md). An earlier version of this
predicate gated both, which withheld the routing key from xAI, the one provider that most
needs it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) |

## Returns

`boolean`

## Remarks

Same sharing problem as [AiAssist.supportsStreamUsageOption](supportsStreamUsageOption.md), on the write side instead of the
read side: `callOpenAiCompletion` and `callOpenAiResponsesCompletion` are shared by every
`apiFormat: 'openai'` descriptor (xAI Grok, Groq, Mistral, Ollama, self-hosted
`openai-compat`), but only OpenAI's own API is confirmed to accept a `system`/first-item
`content` restructured into an array of parts each carrying an unrecognized
`prompt_cache_breakpoint` field. A
schema-strict server on one of the other descriptors could 400 on it — the identical
failure mode `supportsStreamUsageOption` was written to avoid for `stream_options`. So `cache`
is gated to `descriptor.id === 'openai'` at the dispatch site before it ever reaches these
builders; every other descriptor gets the same request body it would have gotten had the
caller passed no `cache` at all.
