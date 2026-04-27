[Home](../../README.md) > [CryptoUtils](../README.md) > KeyStoreSymmetricSecretType

# Type Alias: KeyStoreSymmetricSecretType

Discriminator for symmetric secret types stored in the vault.
- `'encryption-key'`: A 32-byte AES-256 encryption key.
- `'api-key'`: An arbitrary-length API key string (UTF-8 encoded).

## Type

```typescript
type KeyStoreSymmetricSecretType = "encryption-key" | "api-key"
```
