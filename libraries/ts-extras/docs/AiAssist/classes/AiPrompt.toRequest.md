[Home](../../README.md) > [AiAssist](../README.md) > [AiPrompt](./AiPrompt.md) > toRequest

## AiPrompt.toRequest() method

Lowers this prompt to the unified AiAssist.IChatRequest shape consumed
by the turn entry points (`callProviderCompletion`,
`callProviderCompletionStream`, `generateJsonCompletion`,
`executeClientToolTurn`). The prompt becomes a single current `user` turn
(carrying any attachments) with the system instructions in the distinct
`system` field.

**Signature:**

```typescript
toRequest(): IChatRequest;
```

**Returns:**

[IChatRequest](../../interfaces/IChatRequest.md)
