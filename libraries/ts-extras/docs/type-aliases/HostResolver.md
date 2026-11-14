[Home](../README.md) > HostResolver

# Type Alias: HostResolver

Resolves a hostname to every address it names.

## Type

```typescript
type HostResolver = (hostname: string) => Promise<Result<ReadonlyArray<string>>>
```
