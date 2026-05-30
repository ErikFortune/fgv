[Home](../README.md) > KeyPairAlgorithm

# Type Alias: KeyPairAlgorithm

Asymmetric keypair algorithms supported by the crypto provider.
- `'ecdsa-p256'`: ECDSA over the P-256 curve, for signing.
- `'rsa-oaep-2048'`: RSA-OAEP, 2048-bit modulus with SHA-256, for encryption.
- `'ecdh-p256'`: ECDH over the P-256 curve, for key agreement
  (e.g. as the recipient keypair in
  CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes /
  CryptoUtils.ICryptoProvider.unwrapBytes | unwrapBytes).
- `'ed25519'`: EdDSA over the Edwards25519 curve, for signing.
  Deterministic — the per-signature nonce is derived from the private key
  and message rather than sampled randomly, eliminating the random-nonce
  reuse risk that ECDSA carries. Distinct from X25519 (key agreement over
  the Montgomery form, Curve25519).

## Type

```typescript
type KeyPairAlgorithm = "ecdsa-p256" | "rsa-oaep-2048" | "ecdh-p256" | "ed25519"
```
