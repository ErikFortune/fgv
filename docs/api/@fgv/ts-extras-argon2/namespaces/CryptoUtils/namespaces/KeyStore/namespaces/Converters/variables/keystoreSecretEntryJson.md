[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../../../README.md) / [CryptoUtils](../../../../../README.md) / [KeyStore](../../../README.md) / [Converters](../README.md) / keystoreSecretEntryJson

# Variable: keystoreSecretEntryJson

> `const` **keystoreSecretEntryJson**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreEntryJson`](../../../type-aliases/IKeyStoreEntryJson.md)\>

Discriminated-union converter for any [key store entry](../../../type-aliases/IKeyStoreEntryJson.md) in JSON form.
Routes by the `type` field: `'asymmetric-keypair'` is parsed by
[keystoreAsymmetricEntryJson](keystoreAsymmetricEntryJson.md),
anything else (including a missing `type` field for backwards compatibility) by
[keystoreSymmetricEntryJson](keystoreSymmetricEntryJson.md).
