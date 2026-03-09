[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreFile

# Interface: IKeyStoreFile

The encrypted key store file format.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="algorithm"></a> `algorithm` | `readonly` | `"AES-256-GCM"` | Algorithm used for encryption. |
| <a id="authtag"></a> `authTag` | `readonly` | `string` | Base64-encoded authentication tag. |
| <a id="encrypteddata"></a> `encryptedData` | `readonly` | `string` | Base64-encoded encrypted vault contents. |
| <a id="format"></a> `format` | `readonly` | `"keystore-v1"` | Format identifier. |
| <a id="iv"></a> `iv` | `readonly` | `string` | Base64-encoded initialization vector. |
| <a id="keyderivation"></a> `keyDerivation` | `readonly` | [`IKeyDerivationParams`](../../../interfaces/IKeyDerivationParams.md) | Key derivation parameters (required for key store - always password-derived). |
