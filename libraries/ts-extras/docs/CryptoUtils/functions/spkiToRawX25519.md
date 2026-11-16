[Home](../../README.md) > [CryptoUtils](../README.md) > spkiToRawX25519

# Function: spkiToRawX25519

Strips the fixed DER prefix from an X25519 SubjectPublicKeyInfo blob, returning the raw
32-byte public key.

An X25519 SPKI is always exactly 44 bytes: a fixed 12-byte prefix (SEQUENCE / AlgorithmIdentifier
with OID 1.3.101.110 / BIT STRING) followed by the 32-byte raw key. Use this to convert a
SPKI-held recipient public key into the raw form accepted by HpkeProvider.openBase's
`recipientPublicKey` parameter.

## Signature

```typescript
function spkiToRawX25519(spki: Uint8Array): Result<Uint8Array<ArrayBufferLike>>
```
