[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretResult

# Interface: IAddSecretResult

Result of adding a secret to the key store.

## Extended by

- [`IAddSecretFromPasswordResult`](IAddSecretFromPasswordResult.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="entry"></a> `entry` | `readonly` | [`IKeyStoreSecretEntry`](IKeyStoreSecretEntry.md) | The secret entry that was added. |
| <a id="replaced"></a> `replaced` | `readonly` | `boolean` | Whether this replaced an existing secret. |
