[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStoreSymmetricSecretType

# Type Alias: KeyStoreSymmetricSecretType

> **KeyStoreSymmetricSecretType** = `"encryption-key"` \| `"api-key"` \| `"opaque"`

Discriminator for symmetric secret types stored in the vault.
- `'encryption-key'`: A 32-byte AES-256 encryption key.
- `'api-key'`: An arbitrary-length API key string (UTF-8 encoded).
- `'opaque'`: Arbitrary raw bytes with no encoding contract — stored and
  returned verbatim (never UTF-8 decoded). Use for byte blobs that are
  neither a fixed-size AES key nor a UTF-8 string (e.g. a serialized
  credential bundle), so they are not mistyped as `'api-key'`.
