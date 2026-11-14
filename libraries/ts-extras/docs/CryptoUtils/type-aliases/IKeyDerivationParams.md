[Home](../../README.md) > [CryptoUtils](../README.md) > IKeyDerivationParams

# Type Alias: IKeyDerivationParams

Key derivation parameters stored in encrypted files.
Discriminated union on `kdf` field: `'pbkdf2'` or `'argon2id'`.

## Type

```typescript
type IKeyDerivationParams = IPbkdf2KeyDerivationParams | IArgon2idKeyDerivationParams
```
