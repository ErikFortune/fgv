[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../../../README.md) / [CryptoUtils](../../../../../README.md) / [KeyStore](../../../README.md) / [Converters](../README.md) / keystoreSymmetricEntryJson

# Variable: keystoreSymmetricEntryJson

> `const` **keystoreSymmetricEntryJson**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSymmetricEntryJson`](../../../interfaces/IKeyStoreSymmetricEntryJson.md)\>

Converter for [symmetric secret entry](../../../interfaces/IKeyStoreSymmetricEntryJson.md) in JSON form.

## Remarks

Backwards compatibility with vaults written before asymmetric-keypair
support: those entries may lack the `type` discriminator on the wire. To
keep the model type honest (`type` is required on
[CryptoUtils.KeyStore.IKeyStoreSymmetricEntryJson](../../../interfaces/IKeyStoreSymmetricEntryJson.md), see its docs),
we declare `type` in `optionalFields` so the inner `Converters.object` will
accept input without it, then `.map()` injects the default
`'encryption-key'` when missing. The output therefore always carries the
discriminator and downstream code never sees the legacy missing-type form.
