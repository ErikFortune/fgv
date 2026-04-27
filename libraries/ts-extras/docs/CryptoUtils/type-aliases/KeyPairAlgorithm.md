[Home](../../README.md) > [CryptoUtils](../README.md) > KeyPairAlgorithm

# Type Alias: KeyPairAlgorithm

Asymmetric keypair algorithms supported by the crypto provider.
- `'ecdsa-p256'`: ECDSA over the P-256 curve, for signing.
- `'rsa-oaep-2048'`: RSA-OAEP, 2048-bit modulus with SHA-256, for encryption.

## Type

```typescript
type KeyPairAlgorithm = "ecdsa-p256" | "rsa-oaep-2048"
```
