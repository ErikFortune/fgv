[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IImportSecretOptions

# Interface: IImportSecretOptions

Options for importing a secret.

## Extends

- [`IAddSecretOptions`](IAddSecretOptions.md)

## Extended by

- [`IImportKeyOptions`](IImportKeyOptions.md)
- [`IImportSecretBytesOptions`](IImportSecretBytesOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description for the secret. |
| <a id="property-replace"></a> `replace?` | `readonly` | `boolean` | Whether to replace an existing secret with the same name. |
