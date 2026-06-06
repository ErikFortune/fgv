[Home](../../README.md) > [AiAssist](../README.md) > callProviderListModels

# Function: callProviderListModels

Lists models available from a provider, routing by `descriptor.apiFormat`.
Capabilities are resolved from native provider info and a configurable rule set.

## Signature

```typescript
function callProviderListModels(params: IProviderListModelsParams): Promise<Result<readonly IAiModelInfo[]>>
```
