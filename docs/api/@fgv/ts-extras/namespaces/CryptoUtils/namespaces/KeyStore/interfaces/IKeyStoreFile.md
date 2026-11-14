[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreFile

# Interface: IKeyStoreFile

The encrypted key store file format.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | `"AES-256-GCM"` | Algorithm used for encryption. |
| <a id="property-authtag"></a> `authTag` | `readonly` | `string` | Base64-encoded authentication tag. |
| <a id="property-encrypteddata"></a> `encryptedData` | `readonly` | `string` | Base64-encoded encrypted vault contents. |
| <a id="property-format"></a> `format` | `readonly` | [`KeyStoreFormat`](../type-aliases/KeyStoreFormat.md) | Format identifier. |
| <a id="property-iv"></a> `iv` | `readonly` | `string` | Base64-encoded initialization vector. |
| <a id="property-keyderivation"></a> `keyDerivation` | `readonly` | [`IPbkdf2KeyDerivationParams`](../../../interfaces/IPbkdf2KeyDerivationParams.md) | Key derivation parameters for the vault master key (always PBKDF2). |
