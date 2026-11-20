[Home](../README.md) > callProxiedCompletion

# Function: callProxiedCompletion

Calls the AI completion endpoint on a proxy server instead of calling the
provider API directly from the browser. The proxy handles provider dispatch,
CORS, and API key forwarding. The request body serializes the unified
AiAssist.IChatRequest shape (`system?` + `messages`). Enforces the same
non-empty / trailing-user-turn and image-input invariants as the direct path.

## Signature

```typescript
function callProxiedCompletion(proxyUrl: string, params: IProviderCompletionParams): Promise<Result<IAiCompletionResponse>>
```
