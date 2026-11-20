[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IKeyDerivationParams

# Type Alias: IKeyDerivationParams

> **IKeyDerivationParams** = [`IPbkdf2KeyDerivationParams`](../interfaces/IPbkdf2KeyDerivationParams.md) \| [`IArgon2idKeyDerivationParams`](../interfaces/IArgon2idKeyDerivationParams.md)

Key derivation parameters stored in encrypted files.
Discriminated union on `kdf` field: `'pbkdf2'` or `'argon2id'`.
