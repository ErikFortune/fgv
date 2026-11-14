[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [IKeyStoreSymmetricEntry](./IKeyStoreSymmetricEntry.md) > metadata

## IKeyStoreSymmetricEntry.metadata property

Optional mutable, non-secret-by-contract metadata for this entry. Set via
CryptoUtils.KeyStore.KeyStore.setSecretMetadata without touching the
secret `key` bytes.

"Non-secret by contract" means the field is intended for lifecycle metadata
(rotation timestamps, labels, provenance) rather than secret material.
PHYSICALLY it lives inside the vault's AES-GCM ciphertext alongside the key
bytes — the vault has no plaintext index — so it is protected at rest by the
master password; the "non-secret" designation is a usage contract, not a
weaker custody class.

**Signature:**

```typescript
readonly metadata: JsonValue;
```
