[Home](../README.md) > [IAiCacheRequest](./IAiCacheRequest.md) > systemBreakpoints

## IAiCacheRequest.systemBreakpoints property

Strictly ascending UTF-16 offsets into `AiPrompt.system` (equivalently
`IProviderCompletionParams.system`), each marking the end of a cacheable prefix. Each must
be an integer `> 0` and `< system.length`. Validated where the offsets are actually used
(against the request's own `system.length`, and optionally against a cap) — never clamped;
an invalid plan fails the request rather than silently caching less than declared. Sent where
the provider has a breakpoint mechanism (Anthropic `cache_control`, OpenAI
`prompt_cache_breakpoint`). Ignored by adapters that have no such concept (Gemini).

**Signature:**

```typescript
readonly systemBreakpoints: readonly number[];
```
