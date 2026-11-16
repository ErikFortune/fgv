[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / importPublicKeyFromMultibaseSpki

# Function: importPublicKeyFromMultibaseSpki()

> **importPublicKeyFromMultibaseSpki**(`encoded`, `algorithm`, `provider`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports a public key from a multibase base64url-encoded SPKI blob.

Decodes the multibase prefix, decodes the base64url body, then uses
the provider to import the key with the algorithm parameters from
[CryptoUtils.keyPairAlgorithmParams](../variables/keyPairAlgorithmParams.md).

Accepts a plain `string` (not only a branded [CryptoUtils.MultibaseSpkiPublicKey](../type-aliases/MultibaseSpkiPublicKey.md)),
so callers holding an unbranded value read from storage or the wire can import
it directly; a malformed value fails with error context rather than throwing.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encoded` | `string` | A multibase SPKI string produced by [CryptoUtils.exportPublicKeyAsMultibaseSpki](exportPublicKeyAsMultibaseSpki.md). |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The [CryptoUtils.KeyPairAlgorithm](../type-aliases/KeyPairAlgorithm.md) the key was generated for. |
| `provider` | [`ICryptoProvider`](../interfaces/ICryptoProvider.md) | The [CryptoUtils.ICryptoProvider](../interfaces/ICryptoProvider.md) to use for the import operation. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the imported public `CryptoKey`, or `Failure` with error context.
