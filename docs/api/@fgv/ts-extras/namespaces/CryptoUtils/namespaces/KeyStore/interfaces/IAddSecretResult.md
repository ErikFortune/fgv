[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretResult

# Interface: IAddSecretResult

Result of adding a secret to the key store.

## Extended by

- [`IAddSecretFromPasswordResult`](IAddSecretFromPasswordResult.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entry"></a> `entry` | `readonly` | [`IKeyStoreSymmetricEntry`](IKeyStoreSymmetricEntry.md) | The secret entry that was added. |
| <a id="property-replaced"></a> `replaced` | `readonly` | `boolean` | Whether this replaced an existing secret. |
| <a id="property-warning"></a> `warning?` | `readonly` | `string` | Best-effort warning from displaced-resource cleanup. Set when this call replaced an asymmetric-keypair entry but the corresponding [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md).delete failed; the new entry is still committed and the orphaned blob is left for consumer-side GC to reconcile. |
