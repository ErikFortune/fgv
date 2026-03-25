[Home](../../README.md) > [AiAssist](../README.md) > callProxiedCompletion

# Function: callProxiedCompletion

Calls the AI completion endpoint on a proxy server instead of calling
the provider API directly from the browser.

The proxy server handles provider dispatch, CORS, and API key forwarding.
The request shape mirrors IProviderCompletionParams but is serialized
as JSON for the proxy endpoint.

## Signature

```typescript
function callProxiedCompletion(proxyUrl: string, params: IProviderCompletionParams): Promise<Result<IAiCompletionResponse>>
```
