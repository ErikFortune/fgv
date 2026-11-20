[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / spkiToRawX25519

# Function: spkiToRawX25519()

> **spkiToRawX25519**(`spki`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Strips the fixed DER prefix from an X25519 SubjectPublicKeyInfo blob, returning the raw
32-byte public key.

An X25519 SPKI is always exactly 44 bytes: a fixed 12-byte prefix (SEQUENCE / AlgorithmIdentifier
with OID 1.3.101.110 / BIT STRING) followed by the 32-byte raw key. Use this to convert a
SPKI-held recipient public key into the raw form accepted by [HpkeProvider.openBase](../classes/HpkeProvider.md#openbase)'s
`recipientPublicKey` parameter.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spki` | `Uint8Array` | The DER-encoded X25519 SubjectPublicKeyInfo bytes. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the raw 32-byte public key, or `Failure` if `spki` is not a
  well-formed 44-byte X25519 SPKI blob.
