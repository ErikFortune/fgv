[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / ICreateEncryptedFileParams

# Interface: ICreateEncryptedFileParams\<TMetadata\>

Parameters for creating an [encrypted file](IEncryptedFile.md).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-tmetadata"></a> `TMetadata` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Type of optional unencrypted metadata |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON content to encrypt. |
| <a id="property-cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](ICryptoProvider.md) | [Crypto provider](ICryptoProvider.md) to use for encryption. |
| <a id="property-key"></a> `key` | `readonly` | `Uint8Array` | The encryption key (32 bytes for AES-256). |
| <a id="property-keyderivation"></a> `keyDerivation?` | `readonly` | [`IKeyDerivationParams`](../type-aliases/IKeyDerivationParams.md) | Optional [key derivation parameters](../type-aliases/IKeyDerivationParams.md). If provided, stores the salt and iterations used to derive the key from a password. This allows decryption using only a password (the salt/iterations are read from the file). |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `TMetadata` | Optional metadata to include unencrypted. |
| <a id="property-metadataconverter"></a> `metadataConverter?` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMetadata`, `unknown`\> | Optional converter to validate metadata before including. If provided, metadata will be validated before encryption. |
| <a id="property-secretname"></a> `secretName` | `readonly` | `string` | Name of the secret used for encryption. |
