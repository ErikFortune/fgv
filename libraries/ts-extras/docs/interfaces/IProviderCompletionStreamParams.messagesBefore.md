[Home](../README.md) > [IProviderCompletionStreamParams](./IProviderCompletionStreamParams.md) > messagesBefore

## IProviderCompletionStreamParams.messagesBefore property

Prior conversation history to insert between the system prompt and the
prompt's user message. The new user turn (carried by `prompt.user`) is
always sent last, so the wire shape becomes
`[system, ...messagesBefore, user=prompt.user]`.

**Signature:**

```typescript
readonly messagesBefore: readonly IChatMessage[];
```
