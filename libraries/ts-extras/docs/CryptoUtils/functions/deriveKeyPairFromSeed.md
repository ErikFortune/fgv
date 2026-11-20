[Home](../../README.md) > [CryptoUtils](../README.md) > deriveKeyPairFromSeed

# Function: deriveKeyPairFromSeed

Derives an asymmetric keypair *deterministically* from a fixed secret seed
using `globalThis.crypto.subtle`, shared by the Node and browser
CryptoUtils.ICryptoProvider implementations (both speak the same
WebCrypto API). See
CryptoUtils.ICryptoProvider.importKeyPairFromSeed | importKeyPairFromSeed
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
(private `'deriveBits'`, public no-usage) that CryptoUtils.HpkeProvider
consumes as its recipient key.

The seed bytes are copied into a freshly allocated PKCS#8 buffer, so the
`BufferSource` handed to WebCrypto is always backed by a plain `ArrayBuffer`
(side-stepping the Node-20 `SharedArrayBuffer`-view rejection) and the
caller's `seed` is never mutated.

## Signature

```typescript
function deriveKeyPairFromSeed(algorithm: SeedDerivableAlgorithm, seed: Uint8Array, extractable: boolean): Promise<Result<CryptoKeyPair>>
```
