[Home](../../README.md) > [LibraryData](../README.md) > [IEncryptionConfig](./IEncryptionConfig.md) > secrets

## IEncryptionConfig.secrets property

Array of named secrets to use for decryption.
Each secret has a name and a 32-byte key for AES-256 encryption.

**Signature:**

```typescript
readonly secrets: readonly INamedSecret[];
```
