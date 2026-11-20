[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddKeyPairResult

# Interface: IAddKeyPairResult

Result of adding an asymmetric keypair to the key store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entry"></a> `entry` | `readonly` | [`IKeyStoreAsymmetricEntry`](IKeyStoreAsymmetricEntry.md) | The asymmetric entry that was added. |
| <a id="property-replaced"></a> `replaced` | `readonly` | `boolean` | Whether this replaced an existing entry. |
| <a id="property-warning"></a> `warning?` | `readonly` | `string` | Best-effort warning from displaced-resource cleanup. Set when this call replaced a prior entry but the corresponding [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md).delete failed; the new keypair is still committed and the orphaned blob is left for consumer-side GC to reconcile. |
