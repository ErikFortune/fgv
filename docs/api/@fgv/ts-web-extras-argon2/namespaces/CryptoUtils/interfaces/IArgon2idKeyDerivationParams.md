[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IArgon2idKeyDerivationParams

# Interface: IArgon2idKeyDerivationParams

Argon2id key derivation parameters (RFC 9106).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-iterations"></a> `iterations` | `readonly` | `number` | Number of passes (time cost). |
| <a id="property-kdf"></a> `kdf` | `readonly` | `"argon2id"` | Key derivation function discriminator. |
| <a id="property-memorykib"></a> `memoryKiB` | `readonly` | `number` | Memory cost in kibibytes. |
| <a id="property-parallelism"></a> `parallelism` | `readonly` | `number` | Degree of parallelism. |
| <a id="property-salt"></a> `salt` | `readonly` | `string` | Base64-encoded salt used for key derivation. |
