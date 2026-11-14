[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreVaultContents

# Interface: IKeyStoreVaultContents

The decrypted vault contents - a versioned map of entries.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-secrets"></a> `secrets` | `readonly` | `Record`\<`string`, [`IKeyStoreEntryJson`](../type-aliases/IKeyStoreEntryJson.md)\> | Map of entry name to entry (symmetric or asymmetric). |
| <a id="property-version"></a> `version` | `readonly` | [`KeyStoreFormat`](../type-aliases/KeyStoreFormat.md) | Format version for vault contents. |
