[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IImportKeyOptions

# Interface: IImportKeyOptions

Options for importing raw key material via [KeyStore.importSecret](../classes/KeyStore.md#importsecret).
Extends [IImportSecretOptions](IImportSecretOptions.md) with a type classification.

## Extends

- [`IImportSecretOptions`](IImportSecretOptions.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="description"></a> `description?` | `readonly` | `string` | `undefined` | Optional description for the secret. |
| <a id="replace"></a> `replace?` | `readonly` | `boolean` | `undefined` | Whether to replace an existing secret with the same name. |
| <a id="type"></a> `type?` | `readonly` | [`KeyStoreSecretType`](../type-aliases/KeyStoreSecretType.md) | `'encryption-key'` | Secret type classification for the imported key material. |
