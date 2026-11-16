[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IGetKeyPairOptions

# Interface: IGetKeyPairOptions

Options for retrieving an asymmetric keypair via [CryptoUtils.KeyStore.KeyStore.getKeyPair](../classes/KeyStore.md#getkeypair).

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-rehydrate"></a> `rehydrate?` | `readonly` | `boolean` | `false — today's behavior: load from storage or fail.` | Opt in to escrow rehydration. When `true` AND no private-key blob exists under the entry's storage `id` AND the entry carries an `escrowedPrivateKeyJwk`, the escrowed JWK is imported (non-extractable where the backend supports it) and stored under the entry's `id` before being returned — filling a gap on a fresh device from the recovered vault. Fill-a-gap only: an existing storage blob is never overwritten. When a blob is present it is loaded as usual and the escrow copy is ignored. |
