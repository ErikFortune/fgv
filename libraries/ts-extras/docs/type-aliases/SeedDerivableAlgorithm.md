[Home](../README.md) > SeedDerivableAlgorithm

# Type Alias: SeedDerivableAlgorithm

The subset of CryptoUtils.KeyPairAlgorithm whose keypair can be
derived *deterministically* from a fixed secret seed, for use with
CryptoUtils.ICryptoProvider.importKeyPairFromSeed | importKeyPairFromSeed.

Two algorithms are supported, both of whose 32-byte private scalar *is* the
seed and whose public key is a deterministic function of it, so the same seed
always yields the same keypair on every runtime:
- `'ed25519'` — signing keypair (RFC 8032). Private usage `'sign'`, public
  usage `'verify'`.
- `'x25519'` — Diffie-Hellman key-agreement keypair (RFC 7748), the recipient
  keypair consumed by CryptoUtils.HpkeProvider. Private usage
  `'deriveBits'`, public key imported with no usages. Deriving a fixed X25519
  recipient keypair from a checked-in seed is what makes a deterministic HPKE
  seal/open round-trip vector possible.

The type is a proper subset of CryptoUtils.KeyPairAlgorithm because
algorithms like RSA or the NIST curves are not recoverable from a bare seed.

## Type

```typescript
type SeedDerivableAlgorithm = "ed25519" | "x25519"
```
