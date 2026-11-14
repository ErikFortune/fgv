[Home](../README.md) > usesMaxCompletionTokensField

# Function: usesMaxCompletionTokensField

Determines whether a provider's OpenAI-compatible Chat Completions request
should use the modern `max_completion_tokens` field instead of the legacy
`max_tokens` field for capping output length.

## Signature

```typescript
function usesMaxCompletionTokensField(descriptor: IAiProviderDescriptor): boolean
```
