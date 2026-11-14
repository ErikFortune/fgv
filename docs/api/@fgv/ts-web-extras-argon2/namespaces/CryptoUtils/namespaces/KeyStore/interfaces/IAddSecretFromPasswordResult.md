[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddSecretFromPasswordResult

# Interface: IAddSecretFromPasswordResult

Result of adding a password-derived secret.
Extends [IAddSecretResult](IAddSecretResult.md) with key derivation parameters
needed to store alongside encrypted files.

## Extends

- [`IAddSecretResult`](IAddSecretResult.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entry"></a> `entry` | `readonly` | [`IKeyStoreSymmetricEntry`](IKeyStoreSymmetricEntry.md) | The secret entry that was added. |
| <a id="property-keyderivation"></a> `keyDerivation` | `readonly` | [`IKeyDerivationParams`](../../../type-aliases/IKeyDerivationParams.md) | Key derivation parameters used to derive the secret key. Store these in encrypted file metadata so the password alone can re-derive the same key for decryption. |
| <a id="property-replaced"></a> `replaced` | `readonly` | `boolean` | Whether this replaced an existing secret. |
| <a id="property-warning"></a> `warning?` | `readonly` | `string` | Best-effort warning from displaced-resource cleanup. Set when this call replaced an asymmetric-keypair entry but the corresponding [CryptoUtils.KeyStore.IPrivateKeyStorage](IPrivateKeyStorage.md).delete failed; the new entry is still committed and the orphaned blob is left for consumer-side GC to reconcile. |
