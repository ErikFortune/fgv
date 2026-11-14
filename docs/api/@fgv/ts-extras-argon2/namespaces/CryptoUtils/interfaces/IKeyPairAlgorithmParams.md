[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IKeyPairAlgorithmParams

# Interface: IKeyPairAlgorithmParams

WebCrypto parameters for a single [CryptoUtils.KeyPairAlgorithm](../type-aliases/KeyPairAlgorithm.md).
Implementations of [CryptoUtils.ICryptoProvider](ICryptoProvider.md) use this table to
translate the small public algorithm enum into the WebCrypto algorithm
objects and key-usage arrays expected by `crypto.subtle`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-generatekey"></a> `generateKey` | `readonly` | `EcKeyGenParams` \| `RsaHashedKeyGenParams` \| \{ `name`: `"Ed25519"`; \} \| \{ `name`: `"X25519"`; \} | Algorithm parameters for `crypto.subtle.generateKey`. Always an asymmetric variant — these algorithms produce a `CryptoKeyPair`, not a single key. The literal `{ name: 'Ed25519' }` member covers WebCrypto's Secure-Curves Ed25519 algorithm; `{ name: 'X25519' }` covers the X25519 key-agreement algorithm. Both take only a `name`; using literals rather than the base `Algorithm` keeps the union closed to the algorithms this table supports. |
| <a id="property-importpublickey"></a> `importPublicKey` | `readonly` | `EcKeyImportParams` \| `RsaHashedImportParams` \| \{ `name`: `"Ed25519"`; \} \| \{ `name`: `"X25519"`; \} | Algorithm parameters for `crypto.subtle.importKey('jwk', ...)` when importing the public half of a keypair. The literal `{ name: 'Ed25519' }` member covers Ed25519 imports; `{ name: 'X25519' }` covers X25519 imports. Both take only a `name`; using literals rather than the base `Algorithm` keeps the union closed to the algorithms this table supports. |
| <a id="property-keypairusages"></a> `keyPairUsages` | `readonly` | readonly `KeyUsage`[] | Default key usages for the generated `CryptoKeyPair`. Both halves receive the usages WebCrypto considers valid for their role; the platform filters. |
| <a id="property-publickeyusages"></a> `publicKeyUsages` | `readonly` | readonly `KeyUsage`[] | Key usages applied when re-importing only the public key. |
