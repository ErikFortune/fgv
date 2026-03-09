[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IDirectEncryptionProviderParams

# Interface: IDirectEncryptionProviderParams

Parameters for creating a [DirectEncryptionProvider](../classes/DirectEncryptionProvider.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="boundsecretname"></a> `boundSecretName?` | `readonly` | `string` | Optional bound secret name. When set, `encryptByName` will fail if called with a different name. When unset, any secret name is accepted. |
| <a id="cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](ICryptoProvider.md) | The crypto provider to use for encryption operations. |
| <a id="key"></a> `key` | `readonly` | `Uint8Array` | The encryption key (32 bytes for AES-256). |
