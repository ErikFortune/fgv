[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IEncryptedFile

# Interface: IEncryptedFile\<TMetadata\>

Generic encrypted file format.
This is the JSON structure stored in encrypted files.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-tmetadata"></a> `TMetadata` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Type of optional unencrypted metadata |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | `"AES-256-GCM"` | Algorithm used for encryption. |
| <a id="property-authtag"></a> `authTag` | `readonly` | `string` | Base64-encoded authentication tag (for GCM mode). |
| <a id="property-encrypteddata"></a> `encryptedData` | `readonly` | `string` | Base64-encoded encrypted data (JSON string when decrypted). |
| <a id="property-format"></a> `format` | `readonly` | `"encrypted-collection-v1"` | Format identifier for versioning. |
| <a id="property-iv"></a> `iv` | `readonly` | `string` | Base64-encoded initialization vector. |
| <a id="property-keyderivation"></a> `keyDerivation?` | `readonly` | [`IKeyDerivationParams`](../type-aliases/IKeyDerivationParams.md) | Optional key derivation parameters. If present, allows decryption using a password with these parameters. If absent, a pre-derived key must be provided. |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `TMetadata` | Optional unencrypted metadata for display/filtering. |
| <a id="property-secretname"></a> `secretName` | `readonly` | `string` | Name of the secret required to decrypt (references INamedSecret.name). |
