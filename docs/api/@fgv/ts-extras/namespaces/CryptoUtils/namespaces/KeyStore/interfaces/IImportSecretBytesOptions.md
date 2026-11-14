[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IImportSecretBytesOptions

# Interface: IImportSecretBytesOptions

Options for importing raw opaque bytes via [KeyStore.importSecretBytes](../classes/KeyStore.md#importsecretbytes).
Extends [IImportSecretOptions](IImportSecretOptions.md) with optional initial metadata.

## Extends

- [`IImportSecretOptions`](IImportSecretOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description for the secret. |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Optional initial mutable metadata to store with the entry. Can also be set or replaced later via [KeyStore.setSecretMetadata](../classes/KeyStore.md#setsecretmetadata). |
| <a id="property-replace"></a> `replace?` | `readonly` | `boolean` | Whether to replace an existing secret with the same name. |
