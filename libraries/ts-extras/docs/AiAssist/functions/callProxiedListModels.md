[Home](../../README.md) > [AiAssist](../README.md) > callProxiedListModels

# Function: callProxiedListModels

Calls the model-listing endpoint on a proxy server.
Endpoint: `POST ${proxyUrl}/api/ai/list-models`. Capability config is not
forwarded. `capabilities` is serialized as a string array. Error body
`{error: string}` is surfaced as `proxy: ${error}`.

## Signature

```typescript
function callProxiedListModels(proxyUrl: string, params: IProviderListModelsParams): Promise<Result<readonly IAiModelInfo[]>>
```
