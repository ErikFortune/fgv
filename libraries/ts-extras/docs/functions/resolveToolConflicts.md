[Home](../README.md) > resolveToolConflicts

# Function: resolveToolConflicts

Applies a provider's declared server-tool/client-tool exclusions to one request's
tools.

## Signature

```typescript
function resolveToolConflicts(descriptor: IAiProviderDescriptor, serverTools: readonly IAiWebSearchToolConfig[] | undefined, clientTools: readonly IAiClientTool<unknown>[], policy: AiToolConflictPolicy): Result<IAiResolvedToolConflicts>
```
