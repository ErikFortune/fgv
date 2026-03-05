[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreSecretEntry

# Interface: IKeyStoreSecretEntry

A secret entry stored in the vault (in-memory representation).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="createdat"></a> `createdAt` | `readonly` | `string` | When this secret was added (ISO 8601). |
| <a id="description"></a> `description?` | `readonly` | `string` | Optional description for this secret. |
| <a id="key"></a> `key` | `readonly` | `Uint8Array` | The secret data. - For `'encryption-key'`: 32-byte AES-256 key. - For `'api-key'`: UTF-8 encoded API key string (arbitrary length). |
| <a id="name"></a> `name` | `readonly` | `string` | Unique name for this secret (used as lookup key). |
| <a id="type"></a> `type` | `readonly` | [`KeyStoreSecretType`](../type-aliases/KeyStoreSecretType.md) | Secret type discriminator. Defaults to `'encryption-key'` for backwards compatibility. |
