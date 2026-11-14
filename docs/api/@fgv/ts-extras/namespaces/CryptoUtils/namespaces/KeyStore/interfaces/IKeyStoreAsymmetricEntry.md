[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreAsymmetricEntry

# Interface: IKeyStoreAsymmetricEntry

An asymmetric keypair entry stored in the vault (in-memory representation).
Holds only the public key (as a JWK) and a stable handle (`id`) the
[CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md) provider uses to fetch the private key.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | [`KeyPairAlgorithm`](../../../type-aliases/KeyPairAlgorithm.md) | Algorithm used to generate this keypair. |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | When this entry was added (ISO 8601). |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description for this entry. |
| <a id="property-escrowedprivatekeyjwk"></a> `escrowedPrivateKeyJwk?` | `readonly` | `JsonWebKey` | Optional escrowed copy of the private key, as a JSON Web Key. Present only when the entry was created with `addKeyPair(name, { escrow: true })`. This is an opt-in cross-device recovery affordance: the private key is carried inside the vault's AES-GCM ciphertext (same custody class as `publicKeyJwk`), so a recovered vault plus the master password can reconstitute the signing/decryption identity on a fresh device via `getKeyPair(name, { rehydrate: true })`. SECURITY: when present, the master password becomes the sole gate protecting this private key. Use a strong KDF for escrow-bearing stores. See the [CryptoUtils.KeyStore.KeyStore](../classes/KeyStore.md) class docs. |
| <a id="property-id"></a> `id` | `readonly` | `string` | Immutable handle used by [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md) to address the private key. Independent of `name`; survives renames. |
| <a id="property-name"></a> `name` | `readonly` | `string` | Unique name for this entry (used as vault lookup key, renameable). |
| <a id="property-publickeyjwk"></a> `publicKeyJwk` | `readonly` | `JsonWebKey` | The public key as a JSON Web Key. |
| <a id="property-type"></a> `type` | `readonly` | `"asymmetric-keypair"` | Asymmetric secret type discriminator. |
