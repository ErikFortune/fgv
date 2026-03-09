[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / ICreateEncryptedFileParams

# Interface: ICreateEncryptedFileParams\<TMetadata\>

Parameters for creating an [encrypted file](IEncryptedFile.md).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Type of optional unencrypted metadata |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `readonly` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON content to encrypt. |
| <a id="cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](ICryptoProvider.md) | [Crypto provider](ICryptoProvider.md) to use for encryption. |
| <a id="key"></a> `key` | `readonly` | `Uint8Array` | The encryption key (32 bytes for AES-256). |
| <a id="keyderivation"></a> `keyDerivation?` | `readonly` | [`IKeyDerivationParams`](IKeyDerivationParams.md) | Optional [key derivation parameters](IKeyDerivationParams.md). If provided, stores the salt and iterations used to derive the key from a password. This allows decryption using only a password (the salt/iterations are read from the file). |
| <a id="metadata"></a> `metadata?` | `readonly` | `TMetadata` | Optional metadata to include unencrypted. |
| <a id="metadataconverter"></a> `metadataConverter?` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMetadata`, `unknown`\> | Optional converter to validate metadata before including. If provided, metadata will be validated before encryption. |
| <a id="secretname"></a> `secretName` | `readonly` | `string` | Name of the secret used for encryption. |
