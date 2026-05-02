[Home](../../README.md) > [AiAssist](../README.md) > [IProviderCompletionStreamParams](./IProviderCompletionStreamParams.md) > endpoint

## IProviderCompletionStreamParams.endpoint property

Optional override of the descriptor's default base URL. Same semantics as
the non-streaming completion path: a well-formed `http`/`https` URL is
substituted for `descriptor.baseUrl` when composing the streaming
request, with the per-format suffix appended unchanged. Validated at the
dispatcher; auth shape is unaffected.

**Signature:**

```typescript
readonly endpoint: string;
```
