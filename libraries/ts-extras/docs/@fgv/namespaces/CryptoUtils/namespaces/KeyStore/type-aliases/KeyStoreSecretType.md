[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStoreSecretType

# Type Alias: KeyStoreSecretType

> **KeyStoreSecretType** = `"encryption-key"` \| `"api-key"`

Discriminator for secret types stored in the vault.
- `'encryption-key'`: A 32-byte AES-256 encryption key.
- `'api-key'`: An arbitrary-length API key string (UTF-8 encoded).
