[Home](../../README.md) > [AiAssist](../README.md) > callProviderListModels

# Function: callProviderListModels

Lists models available from a provider, with capabilities resolved from
native provider info (where supplied) and a configurable rule set.

Routes based on `descriptor.apiFormat` — listing reuses the existing
format dispatch and does not require a separate descriptor field.

## Signature

```typescript
function callProviderListModels(params: IProviderListModelsParams): Promise<Result<readonly IAiModelInfo[]>>
```
