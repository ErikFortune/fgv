[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretFromPasswordResult

# Interface: IAddSecretFromPasswordResult

Result of adding a password-derived secret.
Extends [IAddSecretResult](IAddSecretResult.md) with key derivation parameters
needed to store alongside encrypted files.

## Extends

- [`IAddSecretResult`](IAddSecretResult.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="entry"></a> `entry` | `readonly` | [`IKeyStoreSecretEntry`](IKeyStoreSecretEntry.md) | The secret entry that was added. |
| <a id="keyderivation"></a> `keyDerivation` | `readonly` | [`IKeyDerivationParams`](../../../interfaces/IKeyDerivationParams.md) | Key derivation parameters used to derive the secret key. Store these in encrypted file metadata so the password alone can re-derive the same key for decryption. |
| <a id="replaced"></a> `replaced` | `readonly` | `boolean` | Whether this replaced an existing secret. |
