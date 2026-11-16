[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / deriveKeyPairFromSeed

# Function: deriveKeyPairFromSeed()

> **deriveKeyPairFromSeed**(`algorithm`, `seed`, `extractable`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Derives an asymmetric keypair *deterministically* from a fixed secret seed
using `globalThis.crypto.subtle`, shared by the Node and browser
[CryptoUtils.ICryptoProvider](../interfaces/ICryptoProvider.md) implementations (both speak the same
WebCrypto API). See
[importKeyPairFromSeed](../interfaces/ICryptoProvider.md#importkeypairfromseed)
for the public contract.

For each supported algorithm: wraps the 32-byte seed in the RFC 8410 PKCS#8
envelope, then runs a transient-extractable-then-derive dance so the public
key is recoverable even when the caller requests a non-extractable private key:

1. Import the PKCS#8 as a *transient* extractable private key.
2. Export it to JWK to read the deterministic public coordinate `x`.
3. Import `{ kty: 'OKP', crv, x }` as the returned public key.
4. For the returned private key: reuse the transient key when `extractable`
   is `true`; otherwise re-import the same PKCS#8 as a non-extractable key.
   The transient extractable key is never returned when `extractable` is
   `false`, so seed material cannot escape through it.

The two algorithms differ only in the OID/name/curve/usages (see
ISeedAlgorithmParams); `'x25519'` yields the DH key-agreement keypair
(private `'deriveBits'`, public no-usage) that [CryptoUtils.HpkeProvider](../classes/HpkeProvider.md)
consumes as its recipient key.

The seed bytes are copied into a freshly allocated PKCS#8 buffer, so the
`BufferSource` handed to WebCrypto is always backed by a plain `ArrayBuffer`
(side-stepping the Node-20 `SharedArrayBuffer`-view rejection) and the
caller's `seed` is never mutated.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `algorithm` | [`SeedDerivableAlgorithm`](../type-aliases/SeedDerivableAlgorithm.md) | The seed-derivable algorithm (`'ed25519'` or `'x25519'`). Any other value fails loudly rather than being mis-handled. |
| `seed` | `Uint8Array` | The 32-byte secret seed. Any other length fails loudly, before any WebCrypto call. |
| `extractable` | `boolean` | Whether the returned private key may be exported. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

`Success` with the derived `CryptoKeyPair`, or `Failure` with error context.
