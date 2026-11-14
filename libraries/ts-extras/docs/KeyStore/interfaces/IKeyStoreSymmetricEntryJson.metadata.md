[Home](../../README.md) > [KeyStore](../README.md) > [IKeyStoreSymmetricEntryJson](./IKeyStoreSymmetricEntryJson.md) > metadata

## IKeyStoreSymmetricEntryJson.metadata property

Optional mutable, non-secret-by-contract metadata for this entry. Present
only on `'keystore-v3'` vaults whose entry carried metadata; a v1/v2 vault
omits the field. Physically carried inside the vault ciphertext (the vault
has no plaintext index).

**Signature:**

```typescript
readonly metadata: JsonValue;
```
