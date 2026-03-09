[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretFromPasswordOptions

# Interface: IAddSecretFromPasswordOptions

Options for adding a secret derived from a password.

## Extends

- [`IAddSecretOptions`](IAddSecretOptions.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `readonly` | `string` | `undefined` | Optional description for the secret. |
| <a id="iterations"></a> `iterations?` | `readonly` | `number` | `DEFAULT_SECRET_ITERATIONS (350000)` | PBKDF2 iterations for key derivation. |
| <a id="replace"></a> `replace?` | `readonly` | `boolean` | `undefined` | Whether to replace an existing secret with the same name. |
