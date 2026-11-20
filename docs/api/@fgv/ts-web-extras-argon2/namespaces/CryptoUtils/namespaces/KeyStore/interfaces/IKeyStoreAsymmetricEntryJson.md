[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreAsymmetricEntryJson

# Interface: IKeyStoreAsymmetricEntryJson

JSON-serializable representation of an asymmetric keypair entry.
The private key is not present here — it lives in the
[CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md) provider, addressed by `id`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | [`KeyPairAlgorithm`](../../../type-aliases/KeyPairAlgorithm.md) | Algorithm used to generate this keypair. |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | When this entry was added (ISO 8601). |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description. |
| <a id="property-escrowedprivatekeyjwk"></a> `escrowedPrivateKeyJwk?` | `readonly` | `JsonWebKey` | Optional escrowed copy of the private key, as a JSON Web Key. Present only on `'keystore-v2'` vaults whose entry was created with escrow enabled. A v1 vault omits the field; a v2 reader treats its absence as "no escrow". |
| <a id="property-id"></a> `id` | `readonly` | `string` | Immutable handle used by [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md) to address the private key. |
| <a id="property-name"></a> `name` | `readonly` | `string` | Unique name for this entry. |
| <a id="property-publickeyjwk"></a> `publicKeyJwk` | `readonly` | `JsonWebKey` | The public key as a JSON Web Key. |
| <a id="property-type"></a> `type` | `readonly` | `"asymmetric-keypair"` | Asymmetric secret type discriminator. |
