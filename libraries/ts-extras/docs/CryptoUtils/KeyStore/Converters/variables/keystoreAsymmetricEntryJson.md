[Home](../../../../README.md) > [CryptoUtils](../../../README.md) > [KeyStore](../../README.md) > [Converters](../README.md) > keystoreAsymmetricEntryJson

# Variable: keystoreAsymmetricEntryJson

Converter for CryptoUtils.KeyStore.IKeyStoreAsymmetricEntryJson | asymmetric keypair entry in JSON form.
The `publicKeyJwk` field passes through CryptoUtils.KeyStore.Converters.jsonWebKeyShape | jsonWebKeyShape
(shape check only — see its docs); cryptographic correctness is enforced by
`crypto.subtle.importKey` at use.

## Type

`Converter<IKeyStoreAsymmetricEntryJson>`
