[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretFromPasswordArgon2idOptions

# Interface: IAddSecretFromPasswordArgon2idOptions

Options for adding an Argon2id password-derived secret.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description for the secret. |
| <a id="property-params"></a> `params?` | `readonly` | [`IArgon2idParams`](../../../interfaces/IArgon2idParams.md) | Argon2id parameters. Defaults to [CryptoUtils.ARGON2ID\_OWASP\_MIN](../../../variables/ARGON2ID_OWASP_MIN.md). |
| <a id="property-replace"></a> `replace?` | `readonly` | `boolean` | Whether to replace an existing secret with the same name. |
