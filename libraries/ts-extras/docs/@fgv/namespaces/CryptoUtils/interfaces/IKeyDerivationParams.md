[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IKeyDerivationParams

# Interface: IKeyDerivationParams

Key derivation parameters stored in encrypted files.
Allows decryption with password without needing to know the original salt/iterations.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="iterations"></a> `iterations` | `readonly` | `number` | Number of iterations used for key derivation. |
| <a id="kdf"></a> `kdf` | `readonly` | `"pbkdf2"` | Key derivation function used. |
| <a id="salt"></a> `salt` | `readonly` | `string` | Base64-encoded salt used for key derivation. |
