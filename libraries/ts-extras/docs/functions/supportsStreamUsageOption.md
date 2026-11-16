[Home](../README.md) > supportsStreamUsageOption

# Function: supportsStreamUsageOption

Whether a provider's streaming Chat Completions request should carry
`stream_options: { include_usage: true }`. A request-shape gate, not a
capability guess: the shared adapter also carries providers (xAI, Groq,
Mistral, Ollama, self-hosted `openai-compat`) not verified to tolerate an
unrecognized field, so this is `true` only for `'openai'`; every other
provider simply never gets a streaming `usage` block — a safe degradation,
since `IAiStreamDone.usage` is optional everywhere.

## Signature

```typescript
function supportsStreamUsageOption(descriptor: IAiProviderDescriptor): boolean
```
