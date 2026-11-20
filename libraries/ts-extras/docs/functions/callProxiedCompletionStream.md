[Home](../README.md) > callProxiedCompletionStream

# Function: callProxiedCompletionStream

Calls the streaming chat endpoint on a proxy server instead of calling
the provider directly from the browser.

## Signature

```typescript
function callProxiedCompletionStream(proxyUrl: string, params: IProviderCompletionStreamParams): Promise<Result<AsyncIterable<IAiStreamEvent, any, any>>>
```
