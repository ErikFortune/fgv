[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreSecretEntryJson

# Interface: IKeyStoreSecretEntryJson

JSON-serializable version of secret entry (for storage).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="createdat"></a> `createdAt` | `readonly` | `string` | When this secret was added (ISO 8601). |
| <a id="description"></a> `description?` | `readonly` | `string` | Optional description. |
| <a id="key"></a> `key` | `readonly` | `string` | Base64-encoded secret data. |
| <a id="name"></a> `name` | `readonly` | `string` | Unique name for this secret. |
| <a id="type"></a> `type?` | `readonly` | [`KeyStoreSecretType`](../type-aliases/KeyStoreSecretType.md) | Secret type discriminator. Optional for backwards compatibility — missing means `'encryption-key'`. |
