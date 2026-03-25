[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > KeyStoreSecretType

# Type Alias: KeyStoreSecretType

Discriminator for secret types stored in the vault.
- `'encryption-key'`: A 32-byte AES-256 encryption key.
- `'api-key'`: An arbitrary-length API key string (UTF-8 encoded).

## Type

```typescript
type KeyStoreSecretType = "encryption-key" | "api-key"
```
