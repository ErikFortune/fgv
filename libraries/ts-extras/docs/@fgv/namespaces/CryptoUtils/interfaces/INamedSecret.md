[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / INamedSecret

# Interface: INamedSecret

Named secret for encryption/decryption.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="key"></a> `key` | `readonly` | `Uint8Array` | The actual secret key (32 bytes for AES-256). |
| <a id="name"></a> `name` | `readonly` | `string` | Unique name for this secret (referenced in encrypted files). |
