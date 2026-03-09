[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreCreateParams

# Interface: IKeyStoreCreateParams

Parameters for creating a new key store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](../../../interfaces/ICryptoProvider.md) | Crypto provider to use. |
| <a id="iterations"></a> `iterations?` | `readonly` | `number` | PBKDF2 iterations (defaults to DEFAULT_KEYSTORE_ITERATIONS). |
