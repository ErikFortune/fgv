[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../../../README.md) / [CryptoUtils](../../../../../README.md) / [KeyStore](../../../README.md) / [Converters](../README.md) / keystoreAsymmetricEntryJson

# Variable: keystoreAsymmetricEntryJson

> `const` **keystoreAsymmetricEntryJson**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreAsymmetricEntryJson`](../../../interfaces/IKeyStoreAsymmetricEntryJson.md)\>

Converter for [asymmetric keypair entry](../../../interfaces/IKeyStoreAsymmetricEntryJson.md) in JSON form.
The `publicKeyJwk` field passes through [jsonWebKeyShape](jsonWebKeyShape.md)
(shape check only — see its docs); cryptographic correctness is enforced by
`crypto.subtle.importKey` at use.
