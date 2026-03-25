[Home](../../README.md) > [CryptoUtils](../README.md) > [ICreateEncryptedFileParams](./ICreateEncryptedFileParams.md) > keyDerivation

## ICreateEncryptedFileParams.keyDerivation property

Optional CryptoUtils.IKeyDerivationParams | key derivation parameters.
If provided, stores the salt and iterations used to derive the key from a password.
This allows decryption using only a password (the salt/iterations are read from the file).

**Signature:**

```typescript
readonly keyDerivation: IKeyDerivationParams;
```
