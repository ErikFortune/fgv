[Home](../../README.md) > [AiAssist](../README.md) > callProviderCompletionStream

# Function: callProviderCompletionStream

Calls the appropriate streaming chat completion API for a given provider.

## Signature

```typescript
function callProviderCompletionStream(params: IProviderCompletionStreamParams): Promise<Result<AsyncIterable<IAiStreamEvent, any, any>>>
```
