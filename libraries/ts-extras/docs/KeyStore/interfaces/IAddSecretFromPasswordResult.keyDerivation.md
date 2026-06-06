[Home](../../README.md) > [KeyStore](../README.md) > [IAddSecretFromPasswordResult](./IAddSecretFromPasswordResult.md) > keyDerivation

## IAddSecretFromPasswordResult.keyDerivation property

Key derivation parameters used to derive the secret key.
Store these in encrypted file metadata so the password alone
can re-derive the same key for decryption.

**Signature:**

```typescript
readonly keyDerivation: IKeyDerivationParams;
```
