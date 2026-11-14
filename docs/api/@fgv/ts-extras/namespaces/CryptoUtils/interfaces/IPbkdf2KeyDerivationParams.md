[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / IPbkdf2KeyDerivationParams

# Interface: IPbkdf2KeyDerivationParams

PBKDF2 key derivation parameters.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-iterations"></a> `iterations` | `readonly` | `number` | Number of iterations used for key derivation. |
| <a id="property-kdf"></a> `kdf` | `readonly` | `"pbkdf2"` | Key derivation function discriminator. |
| <a id="property-salt"></a> `salt` | `readonly` | `string` | Base64-encoded salt used for key derivation. |
