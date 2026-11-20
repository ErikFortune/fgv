[Home](../../README.md) > [AiAssist](../README.md) > supportsPromptCacheBreakpoints

# Function: supportsPromptCacheBreakpoints

Whether a provider has confirmed tolerance for the request-shape change
AiAssist.IAiCacheRequest.systemBreakpoints produces on the shared Chat Completions /
Responses paths: splitting `system` into content parts each carrying a
`prompt_cache_breakpoint` field.

This governs **breakpoints only**. The routing key is a separate capability with a different
support set — see AiAssist.supportsPromptCacheRouting. An earlier version of this
predicate gated both, which withheld the routing key from xAI, the one provider that most
needs it.

## Signature

```typescript
function supportsPromptCacheBreakpoints(descriptor: IAiProviderDescriptor): boolean
```
