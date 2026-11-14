[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > chatOutputTokensField

## IAiProviderDescriptor.chatOutputTokensField property

The Chat Completions request field that carries `maxTokens` on this provider's
OpenAI-format chat path: `'max_completion_tokens'`, or the legacy `'max_tokens'` (the
default when undefined). Declare `'max_completion_tokens'` only where the provider's API
reference accepts it; a server that does not know the field ignores it and the cap is lost.
Read through AiAssist.usesMaxCompletionTokensField. Not consulted on the Responses API
path (`max_output_tokens`) or by a non-`'openai'` `apiFormat`.

**Signature:**

```typescript
readonly chatOutputTokensField: ChatOutputTokensField;
```
