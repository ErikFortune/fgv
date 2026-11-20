[Home](../../README.md) > [KeyStore](../README.md) > KeyStoreAsymmetricSecretType

# Type Alias: KeyStoreAsymmetricSecretType

Discriminator for asymmetric secret types stored in the vault.
- `'asymmetric-keypair'`: A public/private key pair. The public key is held in
  the vault as a JWK; the private key lives in the supplied
  CryptoUtils.KeyStore.IPrivateKeyStorage provider.

## Type

```typescript
type KeyStoreAsymmetricSecretType = "asymmetric-keypair"
```
