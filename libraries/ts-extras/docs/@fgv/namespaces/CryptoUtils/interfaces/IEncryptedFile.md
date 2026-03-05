[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IEncryptedFile

# Interface: IEncryptedFile\<TMetadata\>

Generic encrypted file format.
This is the JSON structure stored in encrypted files.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Type of optional unencrypted metadata |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="algorithm"></a> `algorithm` | `readonly` | `"AES-256-GCM"` | Algorithm used for encryption. |
| <a id="authtag"></a> `authTag` | `readonly` | `string` | Base64-encoded authentication tag (for GCM mode). |
| <a id="encrypteddata"></a> `encryptedData` | `readonly` | `string` | Base64-encoded encrypted data (JSON string when decrypted). |
| <a id="format"></a> `format` | `readonly` | `"encrypted-collection-v1"` | Format identifier for versioning. |
| <a id="iv"></a> `iv` | `readonly` | `string` | Base64-encoded initialization vector. |
| <a id="keyderivation"></a> `keyDerivation?` | `readonly` | [`IKeyDerivationParams`](IKeyDerivationParams.md) | Optional key derivation parameters. If present, allows decryption using a password with these parameters. If absent, a pre-derived key must be provided. |
| <a id="metadata"></a> `metadata?` | `readonly` | `TMetadata` | Optional unencrypted metadata for display/filtering. |
| <a id="secretname"></a> `secretName` | `readonly` | `string` | Name of the secret required to decrypt (references INamedSecret.name). |
