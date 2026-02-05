[Home](../README.md) > SecretProvider

# Type Alias: SecretProvider

Function type for providing encryption keys by secret name.
Used for dynamic key lookup (e.g., from environment variables or key stores).

## Type

```typescript
type SecretProvider = (secretName: string) => Promise<Result<Uint8Array>>
```
