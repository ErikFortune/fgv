[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreCreateParams

# Interface: IKeyStoreCreateParams

Parameters for creating a new key store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](../../../interfaces/ICryptoProvider.md) | Crypto provider to use. |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | PBKDF2 iterations (defaults to DEFAULT_KEYSTORE_ITERATIONS). |
| <a id="property-privatekeystorage"></a> `privateKeyStorage?` | `readonly` | [`IPrivateKeyStorage`](IPrivateKeyStorage.md) | Optional private-key storage backend. Required to use `addKeyPair` / `getKeyPair`; absent backends still permit opening, listing, and reading public-key metadata for asymmetric entries. |
