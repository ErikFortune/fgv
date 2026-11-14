[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IRemoveSecretResult

# Interface: IRemoveSecretResult

Result of removing a secret from the key store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entry"></a> `entry` | `readonly` | [`IKeyStoreEntry`](../type-aliases/IKeyStoreEntry.md) | The secret entry that was removed from the vault. |
| <a id="property-warning"></a> `warning?` | `readonly` | `string` | Best-effort warning from [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md).delete for asymmetric entries when the storage call failed. The vault entry is still considered removed and the orphaned blob is left for consumer-side GC to reconcile. |
