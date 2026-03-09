[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IKeyStoreVaultContents

# Interface: IKeyStoreVaultContents

The decrypted vault contents - a versioned map of secrets.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="secrets"></a> `secrets` | `readonly` | `Record`\<`string`, [`IKeyStoreSecretEntryJson`](IKeyStoreSecretEntryJson.md)\> | Map of secret name to secret entry. |
| <a id="version"></a> `version` | `readonly` | `"keystore-v1"` | Format version for vault contents. |
