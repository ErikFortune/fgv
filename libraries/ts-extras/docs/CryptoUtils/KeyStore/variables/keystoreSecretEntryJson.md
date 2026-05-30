[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > keystoreSecretEntryJson

# Variable: keystoreSecretEntryJson

Discriminated-union converter for any CryptoUtils.KeyStore.IKeyStoreEntryJson | key store entry in JSON form.
Routes by the `type` field: `'asymmetric-keypair'` is parsed by
CryptoUtils.KeyStore.Converters.keystoreAsymmetricEntryJson | keystoreAsymmetricEntryJson,
anything else (including a missing `type` field for backwards compatibility) by
CryptoUtils.KeyStore.Converters.keystoreSymmetricEntryJson | keystoreSymmetricEntryJson.

## Type

`Converter<IKeyStoreEntryJson>`
