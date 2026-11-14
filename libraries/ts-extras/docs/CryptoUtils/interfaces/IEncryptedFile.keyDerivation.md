[Home](../../README.md) > [CryptoUtils](../README.md) > [IEncryptedFile](./IEncryptedFile.md) > keyDerivation

## IEncryptedFile.keyDerivation property

Optional key derivation parameters.
If present, allows decryption using a password with these parameters.
If absent, a pre-derived key must be provided.

**Signature:**

```typescript
readonly keyDerivation: IKeyDerivationParams;
```
