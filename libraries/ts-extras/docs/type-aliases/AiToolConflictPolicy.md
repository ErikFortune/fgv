[Home](../README.md) > AiToolConflictPolicy

# Type Alias: AiToolConflictPolicy

What to do when a request would combine a server tool with client (function)
tools on a provider that declares the two mutually exclusive (see
`IAiProviderDescriptor.serverToolsExclusiveWithClientTools`).

## Type

```typescript
type AiToolConflictPolicy = "drop-server-tools" | "prefer-server-tools" | "fail"
```
