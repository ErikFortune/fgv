[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreSymmetricEntryJson

# Interface: IKeyStoreSymmetricEntryJson

JSON-serializable representation of a symmetric secret entry.

## Remarks

Describes the *normalized* shape after parsing. `type` is required here
because the converter (see
[keystoreSymmetricEntryJson](../namespaces/Converters/variables/keystoreSymmetricEntryJson.md))
injects the default `'encryption-key'` when reading vaults written before
asymmetric-keypair support added the discriminator. Raw on-wire bytes from
a legacy vault may therefore omit `type`; downstream code only ever sees
the post-conversion shape declared here.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | When this secret was added (ISO 8601). |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description. |
| <a id="property-key"></a> `key` | `readonly` | `string` | Base64-encoded secret data. |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Optional mutable, non-secret-by-contract metadata for this entry. Present only on `'keystore-v3'` vaults whose entry carried metadata; a v1/v2 vault omits the field. Physically carried inside the vault ciphertext (the vault has no plaintext index). |
| <a id="property-name"></a> `name` | `readonly` | `string` | Unique name for this secret. |
| <a id="property-type"></a> `type` | `readonly` | [`KeyStoreSymmetricSecretType`](../type-aliases/KeyStoreSymmetricSecretType.md) | Symmetric secret type discriminator. Required on this normalized model type. Vaults written prior to the asymmetric-keypair support may omit this field on the wire; the converter injects `'encryption-key'` when missing for backwards compatibility, so by the time a value of this type is observed the discriminator is always present. |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | When this entry was last mutated (ISO 8601). Present only on `'keystore-v3'` vaults whose entry has been mutated since creation. |
