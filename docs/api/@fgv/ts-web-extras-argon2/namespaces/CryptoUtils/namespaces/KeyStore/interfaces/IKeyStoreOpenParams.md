[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreOpenParams

# Interface: IKeyStoreOpenParams

Parameters for opening an existing key store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](../../../interfaces/ICryptoProvider.md) | Crypto provider to use. |
| <a id="property-keystorefile"></a> `keystoreFile` | `readonly` | [`IKeyStoreFile`](IKeyStoreFile.md) | The encrypted key store file content. |
| <a id="property-privatekeystorage"></a> `privateKeyStorage?` | `readonly` | [`IPrivateKeyStorage`](IPrivateKeyStorage.md) | Optional private-key storage backend. Required to use `addKeyPair` / `getKeyPair`; absent backends still permit opening, listing, and reading public-key metadata for asymmetric entries. |
