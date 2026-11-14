[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStoreAsymmetricSecretType

# Type Alias: KeyStoreAsymmetricSecretType

> **KeyStoreAsymmetricSecretType** = `"asymmetric-keypair"`

Discriminator for asymmetric secret types stored in the vault.
- `'asymmetric-keypair'`: A public/private key pair. The public key is held in
  the vault as a JWK; the private key lives in the supplied
  [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md) provider.
