[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / exportPublicKeyAsMultibaseSpki

# Function: exportPublicKeyAsMultibaseSpki()

> **exportPublicKeyAsMultibaseSpki**(`key`, `provider`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`MultibaseSpkiPublicKey`](../type-aliases/MultibaseSpkiPublicKey.md)\>\>

Exports a public `CryptoKey` as a multibase base64url-encoded SPKI blob.

The SPKI (SubjectPublicKeyInfo) format is the standard DER-encoded structure
for public keys defined in RFC 5280, RFC 5480, and RFC 8410. It is
algorithm-agnostic and suitable for storage and transmission.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | The `CryptoKey` to export. Must have `key.type === 'public'`. |
| `provider` | [`ICryptoProvider`](../interfaces/ICryptoProvider.md) | The [CryptoUtils.ICryptoProvider](../interfaces/ICryptoProvider.md) to use for the export operation. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`MultibaseSpkiPublicKey`](../type-aliases/MultibaseSpkiPublicKey.md)\>\>

`Success` with the multibase SPKI string, or `Failure` with error context.
