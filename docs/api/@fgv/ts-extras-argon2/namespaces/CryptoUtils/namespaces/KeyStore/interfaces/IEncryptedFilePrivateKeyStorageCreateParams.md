[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IEncryptedFilePrivateKeyStorageCreateParams

# Interface: IEncryptedFilePrivateKeyStorageCreateParams

Parameters for [CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.create](../classes/EncryptedFilePrivateKeyStorage.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](../../../interfaces/ICryptoProvider.md) | [Crypto provider](../../../interfaces/ICryptoProvider.md) used for the AES-256-GCM encrypt/decrypt of each file's contents. |
| <a id="property-directory"></a> `directory` | `readonly` | `string` | Filesystem path to the directory that holds the encrypted private-key files. Used only when [CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.tree](#property-tree) is omitted (the default `FsTree` backing). The directory must already exist. |
| <a id="property-encryptionkey"></a> `encryptionKey` | `readonly` | `Uint8Array` | Raw AES-256-GCM key (32 bytes) used to encrypt each file's JWK content. Consumer-supplied and decoupled from the keystore's password lifecycle — derive it however the application sees fit (typically the same password-derived key material the keystore vault uses). |
| <a id="property-tree"></a> `tree?` | `readonly` | [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\> | Optional [FileTree directory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) override. When supplied it is used as the storage directory directly and [CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.directory](#property-directory) is ignored — pass an in-memory tree for tests, or another Node-compatible backend. When omitted, a mutable `FsTree` rooted at `directory` is used. (This backend is Node-only — it round-trips keys through `node:crypto` — so a browser file tree is not a supported target.) |
