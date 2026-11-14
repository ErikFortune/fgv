[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiCacheRequest

# Interface: IAiCacheRequest

A request-level prompt-caching plan.

## Remarks

Offsets rather than content blocks — see design.md §6.1 for why: `AiPrompt`/`IChatRequest`
carry `system` as a plain string, offsets are usable without `@fgv/ts-prompt-assist` (a
caller can say "the first 4,000 characters of my system prompt are stable" directly), and
they are already the currency `IPromptSection.start`/`.chars` report.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachekey"></a> `cacheKey?` | `readonly` | `string` | Opaque cache-routing key, sent where the provider has one and by that provider's transport: `prompt_cache_key` as a body field on OpenAI (both routes) and on xAI Responses, and an `x-grok-conv-id` header on xAI Chat Completions. See `supportsPromptCacheRouting`. **Remarks** On xAI this is not a nicety. Its prompt cache is per-server and evictable, so two requests sharing a prefix can still miss if they are routed to different servers; the key pins them together. Providers with no routing concept ignore it and receive a request byte-identical to one built without a `cache` at all. |
| <a id="property-systembreakpoints"></a> `systemBreakpoints?` | `readonly` | readonly `number`[] | Strictly ascending UTF-16 offsets into `AiPrompt.system` (equivalently `IProviderCompletionParams.system`), each marking the end of a cacheable prefix. Each must be an integer `> 0` and `< system.length`. Validated where the offsets are actually used (against the request's own `system.length`, and optionally against a cap) — never clamped; an invalid plan fails the request rather than silently caching less than declared. Sent where the provider has a breakpoint mechanism (Anthropic `cache_control`, OpenAI `prompt_cache_breakpoint`). Ignored by adapters that have no such concept (Gemini). |
