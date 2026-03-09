[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IEncryptionResult

# Interface: IEncryptionResult

Result of an encryption operation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="authtag"></a> `authTag` | `readonly` | `Uint8Array` | Authentication tag from GCM mode (16 bytes). |
| <a id="encrypteddata"></a> `encryptedData` | `readonly` | `Uint8Array` | The encrypted data. |
| <a id="iv"></a> `iv` | `readonly` | `Uint8Array` | Initialization vector used for encryption (12 bytes for GCM). |
