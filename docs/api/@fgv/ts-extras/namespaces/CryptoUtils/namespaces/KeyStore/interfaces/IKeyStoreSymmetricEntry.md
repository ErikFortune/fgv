[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreSymmetricEntry

# Interface: IKeyStoreSymmetricEntry

A symmetric secret entry stored in the vault (in-memory representation).
Holds the raw key material directly — for `'encryption-key'` it is a 32-byte
AES-256 key; for `'api-key'` it is the UTF-8 encoded API key string.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | When this secret was added (ISO 8601). |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description for this secret. |
| <a id="property-key"></a> `key` | `readonly` | `Uint8Array` | The secret data. - For `'encryption-key'`: 32-byte AES-256 key. - For `'api-key'`: UTF-8 encoded API key string (arbitrary length). - For `'opaque'`: arbitrary raw bytes, stored and returned verbatim. |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Optional mutable, non-secret-by-contract metadata for this entry. Set via [CryptoUtils.KeyStore.KeyStore.setSecretMetadata](../classes/KeyStore.md#setsecretmetadata) without touching the secret `key` bytes. "Non-secret by contract" means the field is intended for lifecycle metadata (rotation timestamps, labels, provenance) rather than secret material. PHYSICALLY it lives inside the vault's AES-GCM ciphertext alongside the key bytes — the vault has no plaintext index — so it is protected at rest by the master password; the "non-secret" designation is a usage contract, not a weaker custody class. |
| <a id="property-name"></a> `name` | `readonly` | `string` | Unique name for this secret (used as lookup key). |
| <a id="property-type"></a> `type` | `readonly` | [`KeyStoreSymmetricSecretType`](../type-aliases/KeyStoreSymmetricSecretType.md) | Symmetric secret type discriminator. |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | When this entry was last mutated (ISO 8601). Stamped on any metadata mutation (see [CryptoUtils.KeyStore.KeyStore.setSecretMetadata](../classes/KeyStore.md#setsecretmetadata)). Absent on entries that have never been mutated since creation. |
