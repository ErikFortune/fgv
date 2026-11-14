[Home](../README.md) > SecretProvider

# Type Alias: SecretProvider

Function type for dynamic secret retrieval.

## Type

```typescript
type SecretProvider = (secretName: string) => Promise<Result<Uint8Array>>
```
