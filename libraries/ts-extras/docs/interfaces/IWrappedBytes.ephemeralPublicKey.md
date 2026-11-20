[Home](../README.md) > [IWrappedBytes](./IWrappedBytes.md) > ephemeralPublicKey

## IWrappedBytes.ephemeralPublicKey property

Sender's ephemeral ECDH P-256 public key as a JSON Web Key. The matching
ephemeral private key is dropped after the shared-secret derive.

**Signature:**

```typescript
readonly ephemeralPublicKey: JsonWebKey;
```
